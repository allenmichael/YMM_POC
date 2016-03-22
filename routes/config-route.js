var _ = require('underscore');
var express = require('express');
var router = express.Router();
var apiContext = require('mozu-node-sdk/clients/platform/application')();
var isRequestValid = require('mozu-node-sdk/security/is-request-valid');
var transformContext = require('../util/routing/transform-apiContext');
var Config = require('../util/contracts/Config');

router.get('/', function(req, res, next) {
  res.render('config', { title: 'Application Configuration', model: "Hello!" });
});

router.get('/api/configvalues', function(req, res, next) {
  res.send(Config);
});

router.post('/api/configvalues/subnavlink', function(req, res, next) {
  Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN = req.body.ymmAttrFQN;
  console.log(req.body.ymmAttrFQN);
  res.status(200);
  res.send(Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN);
});

router.post('/api/configvalues/ymmdataattributefqn', function(req, res, next) {
  Config.ATTRIBUTES.YMMCSV.ATTRIBUTEFQN = req.body.ymmDataAttrFQN;
  console.log(req.body.ymmDataAttrFQN);
  res.status(200);
  res.send(Config.ATTRIBUTES.YMMCSV.ATTRIBUTEFQN);
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