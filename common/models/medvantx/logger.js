'use strict';
const { isElement, isEmpty } = require('lodash');
const app = require('../../../server/server');
const { apiSuccessResponseFormatter, apiErrorResponseFormatter } = require('./static/utils/apiResponseFormatter');
const AccessForbidden = require('../../../server/lib/AccessForbidden')
const { loggerRoles } = require('./static/shared/roles')
const { Helper } = require('./static/utils/helpers');
const ObjectsToCsv = require('objects-to-csv');
const helper = new Helper();
const path = require("path");
const fs = require('fs');


module.exports = async function (Logger) {

    Logger.beforeRemote('**', function (ctx, instance, next) {
    
        (async function () {
          try {
            
            let isAccess = await helper.checkAccess(ctx, loggerRoles);
            if(isAccess){
              next();
            }
            else{
              throw new AccessForbidden()
            }
            
          } catch (err) {
            next(err);
            const { Logger } = app.models;
            Logger.createLog({
              requestType: "exception",
              reqObj: ctx.req.reqObj,
              isError: true,
              errorMessage: err,
              eventType: "Exception",
            });
          }
        })();
      });
    
    Logger.createLog = async function (payload, reqObj) {
        try {
            const { Logger } = app.models;
            let loggerDataSource = Logger.getDataSource().connector.collection(
                "Logger"
              );
            let requestType = "simple event";
            if (payload.requestType) {
                requestType = payload.requestType;
            }
            let cDate = new Date();
            let lDate = new Date();
            let loggerObj = {
                createdBy: payload.reqObj.workEmail ? payload.reqObj.workEmail : 'annonymous',
                endPoint: payload.reqObj.originalUrl,
                requestType,
                eventTypeId: payload.eventTypeId,
                isLoggedIn: payload.isLoggedIn ? payload.isLoggedIn : payload.reqObj.isLoggedIn ? true : false,
                isError: payload.isError ? true : false,
                errorMessage: payload.errorMessage ? payload.errorMessage : '',
                beforeUpdate: payload.beforeUpdate,
                afterUpdate: payload.afterUpdate,
                payload: payload.payload,
                createdDate: cDate,
                lastModifiedDate: lDate,
            };
            try {
                await loggerDataSource.insertOne(loggerObj);
            }
            catch (err) {

                throw err;
            }
        } catch (err) {
            console.log('Failed to create log');
        }

    }

    Logger.remoteMethod('createLog', {
        accepts: [{
            arg: 'payload',
            type: 'object',
            http: {
                source: 'body'
            }
        },
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        },]
    });
     
    Logger.getLogs = async function (payload){
        try {
            let {startDate, endDate, eventTypeId, skip = 0 , limit = 50} = payload;
            let response = {}
            if(!eventTypeId){
                response["statusCode"] = 400;
                response["message"] = " eventTypeId is missing in payload";
                return response;
            }
            if (!startDate) {
             let date = new Date();
             date.setDate(date.getDate() - 7);
             startDate = +date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
            }
            if (!endDate) {
                let date = new Date();
                date.setDate(date.getDate() + 1);
                endDate = date.toISOString();
            }
            if(startDate == endDate){
                let date = new Date(endDate);
                date.setDate(date.getDate() + 1);
                endDate = date.toISOString();
            }
            const { Logger } = app.models;
            const logger = Logger.getDataSource().connector.collection('Logger');
            const result = await logger.aggregate([
            { $match: { 
            $expr:
                {
                    $and:[
                        {$gte:  ["$createdDate", new Date(startDate)]  },
                        {$lte:  ["$createdDate", new Date(endDate)]  },
                        {$eq:   ["$eventTypeId", parseInt(eventTypeId)]}
                    ]
                }
            },
            },
            {$sort: {createdDate: -1}},
            {
                $facet: {
                  totalCount: [
                    {
                      $count: 'count'
                    }
                  ],
                  logs: [
                    { $skip: skip*limit },
                    { $limit: limit },
                  ]
                },
            }
        ]).toArray();
            if(isEmpty(result[0].logs)){
                response["statusCode"] = 204;
                response["message"] = "no data available for the given date";
                return response;
            } 
            if(!isEmpty(result[0].logs)){
                return apiSuccessResponseFormatter({count: result[0].totalCount[0].count, logs: result[0].logs});
            }  
        }catch (err){
            return apiErrorResponseFormatter(err)
        }
    }

    Logger.remoteMethod('getLogs', {
        accepts: [{
            arg: 'payload',
            type: 'object',
            http: { source: 'body' }
          },
          ],
          http: {
            path: '/getLogs',
            verb: 'post'
          },
          returns: {
            type: 'object',
            root: true
          }
      });

    Logger.exportLogsData = async function (payload){
           
        // If you use "await", code must be inside an asynchronous function:
      try {
          let {startDate, endDate, eventTypeId, skip = 0 , limit = 50} = payload;
          let response = {}
          if(!eventTypeId){
              response["statusCode"] = 400;
              response["message"] = " eventTypeId is missing in payload";
              return response;
          }
          if (!startDate) {
           let date = new Date();
           date.setDate(date.getDate() - 7);
           startDate = +date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
          }
          if (!endDate) {
              let date = new Date();
              date.setDate(date.getDate() + 1);
              endDate = date.toISOString();
          }
          if(startDate == endDate){
              let date = new Date(endDate);
              date.setDate(date.getDate() + 1);
              endDate = date.toISOString();
          }
          const { Logger } = app.models;
          const logger = Logger.getDataSource().connector.collection('Logger');
          const result = await logger.aggregate([
          { $match: { 
          $expr:
              {
                  $and:[
                      {$gte:  ["$createdDate", new Date(startDate)]  },
                      {$lte:  ["$createdDate", new Date(endDate)]  },
                      {$eq:   ["$eventTypeId", parseInt(eventTypeId)]}
                  ]
              }
          },
          },
          {$sort: {createdDate: -1}},
          {
              $facet: {
                totalCount: [
                  {
                    $count: 'count'
                  }
                ],
                logs: [
                  { $skip: skip*limit },
                  { $limit: limit },
                ]
              },
          }
      ]).toArray();
          if(isEmpty(result[0].logs)){
              response["statusCode"] = 204;
              response["message"] = "no data available for the given date";
              return response;
          } 
          if(!isEmpty(result[0].logs)){
                const csv = new ObjectsToCsv(result[0].logs);
                const pathToSend = path.resolve(path.join(__dirname, `/documents/`));
                console.log(pathToSend,'pathToSend');
                await csv.toDisk(pathToSend+'/logs.csv');
                const fileContent = fs.readFileSync(pathToSend+'/logs.csv',{encoding: 'base64'}); 
                fs.unlink(pathToSend+'/logs.csv', (err) => {
                    if (err) {
                      console.error(err);
                    }
                });
                return apiSuccessResponseFormatter(fileContent);
          }
      }catch (err){
          return apiErrorResponseFormatter(err)
      }
    }

    Logger.remoteMethod('exportLogsData', {
      accepts: [{
          arg: 'payload',
          type: 'object',
          http: { source: 'body' }
        },
        ],
        http: {
          path: '/exportLogsData',
          verb: 'post'
        },
        returns: {
          type: 'object',
          root: true
        }
    });

    Logger.fetchLogs = async function (type, skip = 0, limit = 50) {
        // console.log(type,'type');
        const { Logger } = app.models;
        const data = await Logger.find({
            where: {
                eventType: type
            },
            skip,
            limit
        });

        // console.log(data,'daya');
        return data;
    }
    Logger.remoteMethod("fetchLogs", {
        http: {
            path: "/fetchLogs",
            verb: "get",
        },
        accepts: [
            {
                arg: 'type',
                type: 'string'
            },
            {
                arg: 'skip',
                type: 'number'
            },
            {
                arg: 'limit',
                type: 'number'
            }
        ],
        returns: {
            root: true,
            type: "object",
        },
    });

};
