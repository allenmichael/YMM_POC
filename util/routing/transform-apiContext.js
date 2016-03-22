var constants = require('mozu-node-sdk/constants');
var headerPrefix = constants.headerPrefix;
var headers = constants.headers;

var eventHeaderConstants = require('./event-header-constants'); 
var extend = require('mozu-node-sdk/utils/tiny-extend');
headers = extend(headers, eventHeaderConstants);

module.exports = function transformHeaders(requestHeaders, apiContext, cb) { 
    if(requestHeaders) {
        for(var header in requestHeaders) {
            var headerValue = requestHeaders[header];
            if(headerValue !== '') {
                switch(header) {                  
                    case headerPrefix + headers.TENANT:
                        apiContext.context[headers.TENANT] = headerValue;
                        break;
                    
                    case headerPrefix + headers.SITE:
                        apiContext.context[headers.SITE] = headerValue;
                        break;
                    
                    case headerPrefix + headers.MASTERCATALOG:
                        apiContext.context[headers.MASTERCATALOG] = headerValue;
                        break;
                    
                    case headerPrefix + headers.CATALOG:
                        apiContext.context[headers.CATALOG] = headerValue;
                        break;
                    
                    case headerPrefix + headers.DATAVIEWMODE:
                        apiContext.context[headers.DATAVIEWMODE] = headerValue;
                        break;
                    
                    case headerPrefix + headers.VERSION:
                        apiContext.context[headers.VERSION] = headerValue;
                        break;
                    
                    case headerPrefix + headers.TENANTDOMAIN:
                        apiContext.context[headers.TENANTDOMAIN] = headerValue;
                        break;
                    
                    case headerPrefix + headers.LOCALE:
                        apiContext.context[headers.LOCALE] = headerValue;
                        break;
                    
                    case headerPrefix + headers.CURRENCY:
                        apiContext.context[headers.CURRENCY] = headerValue;
                        break;
                        
                    case headerPrefix + headers.CORRELATION:
                        apiContext.context[headers.CORRELATION] = headerValue;
                        break;
                        
                    default: 
                        break;     
                }
            }
        }
        return cb(null, apiContext);
    } else {
        return cb(new Error("Insufficient request headers"));
    }
}