'use strict';
const { isNull, isUndefined, isObject, isEmpty } = require('lodash');
const _ = require('lodash');
const app = require('../../../server/server');
const {enrollmentForm} = require('./static/forms/enrollmentForm');
const {checkFields, mandatoryFields} = require('./static/requiredFields');
const { apiSuccessResponseFormatter, apiErrorResponseFormatter } = require('./static/utils/apiResponseFormatter');
const csv = require('csvtojson');
var multer = require("multer");
const path = require("path");
const fs = require('fs');
const { Helper } = require('./static/utils/helpers');
const helper = new Helper();


module.exports = function(Enrollment){

    Enrollment.intialize = async function(payload, reqObj){
        const {marketer, pharmacy, shared, staff} = payload;
        marketer.forEach(async (m)=>{
            await Enrollment.addMarketerUtil(m, reqObj);
        });

        pharmacy.forEach(async (p)=>{
            await Enrollment.addPharmacyUtil(p, reqObj);
        });

        staff.forEach(async (s)=>{
            await Enrollment.addStaffUtil(s, reqObj);
        });

        const {Shared} = app.models;
        const {status} = shared;
        await Shared.createConfig(status, reqObj);

    }


    Enrollment.remoteMethod('intialize', {
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
        },],
        http: {
            path: "/intialize",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });


    Enrollment.addPrescriptionUtil = async function(payload, reqObj){
        try{
            let enrollment = {}
            let updateProperties = {};
            const { formData, enrollmentId, programId, assignedTo, status } = payload;
            const {prescriptionName, rxNbr, rfNumber, paNumber, raNumber, writtenDate, ndcPrescribed, rxHoldReason, qtyWritten, p1PriorAuth, p1SubmitDate, p2PriorAuth, p2SubmitDate, p3PriorAuth, p3SubmitDate} = formData; 
            const prescriptionInformation = {
                prescriptionName, rxNbr, rfNumber, paNumber, raNumber, writtenDate, ndcPrescribed, rxHoldReason, qtyWritten, p1PriorAuth, p1SubmitDate, p2PriorAuth, p2SubmitDate, p3PriorAuth, p3SubmitDate
            };
            enrollment = await Enrollment.processPatientUtil(enrollment, {formData: formData.patientInformation, enrollmentId}, reqObj);
            enrollment = await Enrollment.processPhysicianUtil(enrollment, {formData: formData.physicianInformation}, reqObj);
            updateProperties = {
                programId: programId,
                assignedTo: assignedTo,
                prescriptionInformation: prescriptionInformation,
                status: status,
                lastUpdatedTime: Date.now()
            };
            await Enrollment.updateEnrollmentPropertiesUtil(enrollment, updateProperties, reqObj);        
            return enrollment;
        }
        catch(err){
            throw err
        }
        
    }

    Enrollment.addPrescription = async function(payload, reqObj){
        try{
            let enrollment = await Enrollment.addPrescriptionUtil(payload, reqObj)
            return apiSuccessResponseFormatter(enrollment);
        }
        catch(err){
            throw err
        }
        
    }

    Enrollment.processPatientUtil = async function(enrollment, payload, reqObj){
        const {Patient} = app.models;
        let enorllmentFormTemplate = _.cloneDeep(enrollmentForm);
        const { formData, enrollmentId } = payload;
        const mandatoryFieldCheck = await helper.checkMissingFields(formData, mandatoryFields.patientInformation);
        if (mandatoryFieldCheck.isMissing) {
            response = {
                status: 200,
                data: {
                    missingSteppers: ["patientInformation"],
                    missingFields: [{ patientInformation: mandatoryFieldCheck.missingFields }]
                }
            };
            return response;
        }
        let searchFilter = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
        }
        let searchedPatient = {}
        if (!isUndefined(enrollmentId)) {

            enrollment = await Enrollment.getEnrollmentById(enrollmentId, reqObj);
            searchedPatient = enrollment.patientInformation;
            await Patient.updatePatient(enrollment.patientInformation.id, formData, reqObj);
        }
        else {
            searchedPatient = await Patient.searchPatient(searchFilter);
            console.log("searchedPatient", searchedPatient)
            if (!isUndefined(searchedPatient)) {
                enrollment = await Enrollment.createEnrollmentUtil(enorllmentFormTemplate, reqObj);
                await Patient.updatePatient(searchedPatient._id, formData, reqObj);
                enrollment.patientInformation.id = searchedPatient._id;
            }
            else {
                enrollment = await Enrollment.createEnrollmentUtil(enorllmentFormTemplate, reqObj);
                await Patient.createPatient(enrollment, formData, reqObj);
            }
        }
        return enrollment;
    }

    Enrollment.processPhysicianUtil = async function(enrollment, payload, reqObj){
        const {formData} = payload; 
        const {marketer, pharmacy} = formData;
        const {HCP, Marketer, Pharmacy} = app.models;
        const marketerFilter = {
            ...marketer? {name: marketer}: {}
        };
        const pharmacyFilter = {
            ...pharmacy? {name: pharmacy}: {}
        };
        let marketerData = await Marketer.findOne({where: marketerFilter});
        let pharmacyData = await Pharmacy.findOne({where: pharmacyFilter});
        if(marketerData){
            formData.marketer = marketerData.id;
        }
        if(pharmacyData){
            formData.pharmacy = pharmacyData.id;
        }
        const hcpFilter = {
            firstName: formData.physician.split(" ")[0],
            lastName: formData.physician.split(" ")[1],
            ...formData.npi?{npi: formData.npi}:{},
            marketer: formData.marketer,
            pharmacy: formData.pharmacy
        }
        
        let hcpData = await HCP.findOne({where: hcpFilter});
        
        if(hcpData){
            enrollment.physicianInformation = {id: hcpData.id};
        }
        else{
            delete hcpFilter.marketer;
            delete hcpFilter.pharmacy;
            hcpData = await HCP.findOne({where: hcpFilter});

            let hcp;
            if(hcpData){
                return Error("Invalid physician")
            }
            else{
                formData.firstName = formData.physician.split(" ")[0];
                formData.lastName = formData.physician.split(" ")[1];
                delete formData.physician;
                
                hcp = await Enrollment.addPhysicianUtil(formData, reqObj);
                enrollment.physicianInformation = {id: hcp.id};
            }
        }
        return enrollment;
        
    }

    Enrollment.addPhysicianUtil = async function(payload, reqObj){
        const {HCP, Marketer, Pharmacy} = app.models;
        const {marketer, pharmacy, hcpId} = payload;
        const marketerFilter = {
            ...marketer? {name: marketer}: {}
        };
        const pharmacyFilter = {
            ...pharmacy? {name: pharmacy}: {}
        };
        let marketerData = await Marketer.findOne({where: marketerFilter});
        let pharmacyData = await Pharmacy.findOne({where: pharmacyFilter});
        let hcp;
        if(marketerData){
            payload.marketer = marketerData.id;
        }
        if(pharmacyData){
            payload.pharmacy = pharmacyData.id;
        }
        if(hcpId){   
            await HCP.update({id: hcpId}, payload);       
        }
        else {
            hcp = await HCP.create(payload);
        }
        return hcp;
    }


    Enrollment.addPhysician = async function(payload, reqObj){
        await Enrollment.addPhysicianUtil(payload, reqObj);

    }

    Enrollment.addMarketerUtil = async function(payload, reqObj){
        const {name} = payload;
        const {Marketer} = app.models;
        const marketerFilter = {
            name: name
        };
        let marketer = await Marketer.findOne({where: marketerFilter});
        if(!marketer){
            marketer = await Marketer.create(payload);
        }
        return marketer;
        ;
    }

    Enrollment.addPharmacyUtil = async function(payload, reqObj){
        const {name} = payload;
        const {Pharmacy} = app.models;
        const pharmacyFilter = {
            name: name
        };
        let pharmacy = await Pharmacy.findOne({where: pharmacyFilter});
        if(!pharmacy){
            pharmacy = await Pharmacy.create(payload);
        }
        return pharmacy;
        
    }


    Enrollment.addMarketer = async function(payload, reqObj){
        try{
            const response = await Enrollment.addMarketerUtil(payload, reqObj)
            return response;
        }
        catch(err){
            throw err;
        }
    }

    Enrollment.addPharmacy = async function(payload, reqObj){
        try{
            const response = await Enrollment.addPharmacyUtil(payload, reqObj)
            return response;
        }
        catch(err){
            throw err;
        }
        
    }

    Enrollment.addStaffUtil = async function(payload, reqObj){
        const {workEmail} = payload;
        const {Staff} = app.models;
        const staffFilter = {
            workEmail: workEmail
        };
        let staff = await Staff.findOne({where: staffFilter});
        if(!staff){
            staff = await Staff.create(payload);
        }
        return staff;
        
    }


    Enrollment.addStaff = async function(payload, reqObj){
        try{
            const response = await Enrollment.addStaffUtil(payload, reqObj)
            return response;
        }
        catch(err){
            throw err;
        }
    }


    Enrollment.getAllPhysician = async function(marketerName, pharmacyName){
        const {HCP} = app.models;
        const hcp = HCP.getDataSource().connector.collection(
            'HCP'
        );
        console.log(marketerName, pharmacyName)
        const data = await hcp.aggregate([
            {
                $lookup: {
                  from: "Marketer",
                  localField: "marketer",
                  foreignField: "_id",
                  pipeline: marketerName?[{
                    $match: {
                        name: marketerName
                    }
                  }]:[],
                  as: "marketer",
                }
            },
            {
                $lookup: {
                  from: "Pharmacy",
                  localField: "pharmacy",
                  foreignField: "_id",
                  pipeline: pharmacyName?[{
                    $match: {
                        name: pharmacyName
                    }
                  }]:[],
                  as: "pharmacy",
                }
            },
            {
                $unwind: {
                  path: "$marketer",
                },
            },
            {
                $unwind: {
                  path: "$pharmacy",
                },
            },
            
        ]).toArray();
        return apiSuccessResponseFormatter(data);
    }


    Enrollment.getAllStaff = async function(){
        const {Staff} = app.models;
        const staff = Staff.getDataSource().connector.collection(
            'Staff'
          );
        const data = await staff.aggregate([]).toArray();
        return apiSuccessResponseFormatter(data);
    }


    Enrollment.addComment = async function(payload, reqObj){
        const {Comment, User} = app.models;
        const { message, workEmail, enrollmentId} = payload;
        const userFilter = {
            workEmail: workEmail
        }
        const user = await User.findOne({where: userFilter})
        const author = `${user.firstName} ${user.lastName}`;
        let comment = await Comment.create({message, author, enrollmentId});
        let enrollment = await Enrollment.findById(enrollmentId);
        let updateProperties  = {
            lastComment: comment.id,
            lastUpdatedTime: Date.now()
        };
        await Enrollment.updateEnrollmentPropertiesUtil(enrollment, updateProperties, reqObj);
        return apiSuccessResponseFormatter(comment)
    }




    Enrollment.getAllComments = async function(enrollmentId, workEmail){
        const {Comment, User} = app.models;
        const commentDataSource = Comment.getDataSource().connector.collection(
            'Comment'
          );
        const userFilter = {
            workEmail: workEmail
        }
        let author;
        
        const user = await User.findOne({where: userFilter})
        if(user){
            author = `${user.firstName} ${user.lastName}`;
        }
        const data = await commentDataSource.aggregate([
            {
                $match:{
                    "enrollmentId": enrollmentId,
                    ...author?{"author": author}:{}
                }
            },
            { $sort: { 'createdDate': -1 } },
            {
              $facet: {
                totalCount: [
                  {
                    $count: 'count'
                  }
                ],
                comments: []
              },
    
            },
        ]).toArray();
        if(!isEmpty(data[0])){
            let comments = []
            data[0]['comments'].forEach(comment=>{
                comment = {message: comment.message, author: comment.author};
                comments.push(comment);
            });
            data[0]['comments'] = comments;        
        }
        return apiSuccessResponseFormatter(data);
    }

    
    Enrollment.deleteDocument = async function(enrollmentId, fileName){
        const { Document } = app.models
        const userDataSource = await Document.getDataSource().connector.collection('Document');
        try {
          let d = await userDataSource.findOneAndDelete(
            { $and: [{ "enrollmentId": enrollmentId }, { "fileName": fileName }] }
          )
          
          const filePath = path.resolve(path.join(__dirname, `/documents/${fileName}`));
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(err);
            }
          });
        }
        catch(err){
            throw err
        }
    }

    Enrollment.getDocument = async function(fileName){
        const filePath = path.resolve(path.join(__dirname, `/documents/${fileName}`));
        let response = fs.readFileSync(filePath, {encoding: 'base64'});
        return apiSuccessResponseFormatter(response);
    }

    Enrollment.getAllDocuments = async function(enrollmentId){
        const {Document} = app.models;
        const documentDataSource = Document.getDataSource().connector.collection(
            'Document'
          );
          const data = await documentDataSource.aggregate([
            {
              $match: {
                "enrollmentId": enrollmentId
              }
            },
            { $sort: { 'createdDate': -1 } },
            {
              $facet: {
                totalCount: [
                  {
                    $count: 'count'
                  }
                ],
                documents: []
              },
    
            },
    
          ]).toArray();
          if(!isEmpty(data[0])){
            let documents = []
            data[0]['documents'].forEach(document=>{
                document = {fileName: document.fileName, fileType: document.fileType};
                documents.push(document);
            });
            data[0]['documents'] = documents;        
        }
        return apiSuccessResponseFormatter(data);
    }


    Enrollment.getEnrollmentById = async function (enrollmentId, reqObj) {
        try {
          return await Enrollment.findById(enrollmentId);
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

    

    Enrollment.createEnrollmentUtil = async function (form, reqObj) {
        try {
          let enrollment = {};
          try {
            enrollment = await Enrollment.create(form);
          }
          catch (err) {
            throw err;
          }
          return enrollment;
        }
        catch (err) {
          throw err;
        }
      }
    

    Enrollment.updateEnrollmentPropertiesUtil = async function (enrollmentObj, properties, reqObj) {
        for (let property of Object.keys(properties)) {
          let propertyObj = await helper.extractProperty(enrollmentObj, property);
          let data = properties[property];
          if (!isUndefined(data)) {
            if (propertyObj && isObject(propertyObj)) {
              for (let key of Object.keys(data)) {
                propertyObj[key] = data[key];
              }
            }
            else {
              propertyObj = data;
            }
    
    
          }
          await helper.modifyProperty(enrollmentObj, property, propertyObj);
        }
        try {
          let data = await Enrollment.findById(enrollmentObj.id);
          await Enrollment.update({ id: enrollmentObj.id }, enrollmentObj)
        //   const { Logger } = app.models;
        //   Logger.createLog({
        //     requestType: reqObj.method,
        //     reqObj,
        //     isError: false,
        //     errorMessage: "",
        //     beforeUpdate: data,
        //     afterUpdate: enrollmentObj,
        //     payload: enrollmentObj.id,
        //     eventTypeId: 5,
        //   });
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
    

    Enrollment.searchEnrollment = async function (payloadObj, reqObj) {
        try {
    
            const { payload, skip, limit } = payloadObj;
            let {patientName, dateOfBirth, doctor, rxNbr, prescriptionStatus, paNumber, drugName} = payload;
            let firstName, middleName, lastName;
            if(patientName){
                if(patientName.split(" ").length==3){
                    [firstName, middleName, lastName] = patientName.split(" ");    
                }
                else if(patientName.split(" ").length==2){
                    [firstName, lastName] = patientName.split(" ");    
                }
                else if(patientName.split(" ").length==1){
                    [firstName] = patientName.split(" ");    
                }
                
            }
            let physicianFirstName, physicianLastName;
            if(doctor){
                if(doctor.split(" ").length==2){
                    [physicianFirstName, physicianLastName] = doctor.split(" ");    
                }
                else if(doctor.split(" ").length==1){
                    [physicianFirstName] = doctor.split(" ");    
                }
            }
            const enrollment = Enrollment.getDataSource().connector.collection(
                'Enrollment'
            );
            console.log(drugName, paNumber, rxNbr, prescriptionStatus)
            let prescriptionFilter = [];
            if(drugName){
                prescriptionFilter.push({ $eq: [drugName.toLowerCase(), { $substr: [{ $toLower: "$prescriptionInformation.prescriptionName" }, 0, drugName.length] }] })
            }
            if(paNumber){
                prescriptionFilter.push({ $eq: [paNumber.toLowerCase(), { $substr: [{ $toLower: "$prescriptionInformation.paNumber" }, 0, paNumber.length] }] })
            }
            if(rxNbr){
                prescriptionFilter.push({ $eq: [rxNbr.toLowerCase(), { $substr: [{ $toLower: "$prescriptionInformation.rxNbr" }, 0, rxNbr.length] }] })
            }
            if(prescriptionStatus){
                prescriptionFilter.push({ $eq: ["$status", prescriptionStatus] })
            }
            console.log(prescriptionFilter)
            const data = await enrollment.aggregate([
                {
                    $match: {
                        $expr:
                        {
                            $and: prescriptionFilter
                        }
                    }
                },
                {
                    $lookup: {
                        from: "Patient",
                        localField: "patientInformation.id",
                        foreignField: "_id",
                        as: "patientInformation",
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $and: [
                                            firstName ? { $eq: [firstName.toLowerCase(), { $substr: [{ $toLower: "$firstName" }, 0, firstName.length] }] } : {},
                                            middleName ? { $eq: [middleName.toLowerCase(), { $substr: [{ $toLower: "$middleName" }, 0, middleName.length] }] } : {},
                                            lastName ? { $eq: [lastName.toLowerCase(), { $substr: [{ $toLower: "$lastName" }, 0, lastName.length] }] } : {},
                                            dateOfBirth ? {$eq: ["$dateOfBirth", dateOfBirth]}: {}
            
                                        ] 
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "HCP",
                        localField: "physicianInformation.id",
                        foreignField: "_id",
                        as: "physicianInformation",
                        pipeline: [
                            {
                                $match: {
                                    $expr:
                                    {
                                        $and: [
                                            physicianFirstName ? { $eq: [physicianFirstName.toLowerCase(), { $substr: [{ $toLower: "$firstName" }, 0, physicianFirstName.length] }] } : {},
                                            physicianLastName ? { $eq: [physicianLastName.toLowerCase(), { $substr: [{ $toLower: "$lastName" }, 0, physicianLastName.length] }] } : {},            
                                        ] 
                                    }
                                }
                            }
                        ]
                    }
                },
                // {
                //     $lookup: {
                //         from: "Comment",
                //         localField: "lastComment",
                //         foreignField: "_id",
                //         as: "lastComment",
                //     }
                // },
                // {
                //     $unwind: {
                //         path: "$lastComment",
                //     },
                // },
                {
                    $unwind: {
                        path: "$patientInformation",
                    },
                },
                {
                    $unwind: {
                        path: "$physicianInformation",
                    },
                },
                {   $sort: { 'createdDate': -1 } },
                {
                    $facet: {
                        totalCount: [
                            {
                                $count: 'count'
                            }
                        ],
                        enrollments: [
                            // { $skip: skip },
                            // { $limit: limit },
                        ]
                    },
        
                }
            ]).toArray();
            console.log(data[0])
            if (!isEmpty(data[0].enrollments)) {
                return apiSuccessResponseFormatter({ count: data[0].totalCount[0].count, enrollments: _.orderBy(data[0].enrollments, ['createdDate'], ['desc']) });
            }
            return apiSuccessResponseFormatter({ count: 0, enrollments: [] });
            }
        catch (err) {
            console.log(err)
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


    var PDFStorage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, "./common/models/medvantx/documents");
        },
        filename: function (req, file, callback) {
            const timestamp = Date.now();
            callback(null, timestamp + path.extname(file.originalname));
        },
    });

    var uploadPDF = multer({
        storage: PDFStorage,
    }).array("file");


    Enrollment.uploadDocument = async function(req, res){
        try {
            uploadPDF(req, res, async function (err) {
            const { Document } = app.models;
            if (err) {
                res.json(err);
            } else {
            const fileName = req.files[0].filename;
            if (!fileName) {
                return;
            }
            let data = {
                enrollmentId: req.query.enrollmentId,
                fileName: fileName,
                fileType: req.query.fileType,
            }
            await Document.create(data);
            
            
            // const pathToSend = path.resolve(path.join(__dirname, `/documents/${fileName}`));

            // const pathToSend = path.resolve(path.join(__dirname, `/prescriptions/`));
            // const filePath = pathToSend + "/" + fileName;
            // await Enrollment.uploadToS3({
            //     fileName: fileName,
            //     filePath: filePath
            // })
            // fs.unlink(filePath, (err) => {
            //     if (err) {
            //     console.error(err);
            //     }
            // });
            res.json({
                data:{
                    msg: "Success"
                },
                status: 200
            });
            }
        });
        } catch (err) {
        }
    }
    
    var CSVStorage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, "./common/models/medvantx/prescriptions");
        },
        filename: function (req, file, callback) {
            const timestamp = Date.now();
            callback(null, timestamp + path.extname(file.originalname));
        },
    });

    var uploadCSV = multer({
        storage: CSVStorage,
    }).array("file");

    Enrollment.bulkUpload = function (req, res, ctx) {
        try {
            uploadCSV(req, res, async function (err) {
            const { Prescription, Shared } = app.models;
            const statusObj = await Shared.getConfig("status");
            if (err) {
                res.json(err);
            } else {
            const fileName = req.files[0].filename;
            if (!fileName) {
                return;
            }
            
            const pathToSend = path.resolve(path.join(__dirname, `/prescriptions/${fileName}`));
            let data = await csv().fromFile(pathToSend)
            
            for(let i=0; i<data.length; i++){
                let formattedPayload = helper.formatPayloadUtil(data[i], req.query.programId, statusObj);
                await Enrollment.addPrescriptionUtil(formattedPayload);    
            }
            let fileData = {
                fileName: fileName,
                fileType: "Bulk Upload",
                totalCount: data.length
            }
            await Prescription.create(fileData);

            // const pathToSend = path.resolve(path.join(__dirname, `/prescriptions/`));
            // const filePath = pathToSend + "/" + fileName;
            // await Enrollment.uploadToS3({
            //     fileName: fileName,
            //     filePath: filePath
            // })
            // fs.unlink(filePath, (err) => {
            //     if (err) {
            //     console.error(err);
            //     }
            // });
            res.status(200).json({
                data:{
                    msg: "Success"
                },
                status: 200
            });
            }
        });
        } catch (err) {
        }
    };


    Enrollment.remoteMethod("bulkUpload", {
        accepts: [
        {
            arg: "req",
            type: "object",
            http: {
            source: "req",
            },
        },
        {
            arg: "res",
            type: "object",
            http: {
            source: "res",
            },
        },
        {
            arg: "ctx",
            type: "object",
            http: function (ctx) {
            return ctx || {};
            },
        },

        ],
        returns: {
        arg: "result",
        type: "string",
        },
    });

    Enrollment.remoteMethod("uploadDocument", {
        accepts: [
        {
            arg: "req",
            type: "object",
            http: {
            source: "req",
            },
        },
        {
            arg: "res",
            type: "object",
            http: {
            source: "res",
            },
        },
        {
            arg: "ctx",
            type: "object",
            http: function (ctx) {
            return ctx || {};
            },
        },

        ],
        returns: {
        arg: "result",
        type: "string",
        },
    });

    Enrollment.remoteMethod('getDocument', {
        accepts: [{
            arg: 'fileName',
            type: 'string',
        },
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        },],
        http: {
            path: "/getDocument",
            verb: "get",
        },
        returns: {
            root: true,
            type: "object",
        },
    });
    
    Enrollment.remoteMethod('deleteDocument', {
        accepts: [
        {
            arg: 'enrollmentId',
            type: 'string',
        },
        {
            arg: 'fileName',
            type: 'string',
        },
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        },],
        http: {
            path: "/deleteDocument",
            verb: "delete",
        },
        returns: {
            root: true,
            type: "object",
        },
    });


    Enrollment.remoteMethod('getAllDocuments', {
        accepts: [{
            arg: 'enrollmentId',
            type: 'string',
        },
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        },],
        http: {
            path: "/getAllDocuments",
            verb: "get",
        },
        returns: {
            root: true,
            type: "object",
        },
    });

    

    Enrollment.remoteMethod('getAllComments', {
        accepts: [
            {
                arg: "enrollmentId",
                type: "string"
            },
            {
                arg: "workEmail",
                type: "string"
            },
            {
                arg: "reqObj",
                type: "object",
                http: function (ctx) {
                    return ctx.req.reqObj || {};
                },
            },
        ],
        http: {
            path: "/getAllComments",
            verb: "get",
        },
        returns: {
            root: true,
            type: "object",
        },
    });

    
    Enrollment.remoteMethod('getAllStaff', {
        accepts: [
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        },],
        http: {
            path: "/getAllStaff",
            verb: "get",
        },
        returns: {
            root: true,
            type: "object",
        },
    });

    Enrollment.remoteMethod('getAllPhysician', {
        accepts: [
            {
                arg: "marketerName",
                type: "string",
                
            },
            {
                arg: "pharmacyName",
                type: "string",
                
            },
        {
            arg: "reqObj",
            type: "object",
            http: function (ctx) {
                return ctx.req.reqObj || {};
            },
        },],
        http: {
            path: "/getAllPhysician",
            verb: "get",
        },
        returns: {
            root: true,
            type: "object",
        },
    });

    Enrollment.remoteMethod('addPrescription', {
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
        },],
        http: {
            path: "/addPrescription",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });

        

    Enrollment.remoteMethod('addStaff', {
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
        },],
        http: {
            path: "/addStaff",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });


    Enrollment.remoteMethod('addPharmacy', {
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
        },],
        http: {
            path: "/addPharmacy",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });

    Enrollment.remoteMethod('addMarketer', {
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
        },],
        http: {
            path: "/addMarketer",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });


    Enrollment.remoteMethod('addPhysician', {
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
        },],
        http: {
            path: "/addPhysician",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });


    Enrollment.remoteMethod('addComment', {
        accepts: [
            {
                arg: "payload",
                type: "object",
                http: {
                    source: "body"
                }
            },
            {
                arg: "reqObj",
                type: "object",
                http: function (ctx) {
                    return ctx.req.reqObj || {};
                },
            },
        ],
        http: {
            path: "/addComment",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });


    Enrollment.remoteMethod('searchEnrollment', {
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
        },],
        http: {
            path: "/searchEnrollment",
            verb: "post",
        },
        returns: {
            root: true,
            type: "object",
        },
    });

}
