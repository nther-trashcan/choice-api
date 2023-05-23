const {isEmpty, isUndefined, filter} = require('lodash');

let parser = function(formData, fields){
    let missingFields = [];
    for(let key of fields){
        if(key.includes("@")){
            let [condition, values] = key.split("@");
            let valArray = String(values).trim().substring(1, values.length-1).split(', ')
            if(condition.includes("any")){
                if(valArray.every(e => isEmpty(formData[e]))){
                    missingFields.push(...valArray)
                }
                
            }
            else if(condition.includes("every")){
                if(valArray.some(e => isEmpty(formData[e]))){
                    missingFields.push(...filter(valArray, e=> isEmpty(formData[e])))
                }
            }
            else if(condition.includes("requires")){
                condition = condition.split('requires')[0]
                condition = condition.substring(1, condition.length-1);
                let [conditional_key, default_value] = condition.split(',')
                if(!isEmpty(formData[conditional_key])){
                    if(!isUndefined(default_value)){
                        default_value = default_value.trim()
                        if(formData[conditional_key] == default_value){
                            if(valArray.some(e => isEmpty(formData[e]))){
                                missingFields.push(...filter(valArray, e=> isEmpty(formData[e])))
                            }
                        }    
                    }
                    else{
                        if(valArray.some(e => isEmpty(formData[e]))){
                            missingFields.push(...filter(valArray, e=> isEmpty(formData[e])))
                        }
                    }
                    
                }    
            }
        }
        else{
            if(isEmpty(formData[key])){
                missingFields.push(key);
            }
        }
    }
    return missingFields;
}

module.exports = {parser};