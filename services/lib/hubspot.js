const fs = require('fs')

function getAllFuncs(obj) {
  let methods = new Set();
  while (obj = Reflect.getPrototypeOf(obj)) {
    let keys = Reflect.ownKeys(obj)
    keys.forEach((k) => methods.add(k));
  }
  return methods;
}


module.exports = {
  /**
   * @function Returns Hubspot client
   * @param {string} apiKey 
   */
  getClient: function (apiKey) {
    const Hubspot = require('hubspot')
    return new Hubspot({
      apiKey: apiKey,
      checkLimit: false // (Optional) Specify whether or not to check the API limit on each call. Default: true 
    })
  },
  /**
   * @function Async Update table properties
   * @param {*} hubspot Hubspot client
   * @param {*} tableName Name of the table in Hubspot
   * @param {*} config Config object in /config/index.js
   */
  updateProperties: async function (hubspot, tableName, hubspotName, config) {
    try {
      let properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))
      const newProperties = await hubspot[hubspotName].properties.get()
      newProperties.forEach(({ name, label, type }) => {
        properties[tableName].properties[name] = { label, type }
      })
      // Ajout de la propriété import_date dans les propriétés des entités
      properties[tableName].properties["import_date"] = { label: "Date de l'importation vers BigQuery", type: "datetime" }
      fs.writeFileSync(config.hubspot.propertiesLocation, JSON.stringify(properties))
    } catch (err) {
      throw err
    }
  },
  getObjectProperties: async function (hubspot, tableName, config) {
    try {
      let properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))
      const newProperties = await hubspot._request({
        method: 'GET',
        path: `/properties/v2/${tableName}/properties`
      })
      newProperties.forEach(({ name, label, type }) => {
        properties[tableName].properties[name] = { label, type }
      })
      // Ajout de la propriété import_date dans les propriétés des entités
      properties[tableName].properties["import_date"] = { label: "Date de l'importation vers BigQuery", type: "datetime" }
      fs.writeFileSync(config.hubspot.propertiesLocation, JSON.stringify(properties))
    } catch (err) {
      throw err
    }
  },
  getAllTickets: async function (hubspot, offset = "") {
    try {
      return await hubspot._request({
        method: 'GET',
        path: `/crm-objects/v1/objects/tickets/paged?offset=${offset}&properties=createdate`
      })
    } catch (err) {
      throw err
    }
  },
  getTicketsRecentLog: async function (hubspot, { timestamp = "", changeType = "", objectId = "" }) {
    try {
      return await hubspot._request({
        method: 'GET',
        path: `/crm-objects/v1/change-log/tickets?timestamp=${timestamp}&changeType=${changeType}&objectId=${objectId}`
      })
    } catch (err) {
      throw err
    }
  },
  getTicketsByIds: async function (ids, hubspot, properties, timestamp = 0) {
    const stringProperties = Object.keys(properties)
      .map(propertyName => `&properties=${propertyName}`)
      .reduce((qs, keyValue) => qs + keyValue)
    try {
      return await hubspot._request({
        method: 'POST',
        path: `/crm-objects/v1/objects/tickets/batch-read?timestamp=${timestamp}${stringProperties}`,
        body: {
          ids: ids
        }
      })
    } catch (err) {
      throw err
    }
  },
  // getObjectProperties: async function (hubspot, tableName, config) {
  //   try {
  //     let properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))
  //     const newProperties = await hubspot._request({
  //       method: 'GET',
  //       path: `/properties/v2/${tableName}/properties`
  //     })
  //     newProperties.forEach(({ name, label, type }) => {
  //       properties[tableName].properties[name] = { label, type }
  //     })
  //     fs.writeFileSync(config.hubspot.propertiesLocation, JSON.stringify(properties))
  //   } catch (err) {
  //     throw err
  //   }
  // }
}