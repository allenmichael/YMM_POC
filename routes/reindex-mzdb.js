var express = require('express');
var router = express.Router();
var MzdbIndexerFactory = require('../util/MzdbIndexer');
var MzdbIndexer = MzdbIndexerFactory();

router.get('/', function(req, res, next) {
  console.log(req.body);
  
  MzdbIndexer.reindex()
    .then(() => {
      res.send(`Successfully reindexed all MZDB entity lists`);
    })
    .catch((err) => {
      res.send(`There was an error:
    ${err}`);
    });
});

module.exports = router;