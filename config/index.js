const fs = require('fs')

module.exports = {
  cron: {
    seconds: '*/30',
    minutes: '*',
    hour: '*', //Tous les 24heures
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
  },
  hubspot: {
    contactRequest: {
      count: 2 // Nombre de contact à prendre par requete
    },
    apiKey: 'a5c6a7dd-414d-4dd4-8db0-2ad32a635f8d',
    lastOffsetLocation: 'config/last.json'
  },
  bigquery: {
    projectId: 'wintegreat-test',
    keyFileName: 'wintegreat-test-aee5902a248d.json',
    dataset: "BDD_test",
    contactTable: "HS_CONTACT"
  }
}