'use strict';
const xlsx = require('xlsx');
const _ = require('underscore');
let SyncFactory = require('./Sync');
let MzdbIndexerFactory = require('./MzdbIndexer');

let Importer = function(filePath) {
  let ymmWorkbook = xlsx.readFile(filePath);
  let ymmData = ymmWorkbook.Sheets[_.first(ymmWorkbook.SheetNames)];
  let bulkYmmDataObject = xlsx.utils.sheet_to_json(ymmData);

  function transformYmmData(bulkYmmDataObject) {
    let finalizedYmmData = {};
    for (let i = 0; i < bulkYmmDataObject.length; i++) {
      finalizedYmmData[bulkYmmDataObject[i].ProductCode] = _.union(finalizedYmmData[bulkYmmDataObject[i].ProductCode], [`${bulkYmmDataObject[i].Year} ${bulkYmmDataObject[i].Make} ${bulkYmmDataObject[i].Model}`]);
      finalizedYmmData.allYmmValues = _.union(finalizedYmmData.allYmmValues, [`${bulkYmmDataObject[i].Year} ${bulkYmmDataObject[i].Make} ${bulkYmmDataObject[i].Model}`]);
    };

    return finalizedYmmData;
  };

  function importYmmData(finalizedYmmData) {
    let Sync = new SyncFactory(finalizedYmmData.allYmmValues);
    return Sync.updateAttributeAndProductType()
      .then(() => {
        let promises = [];
        console.log("Finished...");
        for (let key in finalizedYmmData) {
          if (key === 'allYmmValues') { continue; }
          let Sync = new SyncFactory(finalizedYmmData[key], key);
          promises.push(Sync.updateProductOnly());
        }

        return Promise.all(promises);
      })
      .then(() => {
        console.log("Added to Products");
        console.log(finalizedYmmData.allYmmValues);
        let MzdbIndexer = new MzdbIndexerFactory();
        return MzdbIndexer.reindex();
      })
      .then(() => {
        console.log("Finished Import.")
      });
  };

  return {
    import: function() {
      return importYmmData(transformYmmData(bulkYmmDataObject))
        .then(() => {
          console.log("Import complete.");
        });
    }
  };
};

module.exports = Importer;