'use strict';
const _ = require('underscore');
const apiContext = require('mozu-node-sdk/clients/platform/application')();
let namespace = apiContext.context.appKey;
namespace = _.first(namespace.split('.'));

const Config = {
  "MZDB": {
    "YEAR": "year",
    "YEARMAKE": "yearmake",
    "YEARMAKEMODEL": "yearmakemodel"
  },
  "NAMESPACE": namespace,
  "ATTRIBUTES": {
    "YMMCSV": {
      "ADMINNAME": "YMM-CSV",
      "ATTRIBUTECODE": "ymm-csv",
      "ATTRIBUTEFQN": "Grobelny~ymm-csv"
    },
    "YEARMAKEMODEL": {
      "ADMINNAME": "Year Make Model",
      "ATTRIBUTECODE": "year-make-model",
      "ATTRIBUTEFQN": "Grobelny~year-make-model"
    }
  },
  "SUBNAVLINK": {
    "PATH": ["YMM App","Sync Year Make Model Data"],
    "HREF": "https://1df0da74.ngrok.io/subnav",
    "MODALWINDOWTITLE": "Sync Year Make Model Data",
    "SUBNAVLINKFQN": "subnavlinks@mozu"
  }
};

module.exports = Config;