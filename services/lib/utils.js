module.exports = {

  getProperty: function (property_name, obj) {
    return (obj.properties[property_name] && obj.properties[property_name].value) || null;
  },
  castType: function (value, type) {
    let valueCasted = value
    switch (type) {
      case "datetime":
        if (value == null) {
          break
        }
        valueCasted = new Date(parseInt(value))
        valueCasted = valueCasted.toISOString().replace('T', ' ').split('.')[0]
        break
      case "date":
        if (value == null) {
          break
        }
        valueCasted = new Date(parseInt(value))
        valueCasted = valueCasted.toISOString().replace('T', ' ').split('.')[0].split(' ')[0]
        break
      default:
        valueCasted = value
        break
    }
    return valueCasted
  }
}