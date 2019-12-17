var router = require('express').Router()

router.post('/migrate', async function (req, res, next) {
  try {
    const task = require('../../services/company.service')
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

//Update contacts properties
router.post('/properties/update', async function (req, res, next) {
  try {
    const contactService = require('../../services/company.service')
    contactService.update()
    res.json({
      message: "Companies Properties update done successfully!",
      status: "done"
    })
  } catch (err) {
    res.json({
      message: "Got an error",
      details: [
        err
      ],
      status: "error"
    })
  }
})

module.exports = router;
