const fs = require('fs')

module.exports = {
  hubspot: {
    contactRequest: {
      count: 100 // Nombre de contact à prendre par requete
    },
    apiKey: '0beb5763-527f-4d1c-bd1e-7886bf87b9c4',
    lastOffsetLocation: 'config/last.json'
  },
  bigquery: {
    projectId: 'wintegreat-test',
    keyFileName: 'wintegreat-test-aee5902a248d.json',
    dataset: "BDD_test",
    contactTable: "HS_CONTACT"
  }
}