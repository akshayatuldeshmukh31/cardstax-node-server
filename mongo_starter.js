//Starts MongoServer
var exServer = require("./express_name_server");
var mongodb = require("mongodb");
var environmentVariables = require("./environmentVariables");
var MongoClient = mongodb.MongoClient;
var uri = environmentVariables.mongoDbUri;
var database = null;
var appCollection = null;
var cursor;

//Connection to MongoDB database
function startMongoServer(){
	MongoClient.connect(uri, function(err,db){
		if(err)
			console.log("Error in connecting to database: "+err);
		else if(db){
			console.log("Successfully connected to database!");
			database = db;
			appCollection = db.collection(environmentVariables.mongoCollectionName);
			appCollection.ensureIndex({"u_name":1, unique:true}, function(err,results){
				if(err)
					console.log("Error in ensuring index: "+err);
				else if(results)
					console.log("Index creation is successful! "+results);
			});
		}
	});
}

//Returns name of the database which will be used by the HTTP server
function giveDbName(){
	return database;
}

function insertIntoDb(userId, userName, password, res){
	var flag;
	console.log("Parameter userId " + userId);
	appCollection.insertOne({"_id": userId, "u_name": userName, "pswd": password}, function(err,result){
		if(err){
			console.log("Error in inserting data - "+err);
			res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
		}
		else if(result){
			console.log("Data entered successfully! " + result);
			res.sendFile(__dirname + environmentVariables.successfulMessage);
		}
	});
}

function findInDb(userName, password, res){
	cursor = null;
	cursor = appCollection.find({"u_name": userName, "pswd": password});
	
	cursor.each(function(err,doc){
		if(err){
			console.log("Error in finding data - "+err);
			res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
		}
		else if(doc!=null){
			console.log("Data retrieved successfully!");
			res.sendFile(__dirname + environmentVariables.successfulMessage);
		}
		else{
			console.log("No such data");
			res.sendFile(__dirname + environmentVariables.unsuccessfulMessage);
		}
	});
}

function updateDb(userName, password, res){
	appCollection.updateOne({"u_name": userName},  {$set:{"pswd": password}}, {w:1}, function(err,object){
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
	appCollection.deleteOne({"u_name": userName}, function(err,object){
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
exports.insertIntoDb = insertIntoDb;
exports.findInDb = findInDb;
exports.updateDb = updateDb;
exports.removeFromDb = removeFromDb;