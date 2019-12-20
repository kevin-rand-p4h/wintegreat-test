const config = require('../config');
const hubspot = require('./lib/hubspot')
const bigqueryLib = require('./lib/bigquery')
const hs = hubspot.getClient(config.hubspot.apiKey)
const fs = require('fs')
const { getProperty, castType } = require('./lib/utils')

module.exports = {
  run: async function () {
    try {
      console.log("================== TASK BEGIN ====================")
      const table = bigqueryLib.getTable(config.bigquery.dataset, config.bigquery.contact.tableId);
      let contactOffset = JSON.parse(fs.readFileSync(config.hubspot.lastOffsetLocation)).contact
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
          const temp = {}
          let i = 0
          for (property_name in properties) {
            try {
              const propValue = getProperty(property_name, contact)
              temp[property_name] = castType(propValue, properties[property_name].type)
            } catch (err) {
              throw new Exception(err.message)
            }
          }
          return temp
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
              contactOffset = { ...contactOffset, ...{ vidOffset: contactsInfos[0]['canonical-vid'], timeOffset: contactsInfos[0].addedAt } }
              fs.writeFileSync(config.hubspot.lastOffsetLocation, JSON.stringify({ contact: contactOffset }))
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
      await hubspotLib.updateProperties(hs, 'contact', config)
    } catch (err) {
      throw err
    }
  },
  createTable: async function (entity) {
    try {
      console.log(`Creating table ${entity}`)
      const bigqueryLib = require('./lib/bigquery')
      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))[entity].properties
      const tableConfig = config.bigquery[entity]
      const metadata = bigqueryLib.generateTableSchema(tableConfig.tableId, tableConfig.description, properties, config.hubspot.fieldEquivalent)
      console.log(metadata)
      const res = await bigqueryLib.createTable(config.bigquery.dataset, entity, metadata)
      console.log(res)
    } catch (err) {
      throw err
    }
  },
  updateSchema: async function (entity) {
    try {
      console.log(`Updating ${entity}'s schema`)
      const bigqueryLib = require('./lib/bigquery')
      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation)).contact.properties
      const tableConfig = config.bigquery[entity]
      const metadata = bigqueryLib.generateTableSchema(tableConfig.tableId, tableConfig.description, properties, config.hubspot.fieldEquivalent)
      await bigqueryLib.updateTableSchema(config.bigquery.dataset, entity, metadata)
    } catch (err) {
      throw err
    }
  }
}