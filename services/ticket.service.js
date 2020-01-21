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
      const table = bigqueryLib.getTable(config.bigquery.dataset, config.bigquery.ticket.tableId);
      let offset = JSON.parse(fs.readFileSync(config.hubspot.lastOffsetLocation))
      console.log("------------------ Got offsets ------------------")

      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation)).ticket.properties
      console.log("Got properties")
      let opts = {
        count: config.hubspot.requestCount.count
      }
      // Si c'est la première fois qu'on récupère les tickets
      let data = []
      if (offset.ticket.timestamp == "") {
        let keepRunning = true
        let tempOffset = ""
        while (keepRunning) {
          const tempData = await hubspot.getAllTickets(hs, tempOffset)
          data.push(...tempData.objects)
          keepRunning = tempData.hasMore
          tempOffset = tempData.offset
        }
        const timestamps = data.map(ticket => ticket.properties.createdate.timestamp)
        const indexMaxTimestamp = timestamps.indexOf(Math.max(...timestamps))
        const { timestamp, objectId } = {
          timestamp: data[indexMaxTimestamp].properties.createdate.timestamp,
          ...data[indexMaxTimestamp]
        }
        offset.ticket = {
          timestamp: timestamp,
          changeType: "CREATED",
          objectId: objectId
        }
      } else {
        let keepRunning = true
        let tempOffset = offset.ticket
        while (keepRunning) {
          const tempData = await hubspot.getTicketsRecentLog(hs, tempOffset)
          data.push(...tempData.filter(ticket => ticket.changeType == "CREATED"))
          keepRunning = (tempData === undefined || tempData.length == 0) ? false : true
          if (keepRunning) {
            const { timestamp, changeType, objectId } = tempData.slice(-1)[0]
            tempOffset = { ...{ timestamp, changeType, objectId } }
          }
        }
        offset.ticket = tempOffset
      }
      console.log(offset)
      console.log("Got data")
      const ids = data.map(ticket => ticket.objectId)
      console.log(ids)
      while (ids.length > 0) {
        console.log(ids)
        const chunkIds = ids.splice(0, config.hubspot.requestCount.count)
        const chunk = await hubspot.getTicketsByIds(chunkIds, hs, properties)
        // Modification de la structure des données pour l'adaptation vers Bigquery
        const bqTickets = Object.keys(chunk).map(function (ticketId) {
          const ticket = chunk[ticketId]
          const temp = {}
          let i = 0
          for (property_name in properties) {
            try {
              if (property_name == "import_date") {
                console.log(importDate)
                temp[property_name] = castType(importDate, properties[property_name].type)
              } else {
                const propValue = getProperty(property_name, ticket)
                temp[property_name] = castType(propValue, properties[property_name].type)
              }
            } catch (err) {
              throw new Exception(err.message)
            }
          }
          return temp
        })
        console.log("----------------- Inserting data into bigquery ----------------")
        //Insertion des données dans bigquery
        console.log(bqTickets.length)
        if (bqTickets.length) {
          table.insert(bqTickets, (err, apiResponse) => {
            console.log(apiResponse)
            if (err) {
              console.log(`Error when inserting data to table`)
              console.log(err)
            }
            else {
              console.log(`Data inserted`)
            }
          })
          fs.writeFileSync(config.hubspot.lastOffsetLocation, JSON.stringify(offset))
          console.log("===================== TASK DONE =========================")
        } else {
          return 'Nothing to insert';
        }
        // opts = { ...opts, ...{ offset: nextData['offset'] } } // Update request offset
      }
    } catch (err) {
      throw err
    }
  },
  updateProperties: async function () {
    const hubspotLib = require('./lib/hubspot')
    try {
      await hubspotLib.getObjectProperties(hs, 'ticket', config)
    } catch (err) {
      throw new Exception(err.message)
    }
  },
  getProperties: function () {
    const hubspotLib = require('./lib/hubspot')
    try {
      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation)).ticket.properties
      const structured = Object.keys(properties).map(name => `&properties=${name}`).reduce((total, el) => total + el)
      return structured
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
      const properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))[entity].properties
      const tableConfig = config.bigquery[entity]
      const metadata = bigqueryLib.generateTableSchema(tableConfig.tableId, tableConfig.description, properties, config.hubspot.fieldEquivalent)
      await bigqueryLib.updateTableSchema(config.bigquery.dataset, entity, metadata)
    } catch (err) {
      throw err
    }
  }
}