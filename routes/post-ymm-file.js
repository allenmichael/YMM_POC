var express = require('express');
var router = express.Router();
var ImporterFactory = require('../util/Importer');
var multer = require('multer');
var _ = require('underscore');
var fs = require('fs');

router.post('/', multer({ dest: './uploads/' }).single('ymmFile'), function(req, res, next) {
  console.log(req.file);
  console.log(req.body);
  var Importer = new ImporterFactory(req.file.path);
  Importer.import()
    .then(function() {
      fs.unlinkSync(req.file.path);
      res.send('Finished importing your data.');
    })
    .catch(function(err) {
      console.log("There was an error importing your file.");
      console.error(err);
    });

});

module.exports = router;