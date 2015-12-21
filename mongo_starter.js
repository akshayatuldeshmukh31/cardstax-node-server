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

function findInDb(userName, password, res){
	cursor = null;
	cursor = loginCollection.find({"u_name": userName, "pswd": password});
	
	cursor.each(function(err,doc){
		if(err){
			console.log("Error in finding data - "+err);
			//res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
			res.end("Error");
		}
		else if(doc!=null){
			console.log("Data retrieved successfully!");
			//res.sendFile(__dirname + environmentVariables.successfulMessage);
			res.end("Success");
		}
		else{
			console.log("No such data");
			//res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
			res.end("Failure");
		}
	});
}

function updateDb(userName, password, res){
	loginCollection.updateOne({"u_name": userName},  {$set:{"pswd": password}}, {w:1}, function(err,object){
		var result = JSON.parse(object);
		if(err){
			console.log("Error in updating data - "+err);
			res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
		}
		else if(result.nModified==0){
			console.log("No such data");
			res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
		}
		else{
			console.log("Data updated successfully!"+ object + " "+result.n);
			res.sendFile(__dirname + environmentVariables.successfulMessage);
		}
	});
}

function removeFromDb(userName, password, res){
	loginCollection.deleteOne({"u_name": userName}, function(err,object){
		var result = JSON.parse(object);
		if(err){
			console.log("Error in deleting data - "+err);
			res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
		}
		else if(result.n==0){
			console.log("No such data");
			res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
		}
		else{
			console.log("Data deleted successfully!");
			res.sendFile(__dirname + environmentVariables.successfulMessage);
		}
	});
}

exports.giveDbName = giveDbName;
exports.startMongoServer = startMongoServer;
exports.insertIntoLoginColl = insertIntoLoginColl;
exports.findInDb = findInDb;
exports.updateDb = updateDb;
exports.removeFromDb = removeFromDb;

exports.insertIntoMasterColl = insertIntoMasterColl;