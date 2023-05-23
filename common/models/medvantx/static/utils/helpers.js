const {isEmpty, isUndefined, isObject, isArray, toInteger} = require('lodash');
const {steppers} = require('../steppers');
const {parser} = require('./parsers');
const {mapEnrollmentSource, mapUserRoles} = require('../mapper');
const { ObjectId } = require('mongodb');
const app = require('../../../../../server/server')

class Helper {

    formatPayloadUtil = function(payload, programId, statusObj){
        const patientInformation = {
            firstName: payload['first_name'],
            middleName: payload['middle_name'],
            lastName: payload['last_name'],
            dateOfBirth: payload['date_of_birth'],
            gender: payload['gender'],
            phoneNo: payload['phone_no'],
            address: payload['address']
        }
        const physicianInformation = {
            physician: payload['physician'],
            npi: payload['npi'],
            marketer: payload['marketer'],
            pharmacy: payload['pharmacy']
        }
        const formData = {
            patientInformation,
            physicianInformation,
            prescriptionName: payload['prescription_name'], 
            rxNbr: payload['rx_nbr'],
            rfNumber: payload['rf_no'], 
            paNumber: payload['pa_no'], 
            raNumber: payload['ra_no'], 
            writtenDate: payload['written_date'], 
            ndcPrescribed: payload['ndc_prescribed'], 
            rxHoldReason: payload['rx_hold_reason'] , 
            qtyWritten: payload['qty_written'] ? Number(payload['qty_written']): null, 
            p1PriorAuth: payload['p1_prior_auth'] ? payload['p1_prior_auth'] : null, 
            p1SubmitDate: payload['p1_submit_date'] ? payload['p1_submit_date'] : null, 
            p2PriorAuth: payload['p2_prior_auth'] ? payload['p2_prior_auth'] : null, 
            p2SubmitDate: payload['p2_submit_date'] ? payload['p2_submit_date'] : null,
            p3PriorAuth: payload['p3_prior_auth'] ? payload['p3_prior_auth'] : null, 
            p3SubmitDate: payload['p3_submit_date'] ? payload['p3_submit_date'] : null, 
        }

        const assignedTo = payload['assigned_to'] ? payload['assigned_to'] : null;
        const status = payload['prescription_status']? payload['prescription_status'] : statusObj.filter(x=>x.statusCode==0)[0].statusCode;

        return {formData, programId, assignedTo, status}
    }

    sortUserRoles = function(userRoles){
        userRoles = userRoles.map(userRole => mapUserRoles.nameToId[userRole])
        userRoles.sort()
        userRoles = userRoles.map(userRole => mapUserRoles.idToName[userRole])
        return userRoles;
    }

    alterProgramData = async function(dataObj, userRoles) {
        userRoles = this.sortUserRoles(userRoles);
        for(let stepper of dataObj['steppers']){
            dataObj[stepper['id']] = dataObj[stepper['id']].filter(function(field){
                userRoles.forEach(userRole=>{
                    if(field.accessibleTo && field.accessibleTo.includes(userRole)){
                        field["isAccess"] = true;
                    }    
                    else if(isUndefined(field['isAccess']) || !field["isAccess"]){
                        field["isAccess"] = false;
                    }
                })
                return field;
            })
        }
    }

    formatPhoneNumber = function(phoneNumberString) {
        var cleaned = ('' + phoneNumberString).replace(/\D/g, '');
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return null;
      }
  
    formatDOB = function (dob) {
        var m = dob.split('/')[0];
        var d = dob.split('/')[1];
        var y = dob.split('/')[2];
        return `${y}-${m}-${d}`;
      }

    extractMergeAndPrev = async function(dataObj) {
        let mergedData = {};
        let previousData = {};
        try{            
            for(let stepper of Object.keys(dataObj)){
                console.log("stepper value:" , dataObj[stepper])
                if(!isEmpty(dataObj[stepper][1]))
                {
                    previousData[stepper] = dataObj[stepper][1];
                    mergedData[stepper] = await this.compareAndMerge(dataObj[stepper][0], dataObj[stepper][1]);
                }
            }
            return !isEmpty(mergedData)?{mergedData, previousData}:null;
        }
        catch(err){
            console.log(err)
        }
    }

