const fs = require('fs')

module.exports = {
  hubspot: {
    requestCount: {
      count: 100 // Nombre de contact à prendre par requete
    },
    apiKey: '0beb5763-527f-4d1c-bd1e-7886bf87b9c4',
    lastOffsetLocation: 'config/last.json',
    propertiesLocation: 'config/properties.json',
    anonymous: 'config/anonymisation.json',
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
    anonymousDataset: "anonymousDataset",
    contact: {
      tableId: 'contact',
      description: 'Table containing all the active contacts',
      schema: {
        name: 'contact',
        description: 'Table containing all the active contacts',
        schema: {}
      }
    },
    anonymous_contact: {
      tableId: 'anonymous_contact',
      description: 'Table containing all the anonymous contacts',
      schema: {
        name: 'contact',
        description: 'Table containing all the anonymous contacts',
        schema: {}
      }
    },
    company: {
      tableId: 'company',
      description: 'Table containing all the active companies',
      schema: {
        name: 'company',
        description: 'Table containing all the active companies',
        schema: {}
      }
    },
    ticket: {
      tableId: 'ticket',
      description: 'Table containing all the active tickets',
      schema: {
        name: 'ticket',
        description: 'Table containing all the active tickets',
        schema: {}
      }
    }
  }
}