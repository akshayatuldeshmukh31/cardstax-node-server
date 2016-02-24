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
var formidable = require("formidable");
var path = require("path");
var fs = require("fs");
var secureRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");
var amazonS3Methods = require("./../interfaces/aws_s3_interface");
var config = require("./../../config/config");
var statusCodes = require("./../status_codes");
var logger = require("./../../config/logger");


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

  logger.info("PUT /update - JSON received: " + JSON.stringify(req.body,null,2));

  var jsonUpdateCriteria = JSON.parse(JSON.stringify({
    "_id": req.body._id,
    "password": req.body.oldPassword
  }));
  
  var jsonUpdatedPassword = JSON.parse(JSON.stringify({
    "password": req.body.newPassword
  }));
  
  userAccountMethods.updateLoginDetails(jsonUpdateCriteria, jsonUpdatedPassword, function(result, message){
    
    if(message)
      logger.warn("PUT /update - Password could not be updated for UID " + jsonUpdateCriteria._id + "!");  
    else
      logger.info("PUT /update - Password has been successfully updated for UID " + jsonUpdateCriteria._id + "!");

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        "success": result,
        "error": message
    }));
  }); 
});


//To delete a user account...basically to change the status of the account to CLOSED
secureRouter.delete("/remove", function(req,res){
  
  console.log("DELETE /remove - JSON received: " + JSON.stringify(req.body,null,2));

  var jsonUpdateCriteria = JSON.parse(JSON.stringify({
    "_id": req.body._id,
    "status": statusCodes.recordStatusAlive
  }));

  var jsonUpdatedStatus = JSON.parse(JSON.stringify({
    "status": statusCodes.recordStatusDead 
  }));
  
  //Call to remove record from master collection of the server
  cardMethods.updateCardDetails(jsonUpdateCriteria, jsonUpdatedStatus, function(result, message, mongoRes){
    
    res.setHeader('Content-Type', 'application/json');
    if(message==null){
      //Call to remove record from login collection of the server
      userAccountMethods.updateLoginDetails(jsonUpdateCriteria, jsonUpdatedStatus, function(result, message){
      
        if(message)
          logger.warn("DELETE /remove - Unsuccessful removal of record with UID " + req.body._id + "!");
        else
          logger.info("DELETE /remove - Successful removal of record with UID " + req.body._id + "!");
        
        res.send(JSON.stringify({
            "success": result,
            "error": message
        }));   
      }); 
    }
    else{
      logger.warn("DELETE /remove - Unsuccessful deletion of record with UID " + req.body._id "!");
      res.send(JSON.stringify({
        "success": result,
        "error": message
      }));
    }
  });
});


//To logout from a user account. Requires the destruction of the token.
secureRouter.get("/logout", function(req, res){
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    "success": statusCodes.operationSuccess,
    "error": statusCodes.successMessage
  }));
});


