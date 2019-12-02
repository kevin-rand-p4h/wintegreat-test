var router = require('express').Router();
const task = require('../../services/task')
const Bigquery = require('../../services/bigquery')
const Hubspot = require('../../services/hubspot')
const bigqueryClient = Bigquery.getClient()
const hubspot = Hubspot.getClient()
router.get('/getAll', function (req, res, next) {

  var contact = hubspot.forms.getSubmissions('0beb5763-527f-4d1c-bd1e-7886bf87b9c4')
  // console.log(contact);
  contact.then(res, rej => {
    // res.end(res)
    // console.log(res)
    res.results.forEach(element => {
      console.log(JSON.stringify(element.values))
    });
    // console.log()
    res.end()
  }).catch(error => console.log(error.message));
});

module.exports = router;
