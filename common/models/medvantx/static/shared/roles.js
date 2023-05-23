let enrollmentRoles = [
    {
        "endPoint": 'upload',
        "roles":[
            "Agent", "Order Entry"
        ]
    },
    {
        "endPoint": 'deleteFromS3',
        "roles":[
            "Order Entry"
        ]
    },
    {
        "endPoint": 'communicationFollowUp',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'deleteEnrollment',
        "roles":[
            "Agent","Order Entry", "Admin"
        ]
    },
    {
        "endPoint": 'getFollowUpDetails',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'getTemplateByName',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'getDashboardAnalytics',
        "roles":[
            "Agent","Order Entry", "Admin"
        ]
    },
    {
        "endPoint": 'getEnrollmentLockedInStatus',
        "roles":[
            "Agent","Order Entry", "Admin"
        ]
    },
    {
        "endPoint": 'searchEnrollmentById',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'searchEnrollment',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'listEnrollments',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'insuranceAndSignatures',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'prescriptionAndDiagnosis',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'patientInformation',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'physicianInformation',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'eligibilityInformation',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'createCompleteEnrollment',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'signaturesFax',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'insuranceFax',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'prescriptionAndDiagnosisFax',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'patientInformationFax',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'physicianInformationFax',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'eligibilityInformationFax',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'getDocumentUrl',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    
]

let eligibilityRoles = [
    {
        "endPoint": 'addEligibility',
        "roles":[
            "Agent","Order Entry"
        ]
    }
]

let loggerRoles = [
    {
        "endPoint": 'getLogs',
        "roles":[
            "Admin"
        ]
    },
    {
        "endPoint": 'fetchLogs',
        "roles":[
            "Admin"
        ]
    },
    {
        "endPoint": 'exportLogsData',
        "roles":[
            "Admin"
        ]
    }
]

let patientRoles = [
    {
        "endPoint": 'patientGrxWebhook',
        "roles":[
            "*"
        ]
    },
    {
        "endPoint": 'prescriptionGrxWebhook',
        "roles":[
            "*"
        ]
    }
]

let programRoles = [
    {
        "endPoint": 'getProgramFields',
        "roles":[
            "Agent","Order Entry", "Admin"
        ]
    },
    {
        "endPoint": 'createProgram',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'updateProgram',
        "roles":[
            "Agent","Order Entry"
        ]
    },
    {
        "endPoint": 'deleteProgram',
        "roles":[
            "Agent","Order Entry"
        ]
    }
]

let sharedRoles = [
    {
        "endPoint": 'getEventTypeId',
        "roles":[
            "*"
        ]
    },
    {
        "endPoint": 'getConfigDetails',
        "roles":[
            "*"
        ]
    },
    {
        "endPoint": 'createConfig',
        "roles":[
            "*"
        ]
    },
    {
        "endPoint": 'addConfig',
        "roles":[
            "*"
        ]
    },
    {
        "endPoint": 'updateConfig',
        "roles":[
            "*"
        ]
    }
]

let userRoles = [
    {
        "endPoint": 'getCurrentUserData',
        "roles":[
            "Agent","Order Entry", "Admin"
        ]
    },
    {
        "endPoint": 'setTimeStamp',
        "roles":[
            "*"
        ]
    },
    {
        "endPoint": 'setIsCurrentlyLoggedIn',
        "roles":[
            "Agent","Order Entry", "Admin"
        ]
    },
    {
        "endPoint": 'createUser',
        "roles":[
            "Admin"
        ]
    },
    {
        "endPoint": 'getAllUsers',
        "roles":[
            "Agent","Order Entry", "Admin"
        ]
    },
    {
        "endPoint": 'createGRXWebhook',
        "roles":[
            "*"
        ]
    }
]

let orderRoles = [
        {
            "endPoint": 'orderGrxWebhook',
            "roles":[
                "*"
            ]
        } 
]

let cassiaIdRoles = [
    {
        "endPoint": 'createCassia',
        "roles":[
            "Order Entry", "Admin"
        ]
    } 
]

module.exports = {
    enrollmentRoles, eligibilityRoles, loggerRoles, patientRoles, programRoles,sharedRoles, userRoles, orderRoles, cassiaIdRoles
}