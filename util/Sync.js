'use strict';

//Utilities and Models
const _ = require('underscore');
const Config = require('./Config');
let EntityLists = require('./EntityLists');
let Entities = require('./Entities');

//Mozu Node SDK setup
const FiddlerProxy = require('mozu-node-sdk/plugins/fiddler-proxy');
let apiContext = require('mozu-node-sdk/clients/platform/application')();
apiContext.plugins = [FiddlerProxy()];

//Mozu Node SDK Resources
const productResource = require('mozu-node-sdk/clients/commerce/catalog/admin/product')(apiContext);
const productPropertyResource = require('mozu-node-sdk/clients/commerce/catalog/admin/products/productProperty')(apiContext);
const productTypeResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/productType')(apiContext);
const productTypePropertyResource = require("mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/producttypes/productTypeProperty")(apiContext);
const productAttributeResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attribute')(apiContext);
const productAttributeVocabValueResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attributes/attributeVocabularyValue')(apiContext);
const entityResource = require('mozu-node-sdk/clients/platform/entityLists/entity')(apiContext);
const entityListResource = require('mozu-node-sdk/clients/platform/entityList')(apiContext);

//Initialized variables used with Attribute, Product Type, and Product Sync
let productCode = '';
let attributeFQN = 'Grobelny~year-make-model';
let dataAttributeField = 'Grobelny~ymm-csv';
let productTypeId;

let allYmmValuesFromData = [];

let cachedProductAttributeVocabValues = [];
let cachedProductTypeVocabValues = [];
let cachedProductTypeProperty = {};
let cachedProduct = {};

let vocabValuesBuiltForProductAttribute = [];
let existingAndNewYmmValuesToAddOnProductType = [];
let existingAndNewYmmValuesToAddOnProduct = [];

let attributesToAdd;

//Initialized variables used with MZDB Sync
let entityListYear = `${Config.MZDB.YEAR}@${Config.NAMESPACE}`;
let entityListYearMake = `${Config.MZDB.YEARMAKE}@${Config.NAMESPACE}`;
let entityListYearMakeModel = `${Config.MZDB.YEARMAKEMODEL}@${Config.NAMESPACE}`;
let ymmLength = 3;
let yearMakeLength = 2;
let years = [];
let yearMakes = [];
let yearMakeConstruct = [];
let yearMakeModels = [];
let yearMakeModelConstruct = [];
let constructIndexer;
let existingYears;

/*
 * Retrieve data using dataAttributeField as the data store. Stores the transformed data within allYmmValuesFromData.
 * @param {function} transform - An uncoupled method for transforming the data. Currently transformCsv exists, but any function can be substituted.  
 * @returns {Promise} null
 */
// function retrieveYMMData(transform) {
//   let ymmData;
//   let ymmValues;

//   return productResource.getProduct({ productCode: productCode })
//     .then((product) => {
//       //Cache the Product data for later use.
//       cachedProduct = product;
//       //Locate the YMMM data field Product Attribute on the Product being synced.
//       ymmData = _.first(product.properties.filter((property) => {
//         return property.attributeFQN === dataAttributeField;
//       }));
//       //Pull the data from the YMM data field Product Attribute.
//       if (ymmData !== undefined) {
//         ymmValues = _.first(ymmData.values).content.stringValue;
//         allYmmValuesFromData = transform(ymmValues);
//       }
//     });
// }

/*
 * Verifies that the data returned from dataAttributeField does not already exist on the Product Attribute.  
 * @returns {Promise<Boolean>} hasNewValues - Identifies if there are new values to add to the Product Attribute.
 */
