'use strict';

//Utilities and Models
const _ = require('underscore');
const Config = require('./contracts/Config');
let EntityLists = require('./contracts/EntityLists');
let Entities = require('./contracts/Entities');

//Mozu Node SDK setup
const FiddlerProxy = require('mozu-node-sdk/plugins/fiddler-proxy');
let apiContext = require('mozu-node-sdk/clients/platform/application')();
apiContext.plugins = [FiddlerProxy()];

const entityResource = require('mozu-node-sdk/clients/platform/entityLists/entity')(apiContext);
const entityListResource = require('mozu-node-sdk/clients/platform/entityList')(apiContext);
const productAttributeVocabValueResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attributes/attributeVocabularyValue')(apiContext);

//Initialized variables used with MZDB Sync
let allYmmValuesFromData = [];
let entityListYear = `${Config.MZDB.YEAR}@${Config.NAMESPACE}`;
let entityListYearMake = `${Config.MZDB.YEARMAKE}@${Config.NAMESPACE}`;
let entityListYearMakeModel = `${Config.MZDB.YEARMAKEMODEL}@${Config.NAMESPACE}`;
let ymmAttributeFQN = Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN;
let ymmLength = 3;
let yearMakeLength = 2;
let years = [];
let yearMakes = [];
let yearMakeConstruct = [];
let yearMakeModels = [];
let yearMakeModelConstruct = [];
let constructIndexer;
let existingYears;

//Sync MZDB Internals

function transformDataForMzdb() {
  let splitDataYear;
  let splitDataYearMake;
  let splitDataYearMakeModel;
  return new Promise((resolve, reject) => {
    allYmmValuesFromData.forEach((ymm) => {
      console.log(ymm);
      let splitDataYear = ymm.split(' ');
      if (splitDataYear.length === ymmLength) {
        years.push(splitDataYear[0]);
        yearMakes.push(`${splitDataYear[0]} ${splitDataYear[1]}`);
      }
    });

    years = _.sortBy(_.uniq(years));
    yearMakes = _.uniq(yearMakes);

    years.forEach((year) => {
      yearMakeConstruct.push({ year: year, makes: [] });
    });

    yearMakes.forEach((yearMake) => {
      yearMakeModelConstruct.push({ yearMake: yearMake, models: [] });
      splitDataYearMake = yearMake.split(' ');
      if (splitDataYearMake.length === yearMakeLength) {
        constructIndexer = _.findIndex(yearMakeConstruct, { year: splitDataYearMake[0] });
        yearMakeConstruct[constructIndexer].makes.push(splitDataYearMake[1]);
      }
    });

    allYmmValuesFromData.forEach((yearMakeModel) => {
      splitDataYearMakeModel = yearMakeModel.split(' ');
      if (splitDataYearMakeModel.length === ymmLength) {
        constructIndexer = _.findIndex(yearMakeModelConstruct, { yearMake: `${splitDataYearMakeModel[0]} ${splitDataYearMakeModel[1]}` });
        yearMakeModelConstruct[constructIndexer].models.push(splitDataYearMakeModel[2]);
      }
    });
    console.log(yearMakeConstruct);
    console.log(yearMakeModelConstruct);
    resolve();
  });
};

function checkExistingYearList() {
  return entityResource.getEntities({ entityListFullName: entityListYear })
    .then((yearsList) => {
      existingYears = _.first(yearsList.items).years;
    })
    .catch((err) => {
      return entityListResource.createEntityList(EntityLists.Year)
        .then((createdList) => {
          console.log(createdList);
          return entityResource.insertEntity({ entityListFullName: entityListYear, id: Entities.Year.id }, { body: Entities.Year });
        });
    });
};

function checkExistingYearMakeList() {
  return entityResource.getEntities({ entityListFullName: entityListYearMake })
    .then((yearMakesList) => {
      console.log(yearMakesList.items);
    })
    .catch((err) => {
      return entityListResource.createEntityList(EntityLists.YearMake);
    });
};

function checkExistingYearMakeModelList() {
  return entityResource.getEntities({ entityListFullName: entityListYearMakeModel })
    .then((yearMakesList) => {
      console.log(yearMakesList.items);
    })
    .catch((err) => {
      return entityListResource.createEntityList(EntityLists.YearMakeModel);
    });
};

