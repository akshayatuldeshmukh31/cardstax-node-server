/*
	Consists of AWS S3 methods to handle functions related to cloud backup and picture dumps.
*/

var AWS = require("aws-sdk");
var fs = require("fs");
var environmentVariables = require("./../../config/environmentVariables");
var configuration = require("./../../config/config");
var awsConfig = require("./../../config/aws_config.json");
var statusCodes = require("./../status_codes");

//AWS configuration
AWS.config.loadFromPath(__dirname + "./../../config/aws_config.json");

var s3 = new AWS.S3();
var profilePicBucket = configuration.awsProfilePicBucket;
var companyLogoBucket = configuration.awsCompanyLogoBucket;
var backupBucket = configuration.awsBackupBucket;



function uploadProfilePicture(filePath, fileName, fileMimeType, callback){
	console.log("AWS mimetype " + fileMimeType);

	fs.readFile(filePath, function read(err, data) {
		if(err){
        	console.log("Error in reading file");
        	return callback(statusCodes.operationError, err);
        }
        else{
    		var params = {Bucket: profilePicBucket, Key: fileName, Body: data, ContentType: fileMimeType, ACL: 'public-read'};
    		s3.putObject(params, function(err, data) {
      			if (err){       
        			console.log("Error in putObject for profile picture. Params - " + params);
        			return callback(statusCodes.operationError, err);
        		}     
      			else{
        			console.log("Successfully uploaded file " + fileName + " to " + profilePicBucket + "/" + filePath);
                    fs.unlink(filePath, function(err){
                        if(err)
                            console.log("Error in deleting file " + fileName);
                        else
                            console.log(fileName + " deleted successfully!");
                    })
        			return callback(statusCodes.operationSuccess, null);   
        		}
   			});    	
        }
    });
}

function returnProfilePictureToExpressServer(id, callback){
	//TODO Function to return the profile picture of a particular user
  var key = id + "-profile";
  console.log("Profile picture key is " + key);
  var params = {Bucket: profilePicBucket, Key: key};
  
  s3.getObject(params, function(err, data){
    if(err){
      console.log("Encountered error in retrieving profile picture for " + id);
      callback(statusCodes.operationError, err);
    }
    else if(data){
      var profilePicExt = data.ContentType.split('/').pop();
      var file = __dirname + "/../downloads/" + key + "." + profilePicExt;
      console.log("Downloaded file location - " + file);

      fs.writeFile(file, data.Body, function (err){
        if(err)
          callback(statusCodes.operationError, err);
        else
          callback(statusCodes.operationSuccess, err);
      });
    }
  });
}

function uploadCompanyLogo(filePath, fileName, fileMimeType, callback){
	fs.readFile(filePath, function read(err, data) {
		if(err){
      console.log("Error in reading file");
      return callback(statusCodes.operationError, err);
    }
    else{
      var params = {Bucket: companyLogoBucket, Key: fileName, Body: data, ContentType: fileMimeType, ACL: 'public-read'};
    	s3.putObject(params, function(err, data) {
      	if (err){       
        	console.log("Error in putObject for company logo. Params - " + params);
        	return callback(statusCodes.operationError, err);
        }     
      	else{
        	console.log("Successfully uploaded file " + fileName + " to " + companyLogoBucket + "/" + filePath);
          fs.unlink(filePath, function(err){
            if(err)
              console.log("Error in deleting file " + fileName);
            else
              console.log(fileName + " deleted successfully!");
          });
        	return callback(statusCodes.operationSuccess, null);   
        }
   		});    	
    }
  });
}

function returnCompanyLogoToExpressServer(id, callback){
	//TODO Function to return the company logo of a particular user
  var key = id + "-company";
  console.log("Company logo key is " + key);
  var params = {Bucket: companyLogoBucket, Key: key};
  
  s3.getObject(params, function(err, data){
    if(err){
      console.log("Encountered error in retrieving company logo for " + id);
      callback(statusCodes.operationError, err);
    }
    else if(data){
      var companyLogoExt = data.ContentType.split('/').pop();
      var file = __dirname + "/../downloads/" + key + "." + companyLogoExt;
      console.log("Downloaded file location - " + file);

      fs.writeFile(file, data.Body, function (err){
        if(err)
          callback(statusCodes.operationError, err);
        else
          callback(statusCodes.operationSuccess, err);
      });
    }
  });
}