function checkExistingAttributeValuesOnAttribute() {
  let hasNewValues = false;
  let existingYmmValuesOnAttribute = [];
  //Pull in existing values on the Product Attribute.
  return productAttributeVocabValueResource.getAttributeVocabularyValues({ attributeFQN: attributeFQN })
    .then((attributes) => {
      //If attributes exist, evaluate against YMM values from data. 
      if (attributes && attributes.length > 0) {
        //Cache Vocabulary Values from Product Attribute for later use.
        cachedProductAttributeVocabValues = attributes;
        //Create an array of string values to compare YMM data existing on the Product Attribute.
        for (let attribute of attributes) {
          existingYmmValuesOnAttribute.push(attribute.content.stringValue);
        }
        //Find the difference between the existing YMM data on the Product Attribute and the YMM values pulled from the data field.
        vocabValuesBuiltForProductAttribute = buildProductAttrVocabValues(_.difference(allYmmValuesFromData, existingYmmValuesOnAttribute));

        //Return a boolean based on the difference between the YMM values pulled from data field and the existing YMM values on the Product Attribute.
        if (vocabValuesBuiltForProductAttribute.length === 0) {
          console.log("No new values found to add to Product Attribute.");
          return hasNewValues = false;
        } else {
          return hasNewValues = true;
        }
        //If no attributes exist, use all YMM values from the data field.
      } else if (allYmmValuesFromData.length > 0) {
        vocabValuesBuiltForProductAttribute = buildProductAttrVocabValues(allYmmValuesFromData);
        return hasNewValues = true;
      } else {
        console.log("No values found in YMM Data.");
        return hasNewValues = false;
      }
    });
};

function updateProductAttribute(hasNewValues) {
  if (hasNewValues) {
    let updateProductAttribute = [];
    for (let attribute of vocabValuesBuiltForProductAttribute) {
      updateProductAttribute.push(productAttributeVocabValueResource.addAttributeVocabularyValue({ attributeFQN: attributeFQN }, { body: attribute }));
    }
    return Promise.all(updateProductAttribute)
      .then((collection) => {
        console.log("Returned Promise values");
        console.log(collection);
        for (let value of collection) {
          cachedProductAttributeVocabValues.push(value);
        }
        console.log("Cached Attributes");
        console.log(cachedProductAttributeVocabValues);
      });
  }
};

function retrieveProductTypeId() {
  return productTypeResource.getProductTypes({ filter: "isBaseProductType eq true" })
    .then((baseType) => {
      productTypeId = _.first(baseType.items).id;
    });
};

function cacheAttributeVocabularyValues(alwaysRefreshCache) {
  if (cachedProductAttributeVocabValues.length === 0 || alwaysRefreshCache) {
    console.log("No cached attributes found.");
    return productAttributeVocabValueResource.getAttributeVocabularyValues({ attributeFQN: attributeFQN })
      .then((attributes) => {
        console.log("Looking up attributes");
        if (attributes && attributes.length > 0) {
          cachedProductAttributeVocabValues = attributes;
        }
      });
  }
};

function checkExistingAttributeValuesOnProductType() {
  let existingYmmValuesOnType = [];
  let hasNewValues = false;
  return productTypePropertyResource.getProperty({ productTypeId: productTypeId, attributeFQN: attributeFQN })
    .then((productTypeProperty) => {
      if (productTypeProperty) {
        cachedProductTypeProperty = productTypeProperty;
      }
      if (productTypeProperty && productTypeProperty.vocabularyValues && productTypeProperty.vocabularyValues.length > 0) {

        console.log("Is this running?");
        cachedProductTypeVocabValues = productTypeProperty.vocabularyValues;
        for (let value of cachedProductTypeVocabValues) {
          existingYmmValuesOnType.push(value.vocabularyValueDetail.content.stringValue);
        }

        if (existingYmmValuesOnType && existingYmmValuesOnType.length > 0 && _.difference(allYmmValuesFromData, existingYmmValuesOnType).length > 0) {
          existingAndNewYmmValuesToAddOnProductType = _.union(existingYmmValuesOnType, allYmmValuesFromData);
          return hasNewValues = true;
        } else {
          console.log("No new values to add to Product Type.");
          return hasNewValues = false;
        }

      } else if (allYmmValuesFromData && allYmmValuesFromData.length > 0) {
        console.log("No existing attributes on Product Type Product");
        existingAndNewYmmValuesToAddOnProductType = allYmmValuesFromData;
        return hasNewValues = true;

      } else {
        console.log("No values found in YMM Data.");
        return hasNewValues = false;
      }
    });
};

