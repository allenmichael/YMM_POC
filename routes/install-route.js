var _ = require('underscore');
var express = require('express');
var router = express.Router();
var apiContext = require('mozu-node-sdk/clients/platform/application')();
var isRequestValid = require('mozu-node-sdk/security/is-request-valid');
var transformContext = require('../util/transform-apiContext');
var EVENTNAMES = require('../util/event-names');

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

//POST against /install
router.post('/', function(req, res, next) {
  console.log("Is Valid? " + (req.mozu.isValid ? "\u2713" : "x"));
  if (req.mozu.isValid && req.body.topic === EVENTNAMES.APPLICATIONINSTALLED) {
    res.sendStatus(200);
    console.log("Application Installed Fired...");
  } else if (req.mozu.isValid && req.body.topic === EVENTNAMES.APPLICATIONUPGRADED) {
    res.sendStatus(200);
    console.log("Application Upgraded Fired...");
  }
});

module.exports = router;