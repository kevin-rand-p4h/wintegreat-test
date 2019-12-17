module.exports = {

  getProperty: function (property_name, obj) {
    return (obj.properties[property_name] && obj.properties[property_name].value) || '';
  }
}