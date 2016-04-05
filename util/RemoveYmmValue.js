'use strict';

let RemoveYmmValue = function() {
  const _ = require('underscore');
  const Config = require('./contracts/Config');
  const FiddlerProxy = require('mozu-node-sdk/plugins/fiddler-proxy');
  let apiContext = require('mozu-node-sdk/clients/platform/application')();
  apiContext.plugins = [FiddlerProxy()];

  const getAllProducts = require('./mozu-sdk-extensions/GetAllProducts');
  const productPropertyResource = require('mozu-node-sdk/clients/commerce/catalog/admin/products/productProperty')(apiContext);
  const productTypeResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/productType')(apiContext);
  const productTypePropertyResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/producttypes/productTypeProperty')(apiContext);
  const productAttributeVocabularyValueResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attributes/attributeVocabularyValue')(apiContext);


  let propertyValues = [];
  let propertyValueIds = [];
  let productCodesWithYmmValue = {};
  let productTypeId;

  function removePropertyValueFromProduct(allProductsObject) {
    let promises = [];
    for (var product of allProductsObject.products) {
      if (product.properties) {
        let filteredProperty = _.findWhere(product.properties, { attributeFQN: Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN });
        if (filteredProperty) {
          console.log("Found a YMM value on a Product");
          if (filteredProperty.values) {
            filteredProperty.values.forEach((value) => {
              if (_.contains(propertyValues, value.attributeVocabularyValueDetail.content.stringValue)) {
                let updatedProperty = filteredProperty;
                updatedProperty.values = _.without(filteredProperty.values, value);
                productCodesWithYmmValue[product.productCode] = updatedProperty;
              }
            });
          }
        }
      }
    }
    console.log(Object.keys(productCodesWithYmmValue));
    if (Object.keys(productCodesWithYmmValue).length > 0) {
      Object.keys(productCodesWithYmmValue).forEach((key) => {
        promises.push(productPropertyResource.updateProperty({ productCode: key, attributeFQN: Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN }, { body: productCodesWithYmmValue[key] }));
      });
    }
    if (promises.length > 0) {
      return Promise.all(promises);
    }
  };

  function retrieveProductTypeId() {
    return productTypeResource.getProductTypes({ filter: "isBaseProductType eq true" })
      .then((baseType) => {
        productTypeId = _.first(baseType.items).id;
      });
  };

  function removePropertyValueFromProductType() {
    return retrieveProductTypeId()
      .then(() => {
        return productTypePropertyResource.getProperty({ attributeFQN: Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN, productTypeId: productTypeId });
      })
      .then((result) => {
        let updatedProperty = result;
        let update = false;
        result.vocabularyValues.forEach((value) => {
          if (_.contains(propertyValues, value.vocabularyValueDetail.content.stringValue)) {
            updatedProperty.vocabularyValues = _.without(result.vocabularyValues, value);
            update = true;
          }
        });
        if (update) {
          return productTypePropertyResource.updateProperty({ attributeFQN: Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN, productTypeId: productTypeId }, { body: updatedProperty });
        }
      })
      .catch((err) => {
        console.error(err);
        return null;
      });
  };

  function removePropertyValueFromProductAttribute() {
    let promises = [];
    propertyValueIds.forEach((propertyValueId) => {
      promises.push(productAttributeVocabularyValueResource.deleteAttributeVocabularyValue({ attributeFQN: Config.ATTRIBUTES.YEARMAKEMODEL.ATTRIBUTEFQN, value: propertyValueId }));
    });
    return Promise.all(promises);
  };

  return {
    removeValues: function(userPropertyValues, userPropertyValueIds) {

      propertyValues = userPropertyValues;
      propertyValueIds = userPropertyValueIds;

      if (propertyValues.length > 0 && propertyValueIds.length > 0) {
        return getAllProducts(apiContext, { responseFields: "items(productCode, properties)" })
          .then((allProductsObject) => {
            console.log("Retrieved all Products");
            return removePropertyValueFromProduct(allProductsObject);
          })
          .then(() => {
            console.log("Removed from all Products");
            return removePropertyValueFromProductType();
          })
          .then(() => {
            console.log("Removed from Product Type");
            return removePropertyValueFromProductAttribute();
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  }
};

module.exports = RemoveYmmValue;