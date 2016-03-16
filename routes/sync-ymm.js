var express = require('express');
var router = express.Router();
var Sync = require('../util/Sync');

router.post('/', function (req, res, next) {
  console.log(req.body);
  console.info(Sync);
  if (req.body && req.body.values && req.body.product) {
    Sync.updateAttributeProductTypeAndProduct(req.body.values, req.body.product)
      .then((result) => {
        return Sync.updateMzdb();
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