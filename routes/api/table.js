var router = require('express').Router();
const table = require('../../services/tableservice.js')
const Bigquery = require('../../services/bigquery')
const Hubspot = require('../../services/hubspot')
const bigqueryClient = Bigquery.getClient()
const hubspot = Hubspot.getClient()
router.get('/create', async function (req, res, next) {
  try{
      console.log('eeeee')
    table.create('test_table');
  } catch(err) {
    console.log(err)
  }
})

module.exports = router;
