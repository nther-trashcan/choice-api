const schedule = require('node-schedule');
const { ObjectId } = require('mongodb');
const faxInboundCroneJobTimeInterval = process.env.FAX_INBOUND_CRONE_JOB_TIME_INTERVAL;
module.exports = async function (app) {
  schedule.scheduleJob(`*/${faxInboundCroneJobTimeInterval} * * * *`, async function () {
    // schedule.scheduleJob('53 * * * * *', async function() {
    try {
      // console.log('Inside Scheduler');
      //await getNewFaxToDb();
    } catch (err) {
      console.log(err);
    }
  });

  async function getNewFaxToDb() {
    const { FaxInbound } = app.models;
    const newFaxesArray = await FaxInbound.getDataToDb();
  }
};
