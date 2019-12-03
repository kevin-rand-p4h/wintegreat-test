const config = require('../config');
const hubspot = require('./hubspot')
const bigquery = require('./bigquery')
const hs = hubspot.getClient()
const bq = bigquery.getClient()

module.exports = {
    create: async function (tablen) {
      try {
        console.log("================== CREATING TABLE BEGIN ====================")
        let dataset = bq.dataset(config.bigquery.dataset);
        const table = dataset.table(tablen);
        const metadata = {
            name : 'contact',
            description : 'Table pour stocker les contacts',
            schema : 'nom:string, prenom:string, age:integer'
        }
        table.setMetadata(metadata).then(data => {
            console.log(data);
        })
        // table.create((err, table, apiResponse) => {
        //     console.log(`TABLE ${tablen} created`)
        // })

      } catch (err) {
        throw err
      }
    }
}