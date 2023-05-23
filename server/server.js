'use strict';
require('dotenv').config();
const moment = require('moment');
const { ObjectId } = require('mongodb');
const {mapEnrollmentSource} = require('../common/models/medvantx/static/mapper')
var loopback = require('loopback');
var boot = require('loopback-boot');
const {initializeDB, cleanupDB} = require('./index')
var cron = require('node-cron');
const { isUndefined, isEmpty, isObject, map, isArray, isNull } = require('lodash');
const hook = require('./boot/response-middleware')

//var loopbackSSL = require('loopback-ssl');
 
var app = module.exports = loopback();

app.start = function () {
  // start the web server
  return app.listen(async function () {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
      let args = process.argv.splice(3)
      if(args.includes('--c'))
      {
        await cleanupDB(app);
      }
      if(args.includes('--i'))
      {
        await initializeDB(app);
      }
      

      
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
  app.start();
  
});
