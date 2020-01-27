var router = require('express').Router()

router.post('/migrate', async function (req, res, next) {
  try {
    const task = require('../../services/contact.service')
    await task.run();
    res.json({
      message: "Task done successfully!",
      status: "done"
    })
  } catch (err) {
    res.json({
      message: "Got an error on task",
      details: [
        err.toString()
      ],
      status: "error"
    })
  }
})

//Update contacts properties
router.post('/properties/update', async function (req, res, next) {
  try {
    const service = require('../../services/contact.service')
    service.updateProperties()
    res.json({
      message: "Contacts Properties update done successfully!",
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
    const service = require('../../services/contact.service')
    const schema = await service.updateSchema('contact')
    res.json({
      message: "Contacts Properties update done successfully!",
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
    const service = require('../../services/contact.service')
    await service.createTable('contact')
    res.json({
      message: "Contacts table created successfully!",
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

//Create anonymous contact table
router.post('/anonymous/create', async function (req, res, next) {
  try {
    const service = require('../../services/contact.service')
    await service.createTable('anonymous_contact', 'anonymousDataset')
    res.json({
      message: "Anonymous Contacts table created successfully!",
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

//Migrate anonymous contact table
router.post('/anonymous/migrate', async function (req, res, next) {
  try {
    const service = require('../../services/contact.service')
    await service.migrateAnonymousData('anonymous_contact', 'anonymousDataset')
    res.json({
      message: "Anonymous Contacts table migrated successfully!",
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
