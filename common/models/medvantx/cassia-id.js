'use strict';

const { apiSuccessResponseFormatter, apiErrorResponseFormatter } = require('./static/utils/apiResponseFormatter');
const { isEmpty } = require('lodash');
const AccessForbidden = require('../../../server/lib/AccessForbidden');
const { cassiaIdRoles } = require('./static/shared/roles')
const { Helper } = require('./static/utils/helpers');

const helper = new Helper();

module.exports = async function (CassiaId) {

  CassiaId.beforeRemote('**', function (ctx, instance, next) {
    
    (async function () {
      try {
        
        let isAccess = await helper.checkAccess(ctx, cassiaIdRoles);
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


    CassiaId.createCassia = async function (payload) {
        try{
        let keys = ["modelName", "modelString", "programString", "sequence_value"]
        let responseObject;
        if(!isEmpty(payload)){
        keys.forEach((items)=>{
            if(!payload.hasOwnProperty(items) || !payload[items]){
                responseObject = {
                    "status" : 400,
                    "message" : "feilds are missing in payload"
                }
            }
        })}
        if(responseObject){
            return  responseObject;
        }
        let data = {
            modelName: payload.modelName,
            modelString: payload.modelString,
            programString: payload.programString,
            sequence_value: payload.sequence_value
        }
            let response = await CassiaId.create(data);
            return apiSuccessResponseFormatter(response)
        }catch(err){
            return apiErrorResponseFormatter(err)
        }
        }

        CassiaId.remoteMethod('createCassia', {
            accepts: [
              {
                arg: 'payload',
                type: 'object',
                http: { source: 'body' }
              },
              {
                arg: "reqObj",
                type: "object",
                http: function (ctx) {
                  return ctx.req.reqObj || {};
                },
              }],
            http: {
              path: '/createCassia',
              verb: 'post'
            },
            returns: {
              type: 'object',
              root: true
            }
          });
};
