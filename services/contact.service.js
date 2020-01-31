const config = require('../config');
const hubspot = require('./lib/hubspot')
const bigqueryLib = require('./lib/bigquery')
const hs = hubspot.getClient(config.hubspot.apiKey)
const fs = require('fs')
const { getProperty, castType } = require('./lib/utils')

function getAnonymousFields() {
  const faker = require('faker')
  const parse = require('csv-parse')
  console.log(faker.name.findName())
  const { Storage } = require('@google-cloud/storage');
  const storage = new Storage({
    projectId: 'test-wintegreat',
    keyFilename: config.bigquery.keyFileName
  })
  return new Promise((resolve, reject) => {
    let excludedFields = {}
    storage.bucket(config.cloud_storage.bucket).file(config.cloud_storage.fileName).createReadStream()
      .pipe(parse({ delimiter: ';', from_line: 2 }))
      .on('error', (err) => {
        reject(err)
      })
      .on('data', (line) => {
        const splittedFunc = line[2].split('.')
        excludedFields[line[1]] = faker
        while (splittedFunc.length > 0) {
          excludedFields[line[1]] = excludedFields[line[1]][splittedFunc.shift()]
        }
      })
      .on('end', () => {
        resolve(excludedFields)
      })
  })
}

module.exports = {
  run: async function () {
    try {
      const importDate = new Date().getTime()
      console.log("================== TASK BEGIN ====================")
      const table = bigqueryLib.getTable(config.bigquery.dataset, config.bigquery.contact.tableId);
      let offset = JSON.parse(fs.readFileSync(config.hubspot.lastOffsetLocation))
      let contactOffset = offset.contact
      console.log("------------------ Got offsets ------------------")

      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation)).contact.properties

      let opts = {
        count: config.hubspot.requestCount.count
      }
      let keepRunning = true

      console.log("------------------ Getting data ------------------")
      while (keepRunning) { // En boucle parce que hubspot limite l'API à 100 contacts par requete
        console.log(":::::::::::::: Next Wave ::::::::::::::::")
        let nextData = await hs.contacts.getRecentlyCreated(opts) // Le/Les prochain(s) <count> contacts à prendre
        const ids = nextData.contacts.map(contact => contact.vid)
        let contactsInfos = await hs.contacts.getByIdBatch(ids)
        contactsInfos = Object.values(contactsInfos)
        keepRunning = nextData['has-more']
        if (contactOffset.timeOffset && contactOffset.vidOffset && nextData['time-offset'] <= contactOffset.timeOffset && nextData['vid-offset'] <= contactOffset.vidOffset) { // si le addedAt et canonical-vid du dernier contact est inf ou egal à celui dans last.json
          keepRunning = false // ne plus prendre les prochains vagues de données
          nextData.contacts = nextData.contacts.filter(contact => contact.addedAt > contactOffset.timeOffset && contact['canonical-vid'] > contactOffset.vidOffset) // Filtre la vague courante de données
        }
        console.log("------------------ Got data ------------------")
        // Modification de la structure des données pour l'adaptation vers Bigquery
        const bqContacts = contactsInfos.map(function (contact) {
          try {
            const temp = {}
            let i = 0
            for (property_name in properties) {
              if (property_name == "import_date") {
                temp[property_name] = castType(importDate, properties[property_name].type)
              } else {
                const propValue = getProperty(property_name, contact)
                temp[property_name] = castType(propValue, properties[property_name].type)
              }
            }
            return temp
          } catch (err) {
            throw err
          }
        })

        console.log("----------------- Inserting data into bigquery ----------------")
        //Insertion des données dans bigquery
        console.log(bqContacts.length)
        if (bqContacts.length) {
          table.insert(bqContacts, (err, apiResponse) => {
            if (err) {
              console.log(`Error when inserting data to table`)
              console.log(err.response.insertErrors[0].errors)
            }
            else {
              console.log(`Data inserted`)
              console.log("-------------------- UPDATING last.json ---------------------")
              // MISE A JOUR DU FICHIER last.json 
              offset = { ...offset, ...{ contact: { vidOffset: contactsInfos[0]['canonical-vid'], timeOffset: contactsInfos[0].addedAt } } }
              fs.writeFileSync(config.hubspot.lastOffsetLocation, JSON.stringify(offset))
              console.log("--------------------- last.json UPDATED ----------------------")
            }
          })
          console.log("===================== TASK DONE =========================")
        } else {
          return 'Nothing to insert';
        }
        opts = { ...opts, ...{ vidOffset: nextData['vid-offset'], timeOffset: nextData['time-offset'] } }
      }
    } catch (err) {
      throw err
    }
  },
  updateProperties: async function () {
    const hubspotLib = require('./lib/hubspot')
    try {
      await hubspotLib.updateProperties(hs, 'contact', 'contacts', config)
    } catch (err) {
      throw err
    }
  },
  createTable: async function (entity, dataset = '') {
    try {
      console.log(`Creating table ${entity}`)
      const bigqueryLib = require('./lib/bigquery')
      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))[entity.split('_').pop()].properties
      const tableConfig = config.bigquery[entity]
      const excludedFields = JSON.parse(fs.readFileSync(config.hubspot.anonymous))[entity.split('_').pop()].exclusions
      const metadata = bigqueryLib.generateTableSchema(tableConfig.tableId, tableConfig.description, properties, config.hubspot.fieldEquivalent)
      const res = await bigqueryLib.createTable(dataset || config.bigquery.dataset, entity, metadata)
      // console.log(res)
    } catch (err) {
      throw err
    }
  },
  updateSchema: async function (entity) {
    try {
      console.log(`Updating ${entity}'s schema`)
      const bigqueryLib = require('./lib/bigquery')
      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))[entity].properties
      const tableConfig = config.bigquery[entity]
      const metadata = bigqueryLib.generateTableSchema(tableConfig.tableId, tableConfig.description, properties, config.hubspot.fieldEquivalent)
      await bigqueryLib.updateTableSchema(config.bigquery.dataset, entity, metadata)
    } catch (err) {
      throw err
    }
  },
  migrateAnonymousData: async function (entity) {
    try {
      const start = process.hrtime()
      console.log(`Migrating ${entity}'s data to anonymous dataset`)
      const bigqueryLib = require('./lib/bigquery')
      // const anonymousTable = bigqueryLib.getTable(config.bigquery.anonymousDataset, config.bigquery[entity].tableId);
      const table = bigqueryLib.getTable(config.bigquery.dataset, config.bigquery[entity.split('_').pop()].tableId);
      const excludedFields = await getAnonymousFields()
      const anonymData = (data) => {
        const newData = []
        for (row of data) {
          for (key in excludedFields) {
            if (row[key] != null)
              row[key] = excludedFields[key]()
          }
          newData.push(row)
        }
        return newData
      }
      const manualPaginationCallback = (err, rows, nextQuery, apiResponse) => {
        const newRows = anonymData(rows)
        bigqueryLib.insertData(config.bigquery.anonymousDataset, config.bigquery[entity].tableId, newRows)
        if (nextQuery) {
          table.getRows(nextQuery, manualPaginationCallback)
        }
      }
      table.getRows({
        autoPaginate: false,
        maxResults: 250
      }, manualPaginationCallback);
    } catch (err) {
      throw err
    }
  }
}