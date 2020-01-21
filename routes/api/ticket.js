var router = require('express').Router()

router.post('/migrate', async function (req, res, next) {
  try {
    const task = require('../../services/ticket.service')
    await task.run();
    res.json({
      message: "Task done successfully!",
      status: "done"
    })
  } catch (err) {
    res.json({
      message: "Got an error on task",
      details: [
        err.message
      ],
      status: "error"
    })
  }
})

//Update contacts properties
router.post('/properties/update', async function (req, res, next) {
  try {
    const service = require('../../services/ticket.service')
    service.updateProperties()
    res.json({
      message: "Tickets Properties update done successfully!",
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
    const service = require('../../services/ticket.service')
    const schema = await service.updateSchema('ticket')
    res.json({
      message: "Tickets Schema update done successfully!",
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
    const service = require('../../services/ticket.service')
    await service.createTable('ticket')
    res.json({
      message: "Tickets table created successfully!",
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
router.post('/getProperties', async function (req, res, next) {
  try {
    const service = require('../../services/ticket.service')
    const properties = service.getProperties('ticket')
    res.json({
      data: properties,
      message: "Tickets table created successfully!",
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
