'use strict';
const _ = require('underscore');

module.exports = (apiContext, options) => {
  if (!apiContext) throw new Error("You must provide an ApiContext");
  const productResource = require('mozu-node-sdk/clients/commerce/catalog/admin/product')(apiContext);
  options = options || {};
  options.pageSize = options.pageSize || 200;
  options.startIndex = options.startIndex || 0;
  options.responseFields = options.responseFields || '';
  options.filter = options.filter || "";
  let totalCount = 0;
  let pageCount = 0;
  let allIndexes = {};
  let erroredIndexes = {};
  erroredIndexes["unknown"] = [];
  let promiseArr = [];
  let allProducts = [];

  const regexStartIndex = /startIndex=\d*/;

  return productResource.getProducts({ pageSize: options.pageSize, startIndex: options.startIndex, responseFields: options.responseFields })
    .then((productsCollection) => {
      totalCount = productsCollection.totalCount;
      pageCount = productsCollection.pageCount;

      _.each(productsCollection.items, (item) => {
        allProducts.push(item);
      });

      for (var i = 1; i < pageCount; i++) {
        options.startIndex += options.pageSize;
        allIndexes[options.startIndex] = false;

        promiseArr.push(
          productResource.getProducts({ pageSize: options.pageSize, startIndex: options.startIndex, filter: options.filter, responseFields: options.responseFields })
            .then((products) => {
              allIndexes[products.startIndex] = true;
              _.each(products.items, (item) => {
                allProducts.push(item);
              });
            })
            .catch((err) => {
              let url = regexStartIndex.exec(err.originalError.url);
              if (url && url.length > 0) {
                let splitIndex = url[0].split('=');
                if (splitIndex && splitIndex.length > 1) {
                  erroredIndexes[splitIndex[1]] = err;
                } else {
                  erroredIndexes["unknown"].push(err);
                }
              } else {
                erroredIndexes["unknown"].push(err);
              }
            })
        );
      }

      return Promise.all(promiseArr)
        .then(() => {
          _.each(allIndexes, (val, key) => { if (val === false) console.log(key); });
          let result = {
            indexes: allIndexes,
            products: allProducts,
            errors: erroredIndexes
          };
          return result;
        })
        .catch((err) => {
          erroredIndexes["unknown"].push(err);
        });
    });
}