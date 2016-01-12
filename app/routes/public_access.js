/*
	*********************************************************************************
	File - public_access.js

	This file will define routes which are publicly accessible. The routes will be
	loaded in ./index.js.

	*********************************************************************************
*/

var express = require("express");
var publicRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");

var uuid = require("node-uuid");

//TEST route
publicRouter.get("/", function(req, res){
	res.send("Hello! You have reached our publicly accessible page.")
});

//Route to handle new user registration
publicRouter.post("/register", function(req,res){

	var jsonObj = req.body;
	console.log("REGISTER --> JSON received - " + JSON.stringify(jsonObj,null,2));

	userId = uuid.v4();

	//For the login collection of the server
	var jsonObjForLoginColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"userName": jsonObj.userName,
		"password": jsonObj.password,
		"channel": jsonObj.channel
	}));
	console.log("REGISTER(POST)--> JSON for login collection - " + JSON.stringify(jsonObjForLoginColl,null,2));

	var jsonObjForMasterColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"firstName": jsonObj.firstName,
		"lastName": jsonObj.lastName,
		"version": 0
	}));
	console.log("REGISTER --> JSON for master collection - " + JSON.stringify(jsonObjForMasterColl,null,2));
	
	//Call to insert details into login collection of the server
	userAccountMethods.createLoginDetails(jsonObjForLoginColl, function(result, err){
		console.log("REGISTER --> Result of inserting into login collection - " + result);
		
		if(err==null){
			//Call to insert details into master collection of the server
			cardMethods.createCardDetails(jsonObjForMasterColl, function(result, err){
				console.log("REGISTER --> Result of inserting into master collection - " + result);
				
				//Sending a response to the request
				if(err){
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({
						"success":"0",
						"error": err
					}));
					console.log("REGISTER --> Unsuccessful insertion of record with UID " + userId);
				}
				else{
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({
						"success":"1",
						"error": err,
						"_id":userId
					}));
					console.log("REGISTER --> Successful insertion of record with UID " + userId);
				}		
			});	
		}
		else{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"success":"0",
				"error": err
			}));
			console.log("REGISTER --> Unsuccessful insertion of record with UID " + userId);
		}
	});
});


//Route to handle existing user logins
publicRouter.post("/login", function(req,res){
	
	var jsonObj = req.body;
	console.log("LOGIN --> JSON received - " + JSON.stringify(jsonObj,null,2));

	//Search in the login collection
	userAccountMethods.searchLoginDetails(jsonObj, function(result, err){
		if(err){
			console.log("LOGIN --> Username and password combination not found.");
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"success":"0",
				"error": err
			}));
		}
		else{
			console.log("LOGIN --> Username and password combination found.");
			
			//TODO Code to implement JWT tokens

			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"success":"1",
				"error": err
			}));
		}
	});
});

module.exports = publicRouter;