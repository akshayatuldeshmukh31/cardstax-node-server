var serverInstance = require("./../server_starter");
var statusCodes = require("./../status_codes");
var loginCollection = null;

//To create new login details in the login collection during registration
function createLoginDetails(jsonObjForLoginColl, callback){

	if(loginCollection == null)
		loginCollection = serverInstance.returnLoginCollection();

	loginCollection.insertOne(jsonObjForLoginColl, function(err,result){
		if(err){
			console.log("LOGIN_DETAILS(SERVER)--> Error in inserting data - "+err);
			return callback(statusCodes.operationError, err);
		}
		else if(result){
			console.log("LOGIN_DETAILS(SERVER)--> Data entered successfully! " + result);
			return callback(statusCodes.operationSuccess, statusCodes.successMessage);
		}
	});
}

//To find login details of a user in the login collection during logins
function searchLoginDetails(jsonObjForLoginColl, callback){

	if(loginCollection == null)
		loginCollection = serverInstance.returnLoginCollection();

	loginCollection.findOne(jsonObjForLoginColl, function(err, item){
		if(err){
			console.log("LOGIN_DETAILS(SERVER)--> Error in finding data - "+err);
			callback(statusCodes.operationError, item, err);
		}
		else if(err==null && item!=null){
			console.log("LOGIN_DETAILS(SERVER)--> Data retrieved successfully!");
			callback(statusCodes.operationSuccess, item, statusCodes.successMessage);
		}
		else if(err==null && item==null){
			console.log("LOGIN_DETAILS(SERVER)--> No such data (FIND)");
			callback(statusCodes.dataNotFound, item, statusCodes.dataNotFoundErrorMessage);	
		}
	});
}

//To update login details of a user in the login collection during the creation of a new password
function updateLoginDetails(jsonUpdateCriteria, jsonNewValue, callback){

	if(loginCollection == null)
		loginCollection = serverInstance.returnLoginCollection();

	loginCollection.updateOne(jsonUpdateCriteria,  {$set:jsonNewValue}, {w:1}, function(err,object){
		var result = JSON.parse(object);
		if(err){
			console.log("LOGIN_DETAILS(PUT)--> Error in updating password - "+err);
			callback(statusCodes.operationError, err);
		}
		else if(result.nModified==0){
			console.log("LOGIN_DETAILS(PUT)--> No such data (UPDATE)");
			callback(statusCodes.dataNotFound, statusCodes.dataNotFoundErroMessage);	
		}
		else{
			console.log("LOGIN_DETAILS(PUT)--> Password updated successfully! "+ object);
			callback(statusCodes.operationSuccess, statusCodes.successMessage);
		}
	});
}

/*
//To update the status of the particular login field during account deletion
function deleteLoginDetails(jsonRemove, callback){

	if(loginCollection == null)
		loginCollection = serverInstance.returnLoginCollection();

	loginCollection.deleteOne(jsonRemove, function(err,object){
		var result = JSON.parse(object);
		if(err){
			console.log("LOGIN_DETAILS(DELETE)--> Error in deleting data - "+err);
			callback(statusCodes.operationError, err);
		}
		else if(result.n==0){
			console.log("LOGIN_DETAILS(DELETE)--> No such account (REMOVE)");
			callback(statusCodes.dataNotFound, statusCodes.dataNotFoundErroMessage);
		}
		else{
			console.log("LOGIN_DETAILS(DELETE)--> Account deleted successfully! " + object);
			callback(statusCodes.operationSuccess, statusCodes.successMessage);
		}
	});
}
*/

//Export functions to make it accessible for routes to call these functions
exports.createLoginDetails = createLoginDetails;
exports.searchLoginDetails = searchLoginDetails;
exports.updateLoginDetails = updateLoginDetails;
//exports.deleteLoginDetails = deleteLoginDetails;
