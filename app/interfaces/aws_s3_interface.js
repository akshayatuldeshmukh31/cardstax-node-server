/*
  *********************************************************************************
  File - aws_s3_interface.js

  This file defines functions to access and manipute data stored in Amazon AWS S3.

  *********************************************************************************
*/

var AWS = require("aws-sdk");
var fs = require("fs");
var environmentVariables = require("./../../config/environmentVariables");
var configuration = require("./../../config/config");
var awsConfig = require("./../../config/aws_config.json");
var statusCodes = require("./../status_codes");
var logger = require("./../../config/logger");

//AWS configuration
AWS.config.loadFromPath(__dirname + "./../../config/aws_config.json");

var s3 = new AWS.S3();
var profilePicBucket = configuration.awsProfilePicBucket;
var companyLogoBucket = configuration.awsCompanyLogoBucket;
var backupBucket = configuration.awsBackupBucket;



function uploadProfilePicture(filePath, fileName, fileMimeType, callback){

	fs.readFile(filePath, function read(err, data) {
		if(err){
        	logger.error("Cloud - Error in reading profile picture " + fileName + ": " + err);
        	return callback(statusCodes.operationError, err);
        }
        else{
      		var params = {Bucket: profilePicBucket, Key: fileName, Body: data, ContentType: fileMimeType, ACL: 'public-read'};
      		s3.putObject(params, function(err, data) {
        			if (err){       
          			logger.error("Cloud - Error in putObject for profile picture. Params: " + params + ". Error: " + err);
          			return callback(statusCodes.operationError, err);
          		}     
        			else{
          			logger.info("Cloud - Successfully uploaded file " + fileName + " to " + profilePicBucket + "/" + filePath);
                      fs.unlink(filePath, function(err){
                          if(err)
                              logger.error("Cloud - Error in deleting file " + fileName + ": " + err);
                          else
                              logger.info("Cloud - " + fileName + " deleted successfully!");
                      });
          			return callback(statusCodes.operationSuccess, null);   
          		}
     			});    	
        }
    });
}

function returnProfilePictureToExpressServer(id, callback){
  var key = id + "-profile";
  var params = {Bucket: profilePicBucket, Key: key};
  
  s3.getObject(params, function(err, data){
    if(err){
      logger.error("Cloud - Encountered error in retrieving profile picture for UID " + id + ": " + err);
      callback(statusCodes.operationError, err, null);
    }
    else if(data){
      var profilePicExt = data.ContentType.split('/').pop();
      var file = __dirname + "/../downloads/" + key + "." + profilePicExt;

      fs.writeFile(file, data.Body, function (err){
        if(err){
          logger.error("Cloud - Error in writing profile picture " + file + ": " + err);
          callback(statusCodes.operationError, err, file);
        }
        else{
          logger.info("Cloud - " + file + " written successfully!");
          callback(statusCodes.operationSuccess, err, file);
        }
      });
    }
  });
}

function uploadCompanyLogo(filePath, fileName, fileMimeType, callback){
	
  fs.readFile(filePath, function read(err, data) {
		if(err){
      logger.error("Cloud - Error in reading company logo " + fileName + ": " + err);
      return callback(statusCodes.operationError, err);
    }
    else{
      var params = {Bucket: companyLogoBucket, Key: fileName, Body: data, ContentType: fileMimeType, ACL: 'public-read'};
    	s3.putObject(params, function(err, data) {
      	if (err){       
        	logger.error("Cloud - Error in putObject for company logo. Params: " + params + ". Error: " + err);
        	return callback(statusCodes.operationError, err);
        }     
      	else{
        	logger.info("Cloud - Successfully uploaded file " + fileName + " to " + companyLogoBucket + "/" + filePath);
          fs.unlink(filePath, function(err){
            if(err)
              logger.error("Cloud - Error in deleting file " + fileName + ": " + err);
            else
              logger.info("Cloud - " + fileName + " deleted successfully!");
          });
        	return callback(statusCodes.operationSuccess, null);   
        }
   		});    	
    }
  });
}

function returnCompanyLogoToExpressServer(id, callback){
  var key = id + "-company";
  var params = {Bucket: companyLogoBucket, Key: key};
  
  s3.getObject(params, function(err, data){
    if(err){
      logger.error("Cloud - Encountered error in retrieving company logo for UID " + id + ": " + err);
      callback(statusCodes.operationError, err, null);
    }
    else if(data){
      var companyLogoExt = data.ContentType.split('/').pop();
      var file = __dirname + "/../downloads/" + key + "." + companyLogoExt;

      fs.writeFile(file, data.Body, function (err){
        if(err){
          logger.error("Cloud - Error in writing company logo " + file + ": " + err);
          callback(statusCodes.operationError, err, file);
        }
        else{
          logger.info("Cloud - " + file + " written successfully!");
          callback(statusCodes.operationSuccess, err, file);
        }
      });
    }
  });
}

