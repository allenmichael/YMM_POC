var express = require('express');
var router = express.Router();
const Config = require('../util/contracts/Config');
var FiddlerProxy = require('mozu-node-sdk/plugins/fiddler-proxy');
var apiContext = require('mozu-node-sdk/clients/platform/application')();
apiContext.plugins = [FiddlerProxy()];
var RemoveYmmValueFactory = require('../util/RemoveYmmValue');
var RemoveYmmValue = RemoveYmmValueFactory();

var productPropertyVocabularyValuesResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attributes/attributeVocabularyValue')(apiContext);

router.get('/', function(req, res, next) {
  productPropertyVocabularyValuesResource.getAttributeVocabularyValues({ attributeFQN: Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN })
  .then(function(productPropertyValues) {
    res.send(productPropertyValues);
  });
});

router.post('/', function(req, res, next) {
  console.log(req.body.attributeDataValues);
  console.log(req.body.attributeNameValues);
  
  RemoveYmmValue.removeValues(req.body.attributeNameValues, req.body.attributeDataValues)
  .then(function() {
    res.send("Removed values");
  });
});

module.exports = router;