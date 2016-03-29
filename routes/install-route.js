var _ = require('underscore');
var fs = require('fs');
var express = require('express');
var router = express.Router();
var apiContext = require('mozu-node-sdk/clients/platform/application')();
var isRequestValid = require('mozu-node-sdk/security/is-request-valid');
var transformContext = require('../util/routing/transform-apiContext');
var CONSTANTS = require('mozu-node-sdk/constants');
var EVENTNAMES = require('../util/routing/event-names');
var runOnce = true;

//Mozu Validation Middleware
router.use(function(req, res, next) {
  isRequestValid(apiContext.context, req, function(err) {
    if (err) {
      res.status(401);
      res.render('error', { message: err.message, error: err });
    } else {
      req.mozu = { isValid: true };
      next();
    }
  });
});

router.use(function(req, res, next) {
  if (runOnce && req.mozu.isValid) {
    var readConfigFile = fs.readFileSync('mozu.config.json');
    var jsonConfig = JSON.parse(readConfigFile);
    jsonConfig[CONSTANTS.headers.TENANT] = req.headers[CONSTANTS.headerPrefix + CONSTANTS.headers.TENANT];
    jsonConfig[CONSTANTS.headers.MASTERCATALOG] = req.headers[CONSTANTS.headerPrefix + CONSTANTS.headers.MASTERCATALOG];
    fs.writeFileSync('mozu.config.json', JSON.stringify(jsonConfig));
    next();
  } else {
    next();
  }
})

//POST against /install
router.post('/', function(req, res, next) {
  console.log("Is Valid? " + (req.mozu.isValid ? "\u2713" : "x"));
  if (req.mozu.isValid && (req.body.topic === EVENTNAMES.APPLICATIONINSTALLED || req.body.topic === EVENTNAMES.APPLICATIONUPGRADED) && runOnce) {
    var Installer = require('../util/Installer');
    Installer.install();
    runOnce = false;
    res.sendStatus(200);
    console.log("Application Installed Fired...");
  } else if (req.mozu.isValid) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

module.exports = router;