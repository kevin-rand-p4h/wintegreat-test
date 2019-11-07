const config = require('../config')
const Hubspot = require('hubspot')

module.exports = {
  getClient: function () {
    return new Hubspot({
      apiKey: config.hubspot.apiKey,
      checkLimit: false // (Optional) Specify whether or not to check the API limit on each call. Default: true 
    })
  }
}