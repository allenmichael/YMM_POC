var express = require('express');
var router = express.Router();
var SyncFactory = require('../util/Sync');
var MzdbIndexer = require('../util/MzdbIndexer');

router.post('/', function(req, res, next) {
  console.log(req.body);
  console.info(Sync);
  if (req.body && req.body.values && req.body.product) {
    var Sync = new SyncFactory(req.body.values, req.body.product);
    Sync.updateAttributeProductTypeAndProduct()
      .then(() => {
        return MzdbIndexer.updateMzdb(req.body.values);
      })
      .then(() => {
        res.send(`Successfully updated YMM`);
      })
      .catch((err) => {
        res.send(`There was an error:
    ${err}`);
      });
  }
});

module.exports = router;