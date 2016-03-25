'use strict';

//Utilities and Models
const _ = require('underscore');
const Config = require('./contracts/Config');

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

let Sync = function(YmmValuesFromPost, ProductData) {
  //Initialized variables used with Attribute, Product Type, and Product Sync
  let productCode = (ProductData) ? ProductData.productCode || ProductData : '';
  let allYmmValuesFromData = YmmValuesFromPost;

  let ymmAttributeFQN = Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN;
  let ymmDataAttributeField = Config.ATTRIBUTES.YMMCSV.ATTRIBUTEFQN;
  let productTypeId;

  let cachedProductAttributeVocabValues = [];
  let cachedProductTypeVocabValues = [];
  let cachedProductTypeProperty = {};

  let vocabValuesBuiltForProductAttribute = [];
  let existingAndNewYmmValuesToAddOnProductType = [];
  let existingAndNewYmmValuesToAddOnProduct = [];

  let attributesToAdd;

  /*
   * Verifies that the data returned from dataAttributeField does not already exist on the Product Attribute.  
   * @returns {Promise<Boolean>} hasNewValues - Identifies if there are new values to add to the Product Attribute.
   */
  let checkExistingAttributeValuesOnAttribute = function() {
    let hasNewValues = false;
    let existingYmmValuesOnAttribute = [];
    //Pull in existing values on the Product Attribute.
    return productAttributeVocabValueResource.getAttributeVocabularyValues({ attributeFQN: ymmAttributeFQN })
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
        updateProductAttribute.push(productAttributeVocabValueResource.addAttributeVocabularyValue({ attributeFQN: ymmAttributeFQN }, { body: attribute }));
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
        })
        .catch((err) => { });
    }
  };

  function retrieveProductTypeId() {
    return productTypeResource.getProductTypes({ filter: "isBaseProductType eq true" })
      .then((baseType) => {
        productTypeId = _.first(baseType.items).id;
      })
      .catch((err) => { });
  };

  function cacheAttributeVocabularyValues(alwaysRefreshCache) {
    if (cachedProductAttributeVocabValues.length === 0 || alwaysRefreshCache) {
      console.log("No cached attributes found.");
      return productAttributeVocabValueResource.getAttributeVocabularyValues({ attributeFQN: ymmAttributeFQN })
        .then((attributes) => {
          console.log("Looking up attributes");
          if (attributes && attributes.length > 0) {
            cachedProductAttributeVocabValues = attributes;
          }
        })
        .catch((err) => { });
    }
  };

  function checkExistingAttributeValuesOnProductType() {
    let existingYmmValuesOnType = [];
    let hasNewValues = false;
    return productTypePropertyResource.getProperty({ productTypeId: productTypeId, attributeFQN: ymmAttributeFQN })
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
      })
      .catch((err) => { });
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
      return productTypePropertyResource.updateProperty({ productTypeId: productTypeId, attributeFQN: ymmAttributeFQN }, { body: cachedProductTypeProperty })
        .catch((err) => { });
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
    return productPropertyResource.getProperty({ productCode, ymmAttributeFQN })
      .then((property) => {
        console.log(property);

        if (!attributesToAddToProduct) {
          console.log("Removing all Product Property Values...");
          return productPropertyResource.updateProperty({ productCode: productCode, attributeFQN: ymmAttributeFQN }, { body: { attributeFQN: ymmAttributeFQN, values: attributesToAddToProduct } });
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
          return productPropertyResource.updateProperty({ productCode: productCode, attributeFQN: ymmAttributeFQN }, { body: { attributeFQN: ymmAttributeFQN, values: attributesToAddToProduct } });
        }
      })
      .catch((err) => {
        console.log("There was an error");
        if (attributesToAddToProduct.length > 0 && err.originalError.errorCode === 'ITEM_NOT_FOUND') {
          console.log("Adding Product Property...");
          return productPropertyResource.addProperty({ productCode }, { body: { attributeFQN: ymmAttributeFQN, values: attributesToAddToProduct } });
        }
      })
      .then((result) => {
        console.log(result);
      });
  };

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
    let uniqueValues = [];

    _.each(attributes, (attribute) => {
      uniqueValues.push(attribute.value);
    });

    uniqueValues = _.uniq(uniqueValues);

    _.each(uniqueValues, (value) => {
      vocabVals.push({
        value: value
      });
    });

    return vocabVals;
  };

  return {
    updateAttributeProductTypeAndProduct: function() {
      console.log("Starting Sync Process...");
      return checkExistingAttributeValuesOnAttribute()
        .then(updateProductAttribute)
        .then(retrieveProductTypeId)
        .then(cacheAttributeVocabularyValues)
        .then(checkExistingAttributeValuesOnProductType)
        .then(updateProductType)
        .then(cacheAttributeVocabularyValues)
        .then(updateProduct)
        .catch((err) => {
          console.error(err);
        });
    },
    updateAttributeAndProductType: function() {
      return checkExistingAttributeValuesOnAttribute()
        .then(updateProductAttribute)
        .then(retrieveProductTypeId)
        .then(cacheAttributeVocabularyValues)
        .then(checkExistingAttributeValuesOnProductType)
        .then(updateProductType)
        .catch((err) => {
          console.error(err);
        });
    },
    updateProductOnly: function() {
      return cacheAttributeVocabularyValues(true)
        .then(updateProduct)
        .catch((err) => {
          console.error(err);
        });
    }
  }
};

module.exports = Sync;