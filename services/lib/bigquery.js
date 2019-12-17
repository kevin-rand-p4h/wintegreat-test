
/**
 * @function Get BigQuery client
 * @param {string} projectID The ID of the project in BigQuery
 * @param {string} keyFileName The key file name of the API to BigQuery
 */
function _getClient(projectID, keyFileName) {
  const { BigQuery } = require('@google-cloud/bigquery')
  return new BigQuery({
    projectId: projectID,
    keyFilename: keyFileName,
  });
}

/**
 * @function Get BigQuery client
 * @param {*} projectID The ID of the project in BigQuery
 * @param {*} keyFileName The key file name of the API to BigQuery
 */
function getClient() {
  const { projectId, keyFileName } = require('../../config').bigquery
  return _getClient(projectId, keyFileName)
}

module.exports = {
  /**
   * @function Generate table schema related to the given properties
   * @param {string} name Name of the table
   * @param {string} description Description of the table
   * @param {object} properties Containing the table properties with name as keys
   * @param {object} fieldEquivalent Containing field Equivalent from Hubspot to Bigquery
   */
  generateTableSchema: function (tableName, tableDescription, properties, fieldEquivalent) {
    let table = {
      name: tableName,
      description: tableDescription,
      schema: {
        fields: []
      }
    }
    for (name in properties) {
      let { type, label } = properties[name]
      type = fieldEquivalent[type] //Le type dans Hubspot est different chez Bigquery
      table.schema.fields.push({
        name: name,
        type: type,
        description: label
      })
    }
    // table.schema.fields = JSON.stringify(table.schema.fields)
    return table
  },
  createDataset: async function (name) {
    const bqClient = getClient()
    const [dataset] = await bqClient.createDataset(name)
    return dataset
  },
  getDataset: function (name) {
    const bqClient = getClient()
    const dataset = bqClient.dataset(name)
    return dataset
  },
  createTable: async function (datasetName, name, metadata = {}) {
    try {
      const bqClient = getClient()
      const dataset = bqClient.dataset(datasetName)
      const table = await dataset.createTable(name, metadata)
      return table
    } catch (err) {
      throw err
    }
  },
  updateTableSchema: async function (datasetName, tableName, metadata) {
    try {
      const bqClient = getClient()
      const dataset = bqClient.dataset(datasetName)
      const table = dataset.table(tableName)
      const metadata = await table.setMetadata(metadata)
      return metadata
    } catch (err) {
      throw err
    }
  },
  getTable: function (datasetName, tableName) {
    const bqClient = getClient()
    const dataset = bqClient.dataset(datasetName)
    const table = dataset.table(tableName)
    return table
  },
  insertData: function (datasetName, tableName, data, insertHandler) {
    try {
      const bqClient = getClient()
      const dataset = bqClient.dataset(datasetName)
      const table = dataset.dataset(tableName)
      table.insert(data, insertHandler)
    } catch (err) {
      throw err
    }
  }
}