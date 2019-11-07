const config = require('../config')
const { BigQuery } = require('@google-cloud/bigquery')

module.exports = {
  getClient: function () {
    return new BigQuery({
      projectId: config.bigquery.projectId,
      keyFilename: config.bigquery.keyFileName,
    });
  }
}