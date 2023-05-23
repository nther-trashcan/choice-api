let checkFields = {
    eligibilityInformation : ["usResident", "state", "householdIncome", "householdSize", "patientInsured", "patientUninsured"],
    physicianInformation : ["firstName", "lastName", "npi", "dea","streetAddress", "city", "state", "zipCode","officeFax", "any@(officeContactPhone, officePhone)"],
    patientInformation : ["gender", "streetAddress", "city", "state", "zipCode", "any@(homePhone, mobilePhone, advocateContactPhone)"],
    prescriptionAndDiagnosis : ["prescription", "icdCode", "(prescription, No)requires@(quantity, refills, directions, productRequested, strength)"],
    insuranceAndSignatures : ["physicianDeclaration", "patientAcknowledgement", "patientAuthorization"]
}

let checkFieldsFax = {
    eligibilityInformation : ["usResident", "state", "householdIncome", "householdSize", "patientInsured", "patientUninsured"],
    physicianInformation : ["firstName", "lastName", "npi", "dea","streetAddress", "city", "state", "zipCode", "any@(officeContactPhone, officePhone, officeFax)"],
    patientInformation : ["gender", "streetAddress", "city", "state", "zipCode", "any@(homePhone, mobilePhone, advocateContactPhone)"],
    prescriptionAndDiagnosis : ["prescription", "icdCode", "(prescription, No)requires@(quantity, refills, directions, productRequested, strength)"],
    insurance : [],    
    signatures : ["physicianSignature", "papAcknowledgementSignature"]
    
}

let mandatoryFields = {
    patientInformation : ["firstName", "lastName", "dateOfBirth"],
}

let checkGRXFields = { 
    eligibilityInformation : [],
    physicianInformation : ["every@(firstName, lastName, npi, streetAddress, city, state, zipCode)", "any@(officeContactPhone, officePhone, officeFax)"],
    patientInformation : ["every@(firstName, lastName, dateOfBirth, gender, streetAddress, city, state, zipCode)", "any@(homePhone, mobilePhone, advocateContactPhone)"],
    prescriptionAndDiagnosis : ["prescription", "icdCode", "(prescription, No)requires@(quantity, refills, directions, productRequested, strength)"],
    insuranceAndSignatures : ["physicianDeclaration", "patientAcknowledgement", "patientAuthorization"]
}

module.exports = {checkFields, mandatoryFields, checkGRXFields, checkFieldsFax};