//TODO Requires implementation of Amazon AWS functions
secureRouter.put("/cards", function(req, res){

  //Preparation to recieve multipart form-data
  var form = new formidable.IncomingForm();
  form.uploadDir = __dirname + "/../uploads";
  var jsonSavedCard;

  res.setHeader('Content-Type', 'application/json');
  form.parse(req, function(error, fields, files) {

    //Field for new card details
    jsonSavedCard = JSON.parse(fields.savedCardDetails);
    logger.info("PUT /cards - JSON received: " + JSON.stringify(jsonSavedCard, null, 2));

    var jsonUpdateCard = JSON.parse(JSON.stringify({
    "firstName": jsonSavedCard.firstName,
    "lastName": jsonSavedCard.lastName,
    "company": jsonSavedCard.company,
    "designation": jsonSavedCard.designation,
    "companyAddress": jsonSavedCard.companyAddress,
    "country": jsonSavedCard.country,
    "templateId": jsonSavedCard.templateId,
    "changedOn": jsonSavedCard.changedOn,
    "changedBy": jsonSavedCard.changedBy
    }));

    var jsonFindCard = JSON.parse(JSON.stringify({
      "_id": jsonSavedCard._id,
      "status": statusCodes.recordStatusAlive
    }));

    cardMethods.updateCardDetails(jsonFindCard, jsonUpdateCard, function(result, message, mongoRes){
      if(message){
        logger.warn("PUT /cards - Unsuccessful update of card details with UID " + jsonSavedCard._id + "!");
        res.send(JSON.stringify({
          "success": result,
          "error": message
        }));
      }
      else if(message==null){
        cardMethods.searchCardDetails(jsonFindCard, function(result, item, message){
          if(message){
            logger.warn("PUT /cards - Unsuccessful retrieval of version for UID " + jsonSavedCard._id + "!");
            res.send(JSON.stringify({
              "success": result,
              "error": message
            }));
          }
          else if(message==null){

            //If data exists and there are changes made to it
            if(mongoRes.n!=0 && mongoRes.nModified!=0){
              var jsonUpdateVersion = JSON.parse(JSON.stringify({
                "version": item.version + 1
              }));
              cardMethods.updateCardDetails(jsonFindCard, jsonUpdateVersion, function(result, message, mongoRes){
                if(message){
                  logger.warn("PUT /cards - Unsuccessful version update for UID " + jsonSavedCard._id + "!");
                  res.send(JSON.stringify({
                    "success": result,
                    "error": message
                  }));
                }
                else if(message==null){
                  logger.info("PUT /cards - Card details saved successfully, with change in version, for UID " + jsonSavedCard._id + "!");

                  amazonS3Methods.imageUploaderEntryPoint(jsonSavedCard._id, files.profilePic, files.companyLogo, function(result, message){
                    if(message)
                      logger.warn("PUT /cards - Failed image upload!");
                    else
                      logger.info("PUT /cards - Successful image upload!");

                    res.send(JSON.stringify({
                      "success": result,
                      "error": message
                    }));
                  });
                }
              });
            }

            else{
              logger.info("PUT /cards - Card details saved successfully, without change in version, for UID " + jsonSavedCard._id + "!");

              amazonS3Methods.imageUploaderEntryPoint(jsonSavedCard._id, files.profilePic, files.companyLogo, function(result, message){
                if(message)
                  logger.warn("PUT /cards - Failed image upload!");
                else
                  logger.info("PUT /cards - Successful image upload!");

                res.send(JSON.stringify({
                  "success": result,
                  "error": message
                }));
              });           
            }  
          }
        });
      }
    });
  });
});

//TEST for retrieving profile pictures
secureRouter.get("/profilePic", function(req, res){
  var id = req.decoded._id;
  res.setHeader('Content-Type', 'application/json');
  amazonS3Methods.returnProfilePictureToExpressServer(id, function(result, message){
    if(message)
      console.log("Profile picture download for id " + id + " was unsuccessful");
    else
      console.log("Profile picture download for id " + id + " was successful");

    res.send(JSON.stringify({
      "success": result,
      "error" : message
    }));
  });
});

//TEST for retrieving company pictures
secureRouter.get("/companyLogo", function(req, res){
  var id = req.decoded._id;
  res.setHeader('Content-Type', 'application/json');
  amazonS3Methods.returnCompanyLogoToExpressServer(id, function(result, message){
    if(message)
      console.log("Company logo download for id " + id + " was unsuccessful");
    else
      console.log("Company logo download for id " + id + " was successful");

    res.send(JSON.stringify({
      "success": result,
      "error" : message
    }));
  });
});

//Function to upload backup as given by the app
secureRouter.post("/backup", function(req, res){
  res.setHeader('Content-Type', 'application/json');
  amazonS3Methods.uploadBackup(req.body._id + "-backup.json", JSON.stringify(req.body), "application/json", function(result, message){
    res.send(JSON.stringify({
      "success": result,
      "error" : message
    }));
  });
});


//TODO Endpoint for retrieving backups
secureRouter.get("/cards", function(req, res){
  res.setHeader('Content-Type', 'application/json');
  console.log("User " + req.decoded._id + " sent a request to retrieve backup.");
  var backupFile = req.decoded._id + "-backup.json";
  amazonS3Methods.returnBackupToExpressServer(req.decoded._id, backupFile, function(result, message, data){
    if(message){
      res.send(JSON.stringify({
      "success": result,
      "error" : message
      }));
    }
    else{
      var backupData = JSON.parse(data);
      
      var jsonFindCriteriaForUser = JSON.parse(JSON.stringify({
        "_id": backupdata._id,
        "status": statusCodes.recordStatusAlive
      }));

      cardMethods.searchCardDetails(jsonFindCriteriaForUser, function(result, message, item){
        if(message)
{        }
      });


    }
  })

});

module.exports = secureRouter;



