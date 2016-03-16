'use strict';
const Config = require('./Config');

module.exports = {
  YearMakeModel: {
    adminName: Config.ATTRIBUTES.YEARMAKEMODEL.ADMINNAME,
    attributeCode: Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTECODE,
    dataType: "String",
    inputType: "List",
    isProperty: true,
    content: {
      name: Config.ATTRIBUTES.YEARMAKEMODEL.ADMINNAME
    },
    valueType: "Predefined"
  },
  YMMCSV: {
    adminName: Config.ATTRIBUTES.YMMCSV.ADMINNAME,
    attributeCode: Config.ATTRIBUTES.YMMCSV.ATTRIBUTECODE,
    dataType: "String",
    inputType: "TextArea",
    isProperty: true,
    content: {
      name: Config.ATTRIBUTES.YMMCSV.ADMINNAME
    },
    valueType: "AdminEntered",
    searchSettings: {
      searchableInAdmin: false,
      searchDisplayValue: false,
      allowFilteringAndSortingInStorefront: false
    }
  }
};