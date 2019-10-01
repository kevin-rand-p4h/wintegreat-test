var router = require('express').Router();
const Hubspot = require('hubspot')
const hubspot = new Hubspot({ 
  apiKey: 'd9f8af1f-6012-4bc0-98c2-5d5fb4af2960',
  checkLimit: false // (Optional) Specify whether or not to check the API limit on each call. Default: true 
})


router.get('/', function(req, res, next) {
    
    var contact = hubspot.forms.getSubmissions('4dcef6e8-394a-4dde-a688-16eb384765cd')
    // console.log(contact);
    contact.then(res => {
        // res.end(res)
        // console.log(res)
        res.results.forEach(element => {
            console.log(JSON.stringify(element.values))
        });
        // console.log()
        res.end()
    })
  });
  
  router.get('/connection', function(req, res, next){

    // Instantiates a client. Explicitly use service account credentials by
    // specifying the private key file. All clients in google-cloud-node have this
    // helper, see https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md

    // Imports the Google Cloud client library
    const {BigQuery} = require('@google-cloud/bigquery');

    async function createDataset() {
        // Creates a client
        const bigqueryClient = new BigQuery({
            projectId: 'curious-course-150606',
            keyFilename: 'google_id_bq.json',
        });

        // Create the dataset
        const [dataset] = await bigqueryClient.createDataset('BDD_test');
        console.log(`Dataset ${dataset.id} created.`);
    }
    createDataset();

  });
  module.exports = router;
  