'use strict';
const { isUndefined, isEmpty, isNull } = require('lodash');
const _ = require('lodash');
const { ObjectId } = require('mongodb');
const app = require('../../../server/server');
const { apiSuccessResponseFormatter, apiErrorResponseFormatter } = require('./static/utils/apiResponseFormatter');
const { Helper } = require('./static/utils/helpers');
const AccessForbidden = require('../../../server/lib/AccessForbidden')
const { programRoles } = require('./static/shared/roles')

const helper = new Helper();

module.exports = function (Program) {
  // Program.beforeRemote('**', function (ctx, instance, next) {
    
  //   (async function () {
  //     try {
        
  //       let isAccess = await helper.checkAccess(ctx, programRoles);
  //       if(isAccess){
  //         next();
  //       }
  //       else{
  //         throw new AccessForbidden()
  //       }
        
  //     } catch (err) {
  //       next(err);
  //       const { Logger } = app.models;
  //       Logger.createLog({
  //         requestType: "exception",
  //         reqObj: ctx.req.reqObj,
  //         isError: true,
  //         errorMessage: err,
  //         eventType: "Exception",
  //       });
  //     }
  //   })();
  // });

  Program.getProgramFields = async function (programId, reqObj) {
    try {
      let data = {};
      try {
        if(!isUndefined(programId)){
          data = await Program.findById(programId);
        }
        else{
          data = await Program.find();
        }
        if(!isNull(data) && !_.isArray(data)){
          data = _.toArray({data});
        }
      }
      catch (err) {
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: true,
          errorMessage: err,
          eventTypeId: 8,
        });
        throw err;
      }
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: false,
        errorMessage: "",
        eventTypeId: 9,
      });
      return apiSuccessResponseFormatter(data);

    } catch (err) {
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: true,
        errorMessage: err,
        eventTypeId: 2,
      });
      throw err;
    }

  };

  Program.createProgram = async function (payload, reqObj) {
    try {
      const { programName } = payload;
      const papForm = !isUndefined(payload.papForm) ? payload.papForm : {};
      const papFormFax = !isUndefined(payload.papFormFax) ? payload.papFormFax : {};
      let program = {};
      try {
        program = await Program.findOne({ 
          where: {
            programName: programName
          }
        });
        if(!isNull(program)){
         return apiSuccessResponseFormatter(program);  
        }
        else{
          program = {programName, papForm, papFormFax};
        }
      }
      catch (err) {
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: true,
          errorMessage: err,
          eventTypeId: 8,
        });
        throw err;
      }
      if (!isUndefined(program)) {
        try {
          let response = await Program.create(program);
          const { Logger } = app.models;
          Logger.createLog({
            requestType: reqObj.method,
            reqObj,
            isError: false,
            errorMessage: "",
            beforeUpdate: "",
            afterUpdate: papForm,
            payload: "",
            eventTypeId: 5,
          });
          return apiSuccessResponseFormatter(response);
        }
        catch (err) {
          console.log(err)
          const { Logger } = app.models;
          Logger.createLog({
            requestType: reqObj.method,
            reqObj,
            isError: true,
            errorMessage: err,
            eventTypeId: 8,
          });
          throw err;
        }
      }
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: false,
        errorMessage: "",
        eventTypeId: 9,
      });
    }
    catch (err) {
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: true,
        errorMessage: err,
        eventTypeId: 2,
      });
      throw err;
    }
  };

  Program.updateProgram = async function (payload, reqObj) {
    try {
      const { programId } = payload;
      const programName = !isUndefined(payload.programName) ? payload.programName : null; 
      const programImageUrl = !isUndefined(payload.programImageUrl) ? payload.programImageUrl : null; 
      const papForm =  !isUndefined(payload.papForm) ? payload.papForm : null;
      const papFormFax = !isUndefined(payload.papFormFax) ? payload.papFormFax : null;
      let program = await Program.findById(programId);
      let data = {};
      try {
        let updateProperties = {
          programName: programName,
          programImageUrl: programImageUrl,
          papForm: papForm,
          papFormFax: papFormFax
        };
        for(let property of Object.keys(updateProperties)){
          if(!isNull(updateProperties[property]))
          {
            await helper.modifyProperty(program, property, updateProperties[property]);  
          }
        }
        data = await Program.update({id:programId}, program)
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: false,
          errorMessage: "",
          beforeUpdate: program,
          afterUpdate: data,
          payload: payload,
          eventTypeId: 5,
        });
        
      }
      catch (err) {
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: true,
          errorMessage: err,
          eventTypeId: 8,
        });
        throw err;
      }
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: false,
        errorMessage: "",
        eventTypeId: 9,
      });
      return apiSuccessResponseFormatter(data);
    }
    catch (err) {
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: true,
        errorMessage: err,
        eventTypeId: 2,
      });
      throw err;
    }
  };

  Program.deleteProgram = async function (payload, reqObj) {
    try {
      const { programId } = payload;
      const program = Program.getDataSource().connector.collection(
        'Program'
      );

      try {
        let data = await program.findOneAndDelete({ "_id": ObjectId(programId) });
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: false,
          errorMessage: "",
          beforeUpdate: data.value,
          afterUpdate: "",
          payload: programId,
          eventTypeId: 5,
        });
      } catch (err) {
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: true,
          errorMessage: err,
          eventTypeId: 8,
        });
        throw err;
      }
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: false,
        errorMessage: "",
        eventTypeId: 9,
      });
    }
    catch (err) {
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: true,
        errorMessage: err,
        eventTypeId: 2,
      });
      throw err;
    }

  };

  Program.remoteMethod("getProgramFields", {
    http: {
      path: "/getProgramFields",
      verb: "get",
    },
    accepts: [
      {
        arg: 'programId',
        type: 'string'
      },
      {
        arg: "reqObj",
        type: "object",
        http: function (ctx) {
          return ctx.req.reqObj || {};
        },
      },
    ],
    returns: {
      root: true,
      type: "object",
    },
  });

  Program.remoteMethod("createProgram", {
    http: {
      path: "/createProgram",
      verb: "post",
    },
    accepts: [{
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
    returns: {
      root: true,
      type: "object",
    },
  });

  Program.remoteMethod("updateProgram", {
    http: {
      path: "/updateProgram",
      verb: "put",
    },
    accepts: [{
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
    returns: {
      root: true,
      type: "object",
    },
  });

  Program.remoteMethod("deleteProgram", {
    http: {
      path: "/deleteProgram",
      verb: "delete",
    },
    accepts: [{
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
    returns: {
      root: true,
      type: "object",
    },
  });

}

