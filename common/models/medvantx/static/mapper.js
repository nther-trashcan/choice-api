const mapEligibility = {
  statusToKey: {
    true: "Yes",
    false: "No",
    undefined: "Unknown"
  },
  keyToStatus: {
    "Yes": true,
    "No": false,
    "Unknown": undefined
  }  
};


let mapMissingFields = {
  toLabel:
  {
    papForm:  {
      eligibilityInformation: {
        usResident: "Is the patient a US resident?",
        householdIncome: "Annual household income ($)",
        householdSize: "How many people, including the patient, live in the household?",
        patientInsured: "Is the patient insured by Medicaid, Tricare, VA, or other Federal or State healthcare plans?",
        patientUninsured: "Is the patient uninsured or functionally underinsured?"
      },
      physicianInformation: {
        firstName: "Physician First Name",
        lastName: "Physician Last Name",
        npi: "NPI",
        dea: "DEA",
        officeContactPhone: "Office Contact Phone",
        officePhone: "Office Phone",
        officeFax: "Office Fax",
        streetAddress: "Street Address", 
        city: "City",
        state: "State",
        zipCode: "ZipCode"
      },
      patientInformation: {
        firstName: "First Name",
        lastName: "Last Name",
        dateOfBirth: "Date of Birth",
        gender: "Gender",
        streetAddress: "Street Address",
        city: "City",
        state: "State",
        zipCode: "Zip Code",
        mobilePhone: "Mobile Phone",
        homePhone: "Home Phone",
        advocateContactPhone: "Advocate Contact Phone",
      },
      prescriptionAndDiagnosis: {
        prescription: "Prescription on File",
        icdCode: "ICD-10 Code",
        quantity: "Quantity",
        productRequested: "Product Requested",
        strength: "Strength",
        quantity: "Quantity",
        refills: "Refills",
        directions: "Directions"
      },
      insuranceAndSignatures: {
          physicianDeclaration: "Is a signed and dated Physician Declaration of file?",
          patientAcknowledgement: "Is a signed and dated Patient Assistance Acknowledgement on file?",
          patientAuthorization: "Is a signed and dated Patient Authorization for Healthcare Information and Disclosure on file"
      }
    },
    papFormFax:  {
      eligibilityInformation: {
        usResident: "Is the patient a US resident?",
        householdIncome: "Annual household income ($)",
        householdSize: "How many people, including the patient, live in the household?",
        patientInsured: "Is the patient insured by Medicaid, Tricare, VA, or other Federal or State healthcare plans?",
        patientUninsured: "Is the patient uninsured or functionally underinsured?"
      },
      physicianInformation: {
        firstName: "Physician First Name",
        lastName: "Physician Last Name",
        npi: "NPI",
        dea: "DEA",
        officeContactPhone: "Office Contact Phone",
        officePhone: "Office Phone",
        officeFax: "Office Fax",
        streetAddress: "Street Address", 
        city: "City",
        state: "State",
        zipCode: "ZipCode"
      },
      patientInformation: {
        firstName: "First Name",
        lastName: "Last Name",
        dateOfBirth: "Date of Birth",
        gender: "Gender",
        streetAddress: "Street Address",
        city: "City",
        state: "State",
        zipCode: "Zip Code",
        mobilePhone: "Mobile Phone",
        homePhone: "Home Phone",
        advocateContactPhone: "Advocate Contact Phone",
      },
      prescriptionAndDiagnosis: {
        prescription: "Prescription on File",
        icdCode: "ICD-10 Code",
        quantity: "Quantity",
        productRequested: "Product Requested",
        strength: "Strength",
        quantity: "Quantity",
        refills: "Refills",
        directions: "Directions"
      },
      signatures: {
        physicianSignature: "Physician Signature",
        papAcknowledgementSignature: "Pap Acknowledgement Signature",
      }
    }
  } 
  
  
}

let mapEnrollmentSource = {
  sourceToForm:{
    "Manual": "papForm",
    "System": "papFormFax"
  },
  formToSource:{
    "papForm": "Manual",
    "papFormFax": "System"
  }
  
}

let mapUserRoles = {
  idToName:{
    0:"Admin",
    1:"Agent",
    2:"Order Entry"
  },
  nameToId:{
    "Admin": 0,
    "Agent": 1,
    "Order Entry": 2
  }
}


module.exports = {mapEligibility, mapMissingFields, mapEnrollmentSource, mapUserRoles};