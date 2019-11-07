var router = require('express').Router();
const task = require('../../services/task')
const Bigquery = require('../../services/bigquery')
const Hubspot = require('../../services/hubspot')
const bigqueryClient = Bigquery.getClient()
const hubspot = Hubspot.getClient()

router.get('/', function (req, res, next) {

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

router.get('/task/run', function (req, res, next) {
  try {
    task.run()
    res.send("Task running")
  } catch (err) {
    console.log(err)
    res.send("failed")
  }
})

router.get('/connection', function (req, res, next) {

  // Instantiates a client. Explicitly use service account credentials by
  // specifying the private key file. All clients in google-cloud-node have this
  // helper, see https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
  async function createDataset() {
    // Create the dataset
    const [dataset] = await bigqueryClient.createDataset('BDD_test');
    console.log(`Dataset ${dataset.id} created.`);
  }
  createDataset();

});

router.get('/bigquery/datasets/:dataset/tables/create/:table', async (req, res, next) => {
  const dataset = bigqueryClient.dataset(req.params.dataset);

  const table = dataset.table(req.params.table)
  table.create((err, table, apiResponse) => {
    console.log(`TABLE ${req.params.table} created`)
  });
});

router.get('/bigquery/datasets/:dataset/tables/insert/:table', async (req, res, next) => {
  const dataset = bigqueryClient.dataset(req.params.dataset);
  const table = dataset.table(req.params.table);

  const data = [
    {
      lastname: "randria",
      firstname: "kevin",
    },
    {
      lastname: "rabary",
      firstname: "andria",
    },
    {
      lastname: "rabary",
      firstname: "felana",
    },
    {
      lastname: "razaka",
      firstname: "phil",
    },
  ]

  table.insert(data, (err, apiResponse) => {
    if (err) {
      console.log(`Error when inserting data to table. ${err}`)
    }
    else {
      console.log(`Data inserted`)
    }
  })

});

function checkTableMetadata(table) {
  table.getMetadata((err, metadata, apiResponse) => {
    console.log(metadata);
    return !!metadata;
  })
}
module.exports = router;
