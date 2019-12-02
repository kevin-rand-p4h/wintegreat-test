var router = require('express').Router();
const task = require('../../services/task')
const Bigquery = require('../../services/bigquery')
const Hubspot = require('../../services/hubspot')
const bigqueryClient = Bigquery.getClient()
const hubspot = Hubspot.getClient()
router.get('/migrate', async function (req, res, next) {
  try{
    console.log('before');
    task.run();
    console.log('after')
  } catch(err) {
    console.log(err)
  }
})

module.exports = router;

