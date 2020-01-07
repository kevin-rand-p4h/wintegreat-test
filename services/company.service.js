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
      const table = bigqueryLib.getTable(config.bigquery.dataset, config.bigquery.company.tableId);
      let offset = JSON.parse(fs.readFileSync(config.hubspot.lastOffsetLocation))
      console.log("------------------ Got offsets ------------------")

      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation)).company.properties

      let opts = {
        count: config.hubspot.requestCount.count
      }
      let keepRunning = true

      console.log("------------------ Getting data ------------------")
      while (keepRunning) { // En boucle parce que hubspot limite l'API à 100 ligne par requete
        console.log(":::::::::::::: Next Wave ::::::::::::::::")
        let nextData = await hs.companies.getRecentlyCreated(opts) // Le/Les prochain(s) <count> companies à prendre
        keepRunning = nextData['hasMore']

        console.log("------------------ Got data ------------------")
        // Modification de la structure des données pour l'adaptation vers Bigquery
        const bqCompanies = nextData.results.map(function (company) {
          const temp = {}
          let i = 0
          for (property_name in properties) {
            try {
              const propValue = getProperty(property_name, company)
              temp[property_name] = castType(propValue, properties[property_name].type)
            } catch (err) {
              throw new Exception(err.message)
            }
          }
          return temp
        })

        console.log("----------------- Inserting data into bigquery ----------------")
        //Insertion des données dans bigquery
        console.log(bqCompanies.length)
        if (bqCompanies.length) {
          table.insert(bqCompanies, (err, apiResponse) => {
            if (err) {
              console.log(`Error when inserting data to table`)
              console.log(err.response.insertErrors[0].errors)
            }
            else {
              console.log(`Data inserted`)
              console.log("-------------------- UPDATING last.json ---------------------")
              // MISE A JOUR DU FICHIER last.json 
              offset = { ...offset, ...{ company: { timestamp: nextData.results[0].properties.createdate.value } } }
              fs.writeFileSync(config.hubspot.lastOffsetLocation, JSON.stringify(offset))
              console.log("--------------------- last.json UPDATED ----------------------")
            }
          })
          console.log("===================== TASK DONE =========================")
        } else {
          return 'Nothing to insert';
        }
        opts = { ...opts, ...{ offset: nextData['offset'] } } // Update request offset
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