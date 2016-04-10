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

    console.log(req.headers);
    console.log(req.body);
    //Check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

  	//Decode token
  	if (token) {

    	// verifies secret and checks expiration time
    	jwt.verify(token, config.secret, function(err, decoded) {      
      	if (err) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 404;
          res.send(JSON.stringify({
            "success": statusCodes.authenticationFailure, 
            "error": statusCodes.authenticationFailureErrorMessage
          }));  
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
      logger.debug("SENT FAILED AUTH");
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      res.send(JSON.stringify({
        "success": statusCodes.authenticationTokenNotProvided, 
        "error": statusCodes.authenticationTokenNotProvidedErrorMessage 
      }));
  	}
});

secureRouter.get("/test", function(req,res){

  var contact = JSON.parse(JSON.stringify({
    "x": "axis",
    "y": "axis"
  }));
  contact['z'] = 'axis';
  logger.debug(JSON.stringify(contact, null, 2));
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
  
  console.log(req.headers);
  logger.info("DELETE /remove - ID received: " + req.decoded._id);

  var jsonUpdateCriteria = JSON.parse(JSON.stringify({
    "_id": req.decoded._id,
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
          logger.warn("DELETE /remove - Unsuccessful removal of record with UID " + req.decoded._id + "!");
        else
          logger.info("DELETE /remove - Successful removal of record with UID " + req.decoded._id + "!");
        
        res.send(JSON.stringify({
            "success": result,
            "error": message
        }));   
      }); 
    }
    else{
      logger.warn("DELETE /remove - Unsuccessful deletion of record with UID " + req.decoded._id + "!");
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
secureRouter.post("/cards", function(req, res){

  //Preparation to recieve multipart form-data
  logger.debug("BEGINNING THE FUNCTION");
  var form = new formidable.IncomingForm();
  logger.debug("Created the form");
  form.uploadDir = __dirname + "/../uploads";
  var jsonSavedCard;

  res.setHeader('Content-Type', 'application/json');
  logger.debug("Parsing form");
  form.parse(req, function(error, fields, files) {

    logger.debug("Parsed form");
    //Field for new card details
    logger.debug(fields.savedCardDetails);
    jsonSavedCard = JSON.parse(fields.savedCardDetails);
    logger.debug("Parsed into saved card");
    logger.info("PUT /cards - JSON received: " + JSON.stringify(jsonSavedCard, null, 2));
    logger.debug("Profile Picture - " + files.profilePic);
    logger.debug("Company logo - " + files.companyLogo);

    var jsonUpdateCard = JSON.parse(JSON.stringify({
    "firstName": jsonSavedCard.firstName,
    "lastName": jsonSavedCard.lastName,
    "company": jsonSavedCard.company,
    "designation": jsonSavedCard.designation,
    "companyAddress": jsonSavedCard.companyAddress,
    "country": jsonSavedCard.country,
    "email": jsonSavedCard.email,
    "phoneNumber": jsonSavedCard.phoneNumber,
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

                  if(files.profilePic || files.companyLogo){
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
                  else{
                    res.send(JSON.stringify({
                      "success": result,
                      "error": message
                    }));
                  }
                }
              });
            }

            else{
              logger.info("PUT /cards - Card details saved successfully, without change in version, for UID " + jsonSavedCard._id + "!");

              if(files.profilePic || files.companyLogo){
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
              else{
                res.send(JSON.stringify({
                  "success": result,
                  "error": message
                }));
              }           
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

  res.setHeader('Content-Type', 'application/json');

  //Variables
  var appendJsonSnippet, mDone1, mDone2, done1, done2, contactRetOver = 0;
  var form = new formData();
  
  var backupFile = req.decoded._id + "-backup.json";
  amazonS3Methods.returnBackupToExpressServer(req.decoded._id, backupFile, function(result, message, data){
    if(message){
      logger.warn("GET /cards - Failed to retrieve backup for UID " + req.decoded._id);
      res.send(JSON.stringify({
        "success": result,
        "error" : message
      }));
    }
    else{
      var backupData = JSON.parse(data);
      logger.debug(backupData);
      
      var jsonFindCriteriaForUser = JSON.parse(JSON.stringify({
        "_id": backupData._id,
        "status": statusCodes.recordStatusAlive
      }));

      cardMethods.searchCardDetails(jsonFindCriteriaForUser, function(result, item, message){
        if(message){
          logger.warn("GET /cards - Failed to retrieve user card details for UID " + backupData._id + ": " + message);
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
            "email": item.email,
            "phoneNumber": item.phoneNumber,
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
          amazonS3Methods.returnProfilePictureToExpressServer(backupData._id, function(result, message, file, contentType){
            if(message){
              logger.warn("GET /cards - Unsuccessful retrieval of profile picture for main UID " + backupData._id + "!");
              mDone1 = 1;
              if(mDone1 == 1 && mDone2 == 1 && (backupData.cards.length == 0 || contactRetOver == 1)){
                res.send(JSON.stringify(cardStack));
                for(var i = 0; i<deletePics.cards.length; i++)
                  deletePictures(deletePics, i);
              }
            }
            else{
              logger.info("GET /cards - Successful retrieval of profile picture for main UID " + backupData._id + "!")
              
              deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
              var readStream1 = fs.createReadStream(file);
              var content1;
              readStream1.on('data', function(chunk){
                content1 += chunk;
              })
              .on('end', function(chunk){
                attachImage(cardStack, backupData._id + "-profile", content1, backupData._id + "-profile-contentType", contentType, function(){
                  mDone1 = 1;
                  if(mDone1 == 1 && mDone2 == 1 && (backupData.cards.length == 0 || contactRetOver == 1)){
                    logger.debug("SENDING " + cardStack);
                    res.send(JSON.stringify(cardStack));
                    for(var i = 0; i<deletePics.cards.length; i++)
                      deletePictures(deletePics, i);
                  }
                });
                //cardStack[backupData._id + "-profile"] = new Buffer(content1).toString('base64');
                //cardStack[backupData._id + "-profile-contentType"] = contentType;
                
              });

              //Attach image to form
              //form.append(backupData._id + "-profile", fs.createReadStream(file));
              //logger.debug(fs.createReadStream(file));
            }

            
          });

          amazonS3Methods.returnCompanyLogoToExpressServer(backupData._id, function(result, message, file, contentType){
            if(message){
              logger.warn("GET /cards - Unsuccessful retrieval of company logo for main UID " + backupData._id + "!");
              mDone2 = 1;
              if(mDone1 == 1 && mDone2 == 1 && (backupData.cards.length == 0 || contactRetOver == 1)){
                res.send(JSON.stringify(cardStack));
                for(var i = 0; i<deletePics.cards.length; i++)
                  deletePictures(deletePics, i);
              }
            }
            else{
              logger.info("GET /cards - Successful retrieval of company logo for main UID " + backupData._id + "!");
              
              deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
              var readStream2 = fs.createReadStream(file);
              var content2;
              readStream2.on('data', function(chunk){
                content2 += chunk;
              })
              .on('end', function(chunk){
                attachImage(cardStack, backupData._id + "-company", content2, backupData._id + "-company-contentType", contentType, function(){
                  mDone2 = 1;
                  if(mDone1 == 1 && mDone2 == 1 && (backupData.cards.length == 0 || contactRetOver == 1)){
                    logger.debug("SENDING " + cardStack);
                    res.send(JSON.stringify(cardStack));
                    for(var i = 0; i<deletePics.cards.length; i++)
                      deletePictures(deletePics, i);
                  }  
                });
                //cardStack[backupData._id + "-company"] = new Buffer(content2).toString('base64');
                //cardStack[backupData._id + "-company-contentType"] = contentType;
                
              });

              //Attach image to form
              //form.append(backupData._id + "-company", fs.createReadStream(file));
            }
          });

          var i = 0, j;
          var counter = 0;
          //Retrieve card details of the user's contacts
          for(i = 0; i<backupData.cards.length; i++){
            j = i;
            
            getContactDetails(cardStack, backupData, i, form, deletePics, function(){
              counter = counter + 1;
              if(mDone1 == 1 && mDone2 == 1 && (counter == backupData.cards.length - 1)){
                logger.debug("SENDING " + cardStack);
                res.send(JSON.stringify(cardStack));
                for(var i = 0; i<deletePics.cards.length; i++)
                  deletePictures(deletePics, i);
              }
              else if(counter == backupData.cards.length - 1){
                contactRetOver = 1;
              }
            });
          }
        }
      });
    }
  })
});

function getContactDetails(cardStack, backupData, i, form, deletePics, callback){

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
      //cardStack.cards.push(contact);

      amazonS3Methods.returnProfilePictureToExpressServer(jsonFindCriteria._id, function(result, message, file, contentType){
        if(message){
          done1 = -1;
          logger.warn("GET /cards - Unsuccessful retrieval of profile picture for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!");
         
          if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
            cardStack.cards.push(contact);            
            callback();
          }
        }
        else{
          logger.info("GET /cards - Successful retrieval of profile picture for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!")
          
          var readStream3 = fs.createReadStream(file);
          var content3;
          readStream3.on('data', function(chunk){
            content3 += chunk;
          })
          .on('end', function(chunk){
            attachImage(contact, jsonFindCriteria._id + "-profile", content3, jsonFindCriteria._id + "-profile-contentType", contentType, function(){
              deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
              done1 = 1;

              if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
                cardStack.cards.push(contact);            
                callback();
              }  
            });
            /*contact[jsonFindCriteria._id + "-profile"] = new Buffer(content3).toString('base64');
            contact[jsonFindCriteria._id + "-profile-contentType"] = contentType;
            deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
            done1 = 1;

            if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
              cardStack.cards.push(contact);            
              callback();
            }*/
          });

          //Attach image to form
          //form.append(jsonFindCriteria._id + "-profile", fs.createReadStream(file));

          /*deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));

          if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
            cardStack.cards.push(contact);            
            callback();
          }*/
        }
      });

      amazonS3Methods.returnCompanyLogoToExpressServer(jsonFindCriteria._id, function(result, message, file, contentType){
        if(message){
          done2 = -1;
          logger.warn("GET /cards - Unsuccessful retrieval of company logo for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!");
          
          if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
            cardStack.cards.push(contact);            
            callback();
          }
        }
        else{
          
          logger.info("GET /cards - Successful retrieval of company logo for UID " + jsonFindCriteria._id + " belonging to the card stack of UID " + backupData._id + "!")
                    
          var readStream4 = fs.createReadStream(file);
          var content4;
          readStream4.on('data', function(chunk){
            content4 += chunk;
          })
          .on('end', function(chunk){
            attachImage(contact, jsonFindCriteria._id + "-company", content4, jsonFindCriteria._id + "-company-contentType", contentType, function(){
              deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
              done2 = 1;

              if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
                cardStack.cards.push(contact);            
                callback();
              }  
            });
            /*contact[jsonFindCriteria._id + "-company"] = new Buffer(content4).toString('base64');
            contact[jsonFindCriteria._id + "-company-contentType"] = contentType;
            deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));
            done2 = 1;

            if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
              cardStack.cards.push(contact);
              callback();
            }*/
          });
          
          //Attach image to form
          //form.append(jsonFindCriteria._id + "-company", fs.createReadStream(file));
          /*deletePics.cards.push(JSON.parse(JSON.stringify({"file": file})));

          if((done1 == 1 || done1 == -1) && (done2 == 1 || done2 == -1)){
            cardStack.cards.push(contact);
            callback();
          }*/
        }
      });
    }
  });
}

function deletePictures(deletePics, i){
  fs.unlink(deletePics.cards[i].file, function(err){
    if(err)
      logger.error("Server - Error in deleting " + deletePics.cards[i].file);
    else
      logger.info("Server - Successfully deleted " + deletePics.cards[i].file);
  });
}

function attachImage(cardStack, picKey, content, typeKey, type, callback){
  cardStack[picKey] = new Buffer(content).toString('base64');
  cardStack[typeKey] = type;
  callback(); 
}

module.exports = secureRouter;



