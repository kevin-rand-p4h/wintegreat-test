var router = require('express').Router();

router.get('/', function (req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.end('Hello e!')
});

router.use('/contact', require('./contact'));
router.use('/company', require('./company'));
router.use('/ticket', require('./ticket'));
// router.use('/table', require('./table'));

router.post('/dataset/create', async (req, res, next) => {
  try {
    const bigqueryLib = require('../../services/lib/bigquery')
    const config = require('../../config/index')
    console.log("Creating dataset")
    await bigqueryLib.createDataset(config.bigquery.dataset)
    console.log("Dataset created successfully")
  } catch (err) {
    next(err)
  }
})

router.use(function (err, req, res, next) {
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      errors: Object.keys(err.errors).reduce(function (errors, key) {
        errors[key] = err.errors[key].message;
        return errors;
      }, {})
    });
  }

  return next(err);
});

module.exports = router;