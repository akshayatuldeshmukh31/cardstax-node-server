var serverInstance = require("./../server_starter");
var masterCollection = null;

//To insert new user card details in the master collection during registration
function createCardDetails(jsonObjForMasterColl, callback){

	if(masterCollection == null)
		masterCollection = serverInstance.returnMasterCollection();

	masterCollection.insertOne(jsonObjForMasterColl, function(err,result){
		if(err){
			console.log("MASTER COLL(SERVER)--> Error in inserting data - "+err);
			//res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
			return callback(0, err);
		}
		else if(result){
			console.log("MASTER COLL(SERVER)--> Data entered successfully! " + result);
			//res.sendFile(__dirname + environmentVariables.successfulMessage);
			return callback(1, null);
		}
	});
}


function searchCardDetails(jsonObjForMasterColl, callback){

	if(masterCollection == null)
		masterCollection = serverInstance.returnMasterCollection();

	masterCollection.findOne(jsonObjForMasterColl, function(err, item){
		if(err){
			console.log("MASTER COLL --> Error in finding data - "+err);
			callback(0, err);
		}
		else if(err==null && item!=null){
			console.log("MASTER COLL --> Data retrieved successfully! ");
			callback(1, null);
		}
		else if(err==null && item==null){
			console.log("MASTER COLL --> No such data (FIND)");
			callback(0, "No such data");	
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
			callback(0, err);
		}
		else if(result.nModified==0){
			console.log("MASTER_COLLECTION(PUT)--> No such data (UPDATE)");
			callback(0, "No such data");
		}
		else{
			console.log("MASTER_COLLECTION(PUT)--> User card details updated successfully! "+ object);
			callback(1, null);
		}
	});
}

//To update the status of card details of the user in the master collection in the event of a deletion of a card
function deleteCardDetails(jsonRemove, callback){

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

//Export functions to make it accessible for routes to call these functions
exports.createCardDetails = createCardDetails;
exports.searchCardDetails = searchCardDetails;
exports.updateCardDetails = updateCardDetails;
exports.deleteCardDetails = deleteCardDetails;