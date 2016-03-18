'use strict';
let FiddlerProxy = require('mozu-node-sdk/plugins/fiddler-proxy');
let apiContext = require('mozu-node-sdk/clients/platform/application')();
apiContext.plugins = [FiddlerProxy()];

const _ = require('underscore');
const Config = require('./Config');
const Attributes = require('./Attributes');
const EntityLists = require('./EntityLists');
const Entities = require('./Entities');
let SubnavLink = require('./SubnavLink');
const productAttributeResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/attribute')(apiContext);
const productTypeResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/productType')(apiContext);
const productTypePropertyResource = require('mozu-node-sdk/clients/commerce/catalog/admin/attributedefinition/producttypes/productTypeProperty')(apiContext);
const applicationSettingsResource = require('mozu-node-sdk/clients/commerce/settings/application')(apiContext);
const entityContainerResource = require('mozu-node-sdk/clients/platform/entitylists/entityContainer')(apiContext);
const entityListResource = require('mozu-node-sdk/clients/platform/entityList')(apiContext);
const entityResource = require('mozu-node-sdk/clients/platform/entitylists/entity')(apiContext);

let yearMakeModelAttribute;
let baseProductTypeId;
let order;

function createAttributes() {
  return new Promise((resolve,reject) => {
    productAttributeResource.addAttribute(Attributes.YearMakeModel)
      .then((attribute) => {
        yearMakeModelAttribute = attribute;
        return productTypeResource.getProductTypes({ filter: "isBaseProductType eq true" });
      })
      .then((baseType) => {
        baseProductTypeId = _.first(baseType.items).id;
        order = _.last(_.first(baseType.items).properties).order++;
        return productTypePropertyResource.addProperty(
          {productTypeId: baseProductTypeId}, 
          {body: 
            {
              attributeFQN: yearMakeModelAttribute.attributeFQN,
              order: order
            }
          });
      })
      .then(() => {
        return productAttributeResource.addAttribute(Attributes.YMMCSV);
      })
      // .then((ymmcsvAttribute) => {
      //   order++;
      //   return productTypePropertyResource.addProperty(
      //     {productTypeId: baseProductTypeId}, 
      //     {body: 
      //       {
      //         attributeFQN: ymmcsvAttribute.attributeFQN,
      //         order: order
      //       }
      //     });
      // })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error("An error occurred...");
        console.error(err);
        reject(err);
      });
  });
};

function createSubnavLink() {
  return new Promise((resolve, reject) => {
    applicationSettingsResource.thirdPartyGetApplication()
      .then((application) => {
        SubnavLink.appId = application.appId;
        return entityContainerResource.getEntityContainers({ entityListFullName: Config.SUBNAVLINK.SUBNAVLINKFQN, pageSize: 200 });
      })
      .then((entityCollection) => {
        return entityResource.insertEntity({ entityListFullName: Config.SUBNAVLINK.SUBNAVLINKFQN }, { body: SubnavLink });
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error("An error occurred...");
        console.error(err);
        reject(err);
      });
  });
};

function createMzdbEntityLists() {
  return new Promise((resolve, reject) => {
    entityListResource.createEntityList(EntityLists.Year)
    .then(() => {
      return entityResource.insertEntity({ entityListFullName: `${Config.MZDB.YEAR}@${Config.NAMESPACE}`, id: Entities.Year.id }, { body: Entities.Year });
    })
    .then(() => {
      return entityListResource.createEntityList(EntityLists.YearMake); 
    })
    .then(() => {
      return entityListResource.createEntityList(EntityLists.YearMakeModel);
    })
    .catch((err) => {
        console.error("An error occurred...");
        console.error(err);
        reject(err);
      });
  });
};

let Installer = function () {};

Installer.prototype.install = function() {
  return new Promise((resolve, reject) => {
    createAttributes()
    .then(() => {
      return createSubnavLink();
    })
    .then(() => {
      return createMzdbEntityLists();
    })
    .then(() => {
      resolve();
    })
    .catch((err) => {
      console.error("An error occurred...");
      console.error(err);
      reject(err);
    });
  });
};

module.exports = new Installer();