    compareAndMerge = async function(preEnrollment, searchedEnrollment){ 
        let mergedData = {}; 
        try{
            for(let key in searchedEnrollment){ 
                if(preEnrollment[key]){ 
                    mergedData[key] = preEnrollment[key] 
                } 
                else if(!preEnrollment[key] && searchedEnrollment[key]){ 
                    mergedData[key] = searchedEnrollment[key] 
                } 
            } return mergedData; 
        }
        catch(err){
            console.log(err)
        }
        
        
    }

    modifyProperty = async function(Obj, key, value){
        let keys = key.split('.');
        let set_key = function(obj, index){
            if(index == (keys.length - 1)){
                if(isArray(obj)){
                    obj[toInteger(keys[index])] = value;
                    
                }
                else{
                    obj[keys[index]] = value;
                }
            }
            if(isObject(obj)){
                set_key(obj[keys[index]], index+1)
            }
            else if(isArray(obj)){
                set_key(obj[toInteger(keys[index])], index+1)
            }
        }
        set_key(Obj, 0);
        
    }

    extractProperty = async function(obj, path){
        if(isUndefined(obj) || isEmpty(obj)){
            return obj;
        }

        const keys = path.split('.');
        let process = function(obj, index){
            if(index == keys.length){
                return obj;
            }

            if(isObject(obj)){
                return process(obj[keys[index]], index + 1);
            }
            else if(isArray(obj)){
                return process(obj[parseInt(keys[index])], index + 1);
            }
            return process(obj, index + 1);
        }

        return process(obj, 0);
    }

    
    validate = function(formData, filter){
        let validations = {};
        for(let key of Object.keys(filter)){
            validations[key] = filter[key] == formData[key] ? true: false;
        }
        return {validations};
    };


    filterFormData = async function(formData, filterProperties){
        let filteredData = {};
        for(let key of filterProperties){
            if(!isUndefined(formData[key]) && !isEmpty(formData[key])){
                filteredData[key] = formData[key];
                delete formData[key];
            }
        }
        return {filteredData, enrollmentformData:formData};
    };

    filterFormDataStepper = async function(formData, filterProperties){
        let filteredData = {};
        for(let key of filterProperties){
            filteredData[key] = formData[key];
        }
        return {filteredData, enrollmentformData:formData};
    };

    checkMissingFields = async function(formData, fieldsToCheck) {
        let missingFields = [];
        let isMissing;
        missingFields = parser(formData, fieldsToCheck);
        isMissing = missingFields.length ? true : false;            
        return {isMissing, missingFields};
    }

    compareFields = async function(obj1, obj2) {
        let newObj = {};
        Object.keys(obj1).forEach((key)=>{
            // console.log(key,'key');
            if(key=="id"){
                // console.log('uuuuuuuuuu');
                newObj[key] = obj2[key];
            } else{
                if(obj2[key]){
                    // console.log('qqqqqqqqqq');
                    if(typeof obj1[key] == "string" || typeof obj1[key] == "number"){
                        // console.log('wwwwwwwww');
                        if(obj1[key]!=obj2[key]){
                            // console.log('eeeeeeeeee');
                            newObj[key] = obj2[key];
                        }
                    }
                    else{
                        // console.log('rrrrrrrrrrr');
                        if(JSON.stringify(obj1[key]) != JSON.stringify(obj2[key])){
                            // console.log('ttttttttttt');
                            newObj[key] = obj2[key];
                        }
                    }
                } else{
                    // console.log('yyyyyyyyyyy');
                    newObj[key] = obj1[key];
                }
            }
        })
        console.log(newObj,'nnnnnnnnnnnnnnnnnnnnnnnnnnnn');
        return newObj;
    }

