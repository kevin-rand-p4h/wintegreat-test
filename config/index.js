const fs = require('fs')

module.exports = {
  hubspot: {
    contactRequest: {
      count: 100 // Nombre de contact à prendre par requete
    },
    apiKey: '0beb5763-527f-4d1c-bd1e-7886bf87b9c4',
    lastOffsetLocation: 'config/last.json',
    propertiesLocation: 'config/properties.json',
    fieldEquivalent: {
      enumeration: 'string',
      string: 'string',
      number: 'numeric',
      date: 'date',
      datetime: 'datetime',
      bool: 'boolean',
      phone_number: 'string'
    }
  },
  bigquery: {
    projectId: 'test-wintegreat',
    keyFileName: 'test-wintegreat-7ac9fc70c1e0.json',
    dataset: "BDD_test",
    contact: {
      tableId: 'contact',
      description: 'Table containing all the active contacts',
      schema: {
        name: 'contact',
        description: 'Table containing all the active contacts',
        schema: ''
      }
    },
    company: {
      tableId: 'company',
      description: 'Table containing all the active companies',
      schema: {
        name: 'company',
        description: 'Table containing all the active companies',
        schema: ''
      }
    }
  }
}