var _ = require('underscore');
var express = require('express');
var router = express.Router();
var apiContext = require('mozu-node-sdk/clients/platform/application')();
var isRequestValid = require('mozu-node-sdk/security/is-request-valid');
var transformContext = require('../util/routing/transform-apiContext');
var ProductAdminResourceFactory = require('mozu-node-sdk/clients/commerce/catalog/admin/product');
var CONSTANTS = require('mozu-node-sdk/constants');
var HEADERPREFIX = CONSTANTS.headerPrefix;
var HEADERS = CONSTANTS.headers;
var CONFIG = require('../util/contracts/Config');

/* GET /mozu.events  */
router.get('/', function(req, res, next) {
  res.render('subnav', { title: 'Eventing', model: "Hello!" });
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

router.use(function(req, res, next) {
  var url = req.body['x-vol-return-url'];
  req.mozu.isProductPage = /(products\/edit)/g.exec(url) ? true : false;
  req.mozu.productCode = _.last(url.split(_.first(/https?:\/\/.+?(?:edit\/)/g.exec(url))));
  next();
});

/* POST against /mozu.events */
router.post('/', function(req, res, next) {
  console.log(CONFIG.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN);
  console.log("Is Product Edit Page? " + (req.mozu.isProductPage ? "\u2713" : "x"));
  console.log("Is Valid? " + (req.mozu.isValid ? "\u2713" : "x"));
  console.log(`Product Code: ${req.mozu.productCode}`);
  console.log(req.body);
  if (req.mozu.productCode && req.mozu.isValid) {
    console.log(req.body[HEADERPREFIX + HEADERS.MASTERCATALOG]);
    apiContext.context[HEADERS.MASTERCATALOG] = req.body[HEADERPREFIX + HEADERS.MASTERCATALOG];
    apiContext.context[HEADERS.TENANT] = req.body[HEADERPREFIX + HEADERS.TENANT];
    var productResource = ProductAdminResourceFactory(apiContext);
    console.log("Preparing to get Product info...");
    productResource.getProduct({ productCode: req.mozu.productCode })
      .then(function(product) {
        console.log("Retrieved Product Info");
        res.render('subnav', { model: req.body, product: product, title: "Sync YMM Data" });
      });
  } else {
    var notAuthorizedOrMissingProductCode = new Error("There was a problem with authorization or retrieving this product");
    res.render('error', { message: notAuthorizedOrMissingProductCode.message, error: notAuthorizedOrMissingProductCode });
  }
});

module.exports = router;