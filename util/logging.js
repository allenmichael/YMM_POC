var util = require('util');

module.exports.LogToConsole = function (result) {
  console.log(util.inspect(result));
}

module.exports.ReportErrorToConsole = function (error) {
  console.error("Reporting error ---- " + error.message, error);
}