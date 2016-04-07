/*
	*********************************************************************************
	File - public_access.js

	This file will define routes which are publicly accessible. The routes will be
	loaded in ./index.js.

	*********************************************************************************
*/

var jwt = require("jsonwebtoken");
var express = require("express");
var formidable = require("formidable");
var util = require("util");
var bodyParser = require("body-parser");
var fs = require("fs");
var path = require("path");
var publicRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");
var config = require("./../../config/config");
var statusCodes = require("./../status_codes");
var logger = require("./../../config/logger");

var uuid = require("node-uuid");

publicRouter.use(bodyParser.urlencoded({extended:false}));

//TEST route
publicRouter.get("/", function(req, res){
	res.send("Hello! You have reached our publicly accessible page.");
});

//Route to handle new user registration
publicRouter.post("/register", function(req,res){
	userId = uuid.v4();

	//To search for unique username
	var jsonObjToSearchUsername = JSON.parse(JSON.stringify({
		"userName": req.body.userName,
		"status": statusCodes.recordStatusAlive
	}));

	//For the login collection of the server
	var jsonObjForLoginColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"userName": req.body.userName,
		"password": req.body.password,
		"channel": req.body.channel,
		"status": statusCodes.recordStatusAlive
	}));
	logger.info("GET /register - JSON for login collection: " + JSON.stringify(jsonObjForLoginColl,null,2));

	var jsonObjForMasterColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"firstName": req.body.firstName,
		"lastName": req.body.lastName,
		"version": 0,
		"status": statusCodes.recordStatusAlive
	}));
	logger.info("GET /register - JSON for master collection: " + JSON.stringify(jsonObjForMasterColl,null,2));
	
	res.setHeader('Content-Type', 'application/json');

	userAccountMethods.searchLoginDetails(jsonObjToSearchUsername, function(result, message){
		if(message){
			//Call to insert details into login collection of the server
			userAccountMethods.createLoginDetails(jsonObjForLoginColl, function(result, message){
				if(message==null){
					logger.info("POST /register - Login details created successfully for UID " + jsonObjForLoginColl._id + "!");

					//Call to insert details into master collection of the server
					cardMethods.createCardDetails(jsonObjForMasterColl, function(result, message){
				
						//Sending a response to the request
						if(message){	
							logger.warn("POST /register - Unsuccessful creation of Master details for UID " + jsonObjForMasterColl._id + "!");	
							res.send(JSON.stringify({
								"success":result,
								"error": message
							}));
						}
						else{
							logger.info("POST /register - Master details created successfully for UID " + jsonObjForMasterColl._id + "!");
							res.send(JSON.stringify({
								"success":result,
								"error": message,
								"_id":userId
							}));
						}		
					});	
				}
				else{
					logger.warn("POST /register - Unsuccessful creation of Login details for UID " + jsonObjForLoginColl._id + "!");
					res.send(JSON.stringify({
						"success":result,
						"error": message
					}));
				}
			});
		}
		else{
			res.send(JSON.stringify({
				"success": result,
				"error": statusCodes.existingUsernameMessage
			}));
		}
	});
});


//Route to handle existing user logins
publicRouter.post("/login", function(req,res){
	
	logger.info("POST /login - JSON received: " + JSON.stringify(req.body,null,2));

	var jsonLoginCriteria = JSON.parse(JSON.stringify({
    "userName": req.body.userName,
    "password": req.body.password,
    "status": statusCodes.recordStatusAlive
  	}));

	//Search in the login collection
	userAccountMethods.searchLoginDetails(jsonLoginCriteria, function(result, item, message){
		
		res.setHeader('Content-Type', 'application/json');
		
		if(message || (!item)){
			res.send(JSON.stringify({
				"success": result,
				"error": message
			}));
		}
		else{
			var token = jwt.sign(item, config.secret, {
				expiresIn: 86400 //Expires in 24 hours
			});

			res.setHeader('x-access-token', token);
			res.send(JSON.stringify({
				"success": result,
				"error": message,
				"token": token,
				"_id": item._id
			}));
		}
	});
});

module.exports = publicRouter;