function filterAndBuildAttributesOnProductType() {
  let filteredProductTypeAttrs = [];
  let filteredProductAttributeAttrs = [];
  let finalYmmVocabValuesForProductType = [];
  let maxOrder = 0;

  console.log("Cached Product Attribute Attributes");
  console.log(cachedProductAttributeVocabValues);
  console.log("Cached Product Type Attributes")
  console.log(cachedProductTypeVocabValues);
  console.log("YMM Values");
  console.log(existingAndNewYmmValuesToAddOnProductType);

  if (existingAndNewYmmValuesToAddOnProductType && existingAndNewYmmValuesToAddOnProductType.length > 0) {
    filteredProductTypeAttrs = _.filter(cachedProductTypeVocabValues, (attr) => {
      if (attr.order > maxOrder) maxOrder = attr.order;

      let existingValue = attr.vocabularyValueDetail.content.stringValue;
      if (_.contains(existingAndNewYmmValuesToAddOnProductType, existingValue)) {
        existingAndNewYmmValuesToAddOnProductType.splice(existingAndNewYmmValuesToAddOnProductType.indexOf(existingValue), 1);
        return attr;
      }
    });
  }

  console.log("Filtered Product Type Attributes");
  console.log(filteredProductTypeAttrs);
  console.log("Existing and New YMM Values");
  console.log(existingAndNewYmmValuesToAddOnProductType);

  if (existingAndNewYmmValuesToAddOnProductType && existingAndNewYmmValuesToAddOnProductType.length > 0) {

    filteredProductAttributeAttrs = _.filter(cachedProductAttributeVocabValues, (attr) => {
      let existingValue = attr.content.stringValue;
      if (_.contains(existingAndNewYmmValuesToAddOnProductType, existingValue)) {
        existingAndNewYmmValuesToAddOnProductType.splice(existingAndNewYmmValuesToAddOnProductType.indexOf(existingValue), 1);
        return attr;
      }
    });
  }

  console.log("Filtered Product Attribute Attributes");
  console.log(filteredProductAttributeAttrs);
  console.log("Existing and New YMM Values");
  console.log(existingAndNewYmmValuesToAddOnProductType);

  if (existingAndNewYmmValuesToAddOnProductType && existingAndNewYmmValuesToAddOnProductType.length > 0) {
    throw new Error("Attempting to add value(s) to YMM Product Type that are not present on YMM Product Attribute");
  }

  if (filteredProductAttributeAttrs && filteredProductAttributeAttrs.length > 0) {
    filteredProductAttributeAttrs = buildProductAttrOnProductType(filteredProductAttributeAttrs, maxOrder);
  }

  console.log("Built Product Attribute Attributes");
  console.log(filteredProductAttributeAttrs);

  finalYmmVocabValuesForProductType = _.union(filteredProductTypeAttrs, filteredProductAttributeAttrs);

  console.log("Complete List");
  console.log(finalYmmVocabValuesForProductType);

  return finalYmmVocabValuesForProductType;
};

function updateProductType(hasNewValues) {
  if (hasNewValues) {
    let attributesToAddToProductType = filterAndBuildAttributesOnProductType();
    console.log("Attributes ready to update Product Type");
    console.log(attributesToAddToProductType);
    cachedProductTypeProperty.vocabularyValues = attributesToAddToProductType;
    return productTypePropertyResource.updateProperty({ productTypeId: productTypeId, attributeFQN: attributeFQN }, { body: cachedProductTypeProperty });
  }
};

function filterAndBuildAttributesOnProduct() {
  let filteredAttrs = [];
  if (allYmmValuesFromData && allYmmValuesFromData.length > 0) {
    filteredAttrs = _.filter(cachedProductAttributeVocabValues, (attr) => {
      let existingValue = attr.content.stringValue;
      if (_.contains(allYmmValuesFromData, existingValue)) {
        return attr;
      }
    });

    return buildProductAttrOnProduct(filteredAttrs);
  }
};

