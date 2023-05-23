'use strict';
const app = require('../../../server/server');
// const bcrypt = require('bcrypt');
const _ = require('lodash');
// const ngrok = require('ngrok');
var rp = require("request-promise");
const { apiSuccessResponseFormatter, apiErrorResponseFormatter } = require('./static/utils/apiResponseFormatter');
const {Helper} = require('./static/utils/helpers');
const AccessForbidden = require('../../../server/lib/AccessForbidden')
const { userRoles } = require('./static/shared/roles')

const helper = new Helper();
module.exports = function (User) {
 
  // User.beforeRemote('**', function (ctx, instance, next) {
    
  //   (async function () {
  //     try {
        
  //       let isAccess = await helper.checkAccess(ctx, userRoles);
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

  User.getCurrentUserData = async function (workEmail, reqObj) {
    // console.log(workEmail, 'workEmail');
    try {
      let data = null;
      if (workEmail) {
        const user = User.getDataSource().connector.collection(
          'User'
        );
        data = await user.aggregate([
          
          {
            $match: {
              $expr:
              {
                $and: [
                  { $eq: ["$workEmail", workEmail] },
                  { $eq: ["$isDeleted", false] }
                ]
              }
            }
          },
          {
            $unwind: "$role",
          },
          { "$addFields": { "role": { "$toObjectId": "$role" } } },
          {
            $lookup: {
              from: "Role",
              localField: "role",
              foreignField: "_id",
              as: "role",
            }
          },
        {
          $group: {
            _id:'$_id',
            role:{$addToSet:{ $arrayElemAt: [ '$role', 0 ] }},
            firstName: {
              $last: "$firstName",
            },
            lastName: {
              $last: "$lastName",
            },
            workEmail: {
              $last: "$workEmail",
            },
            isDeleted: {
              $last: "$isDeleted",
            },
            isLoggedIn: {
              $last: "$isLoggedIn",
            },
          },
        },
        {
          $project: {
            _id:1,
            role:"$role.name",
            firstName: 1,
            lastName: 1,
            workEmail: 1,
            isDeleted: 1,
            isLoggedIn: 1,
          }
        }
        ]).toArray();
        // console.log(data, 'datassssssssssssssss');
      }
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: false,
        errorMessage: "",
        eventTypeId: 9,
      });
      if(!data) {
        data = {
          'status_code': 401,
          'error': 'Unauthorized'
        }
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: false,
          errorMessage: "Unauthorised login for email: "+workEmail,
          eventTypeId: 1,
        });
      }
      return apiSuccessResponseFormatter(data[0])
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
  }
  User.remoteMethod('getCurrentUserData', {
    accepts: [{
      arg: 'workEmail',
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
      path: '/getCurrentUserData',
      verb: 'get',
    },
    returns: {
      type: 'object',
      root: true,
    },
  });

  User.setTimeStamp = async function (payload){
    try{
      const {workEmail} =  payload;
      const userDataSource = User.getDataSource().connector.collection(
        'User'
      );
      let response = await userDataSource.findOneAndUpdate(
        {
          workEmail: workEmail
        },
        {
          $set: {
            timeStamp: new Date()
          }
        }
      )
      return apiSuccessResponseFormatter(response);
    }catch(err){
      return apiErrorResponseFormatter(err);  
    }
  }
  
  User.remoteMethod('setTimeStamp', {
    accepts: [{
      arg: 'payload',
      type: 'object',
      http: {source:"body"}
    },
    {
      arg: "reqObj",
      type: "object",
      http: function (ctx) {
        return ctx.req.reqObj || {};
      },
    }],
    http: {
      path: '/setTimeStamp',
      verb: 'post',
    },
    returns: {
      type: 'object',
      root: true,
    },
  });

  User.setIsCurrentlyLoggedIn = async function (payload) {
    try {
      // console.log(payload,'payload');
      const {workEmail, isLoggedIn} = payload;
      // console.log(payload,'ppppppppppp');
      if (workEmail) {     
        let userData = await User.findOne({
          where: {
            workEmail:payload.workEmail
          },
        });
        // console.log(userData,'userData');
        const userDataSource = User.getDataSource().connector.collection(
          'User'
        );
        // console.log('111111111');
        if(Object.keys(payload).includes('isLoggedIn')&&!payload.isLoggedIn){
          // console.log('1111111111');
          
          await userDataSource.findOneAndUpdate(
            {
              workEmail: payload.workEmail
            },
            {
              $set: {
                isLoggedIn: false
              }
            }
          )
          // console.log('77777777777777777777');
          return {
            isLoggedIn: false
          }
        }
        if(Object.keys(payload).includes('isLoggedIn')&&payload.isLoggedIn){
          // console.log('333333333');
          await userDataSource.findOneAndUpdate(
            {
              workEmail: payload.workEmail
            },
            {
              $set: {
                isLoggedIn: true
              }
            }
          )
          // console.log('8888888888888888888');
          return {
            isLoggedIn: true
          }
        }  
        // console.log('99999999999999999999',userData);
        return {
          isLoggedIn: !!userData.isLoggedIn
        }
      }
    } catch (err) {
      //   const { Logger } = app.models;
      //         Logger.createLog({
      //           requestType: "exception",
      //           reqObj,
      //           isError: true,
      //           errorMessage: err,
      //           eventType: "Exception",
      //         });
      //         throw err;
    }
  }
  User.remoteMethod('setIsCurrentlyLoggedIn', {
    accepts: [{
      arg: 'payload',
      type: 'object',
      http: {source:"body"}
    },
    {
      arg: "reqObj",
      type: "object",
      http: function (ctx) {
        return ctx.req.reqObj || {};
      },
    }],
    http: {
      path: '/setIsCurrentlyLoggedIn',
      verb: 'post',
    },
    returns: {
      type: 'object',
      root: true,
    },
  });
  User.createUser = async function (payload, reqObj) {
    // (async function() {
    //   const url = await ngrok.connect(3030);
    //   await ngrok.authtoken("2M2j94FcQMnRCD3bE4yP0SY9JT8_7DrJX4WCqoArFzekWpwAt");
    //   console.log(url,'urlll');
    //   const api = ngrok.getApi();
    //   const tunnels = await api.listTunnels();
    //   const apiUrl = ngrok.getUrl();
    //   console.log(tunnels,'tunnels');
    //   console.log(apiUrl,'apiurl');
    // })();
    // console.log(payload, 'payload');
    // console.log(typeof payload, 'payload Type');
    try {
      try {
        await User.create(payload);
        const { Logger } = app.models;
        Logger.createLog({
          requestType: reqObj.method,
          reqObj,
          isError: false,
          errorMessage: "",
          beforeUpdate: "",
          afterUpdate: payload,
          payload: "",
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
    // await User.create({
    //   firstName: 'Rohit',
    //   lastName: 'Kumar',
    //   workEmail: 'rohit.kumar@medvantx.com',
    //   role: '63c4e909098c615134a6a636'
    // })
  }
  User.remoteMethod('createUser', {
    accepts: [{
      arg: 'payload',
      type: 'object'
    },
    {
      arg: "reqObj",
      type: "object",
      http: function (ctx) {
        return ctx.req.reqObj || {};
      },
    }],
    http: {
      path: '/createUser',
      verb: 'post'
    },
    returns: {
      type: 'object',
      root: true
    }
  });

  User.getAllUsers = async function (reqObj) {
    try {
      let data = [];
      try {
        data = await User.find();
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
      return apiSuccessResponseFormatter(data)
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
      return apiErrorResponseFormatter(err);
    }
  }
  User.remoteMethod('getAllUsers', {
    accepts: [
      {
        arg: "reqObj",
        type: "object",
        http: function (ctx) {
          return ctx.req.reqObj || {};
        },
      }],
    http: {
      path: '/getAllUsers',
      verb: 'get'
    },
    returns: {
      type: 'object',
      root: true
    }
  });

  User.createGRXWebhook = async function (payload, reqObj) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": "b27d09ce0a564322a71863e9c48819ec",
        "CLIENT": "Dayvigo"
      },
      uri:
        `https://api-management-service-vtyal-dev.azure-api.net/ic/webhook/subscription`,
      body: payload,
      json: true,
    };
    try {
      const response = await rp.post(options);
      console.log("responseWebhook", response);
      const { Logger } = app.models;
      Logger.createLog({
        requestType: reqObj.method,
        reqObj,
        isError: false,
        errorMessage: "",
        eventTypeId: 9,
      });
    } catch (err) {
      const { Logger } = app.models;
      Logger.createLog({
        requestType: "POST",
        reqObj,
        isError: true,
        errorMessage: err,
        eventTypeId: 1,
      });
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
  User.remoteMethod('createGRXWebhook', {
    accepts: [{
      arg: 'payload',
      type: 'object'
    },
    {
      arg: "reqObj",
      type: "object",
      http: function (ctx) {
        return ctx.req.reqObj || {};
      },
    }],
    http: {
      path: '/createGRXWebhook',
      verb: 'post'
    },
    returns: {
      type: 'object',
      root: true
    }
  });

};
