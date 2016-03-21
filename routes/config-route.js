var _ = require('underscore');
var express = require('express');
var router = express.Router();
var apiContext = require('mozu-node-sdk/clients/platform/application')();
var isRequestValid = require('mozu-node-sdk/security/is-request-valid');
var transformContext = require('../util/transform-apiContext');
var Config = require('../util/Config');

router.get('/', function(req, res, next) {
  res.render('config', { title: 'Application Configuration', model: "Hello!" });
});

router.get('/api/configvalues', function(req, res, next) {
  res.send(Config);
});

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

// POST against /config
router.post('/', function(req, res, next) {
  if (req.mozu.isValid) {
    res.render('config', { title: "YMM Configuration" });
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;