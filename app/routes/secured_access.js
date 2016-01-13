/*
	*********************************************************************************
	File - public_access.js

	This file will define routes which are secured. To access these routes, the user
	needs the required token for authorization. The routes will be loaded in 
	./index.js. Any access to any path in this file will have to be authorized at a
  checkpoint which will be the middleware of the secure router.

	*********************************************************************************
*/

var jwt = require("jsonwebtoken");
var express = require("express");
var secureRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");
var config = require("./../../config/config");
var statusCodes = require("./../status_codes");


//Router middleware for checking validity of token (CHECKPOINT)
secureRouter.use(function(req, res, next){

    //Check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

  	//Decode token
  	if (token) {

    	// verifies secret and checks expiration time
    	jwt.verify(token, config.secret, function(err, decoded) {      
      	if (err) {
        	return res.json({ 
        		"success": statusCodes.authenticationFailure, 
        		"error": statusCodes.authenticationFailureErrorMessage 
        	});    
      	} 
      	else {
        	// if everything is good, save to request for use in other routes
        	req.decoded = decoded;
        	console.log(decoded);    
        	next();
      	}
    	});

  	} 
  	else {

    	// if there is no token
    	// return an error
    	return res.status(403).json({ 
       		"success": statusCodes.authenticationTokenNotProvided, 
        	"error": statusCodes.authenticationTokenNotProvidedErrorMessage 
    	});
  	}
});


//To update the password of the user account
secureRouter.put("/update", function(req, res){

  console.log("UPDATE_LOGIN_DETAILS(PUT)--> JSON received - " + JSON.stringify(req.body,null,2));

  var jsonUpdateCriteria = JSON.parse(JSON.stringify({
    "_id": req.body._id,
    "password": req.body.oldPassword
  }));
  
  var jsonUpdatedPassword = JSON.parse(JSON.stringify({
    "password": req.body.newPassword
  }));
  
  userAccountMethods.updateLoginDetails(jsonUpdateCriteria, jsonUpdatedPassword, function(result, message){
    
    if(message)
      console.log("UPDATE_LOGIN_DETAILS(PUT)--> Password could not be updated.");  
    else
      console.log("UPDATE_LOGIN_DETAILS(PUT)--> Password has been successfully updated.");

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        "success": result,
        "error": message
    }));
  }); 
});


//To delete a user account...basically to change the status of the account to CLOSED
secureRouter.delete("/remove", function(req,res){
  
  console.log("REMOVE ACCOUNT(PUT)--> JSON received - " + JSON.stringify(req.body,null,2));

  var jsonUpdateCriteria = JSON.parse(JSON.stringify({
    "_id": req.body._id,
    "status": statusCodes.recordStatusAlive
  }));

  var jsonUpdatedStatus = JSON.parse(JSON.stringify({
    "status": statusCodes.recordStatusDead 
  }));
  
  //Call to remove record from master collection of the server
  cardMethods.updateCardDetails(jsonUpdateCriteria, jsonUpdatedStatus, function(result, message){
    
    res.setHeader('Content-Type', 'application/json');
    console.log("REMOVE ACCOUNT(PUT)--> Result of updating status in login collection - " + result);
    
    if(message==null){
      //Call to remove record from login collection of the server
      userAccountMethods.updateLoginDetails(jsonUpdateCriteria, jsonUpdatedStatus, function(result, message){
        console.log("REMOVE ACCOUNT(PUT)--> Result of updating status in master collection - " + result);
        
        if(message)
          console.log("REMOVE ACCOUNT(PUT)--> Unsuccessful update of status of record with UID " + req.body._id);
        else
          console.log("REMOVE ACCOUNT(PUT)--> Successful update of status of record with UID " + req.body._id);
        
        res.send(JSON.stringify({
            "success": result,
            "error": message
        }));   
      }); 
    }
    else{
      res.send(JSON.stringify({
        "success": result,
        "error": message
      }));
      console.log("REMOVE ACCOUNT(PUT)--> Unsuccessful deletion of record with UID " + req.body._id);
    }
  });
});


//To logout from a user account. Requires the destruction of the token.
secureRouter.get("/logout", function(req, res){
  console.log("Received request to LOGOUT");
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    "success": statusCodes.operationSuccess,
    "error": statusCodes.successMessage
  }));
  console.log("LOGOUT executed");
});

/*
  TODO Requires implementation of Amazon AWS functions
secureRouter.put("/cards", function(req, res){

  var jsonObj = req.body;

  var jsonObjFindClause = JSON.parse(JSON.stringify({
    "_id": jsonObj._id
  }));

  //TODO
  
    1. Is Changed_by required?
    2. Separate images from the header
  
  var jsonObjUpdateClause = JSON.parse(JSON.stringify({
    "First_name": jsonObj.First_name,
    "Last_name": jsonObj.Last_name,
    "Company": jsonObj.Company,
    "Designation": jsonObj.Designation,
    "Company_address": jsonObj.Company_address,
    "Country": jsonObj.Country,
    "Template_id": jsonObj.Template_id,
    "Changed_on": jsonObj.Changed_on,
    "Changed_by": jsonObj.Changed_by
  }));

  mongo.updateMasterColl(jsonObjFindClause, jsonObjUpdateClause, function(result, err){
    if(result==1){
      //TODO Operation to load profile and company pictures
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        "Success":"1",
        "Error": err
      }));
    }
    else{
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        "Success":"0",
        "Error": err
      }));
    } 
  });

  //TODO awsS3Method.uploadProfilePicture();
  //TODO awsS3Method.uploadCompanyLogo();
});


//TEST for AWS
app.get("/aws_testing", function(req,res){
  var s3 = new AWS.S3();
  var params = {Bucket: 'mp-profile-picture', Key: 'trial', Body: 'Hello!'};

  s3.putObject(params, function(err, data) {
      if (err)       
        console.log(err)     
      else       
        console.log("Successfully uploaded data to myBucket/myKey");   
   });

  res.send("Test over!");
});
*/

//TEST route
secureRouter.get("/test", function(req, res){
	res.send("Welcome to our secure site!");
});

module.exports = secureRouter;



