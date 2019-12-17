const fs = require('fs')

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
  updateProperties: async function (hubspot, tableName, config) {
    let properties = JSON.parse(fs.readFileSync(config.hubspot.propertiesLocation))
    const newProperties = await hubspot[tableName].properties.get()
    newProperties.forEach(({ name, label, type }) => {
      properties[tableName].properties[name] = { label, type }
    })
    fs.writeFileSync(config.hubspot.propertiesLocation, JSON.stringify(properties))
  }
}