'use strict';
let Config = require('./Config');

module.exports = {
  Year: {
    "contextLevel": "tenant",
    "idProperty": {
      "dataType": "string",
      "propertyName": "id"
    },
    "isSandboxDataCloningSupported": true,
    "isShopperSpecific": false,
    "isVisibleInStorefront": true,
    "name": Config.MZDB.YEAR,
    "nameSpace": Config.NAMESPACE,
    "usages": ["entityManager"],
    "useSystemAssignedId": false
  },
  YearMake: {
    "contextLevel": "tenant",
    "idProperty": {
      "dataType": "integer",
      "propertyName": "year"
    },
    "indexA": {
      "dataType": "integer",
      "propertyName": "year"
    },
    "isSandboxDataCloningSupported": true,
    "isShopperSpecific": false,
    "isVisibleInStorefront": true,
    "name": Config.MZDB.YEARMAKE,
    "nameSpace": Config.NAMESPACE,
    "usages": ["entityManager"],
    "useSystemAssignedId": false
  },
  YearMakeModel: {
    "contextLevel": "tenant",
    "idProperty": {
      "dataType": "string",
      "propertyName": "yearMake"
    },
    "indexA": {
      "dataType": "string",
      "propertyName": "yearMake"
    },
    "isSandboxDataCloningSupported": true,
    "isShopperSpecific": false,
    "isVisibleInStorefront": true,
    "name": Config.MZDB.YEARMAKEMODEL,
    "nameSpace": Config.NAMESPACE,
    "usages": ["entityManager"],
    "useSystemAssignedId": false
  }
};