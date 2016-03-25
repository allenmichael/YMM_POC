var express = require('express');
var router = express.Router();
var SyncFactory = require('../util/Sync');
var xlsx = require('xlsx');
var multer = require('multer');
var _ = require('underscore');

router.post('/', multer({ dest: './uploads/'}).single('ymmFile'), function(req, res, next) {
  console.log(req.file);
  console.log(req.body);
  var ymmWorkbook = xlsx.readFile(req.file.path);
  var ymmData = ymmWorkbook.Sheets[_.first(ymmWorkbook.SheetNames)];
  var bulkYmmDataObject = xlsx.utils.sheet_to_json(ymmData);
  console.log(bulkYmmDataObject);
  res.send('You posted to the Ymm File Route');
});

module.exports = router;