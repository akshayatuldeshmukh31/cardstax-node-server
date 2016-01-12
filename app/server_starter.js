/*
	*********************************************************************************
	File - server_starter.js

	This file contains the functions to start the Express server and the MongoDB
	server. Since, this is the main intialization file, Mongo variables will also be
	initialized in this file.

	*********************************************************************************
*/

var environmentVariables = require("./../environmentVariables");
var config = require("./../config/config");
var mongoAccountsInterface = require("./interfaces/mongodb_accounts_interface");
var mongoCardsInterface = require("./interfaces/mongodb_cards_interface");
var routeIndex = require("./routes/index");

//For Express
var express = require("express");
var app = express();

//For MongoDB
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var uri = config.database;
var database = null;
var loginCollection = null;
var masterCollection = null;

//Function to start Express server
function startExpressServer(){
	server = app.listen(environmentVariables.portNo, function(){
		var host = server.address().address;
		var port = server.address().port;

		console.log("Server is operational : "+host+" "+port);
	});

	//Function call to load routes
	routeIndex.loadAppRoutes(app);
}

//Function to start MongoDB server and initialize collections in Mongo interfaces
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
					console.log("LOGIN_DETAILS--> Error in ensuring index for id: "+err);
				else if(results){
					console.log("LOGIN_DETAILS--> Index creation is successful for id! "+results);

					loginCollection.ensureIndex({"userName":1, unique:true}, function(err,results){
						if(err)
							console.log("LOGIN_DETAILS--> Error in ensuring index for userName: "+err);
						else if(results)
							console.log("LOGIN_DETAILS--> Index creation is successful for userName! "+results);
					});
				}
			});

			//Master Collection
			masterCollection = db.collection(environmentVariables.mongoMasterCollectionName);
			masterCollection.ensureIndex({"_id":1, unique:true}, function(err,results){
				if(err)
					console.log("MASTER COLL--> Error in ensuring index for id: "+err);
				else if(results){
					console.log("MASTER COLL--> Index creation is successful for id! "+results);
				}
			});
		}
	});
}

function returnLoginCollection(){
	return loginCollection;
}

function returnMasterCollection(){
	return masterCollection;
}

//Exporting functions for access from main.js
exports.startExpressServer = startExpressServer;
exports.startMongoServer = startMongoServer;

//Exporting functions relevant to MongoDB
exports.returnLoginCollection = returnLoginCollection;
exports.returnMasterCollection = returnMasterCollection;