function uploadBackup(fileName, data, fileMimeType, callback){
  var params = {Bucket: backupBucket, Key: fileName, Body: data, ContentType: fileMimeType, ACL: 'public-read'};
  s3.putObject(params, function(err, data) {
    if (err){       
      console.log("Error in putObject for backup. Params - " + params);
      return callback(statusCodes.operationError, err);
    }
    else{
      console.log("Succesfully uploaded "+ fileName + " to backup.");
      return callback(statusCodes.operationSuccess, err);
    }
  });   
}

function returnBackupToExpressServer(){
	//TODO Function to return the backup of cards owned and acquired by a particular user
}

//Function to parse file as preparation for storing in S3
function prepareForProfileImageUpload(profilePic, id, callback){
  
  var profilePicPath = profilePic.path;
  var profilePicExt = profilePic.name.split('.').pop();
  var profilePicName = id + "-profile"; 
  var profilePicNewPath = __dirname + "/../uploads/" + profilePicName + "." + profilePicExt;
    
  console.log("Profile picture old path - " + profilePicPath);        
  fs.rename(profilePicPath, profilePicNewPath, function(err){
    if(err){
      console.log("Profile picture renaming error - " + err);
      return callback(statusCodes.operationError, err);
    }
    else{
      console.log("Profile picture renamed");
      uploadProfilePicture(profilePicNewPath, profilePicName, profilePic.type, function(result, message){
        if(message)
          console.log("Error in uploading profile picture for " + profilePicName);
        else
          console.log("Profile picture uploaded successfully for " + profilePicName);

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
  
  console.log("Company logo old path - " + companyLogoPath);   
  fs.rename(companyLogoPath, companyLogoNewPath, function(err){
    if(err){
      console.log("Company logo renaming error - " + err);
      return callback(statusCodes.operationError, err);
    }
    else{
      console.log("Company logo renamed");
      uploadCompanyLogo(companyLogoNewPath, companyLogoName, companyLogo.type, function(result, message){
        if(message)
          console.log("Error in uploading company logo for " + companyLogoName);
        else
          console.log("Company logo uploaded successfully for " + companyLogoName);

        return callback(result, message);
      });
    }
  });
}

//Function which calls all functions related to image uploads
function imageUploaderEntryPoint(id, profilePic, companyLogo, callback){
 
  var counter1 = -2;
  var counter2 = -2;
  var errorMessage, sentCallback = 0;

  if(profilePic!=null){
    counter1 = -1;
    prepareForProfileImageUpload(profilePic, id, function(result, message){
      if(message){
        console.log("Uploading profile picture was unsuccessful for " + profilePic.name);
        counter1 = 0;
        errorMessage = message;
      }
      else{
        console.log("Successful upload of profile picture for " + profilePic.name);
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
        console.log("Uploading profile picture was unsuccessful for " + profilePic.name);
        counter2 = 0;
        errorMessage = message;
      }
      else{
        console.log("Successful upload of company logo for " + companyLogo.name);
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

  /*
  if(profilePic==null && companyLogo==null){
    callback(statusCodes.operationSuccess, null);
  }
  else{
    if(profilePic!=null){
      //Call function for profile picture upload
      prepareForProfileImageUpload(profilePic, id, function(result, message){
        if(message){
          console.log("Uploading profile picture was unsuccessful for " + profilePic.name);
          callback(statusCodes.operationError, message);
        }
        else{
          console.log("Successful upload of profile picture for " + profilePic.name);
                      
          if(companyLogo!=null){
            //Call function for company logo upload
            prepareForCompanyLogoUpload(companyLogo, id, function(result, message){
              if(message){
                console.log("Uploading profile picture was unsuccessful for " + profilePic.name);
                callback(statusCodes.operationError, message);
              }
              else{
                console.log("Successful upload of company logo for " + companyLogo.name);
                callback(statusCodes.operationSuccess, message);
              }
            });
          }
          else
            callback(statusCodes.operationSuccess, message);
        }
      });
    }
    else if(profilePic==null){
      //Call function for company logo upload
      prepareForCompanyLogoUpload(companyLogo, id, function(result, message){
        if(message){
          console.log("Uploading profile picture was unsuccessful for " + profilePic.name);
          callback(statusCodes.operationError, message);
        }
        else{
          console.log("Successful upload of company logo for " + companyLogo.name);
          callback(statusCodes.operationSuccess, message);
        }
      });
    }
  } 
  */
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