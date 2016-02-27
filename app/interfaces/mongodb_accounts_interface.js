/*
	*********************************************************************************
	File - mongodb_accounts_interface.js

	This file consists of functions to access and manipulate data stored in the 
	login collection of the MongoDB server.

	*********************************************************************************
*/

var serverInstance = require("./../server_starter");
var statusCodes = require("./../status_codes");
var logger = require("./../../config/logger");
var loginCollection = null;

//To create new login details in the login collection during registration
function createLoginDetails(jsonObjForLoginColl, callback){

	if(loginCollection == null)
		loginCollection = serverInstance.returnLoginCollection();

	loginCollection.insertOne(jsonObjForLoginColl, function(err,result){
		if(err){
			logger.error("Login Collection - Error in registration for username '" + jsonObjForLoginColl._id + "': "+err);
			return callback(statusCodes.operationError, err);
		}
		else if(result){
			logger.info("Login Collection - Registration successful for UID " + jsonObjForLoginColl._id + "!");
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
			logger.error("Login Collection - Error while logging in for username '" + jsonObjForLoginColl.userName + "': "+err);
			callback(statusCodes.operationError, item, err);
		}
		else if(err==null && item!=null){
			logger.info("Login Collection - Login successful for username '" + jsonObjForLoginColl.userName + "'!");
			logger.debug(item);
			var json = JSON.parse(JSON.stringify({
				"cards":[]
			}));
			json.cards.push(JSON.stringify(item));
			json.cards.push(JSON.stringify(item));
			var temp = JSON.parse(json.cards[1]);
			logger.debug(temp.status);
			logger.debug(json);
			callback(statusCodes.operationSuccess, item, statusCodes.successMessage);
		}
		else if(err==null && item==null){
			logger.warn("Login Collection - No such data pertaining to username '" + jsonObjForLoginColl.userName + "'");
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
			logger.error("Login Collection - Error in updating login details of UID " + jsonUpdateCriteria._id + ": "+err);
			callback(statusCodes.operationError, err);
		}
		else if(result.n==0){
			logger.warn("Login Collection - No such data pertaining to UID " + jsonUpdateCriteria._id);
			callback(statusCodes.dataNotFound, statusCodes.dataNotFoundErroMessage);	
		}
		else{
			logger.info("Login Collection - Login details updated successfully for UID " + jsonUpdateCriteria._id + "!");
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
