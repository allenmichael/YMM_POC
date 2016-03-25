var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var install_route = require('./routes/install-route');
var subnav_route = require('./routes/subnav-route');
var sync_ymm = require('./routes/sync-ymm');
var reindex_mzdb = require('./routes/reindex-mzdb');
var config_route = require('./routes/config-route');
var post_ymm_file = require('./routes/post-ymm-file');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true, type: "application/x-www-form-urlencoded" }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/install', install_route);
app.use('/subnav', subnav_route);
app.use('/sync.ymm', sync_ymm);
app.use('/reindex.mzdb', reindex_mzdb);
app.use('/config', config_route);
app.use('/ymmfile', post_ymm_file);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
