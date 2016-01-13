/*
	*********************************************************************************
	File - public_access.js

	This file will define routes which are publicly accessible. The routes will be
	loaded in ./index.js.

	*********************************************************************************
*/

var jwt = require("jsonwebtoken");
var express = require("express");
var publicRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");
var config = require("./../../config/config");
var statusCodes = require("./../status_codes");

var uuid = require("node-uuid");

//TEST route
publicRouter.get("/", function(req, res){
	res.send("Hello! You have reached our publicly accessible page.")
});

//Route to handle new user registration
publicRouter.post("/register", function(req,res){

	console.log("REGISTER --> JSON received - " + JSON.stringify(req.body,null,2));

	userId = uuid.v4();

	//For the login collection of the server
	var jsonObjForLoginColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"userName": req.body.userName,
		"password": req.body.password,
		"channel": req.body.channel,
		"status": statusCodes.recordStatusAlive
	}));
	console.log("REGISTER(POST)--> JSON for login collection - " + JSON.stringify(jsonObjForLoginColl,null,2));

	var jsonObjForMasterColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"firstName": req.body.firstName,
		"lastName": req.body.lastName,
		"version": 0,
		"status": statusCodes.recordStatusAlive
	}));
	
	console.log("REGISTER --> JSON for master collection - " + JSON.stringify(jsonObjForMasterColl,null,2));
	res.setHeader('Content-Type', 'application/json');


	//Call to insert details into login collection of the server
	userAccountMethods.createLoginDetails(jsonObjForLoginColl, function(result, message){
		console.log("REGISTER --> Result of inserting into login collection - " + result);
		
		if(message==null){
			//Call to insert details into master collection of the server
			cardMethods.createCardDetails(jsonObjForMasterColl, function(result, message){
				console.log("REGISTER --> Result of inserting into master collection - " + result);
				
				//Sending a response to the request
				if(message){	
					res.send(JSON.stringify({
						"success":result,
						"error": message
					}));
					console.log("REGISTER --> Unsuccessful insertion of record with UID " + userId);
				}
				else{
					res.send(JSON.stringify({
						"success":result,
						"error": message,
						"_id":userId
					}));
					console.log("REGISTER --> Successful insertion of record with UID " + userId);
				}		
			});	
		}
		else{
			res.send(JSON.stringify({
				"success":result,
				"error": message
			}));
			console.log("REGISTER --> Unsuccessful insertion of record with UID " + userId);
		}
	});
});


//Route to handle existing user logins
publicRouter.post("/login", function(req,res){
	
	console.log("LOGIN --> JSON received - " + JSON.stringify(req.body,null,2));

	var jsonLoginCriteria = JSON.parse(JSON.stringify({
    "userName": req.body.userName,
    "password": req.body.password,
    "status": statusCodes.recordStatusAlive
  	}));

	//Search in the login collection
	userAccountMethods.searchLoginDetails(jsonLoginCriteria, function(result, item, message){
		
		res.setHeader('Content-Type', 'application/json');
		
		if(message){
			console.log("LOGIN --> Username and password combination not found.");
			res.send(JSON.stringify({
				"success": result,
				"error": message
			}));
		}
		else if(!item){
			res.send(JSON.stringify({
				"success": result,
				"error": message
			}));
		}
		else{
			console.log("LOGIN --> Username and password combination found.");
			
			//TODO Code to implement JWT tokens
			var token = jwt.sign(item, config.secret, {
				expiresIn: 86400 //Expires in 24 hours
			});

			res.send(JSON.stringify({
				"success": result,
				"error": message,
				"token": token
			}));
		}
	});
});

module.exports = publicRouter;