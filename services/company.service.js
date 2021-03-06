const config = require('../config');
const hubspot = require('./lib/hubspot')
const bigquery = require('./lib/bigquery')
const hs = hubspot.getClient(config.hubspot.apiKey)
const bq = bigquery.getClient(config.bigquery.projectId, config.bigquery.keyFileName)
const fs = require('fs')
const { getProperty } = require('./lib/utils')

module.exports = {
  run: async function () {
    try {
      console.log("================== TASK BEGIN ====================")
      const dataset = bq.dataset(config.bigquery.dataset);
      const table = dataset.table(config.bigquery.contactTable);
      let contactOffset = JSON.parse(fs.readFileSync(config.hubspot.lastOffsetLocation)).contact
      console.log("------------------ Got offsets ------------------")

      let contactProperties = await hs.contacts.properties.get()
      contactProperties = contactProperties.map(prop => prop.name)
      console.log("------------------ Got properties ------------------")

      let opts = {
        count: config.hubspot.contactRequest.count,
        // property: contactProperties
      }
      let keepRunning = true
      let contacts = [] // Initialisation à vide de data

      console.log("------------------ Getting data ------------------")
      while (keepRunning) { // En boucle parce que hubspot limite l'API à 100 contacts par requete
        console.log(":::::::::::::: Next Wave ::::::::::::::::")
        let nextData = await hs.contacts.getRecentlyCreated(opts) // Le/Les prochain(s) <count> contacts à prendre
        keepRunning = nextData['has-more']
        if (contactOffset.timeOffset && contactOffset.vidOffset && nextData['time-offset'] <= contactOffset.timeOffset && nextData['vid-offset'] <= contactOffset.vidOffset) { // si le addedAt et canonical-vid du dernier contact est inf ou egal à celui dans last.json
          keepRunning = false // ne plus prendre les prochains vagues de données
          nextData.contacts = nextData.contacts.filter(contact => contact.addedAt > contactOffset.timeOffset && contact['canonical-vid'] > contactOffset.vidOffset) // Filtre la vague courante de données
        }
        contacts.push(...nextData.contacts) // Ajouter les données dans data
        opts = { ...opts, ...{ vidOffset: nextData['vid-offset'], timeOffset: nextData['time-offset'] } }
      }
      console.log(contacts);

      console.log("------------------ Got data ------------------")
      // Modification de la structure des données pour l'adaptation vers Bigquery
      bqContacts = contacts.map(function (contact) {
        return {
          firstname: getProperty('firstname', contact),
          lastname: getProperty('lastname', contact),
        }
      })

      console.log("----------------- Inserting data into bigquery ----------------")
      //Insertion des données dans bigquery
      if (bqContacts.length) {
        table.insert(bqContacts, (err, apiResponse) => {
          if (err) {
            console.log(`Error when inserting data to table. ${err}`)
          }
          else {
            console.log(`Data inserted`)
            console.log("-------------------- UPDATING last.json ---------------------")
            // MISE A JOUR DU FICHIER last.json 
            contactOffset = { ...contactOffset, ...{ vidOffset: contacts[0]['canonical-vid'], timeOffset: contacts[0].addedAt } }
            fs.writeFileSync(config.hubspot.lastOffsetLocation, JSON.stringify({ contact: contactOffset }))
            console.log("--------------------- last.json UPDATED ----------------------")
          }
          console.log(apiResponse)
        })
        console.log("===================== TASK DONE =========================")
      } else {
        return 'Nothing to insert';
      }
    } catch (err) {
      throw err
    }
  },
  update: async function () {
    const hubspotLib = require('./lib/hubspot')
    try {
      await hubspotLib.updateProperties(hs, 'company', config)
    } catch (err) {
      throw err
    }
  }
}