function updateYearList() {
  if (existingYears && existingYears.length > 0) {
    years = _.uniq(years.concat(existingYears));
  }
  let yearEntity = {};
  yearEntity.id = "years";
  yearEntity.years = years;

  return entityResource.updateEntity({ entityListFullName: entityListYear, id: yearEntity.id }, { body: yearEntity });
};

function updateYearMakeList() {
  let promises = [];
  yearMakeConstruct.forEach((yearMake) => {
    promises.push(
      entityResource.getEntity({ entityListFullName: entityListYearMake, id: yearMake.year })
        .then((existingYearMake) => {
          console.log("Use existing");
          if (existingYearMake && existingYearMake.makes && existingYearMake.makes.length > 0) {
            yearMake.makes = _.uniq(yearMake.makes.concat(existingYearMake.makes));
          }

          let yearMakeEntity = {};
          yearMakeEntity.year = yearMake.year;
          yearMakeEntity.makes = yearMake.makes;

          return entityResource.updateEntity({ entityListFullName: entityListYearMake, id: yearMakeEntity.year }, { body: yearMakeEntity });
        })
        .catch((err) => {
          console.log("Create a new entry...");
          return entityResource.insertEntity({ entityListFullName: entityListYearMake, id: yearMake.year }, { body: yearMake });
        })
    );
  });
  return Promise.all(promises);
};

function updateYearMakeModelList() {
  let promises = [];
  yearMakeModelConstruct.forEach((yearMakeModel) => {
    promises.push(
      entityResource.getEntity({ entityListFullName: entityListYearMakeModel, id: yearMakeModel.yearMake })
        .then((existingYearMakeModel) => {
          console.log("Use existing");
          if (existingYearMakeModel && existingYearMakeModel.models && existingYearMakeModel.models.length > 0) {
            yearMakeModel.models = _.uniq(yearMakeModel.models.concat(existingYearMakeModel.models));
          }

          let yearMakeModelEntity = {};
          yearMakeModelEntity.yearMake = yearMakeModel.yearMake;
          yearMakeModelEntity.models = yearMakeModel.models;

          return entityResource.updateEntity({ entityListFullName: entityListYearMakeModel, id: yearMakeModelEntity.yearMake }, { body: yearMakeModelEntity });
        })
        .catch((err) => {
          console.log("Create a new entry...");
          return entityResource.insertEntity({ entityListFullName: entityListYearMakeModel, id: yearMakeModel.yearMake }, { body: yearMakeModel });

        })
    );
  });
  return Promise.all(promises);
};

function getAttributeVocabValues() {
  return productAttributeVocabValueResource.getAttributeVocabularyValues({ attributeFQN: ymmAttributeFQN })
    .then(function(collection) {
      let ymmValues = [];
      collection.forEach((value) => {
        ymmValues.push(value.content.stringValue);
      });
      return ymmValues;
    });
}

function deleteExistingEntityLists() {
  let promises = [
    entityListResource.deleteEntityList({ entityListFullName: entityListYear }),
    entityListResource.deleteEntityList({ entityListFullName: entityListYearMake }),
    entityListResource.deleteEntityList({ entityListFullName: entityListYearMakeModel })
  ];
  return Promise.all(promises)
    .catch(() => { });
}

let MzdbIndexer = function() { };

MzdbIndexer.prototype.updateMzdb = function(YmmValuesFromPost) {
  console.log("Starting MZDB Indexing Process...");
  allYmmValuesFromData = YmmValuesFromPost;
  return transformDataForMzdb()
    .then(() => {
      return checkExistingYearList();
    })
    .then((result) => {
      console.log(result);
      return checkExistingYearMakeList();
    })
    .then((result) => {
      return checkExistingYearMakeModelList();
    })
    .then((result) => {
      console.log(result);
      return updateYearList();
    })
    .then((result) => {
      return updateYearMakeList();
    })
    .then(() => {
      return updateYearMakeModelList();
    })
    .catch((err) => {
      console.error(err);
    });
};

MzdbIndexer.prototype.reindex = function() {
  let ymmValues;
  return getAttributeVocabValues()
    .then((attribValues) => {
      ymmValues = attribValues;
      return deleteExistingEntityLists();
    })
    .then(() => {
      return MzdbIndexer.prototype.updateMzdb(ymmValues);
    })
    .catch((err) => {
      console.error(err);
    });
}

module.exports = new MzdbIndexer();