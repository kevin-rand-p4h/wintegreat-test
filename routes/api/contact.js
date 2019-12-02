var router = require('express').Router();
const task = require('../../services/task')
const Bigquery = require('../../services/bigquery')
const Hubspot = require('../../services/hubspot')
const bigqueryClient = Bigquery.getClient()
const hubspot = Hubspot.getClient()
router.get('/getAll', function (req, res, next) {

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

module.exports = router;
