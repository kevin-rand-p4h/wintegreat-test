var router = require('express').Router();
const task = require('../../services/task')
const Bigquery = require('../../services/bigquery')
const Hubspot = require('../../services/hubspot')
const bigqueryClient = Bigquery.getClient()
const hubspot = Hubspot.getClient()
router.get('/migrate', async function (req, res, next) {
  try {
    task.run();
    res.json({
      message: "Task done successfully!",
      status: "done"
    })
  } catch (err) {
    res.json({
      message: "Got an error on task",
      details: [
        err
      ],
      status: "error"
    })
  }
})

module.exports = router;
