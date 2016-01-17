var serverInstance = require("./../server_starter");
var statusCodes = require("./../status_codes");
var masterCollection = null;

//To insert new user card details in the master collection during registration
function createCardDetails(jsonObjForMasterColl, callback){

	if(masterCollection == null)
		masterCollection = serverInstance.returnMasterCollection();

	masterCollection.insertOne(jsonObjForMasterColl, function(err,result){
		if(err){
			console.log("MASTER COLL(SERVER)--> Error in inserting data - "+err);
			return callback(statusCodes.operationError, err);
		}
		else if(result){
			console.log("MASTER COLL(SERVER)--> Data entered successfully! " + result);
			return callback(statusCodes.operationSuccess, statusCodes.successMessage);
		}
	});
}


function searchCardDetails(jsonObjForMasterColl, callback){

	if(masterCollection == null)
		masterCollection = serverInstance.returnMasterCollection();

	masterCollection.findOne(jsonObjForMasterColl, function(err, item){
		if(err){
			console.log("MASTER COLL --> Error in finding data - "+err);
			return callback(statusCodes.operationError, item, err);
		}
		else if(err==null && item!=null){
			console.log("MASTER COLL --> Data retrieved successfully! ");
			return callback(statusCodes.operationSuccess, item, statusCodes.successMessage);
		}
		else if(err==null && item==null){
			console.log("MASTER COLL --> No such data (FIND)");
			return callback(statusCodes.dataNotFound, item, statusCodes.dataNotFoundErrorMessage);	
		}
	});
}

//To update user card details in the master collection when a user wants to save changes to his/her card
function updateCardDetails(jsonUpdateCriteria, jsonNewValues, callback){

	if(masterCollection == null)
		masterCollection = serverInstance.returnMasterCollection();

	masterCollection.updateOne(jsonUpdateCriteria,  {$set:jsonNewValues}, {w:1}, function(err,object){
		var result = JSON.parse(object);
		if(err){
			console.log("MASTER_COLLECTION(PUT)--> Error in updating user card details - "+err);
			return callback(statusCodes.operationError, err, result);
		}
		else if(result.n==0){
			console.log("MASTER_COLLECTION(PUT)--> No such data (UPDATE) " + object);
			return callback(statusCodes.dataNotFound, statusCodes.dataNotFoundErrorMessage, result);	
		}
		else{
			console.log("MASTER_COLLECTION(PUT)--> User card details updated successfully! "+ object);
			return callback(statusCodes.operationSuccess, statusCodes.successMessage, result);
		}
	});
}

/*
//To update the status of card details of the user in the master collection in the event of a deletion of a card
function deleteCardDetails(jsonId, callback){

	if(masterCollection == null)
		masterCollection = serverInstance.returnMasterCollection();

	masterCollection.deleteOne(jsonRemove, function(err,object){
		var result = JSON.parse(object);
		if(err){
			console.log("LOGIN_DETAILS(DELETE)--> Error in deleting data - "+err);
			callback(0, err);
		}
		else if(result.n==0){
			console.log("LOGIN_DETAILS(DELETE)--> No such account (REMOVE)");
			callback(0, "No such data");
		}
		else{
			console.log("LOGIN_DETAILS(DELETE)--> Account deleted successfully! " + object);
			callback(1, null);
		}
	});
}
*/

//Export functions to make it accessible for routes to call these functions
exports.createCardDetails = createCardDetails;
exports.searchCardDetails = searchCardDetails;
exports.updateCardDetails = updateCardDetails;
//exports.deleteCardDetails = deleteCardDetails;