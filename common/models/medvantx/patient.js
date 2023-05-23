'use strict';
const { isNull, isEmpty } = require('lodash');
const app = require('../../../server/server');
const AccessForbidden = require('../../../server/lib/AccessForbidden')
const { patientRoles } = require('./static/shared/roles')
const { Helper } = require('./static/utils/helpers');

const helper = new Helper();

module.exports = function (Patient) {

  // Patient.beforeRemote('**', function (ctx, instance, next) {
    
  //   (async function () {
  //     try {
        
  //       let isAccess = await helper.checkAccess(ctx, patientRoles);
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


  Patient.createPatient = async function (enrollmentObj, formData, reqObj) {
    try {
      await Patient.create(formData).then(e => {
        enrollmentObj.patientInformation.id = e.id;
      });
      // const { Logger } = app.models;
      // Logger.createLog({
      //   requestType: reqObj.method,
      //   reqObj,
      //   isError: false,
      //   errorMessage: "",
      //   beforeUpdate: "",
      //   afterUpdate: formData,
      //   payload: "",
      //   eventTypeId: 5,
      // });
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
  }

  Patient.updatePatient = async function (patientId, formData, reqObj) {
    let patient = await Patient.getPatientById(patientId, reqObj);
    if (!isNull(patient)) {
      try {
        let data = await Patient.findById(patientId);
        await Patient.update({ id: patientId }, formData);
        // const { Logger } = app.models;
        // Logger.createLog({
        //   requestType: reqObj.method,
        //   reqObj,
        //   isError: false,
        //   errorMessage: "",
        //   beforeUpdate: data,
        //   afterUpdate: formData,
        //   payload: patientId,
        //   eventTypeId: 5,
        // });
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

    }
  }


  Patient.getPatientById = async function (patientId, reqObj) {
    let patient = {};
    try {
      patient = await Patient.findById(patientId);
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
    return patient;
  }


  Patient.searchPatient = async function (payload) {
    const patient = await Patient.getDataSource().connector.collection('Patient');
    let data = await patient.aggregate([
      {
        $match: {
          $expr:
          {
            $and: [
              { $eq: ["$firstName", payload.firstName] },
              { $eq: ["$lastName", payload.lastName] },
              { $eq: ["$dateOfBirth", payload.dateOfBirth] }
            ]
          }
        }
      },
      {
        $count: "patientCount"
      },
      {
        $lookup: {
          from: "Patient",
          let: { "count": { $toInt: "$patientCount" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $gt: ["$$count", 1] },
                    then: {
                      $and: [
                        { $eq: ["$firstName", payload.firstName] },
                        { $eq: ["$lastName", payload.lastName] },
                        { $eq: ["$dateOfBirth", payload.dateOfBirth] },
                        { $eq: ["$streetAddress", payload.streetAddress] },
                        {
                          $or: [
                            { $eq: ["$lastName", payload.lastName] },
                            { $eq: ["$dateOfBirth", payload.dateOfBirth] }
                          ]
                        }]
                    },
                    else: {
                      $and: [
                        { $eq: ["$firstName", payload.firstName] },
                        { $eq: ["$lastName", payload.lastName] },
                        { $eq: ["$dateOfBirth", payload.dateOfBirth] }
                      ]
                    }
                  }
                }
              }
            }],
          as: "patients"
        }
      }


    ]).toArray();
    if (isEmpty(data)) {
      return undefined;
    }
    return data[0].patients[0];

  }

  Patient.patientGrxWebhook = async function (payload, reqObj) {
    try {
      const webhookPayload = payload.webhookBody;
      console.log(reqObj.headers, 'hhhhhhhhhhhhhh');
      const { Logger } = app.models;
      Logger.createLog({
        requestType: "WebhookPatient",
        reqObj,
        isError: false,
        beforeUpdate: '',
        isLoggedIn: false,
        endPoint: '/patientGrxWebhook',
        afterUpdate: { payload: webhookPayload, key: reqObj.headers["pap-subscription-key"] },
        errorMessage: '',
        eventType: "Transaction",
      });
      if (reqObj && reqObj.headers && reqObj.headers["pap-subscription-key"]) {
        if (reqObj.headers["pap-subscription-key"] === process.env["PAP-SUBSCRIPTION-KEY"]) {
          // console.log(payload,'payload');
          let patient = Patient.getDataSource().connector.collection(
            "Patient"
          );
          try {
            let val = {
              "pharmacyId": webhookPayload.pharmacyId
            }
            let data = await patient.findOneAndUpdate({ cassiaId: webhookPayload.id }, {
              $set: val
            });
            const { Logger } = app.models;
            Logger.createLog({
              requestType: reqObj.method,
              reqObj,
              isError: false,
              errorMessage: "",
              beforeUpdate: data.value,
              afterUpdate: val,
              payload: webhookPayload.id,
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

        } else {
          let e = new Error()
          e.message = 'Incorrect PAP-SUBSCRIPTION-KEY provided';
          e.statusCode = 401;
          e.name = 'UnAuthorized';
          throw e;
        }
      } else {
        let e = new Error()
        e.message = 'No PAP-SUBSCRIPTION-KEY found. Please provide PAP-SUBSCRIPTION-KEY in headers';
        e.statusCode = 401;
        e.name = 'UnAuthorized';
        throw e;
      }
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

  Patient.remoteMethod('patientGrxWebhook', {
    accepts: [{
      arg: 'payload',
      type: 'object',
      http: { source: 'body' }
    }, {
      arg: "reqObj",
      type: "object",
      http: function (ctx) {
        return ctx.req.reqObj || {};
      },
    }],
    http: {
      path: '/patientGrxWebhook',
      verb: 'post'
    },
    returns: {
      type: 'object',
      root: true
    }
  });

  Patient.prescriptionGrxWebhook = async function (payload, reqObj) {
    const webhookPayload = payload.webhookBody;
    // console.log('ppppppppppppppppp',process.env["PAP-SUBSCRIPTION-KEY"], payload);
    // console.log('ppppppppppppppppp',reqObj.headers["PAP-SUBSCRIPTION-KEY"]);
    try {
      const { Logger } = app.models;
      Logger.createLog({
        requestType: "WebhookPrescription",
        reqObj,
        isError: false,
        beforeUpdate: '',
        isLoggedIn: false,
        endPoint: '/prescriptionGrxWebhook',
        afterUpdate: { payload: webhookPayload, key: reqObj.headers["pap-subscription-key"] },
        errorMessage: '',
        eventType: "Transaction",
      });
      const { Enrollment } = app.models;
      if (reqObj && reqObj.headers && reqObj.headers["pap-subscription-key"]) {
        if (reqObj.headers["pap-subscription-key"] === process.env["PAP-SUBSCRIPTION-KEY"]) {
          // console.log(payload,'payload');
          let enrollment = Enrollment.getDataSource().connector.collection(
            "Enrollment"
          );
          try {
            let val = {
              "pharmacyRxNumber": payload.webhookBody.pharmacyRxNumber
            }
            let data = await enrollment.findOneAndUpdate({ cassiaId: payload.webhookBody.id }, {
              $set: val
            });
            const { Logger } = app.models;
            Logger.createLog({
              requestType: reqObj.method,
              reqObj,
              isError: false,
              errorMessage: "",
              beforeUpdate: data.value,
              afterUpdate: val,
              payload: payload.webhookBody.id,
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

        } else {
          let e = new Error()
          e.message = 'Incorrect PAP-SUBSCRIPTION-KEY provided';
          e.statusCode = 401;
          e.name = 'UnAuthorized';
          throw e;
        }
      } else {
        let e = new Error()
        e.message = 'No PAP-SUBSCRIPTION-KEY found. Please provide PAP-SUBSCRIPTION-KEY in headers';
        e.statusCode = 401;
        e.name = 'UnAuthorized';
        throw e;
      }
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

  Patient.remoteMethod('prescriptionGrxWebhook', {
    accepts: [{
      arg: 'payload',
      type: 'object',
      http: { source: 'body' }
    }, {
      arg: "reqObj",
      type: "object",
      http: function (ctx) {
        return ctx.req.reqObj || {};
      },
    }],
    http: {
      path: '/prescriptionGrxWebhook',
      verb: 'post'
    },
    returns: {
      type: 'object',
      root: true
    }
  });
};
