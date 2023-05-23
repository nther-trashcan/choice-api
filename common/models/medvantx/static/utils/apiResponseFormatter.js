const {isEmpty, isUndefined, isObject, isArray} = require('lodash');

let apiSuccessResponseFormatter = (data)=>{
    let response = {}
    response.status = 200;
    response.data = data;
    return response;
}

let apiErrorResponseFormatter = (err)=>{
    let response = {}
    response.status = 500;
    response.error = "Internal Server Error";
    return response;
}

module.exports = { apiSuccessResponseFormatter, apiErrorResponseFormatter}
