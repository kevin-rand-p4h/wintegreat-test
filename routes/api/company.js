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
    const service = require('../../services/company.service')
    service.updateProperties()
    res.json({
      message: "Companies Properties update done successfully!",
      status: "done"
    })
  } catch (err) {
    res.json({
      message: "Got an error",
      details: [
        err.message
      ],
      status: "error"
    })
  }
})

//Update contacts schema
router.post('/schema/update', async function (req, res, next) {
  try {
    const service = require('../../services/company.service')
    const schema = await service.updateSchema('company')
    res.json({
      message: "Companies Properties update done successfully!",
      data: schema,
      status: "done"
    })
  } catch (err) {
    res.json({
      message: "Got an error",
      details: [
        err.message
      ],
      status: "error"
    })
  }
})

//Create contact table
router.post('/create', async function (req, res, next) {
  try {
    const service = require('../../services/company.service')
    await service.createTable('company')
    res.json({
      message: "Companies table created successfully!",
      status: "done"
    })
  } catch (err) {
    res.json({
      message: "Got an error",
      details: [
        err.message
      ],
      status: "error"
    })
  }
})

module.exports = router;