function updateProduct() {
  console.log(allYmmValuesFromData);
  let attributesToAddToProduct = filterAndBuildAttributesOnProduct();
  productPropertyResource.getProperty({ productCode, attributeFQN })
    .then((property) => {
      console.log(property);

      if (!attributesToAddToProduct) {
        console.log("Removing all Product Property Values...");
        return productPropertyResource.updateProperty({ productCode: productCode, attributeFQN: attributeFQN }, { body: { attributeFQN: attributeFQN, values: attributesToAddToProduct } });
      }
      console.log("Attributes to Add...");
      console.log(attributesToAddToProduct);
      console.log("Attribute Values to Add");
      console.log(_.pluck(attributesToAddToProduct, 'value'));
      console.log("Existing Attribute Values");
      console.log(_.pluck(property.values, 'value'));
      console.log(_.difference(_.pluck(attributesToAddToProduct, 'value'), _.pluck(property.values, 'value')));
      let difference = _.difference(_.pluck(attributesToAddToProduct, 'value'), _.pluck(property.values, 'value'));
      console.log("Filtered Array:");
      console.log(difference);
      if (difference.length > 0) {
        console.log("Updating Product Property...");
        return productPropertyResource.updateProperty({ productCode: productCode, attributeFQN: attributeFQN }, { body: { attributeFQN: attributeFQN, values: attributesToAddToProduct } });
      }
    }, (err) => {
      console.log("There was an error");
      if (attributesToAddToProduct.length > 0) {
        console.log("Adding Product Property...");
        return productPropertyResource.addProperty({ productCode }, { body: { attributeFQN: attributeFQN, values: attributesToAddToProduct } });
      }
    })
    .then((result) => {
      console.log(result);
    });
  console.log("Attribute to add to Product");
  console.log(attributesToAddToProduct);
};

// function transformCsv(values) {
//   let lines = values.trim().split('\n');
//   let eachValue = [];
//   for (let line of lines) {
//     eachValue.push(line.trim().split(','));
//   }
//   eachValue = _.flatten(eachValue);
//   eachValue = _.map(eachValue, (value) => { return value.trim(); });
//   return eachValue;
// }

function buildProductAttrVocabValues(values) {
  let vocabVals = [];
  _.each(values, (value) => {
    let vocabVal = {};
    vocabVal.value = value.replace(/ /g, '-');
    vocabVal.content = {};
    vocabVal.content.localeCode = 'en-US';
    vocabVal.content.stringValue = value;
    vocabVals.push(vocabVal);
  });
  return vocabVals;
};

function buildProductAttrOnProductType(attributes, order) {
  let vocabVals = [];
  _.each(attributes, (attribute) => {
    vocabVals.push({
      value: attribute.value,
      order: ++order,
      vocabularyValueDetail: attribute
    });
  });

  return vocabVals;
};

function buildProductAttrOnProduct(attributes) {
  let vocabVals = [];
  _.each(attributes, (attribute) => {
    vocabVals.push({
      value: attribute.value
    });
  });

  return vocabVals;
};


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
};

let Sync = function() { };

Sync.prototype.updateAttributeProductTypeAndProduct = function(YmmValuesFromPost, ProductDataFromPost) {
  return new Promise((resolve, reject) => {
    console.log("Starting Sync Process...");
    allYmmValuesFromData = YmmValuesFromPost;
    cachedProduct = ProductDataFromPost;
    productCode = ProductDataFromPost.productCode;

    checkExistingAttributeValuesOnAttribute()
      .then(updateProductAttribute)
      .then(retrieveProductTypeId)
      .then(cacheAttributeVocabularyValues)
      .then(checkExistingAttributeValuesOnProductType)
      .then(updateProductType)
      .then(cacheAttributeVocabularyValues)
      .then(updateProduct)
      .then(resolve())
      .catch((err) => {
        console.error("You found an error!");
        console.error(err);
        reject(err);
      });
  });
};

Sync.prototype.updateMzdb = function() {
  // allYmmValuesFromData = allYmmValuesFromData || YmmValuesFromPost;
  // cachedProduct = cachedProduct || ProductDataFromPost;
  // productCode = productCode || ProductDataFromPost.productCode;

  transformDataForMzdb()
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
    });
};

module.exports = new Sync();