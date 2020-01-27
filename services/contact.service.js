const config = require('../config');
const hubspot = require('./lib/hubspot')
const bigqueryLib = require('./lib/bigquery')
const hs = hubspot.getClient(config.hubspot.apiKey)
const fs = require('fs')
const { getProperty, castType } = require('./lib/utils')

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
      const excludedFields = JSON.parse(fs.readFileSync(config.hubspot.anonymous))[entity.split('_').pop()].exclusions
      const anonymousTable = bigqueryLib.getTable(config.bigquery.anonymousDataset, config.bigquery[entity].tableId);
      const table = bigqueryLib.getTable(config.bigquery.dataset, config.bigquery[entity.split('_').pop()].tableId);
      // const metadata = {
      //   createDisposition: 'CREATE_NEVER',
      //   writeDisposition: 'WRITE_APPEND',
      //   schemaUpdateOptions: 'ALLOW_FIELD_RELAXATION'
      // };

      function manualPaginationCallback(err, rows, nextQuery, apiResponse) {
        // const restructuredRows = rows.map(row => {
        //   for (field in excludedFields) {
        //     delete row[field]
        //   }
        //   for (prop of Object.keys(row)) {
        //     if (row[prop] == null) {
        //       delete row[prop]
        //     }
        //   }
        //   return row
        // })
        anonymousTable.insert(rows, (err, apiResponse) => {
          console.log(apiResponse)
          if (err) {
            console.log(err.toString())
            if (err.name === 'PartialFailureError') {
              console.log(err.errors[0].errors[0])
            }
          }
        })
        if (nextQuery) {
          setTimeout(() => {
            console.log("=========== NEXT WAVE ============")
            table.getRows(nextQuery, manualPaginationCallback)
          }, 1000)

        }
      }

      table.getRows({
        autoPaginate: false,
        maxResults: 1000
      }, manualPaginationCallback);


      // let [data] = await table.getRows()
      // const mid = process.hrtime(start)
      // console.log("restructuring rows")
      // data = data.map(row => {
      //   for (field in excludedFields) {
      //     delete row[field]
      //   }
      //   for (prop of Object.keys(row)) {
      //     if (row[prop] == null) {
      //       delete row[prop]
      //     }
      //   }
      //   return row
      // })
      // const end = process.hrtime(start)
      // console.log(`mid: ${mid[1] / 1000000}ms`)
      // console.log(`end: ${end[1] / 1000000}ms`)
      // console.log(`rows restructured: ${data.length}`)
      // while (data.length > 0) {
      //   let insert = process.hrtime(start)
      //   setTimeout(() => {
      //     anonymousTable.insert(data.splice(0, 500), (err, apiResponse) => {
      //       if (err) {
      //         console.log(err.response.insertErrors[0])
      //       }
      //     })
      //     console.log(`insert: ${insert[1] / 1000000}ms`)
      //   }, 500)
      // }
      // console.log("Anonymisation contact fait!")
    } catch (err) {
      throw err
    }
  }
}