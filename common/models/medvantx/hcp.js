'use strict';
const { isNull } = require('lodash');
const app = require('../../../server/server');

module.exports = function (HCP) {
    HCP.createHCP = async function (enrollmentObj, formData, reqObj) {
        try {
            await HCP.create(formData).then(e => {
                enrollmentObj.physicianInformation.id = e.id;
            });
            const { Logger } = app.models;
            Logger.createLog({
                requestType: reqObj.method,
                reqObj,
                isError: false,
                errorMessage: "",
                beforeUpdate: "",
                afterUpdate: formData,
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

    }

    HCP.updateHCP = async function (hcpId, formData, reqObj) {
        let hcp = await HCP.getHCPById(hcpId, reqObj);
        if (!isNull(hcp)) {
            try {
                let data = await HCP.findById(hcpId);
                await HCP.update({ id: hcpId }, formData);
                const { Logger } = app.models;
                Logger.createLog({
                    requestType: reqObj.method,
                    reqObj,
                    isError: false,
                    errorMessage: "",
                    beforeUpdate: data,
                    afterUpdate: formData,
                    payload: hcpId,
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
        }
    }

    HCP.getHCPById = async function (hcpId, reqObj) {
        let hcp = {};
        try {
            hcp = await HCP.findById(hcpId);
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
        return hcp;
    }

    HCP.searchHCP = async function (payload) {
        let searchProperties = {}
        for (let key of Object.keys(payload)) {
            if (payload[key]) {
                searchProperties[`${key}`] = {
                    like: payload[key],
                    options: 'i'
                };
            }
        }
        let hcp = {};
        try {
            hcp = await HCP.findOne({
                where: searchProperties
            });
        }
        catch (err) {
            throw err;
        }
        return hcp;
    }
};
