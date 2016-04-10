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
var https = require("https");
var publicRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");
var as3Methods = require("./../interfaces/aws_s3_interface");
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


	var initialBackup = JSON.stringify({
		"_id": userId,
		"cards": []
	});

	as3Methods.uploadBackup(userId + "-backup.json", initialBackup, "application/json", function(result, message){
		if(message){
			logger.warn("POST /register - Failed to create backup for UID " + userId + ". Failed registration!");
			res.send(JSON.stringify({
				"success":result,
				"error": message
			}));
		}
		else{
			userAccountMethods.searchLoginDetails(jsonObjToSearchUsername, function(result, item, message){
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

									var token = jwt.sign(jsonObjForLoginColl, config.secret, {
										expiresIn: 86400 //Expires in 24 hours
									});

									res.send(JSON.stringify({
										"success":result,
										"error": message,
										"token": token,
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

publicRouter.post("/fbLogin", function(req, res){

	logger.info("POST /fbLogin - JSON received: " + JSON.stringify(req.body, null, 2));

	var options = {
		host: 'graph.facebook.com',
		path: '/me?fields=id,first_name,last_name&access_token='+req.body.fbToken
	};
	https.get(options, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {

        	logger.debug(body);
            // Data reception is done, do whatever with it!
            var parsed = JSON.parse(body);
            logger.debug(parsed);

            fbLogin(parsed, res);
        });
    });
});

function fbLogin(parsedFbBody, res){
	//For the login collection of the server
	var jsonObjToSearchUsername = JSON.parse(JSON.stringify({
		"userName": parsedFbBody.id,
		"status": statusCodes.recordStatusAlive
	}));

	userAccountMethods.searchLoginDetails(jsonObjToSearchUsername, function(result, item, message){
		if(message){

			userId = uuid.v4();
			var jsonObjForLoginColl = JSON.parse(JSON.stringify({
				"_id": userId,
				"userName": parsedFbBody.id,
				"password": "FACEBOOK USER",
				"channel": "FACEBOOK",
				"status": statusCodes.recordStatusAlive
			}));

			var jsonObjForMasterColl = JSON.parse(JSON.stringify({
				"_id": userId,
				"firstName": parsedFbBody.first_name,
				"lastName": parsedFbBody.last_name,
				"version": 0,
				"status": statusCodes.recordStatusAlive
			}));

			userAccountMethods.createLoginDetails(jsonObjForLoginColl, function(result, message){
				if(message==null){
					logger.info("POST /fbLogin - Login details created successfully for UID " + userId + "!");

					//Call to insert details into master collection of the server
					cardMethods.createCardDetails(jsonObjForMasterColl, function(result, message){
				
						//Sending a response to the request
						if(message){	
							logger.warn("POST /fbLogin - Unsuccessful creation of Master details for UID " + userId + "!");	
							res.send(JSON.stringify({
								"success":result,
								"error": message
							}));
						}
						else{
							logger.info("POST /fbLogin - Master details created successfully for UID " + userId + "!");

							var token = jwt.sign(jsonObjForLoginColl, config.secret, {
								expiresIn: 86400 //Expires in 24 hours
							});

							res.send(JSON.stringify({
								"success":result,
								"error": message,
								"token": token,
								"_id":userId
							}));
						}		
					});	
				}
				else{
					logger.warn("POST /fbLogin - Unsuccessful creation of Login details for UID " + userId + "!");
					res.send(JSON.stringify({
						"success":result,
						"error": message
					}));
				}
			});
		}
		else{

			var token = jwt.sign(item, config.secret, {
				expiresIn: 86400 //Expires in 24 hours
			});

			res.send(JSON.stringify({
				"success":result,
				"error": message,
				"token": token,
				"_id": item._id
			}));
		}
	});
}

module.exports = publicRouter;