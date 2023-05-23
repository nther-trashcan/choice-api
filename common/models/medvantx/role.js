'use strict';

const { isElement } = require("lodash");
const { apiSuccessResponseFormatter, apiErrorResponseFormatter } = require("./static/utils/apiResponseFormatter");

module.exports = function (Role) {
    Role.createRoles = async function(payload){
        try{
            if(!isElement(payload)){
                let response = await Role.create(payload);
                return apiSuccessResponseFormatter(response);
            }
        }catch(err){
               return apiErrorResponseFormatter(err);
        }
       
    }
    Role.remoteMethod('createRoles', {
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
        }],
        http: {
          path: '/createRoles',
          verb: 'post'
        },
        returns: {
          type: 'object',
          root: true
        }
      });
};

