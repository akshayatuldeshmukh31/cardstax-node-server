//Starts MongoServer
var exServer = require("./express_name_server");
var mongodb = require("mongodb");
var environmentVariables = require("./environmentVariables");
var MongoClient = mongodb.MongoClient;
var uri = environmentVariables.mongoDbUri;
var database = null;
var loginCollection = null;
var masterCollection = null;
var cursor;

//Connection to MongoDB database in the server
function startMongoServer(){
	MongoClient.connect(uri, function(err,db){
		if(err)
			console.log("Error in connecting to database: "+err);
		else if(db){
			console.log("Successfully connected to database!");
			database = db;
			
			//Login Collection
			loginCollection = db.collection(environmentVariables.mongoLoginDetailsCollectionName);
			loginCollection.ensureIndex({"_id":1, unique:true}, function(err,results){
				if(err)
					console.log("LOGIN_DETAILS(SERVER)--> Error in ensuring index for id: "+err);
				else if(results)
					console.log("LOGIN_DETAILS(SERVER)--> Index creation is successful for id! "+results);
			});
			loginCollection.ensureIndex({"userName":1, unique:true}, function(err,results){
				if(err)
					console.log("LOGIN_DETAILS(SERVER)--> Error in ensuring index for userName: "+err);
				else if(results)
					console.log("LOGIN_DETAILS(SERVER)--> Index creation is successful for userName! "+results);
			});

			//Master Collection
			masterCollection = db.collection(environmentVariables.mongoMasterCollectionName);
			masterCollection.ensureIndex({"_id":1, unique:true}, function(err,results){
				if(err)
					console.log("MASTER COLL(SERVER)--> Error in ensuring index for id: "+err);
				else if(results)
					console.log("MASTER COLL(SERVER)--> Index creation is successful for id! "+results);
			});
		}
	});
}

//Returns name of the database which will be used by the HTTP server
function giveDbName(){
	return database;
}

function insertIntoLoginColl(jsonObjForLoginColl, callback){
	var flag;
	loginCollection.insertOne(jsonObjForLoginColl, function(err,result){
		if(err){
			console.log("LOGIN_DETAILS(SERVER)--> Error in inserting data - "+err);
			//res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
			return callback(0, err);
		}
		else if(result){
			console.log("LOGIN_DETAILS(SERVER)--> Data entered successfully! " + result);
			//res.sendFile(__dirname + environmentVariables.successfulMessage);
			return callback(1, null);
		}
	});
}

function insertIntoMasterColl(jsonObjForMasterColl, callback){
	var flag;
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

function findInLoginColl(jsonObjForLoginColl, callback){
	cursor = null;
	loginCollection.findOne(jsonObjForLoginColl, function(err, item){
		if(err){
			console.log("LOGIN_DETAILS(SERVER)--> Error in finding data - "+err);
			callback(0, err);
		}
		else if(err==null && item!=null){
			console.log("LOGIN_DETAILS(SERVER)--> Data retrieved successfully! ");
			callback(1, null);
		}
		else if(err==null && item==null){
			console.log("LOGIN_DETAILS(SERVER)--> No such data (FIND)");
			callback(0, "No such data");	
		}
	});
}

function updateLoginColl(jsonUpdateCriteria, jsonNewValue, callback){
	loginCollection.updateOne(jsonUpdateCriteria,  {$set:jsonNewValue}, {w:1}, function(err,object){
		var result = JSON.parse(object);
		if(err){
			console.log("LOGIN_DETAILS(PUT)--> Error in updating password - "+err);
			callback(0, err);
		}
		else if(result.nModified==0){
			console.log("LOGIN_DETAILS(PUT)--> No such data (UPDATE)");
			callback(0, "No such data");
		}
		else{
			console.log("LOGIN_DETAILS(PUT)--> Password updated successfully! "+ object);
			callback(1, null);
		}
	});
}

function removeFromLoginColl(jsonRemove, callback){
	loginCollection.deleteOne(jsonRemove, function(err,object){
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

function removeFromMasterColl(jsonRemove, callback){
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

exports.giveDbName = giveDbName;
exports.startMongoServer = startMongoServer;
exports.insertIntoLoginColl = insertIntoLoginColl;
exports.findInLoginColl = findInLoginColl;
exports.updateLoginColl = updateLoginColl;
exports.removeFromLoginColl = removeFromLoginColl;

exports.insertIntoMasterColl = insertIntoMasterColl;
exports.removeFromMasterColl = removeFromMasterColl;