function uploadBackup(fileName, data, fileMimeType, callback){
  var params = {Bucket: backupBucket, Key: fileName, Body: data, ContentType: fileMimeType, ACL: 'public-read'};
  s3.putObject(params, function(err, data) {
    if (err){       
      logger.error("Cloud - Error in putObject for backup. Params: " + params + ". Error: " + err);
      return callback(statusCodes.operationError, err);
    }
    else{
      logger.info("Cloud - Succesfully uploaded "+ fileName + " to backup.");
      return callback(statusCodes.operationSuccess, err);
    }
  });   
}

function returnBackupToExpressServer(id, fileName, callback){
  var params = {Bucket: backupBucket, Key: fileName};

  s3.getObject(params, function(err, data){
    if(err){
      logger.error("Cloud - Encountered error in retrieving backup for UID " + id + ": " + err);
      callback(statusCodes.operationError, err, null);
    }
    else if(data){
      logger.info("Cloud - Successfully retrieved backup for UID " + id);
      callback(statusCodes.operationSuccess, err, data.Body.toString());
    };
  });
}

//Function to parse file as preparation for storing in S3
function prepareForProfileImageUpload(profilePic, id, callback){
  
  var profilePicPath = profilePic.path;
  var profilePicExt = profilePic.name.split('.').pop();
  var profilePicName = id + "-profile"; 
  var profilePicNewPath = __dirname + "/../uploads/" + profilePicName + "." + profilePicExt;
            
  fs.rename(profilePicPath, profilePicNewPath, function(err){
    if(err){
      return callback(statusCodes.operationError, err);
    }
    else{
      uploadProfilePicture(profilePicNewPath, profilePicName, profilePic.type, function(result, message){
        if(message)
          logger.error("Cloud - Error in uploading profile picture for " + profilePicName + ": " + message);
        else
          logger.info("Cloud - Successful upload of profile picture " + profilePicName);

        return callback(result, message);
      });
    }
  });
}

//Function to parse file as preparation for storing in S3
function prepareForCompanyLogoUpload(companyLogo, id, callback){
  
  var companyLogoPath = companyLogo.path;
  var companyLogoExt = companyLogo.name.split('.').pop();
  var companyLogoName = id + "-company"; 
  var companyLogoNewPath = __dirname + "/../uploads/" + companyLogoName + "." + companyLogoExt;
  
  fs.rename(companyLogoPath, companyLogoNewPath, function(err){
    if(err){
      return callback(statusCodes.operationError, err);
    }
    else{
      uploadCompanyLogo(companyLogoNewPath, companyLogoName, companyLogo.type, function(result, message){
        if(message)
          logger.error("Cloud - Error in uploading company logo " + companyLogoName + ": " + message);
        else
          logger.info("Cloud - Successful upload of company logo " + companyLogoName);

        return callback(result, message);
      });
    }
  });
}

//Function which calls all functions related to image uploads
function imageUploaderEntryPoint(id, profilePic, companyLogo, callback){
 
  var counter1 = -2;
  var counter2 = -2;
  var sentCallback = 0;

  if(profilePic!=null){
    counter1 = -1;
    prepareForProfileImageUpload(profilePic, id, function(result, message){
      if(message){
        logger.warn("Cloud - Unsuccessful upload of profile picture for UID " + id + ": " + message);
        counter1 = 0;
      }
      else{
        logger.info("Cloud - Successful upload of profile picture for UID " + id);
        counter1 = 1;
      }

      if(companyLogo==null && counter1==1){
        sentCallback = 1;
        callback(statusCodes.operationSuccess, message);
      }
      else if(counter1==0){
        sentCallback = 1;
        callback(statusCodes.operationError, message);
      }
      else if(companyLogo!=null && counter1==1){
        if(sentCallback!=1 && counter2==1){
          sentCallback = 1;
          callback(statusCodes.operationSuccess, message);
        }
      }
    });
  }

  if(companyLogo!=null){
    counter2 = -1;
    prepareForCompanyLogoUpload(companyLogo, id, function(result, message){
      if(message){
        logger.warn("Cloud - Unsuccessful upload of company logo for UID " + id + ": " + message);
        counter2 = 0;
      }
      else{
        logger.warn("Cloud - Successful upload of company logo for UID " + id);
        counter2 = 1;
      }

      if(profilePic==null && counter2==1){
        sentCallback = 1;
        callback(statusCodes.operationSuccess, message);
      }
      else if(counter2==0){
        sentCallback = 1;
        callback(statusCodes.operationError, message);
      }
      else if(profilePic!=null && counter2==1){
        if(sentCallback!=1 && counter1==1){
          sentCallback = 1;
          callback(statusCodes.operationSuccess, message);
        }
      }
    });
  }
}

exports.uploadProfilePicture = uploadProfilePicture;
exports.returnProfilePictureToExpressServer = returnProfilePictureToExpressServer;
exports.uploadCompanyLogo = uploadCompanyLogo;
exports.returnCompanyLogoToExpressServer = returnCompanyLogoToExpressServer;
exports.uploadBackup = uploadBackup;
exports.returnBackupToExpressServer = returnBackupToExpressServer;
exports.prepareForProfileImageUpload = prepareForProfileImageUpload;
exports.prepareForCompanyLogoUpload = prepareForCompanyLogoUpload;
exports.imageUploaderEntryPoint = imageUploaderEntryPoint;