    setMissing = async function(missingCheck, enrollment, enrollmentObj, stepperId){
        try{
            let isFormFilled;
            let mapStepper;
            if(!isUndefined(enrollment.source) && !isEmpty(enrollment.source)){
                mapStepper = mapEnrollmentSource.sourceToForm[enrollment.source]=="papForm" ? steppers.papForm : steppers.papFormFax;
            }
            let key = mapStepper[stepperId];
            let {isMissing, missingFields} = missingCheck;
            if(isMissing){
                enrollmentObj.missingFields = missingFields;
                if(isUndefined(enrollment.missingSteppers)){
                    enrollment.missingSteppers = [key];
                }
                else if(!isUndefined(enrollment.missingSteppers)){    
                    if(isEmpty(enrollment.missingSteppers)){
                        enrollment.missingSteppers = [key];
                    }
                    else if(!enrollment.missingSteppers.includes(key)){
                        enrollment.missingSteppers.push(key);
                    }
                }
            }
            else{
                if(!isUndefined(enrollmentObj.missingFields)){
                    delete enrollmentObj.missingFields;
                }
            
                if(!isUndefined(enrollment.missingSteppers) && !isEmpty(enrollment.missingSteppers)){
                    enrollment.missingSteppers = enrollment.missingSteppers.filter(item => item !== key)
                }
            }
            if(!isUndefined(enrollment.missingSteppers) && !isEmpty(enrollment.missingSteppers)){
                enrollment.isComplete = false;
            }
            else{
                isFormFilled = Object.keys(mapStepper).every((stepperId) => !isEmpty(enrollment[mapStepper[stepperId]]));
                if(isFormFilled && !enrollment.isComplete){
                    enrollment.isComplete = true;
                }
            } 
        }
        catch(err){
            throw err;
        }
    }

    getUserRoles = async function(reqObj){
        let user;
        const {User} = app.models; 
        const userDataSource = User.getDataSource().connector.collection('User');
        
        if(reqObj.workEmail){
            [user] = await userDataSource.aggregate([
                {
                    $match:{
                        "workEmail": reqObj.workEmail.toLowerCase()
                    }
                },
                {
                    $lookup: {
                        from: "Role",
                        localField: "role",
                        foreignField: "_id",
                        as: "roles",
                    }
                }
            ]).toArray()    
        }
        let userRoles = []
        if(user){
            for(let role of user.roles){
                userRoles.push(role.name);
            }
            user.role = userRoles;
            delete user.roles;
        }
        
        return {user, userRoles};
    }

    async checkAccess(ctx, methodRoles){
        if(ctx.method.name=="setTimeStamp"){
            ctx.req.workEmail = ctx.req.body.workEmail;
        }
        let {user, userRoles} = await this.getUserRoles(ctx.req);
        ctx.userData = user;
        let isAccess = false;
        let method = methodRoles.filter((remoteMethod)=>remoteMethod.endPoint == ctx.method.name);
        if(!isEmpty(method)){
            
            if(method[0].roles.includes("*")){
                isAccess = true;
            }
            else{
                isAccess = !isEmpty(userRoles.filter(role=>method[0].roles.includes(role)));
            }
        }
        return isAccess;
        // const {User, Role} = app.models; 
        // const data = await User.findOne({ where: { workEmail: workEmail.toLowerCase() }, }); 
        // // console.log(data,'data');
        // const isRoleFind = false;
        // if(Array.isArray(data.role)){
        //     for(let roleId of data.role){
        //         const roleObj = await Role.findById(ObjectId(roleId));
        //         // console.log(roleObj,'roleObj');
        //         if(rolesWithAccess.indexOf(roleObj.name)>-1){
        //             isRoleFind = true;
        //             break;
        //         }
        //     }
        //     return isRoleFind;
        // } else{
        //     const roleObj = await Role.findById(ObjectId(data.role));
        //     // console.log(roleObj,'roleObj');
        //     if(rolesWithAccess.indexOf(roleObj.name)>-1){
        //         isRoleFind = true;
        //     }
        //     return isRoleFind;
        // }
        
    }
}

module.exports = {Helper};
