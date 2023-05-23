'use strict';

var app = require('../../server');
const ignoreModels = ['Logger', 'FaxValidation', 'FaxMissingInfo', 'FaxAttanded', 'EnrollmentQueue',
  'EnrollmentServiceDocument', 'EnrollmentInProcess', 'WebEnrollmentStatus', 'WebEnrollmentHcpValidation',
  'WebEnrollmentHcpMissingInfo', 'WebEnrollmentHcpAttended', 'WebEnrollmentDocument', 'WebEnrollmentHcpUnattended', 'RTME'
];

module.exports = function (Model) {

  Model.observe('before save', async function (ctx, next) {
    try {
      if (ctx.isNewInstance && ignoreModels.indexOf(Model.name) === -1) {
        const {
          CassiaId
        } = app.models;
        let sampleIncrementCollection = CassiaId.getDataSource().connector.collection('CassiaId');
        let data = {};
        try {
          data = await sampleIncrementCollection.findOneAndUpdate({
            modelName: Model.name
          }, {
            $inc: {
              sequence_value: 1
            }
          });
        }
        catch (err) {

          throw err;
        }
        if (data.value) {
          let datamax = data.value.sequence_value;
          ctx.instance.cassiaId = `${data.value.modelString}-${(Number(datamax))}`;
        } else {
          try{
          data = await sampleIncrementCollection.findOneAndUpdate({
            counterAll: "UniversalId"
          }, {
            $inc: {
              sequence_value: 1
            }
          });
        }
        catch (err) {
          
          throw err;
        }
          let datamax = data.value.sequence_value;
          if (Model.name === 'FaxInbound' && ctx.instance.cassiaId) {
            ctx.instance.cassiaId = ctx.instance.cassiaId;
          } else {
            ctx.instance.cassiaId = (data.value.programString + (Number(datamax))).toString();
          }
        }
      }
    } catch (err) {
      return err;
    }
  });
};
