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
var formData = require("form-data");
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
      logger.warn("DELETE /remove - Unsuccessful deletion of record with UID " + req.body._id + "!");
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

  //Variables
  var appendJsonSnippet, mDone1, mDone2, done1, done2, contactRetOver = 0;
  var form = new formData();
  
  var backupFile = req.decoded._id + "-backup.json";
  amazonS3Methods.returnBackupToExpressServer(req.decoded._id, backupFile, function(result, message, data){
    if(message){
      logger.warn("GET /cards - Failed to retrieve backup for UID " + req.decoded._id);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        "success": result,
        "error" : message
      }));
    }
    else{
      var backupData = JSON.parse(data);
      
      var jsonFindCriteriaForUser = JSON.parse(JSON.stringify({
        "_id": backupData._id,
        "status": statusCodes.recordStatusAlive
      }));

      cardMethods.searchCardDetails(jsonFindCriteriaForUser, function(result, item, message){
        if(message){
          logger.warn("GET /cards - Failed to retrieve user card details for UID " + backupData._id + ": " + message);
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({
            "success": result,
            "error" : message
          }));
        }
        else{

          //Download pics and retrieve information
          //Prepare JSON response to app side. Cards will store the cards of the user who has requested to retrieve the backup
          var cardStack = JSON.parse(JSON.stringify({
            "_id": item._id,
            "firstName": item.firstName,
            "lastName": item.lastName,
            "company": item.company,
            "companyAddress": item.companyAddress,
            "designation": item.designation,
            "country": item.country,
            "version": item.version,
            "templateId": item.templateId,
            "changedBy": item.changedBy,
            "changedOn": item.changedOn,
            "cards": [],
            "failedRetrievals": []
          }));

          var deletePics = JSON.parse(JSON.stringify({
            "cards": []
          }));
          mDone1 = 0; 
          mDone2 = 0;
          
          //Download pics of the main user
          amazonS3Methods.returnProfilePictureToExpressServer(backupData._id, function(result, message, file){
            mDone1 = 1;
            if(message){
              logger.warn("GET /cards - Unsuccessful retrieval of profile picture for main UID " + backupData._id + "!");
            }
            else{
              logger.info("GET /cards - Successful retrieval of profile picture for main UID " + backupData._id + "!")
              //Attach image to form
              form.append(backupData._id + "-profile", fs.createReadStream(file));
              deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
            }

            if(mDone1 == 1 && mDone2 == 1 && (backupData.cards.length == 0 || contactRetOver == 1)){
              //Delete pics from server memory
              deletePictures(deletePics);
              
              form.append("cardStack", JSON.stringify(cardStack));
              res.set(form.getHeaders());
              form.pipe(res);
            }
          });

          amazonS3Methods.returnCompanyLogoToExpressServer(backupData._id, function(result, message, file){
            mDone2 = 1;
            if(message){
              logger.warn("GET /cards - Unsuccessful retrieval of company logo for main UID " + backupData._id + "!");
            }
            else{
              logger.info("GET /cards - Successful retrieval of company logo for main UID " + backupData._id + "!");
              //Attach image to form
              form.append(backupData._id + "-company", fs.createReadStream(file));
              deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
            }

            if(mDone1 == 1 && mDone2 == 1 && (backupData.cards.length == 0 || contactRetOver == 1)){
              //Delete pics from server memory
              deletePictures(deletePics);
              
              form.append("cardStack", JSON.stringify(cardStack));
              res.set(form.getHeaders());
              form.pipe(res);
            }
          });

          //Retrieve card details of the user's contacts
          for(var i = 0; i<backupData.cards.length; i++){
            getContactDetails(cardStack, backupData, i, form, function(){
              if(mDone1 == 1 && mDone2 == 1 && i >= backupData.cards.length){
                //Delete pics from server memory
                deletePictures(deletePics);

                form.append("cardStack", JSON.stringify(cardStack));
                res.set(form.getHeaders());
                form.pipe(res);
              }
              else if(i >= backupData.cards.length){
                contactRetOver = 1;
              }
            });
          }
        }
      });
    }
  })
});

function getContactDetails(cardStack, backupData, i, form, callback){

  var done1 = 0, done2 = 0;

  var jsonFindCriteria = JSON.parse(JSON.stringify({
    "_id": backupData.cards[i]._id,
    "status": statusCodes.recordStatusAlive
  }));

  cardMethods.searchCardDetails(jsonFindCriteria, function(result, contact, message){
    if(message){
      logger.warn("GET /cards - Unsuccessful retrieval of card details for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!");
      cardStack.failedRetrievals.push(JSON.parse(JSON.stringify({"_id": jsonFindCriteria._id})));
      callback();
    }
    else{

      contact.circle = backupData.cards[i].circle;
      cardStack.cards.push(contact);

      amazonS3Methods.returnProfilePictureToExpressServer(jsonFindCriteria._id, function(result, message, file){
        done1 = 1;
        if(message){
          logger.warn("GET /cards - Unsuccessful retrieval of profile picture for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!");
        }
        else{
          logger.info("GET /cards - Successful retrieval of profile picture for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!")
                    
          //Attach image to form
          form.append(jsonFindCriteria._id + "-profile", fs.createReadStream(file));
          deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));

          if(done1 == 1 && done2 == 1)
            callback();
        }
      });

      amazonS3Methods.returnCompanyLogoToExpressServer(jsonFindCriteria._id, function(result, message, file){
        done2 = 1;
        if(message){
          logger.warn("GET /cards - Unsuccessful retrieval of company logo for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!");
        }
        else{
          logger.info("GET /cards - Successful retrieval of company logo for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!")
                    
          //Attach image to form
          form.append(jsonFindCriteria._id + "-company", fs.createReadStream(file));
          deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));

          if(done1 == 1 && done2 == 1)
            callback();
        }
      });
    }
  });
}

//Function to delete pictures from server memory
function deletePictures(deletePics){
  logger.debug(JSON.stringify(deletePics, null, 2));
  for(var i = 0; i<deletePics.cards.length; i++){
    fs.unlink(deletePics.cards[i].file, function(err){
      if(err)
        logger.error("Server - Error in deleting " + deletePics.cards[i].file + " : " + err);
      else
        logger.info("Server - Successfully deleted " + deletePics.cards[i].file);
    });
  }
}
module.exports = secureRouter;



