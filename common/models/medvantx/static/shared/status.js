let statusData = {
    "sectionName":"status",
    "value":[
     {
         statusType: 'Incomplete (Eligibility unknown)',
         statusCode: 0
     },
     {
         statusType: 'Incomplete (Eligible)',
         statusCode: 1
     },
     {
         statusType: 'Complete (Eligible)',
         statusCode: 2
     },
     {
         statusType: 'Incomplete (Not eligible)',
         statusCode: 3
     },
     {
         statusType: 'Complete (Not eligible)',
         statusCode: 4
     }
 ]
}
module.exports.statusData = statusData;