'use strict';

const { stateData } = require('./static/shared/state')
const { statusData } = require('./static/shared/status')
const app = require('../../../server/server');
const { isEmpty } = require('lodash');
const { apiSuccessResponseFormatter, apiErrorResponseFormatter } = require('./static/utils/apiResponseFormatter');
const AccessForbidden = require('../../../server/lib/AccessForbidden')
const { sharedRoles } = require('./static/shared/roles')
const { Helper } = require('./static/utils/helpers');

const helper = new Helper();

module.exports = function (Shared) {

    // Shared.beforeRemote('**', function (ctx, instance, next) {
    
    //     (async function () {
    //       try {
            
    //         let isAccess = await helper.checkAccess(ctx, sharedRoles);
    //         if(isAccess){
    //           next();
    //         }
    //         else{
    //           throw new AccessForbidden()
    //         }
            
    //       } catch (err) {
    //         next(err);
    //         const { Logger } = app.models;
    //         Logger.createLog({
    //           requestType: "exception",
    //           reqObj: ctx.req.reqObj,
    //           isError: true,
    //           errorMessage: err,
    //           eventType: "Exception",
    //         });
    //       }
    //     })();
    //   });
    
    Shared.initialize = async function () {
        let sharedObj = [];
        try {
            sharedObj = await Shared.find();
        }
        catch (err) {

            throw err;
        }
        if (isEmpty(sharedObj)) {
            try {
                await Shared.create(stateData);
                await Shared.create(statusData);
            }
            catch (err) {

                throw err;
            }
        }

    }

    Shared.createConfig = async function (payload, reqObj) {
        try {
            try {
                let respone = await Shared.create(payload);
                const { Logger } = app.models;
                Logger.createLog({
                    requestType: reqObj.method,
                    reqObj,
                    isError: false,
                    errorMessage: "",
                    beforeUpdate: "",
                    afterUpdate: configData,
                    payload: "",
                    eventTypeId: 5,
                });
                Logger.createLog({
                    requestType: reqObj.method,
                    reqObj,
                    isError: false,
                    errorMessage: "",
                    eventTypeId: 9,
                });
                return apiSuccessResponseFormatter(respone);
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
                return apiErrorResponseFormatter(err);
            }
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
    }

    Shared.getEventTypeId = async function(){
        try{
            let  alleventTypeId = []
            let eventTypeId = await Shared.find({
                where: {
                  "sectionName": "logs"
                }
              })
              eventTypeId.map((items)=>{
                items.value.forEach((data)=>{
                    alleventTypeId.push({id: data.logCode, type: data.logType})
                })                
              })
              return apiSuccessResponseFormatter(alleventTypeId)

        }catch(err){
            return apiErrorResponseFormatter(err);
        }
    }

    Shared.remoteMethod('getEventTypeId', {
        accepts: [
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        }],
        http: {
            path: "/getEventTypeId",
            verb: "get",
        },
        returns: {
            root: true,
            type: "object",
        },
    })

    Shared.getConfig = async function (sectionName) {
        const data = await Shared.findOne({ where: { 'sectionName': sectionName } });
        return data.value
    }

    Shared.getConfigDetails = async function (sectionName, reqObj) {
        try {
            let data = {};
            try {
                data = await Shared.findOne({ where: { 'sectionName': sectionName } });
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
            return apiSuccessResponseFormatter(data.value);
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
    }

    Shared.addConfig = async function (configPropertyObj, reqObj) {
        try {
            try {
                Shared.findOne().then(e => {
                    try {
                        let data = Shared.findOne({ 'id': e.id });
                        Shared.update({ 'id': e.id }, configPropertyObj);
                        const { Logger } = app.models;
                        Logger.createLog({
                            requestType: reqObj.method,
                            reqObj,
                            isError: false,
                            errorMessage: "",
                            beforeUpdate: data,
                            afterUpdate: configPropertyObj,
                            payload: e.id,
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
                })
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
    }

    Shared.updateConfig = async function (payload, reqObj) {
        try {
            let respone = {};
            try {
                respone = await Shared.update({ sectionName: payload.sectionName }, { value: payload.value });

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
                return apiErrorResponseFormatter(err);
            }
            const { Logger } = app.models;
            Logger.createLog({
                requestType: reqObj.method,
                reqObj,
                isError: false,
                errorMessage: "",
                eventTypeId: 9,
            });
            return apiSuccessResponseFormatter(respone);
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
    }


    Shared.remoteMethod('getConfigDetails', {
        accepts: [{
            arg: 'payload',
            type: 'string',
        },
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        }],
        http: {
            path: "/getConfig",
            verb: "get",
        },
        returns: {
            root: true,
            type: "object",
        },
    })


    Shared.remoteMethod('createConfig', {
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
        http: {
            path: "/createConfig",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    })


    Shared.remoteMethod('addConfig', {
        http: {
            path: "/addConfig",
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
    })


    Shared.remoteMethod('updateConfig', {
        http: {
            path: "/updateConfig",
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
    })
}