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

function returnProfilePictureToExpressServer(){
	//TODO Function to return the profile picture of a particular user
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
                    })
        			return callback(statusCodes.operationSuccess, null);   
        		}
   			});    	
        }
    });
}

function returnCompanyLogoToExpressServer(){
	//TODO Function to return the company logo of a particular user
}

function uploadBackup(fileName, data, fileMimeType, callback){
	//TODO Function to save backup of cards owned and acquired by the user
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
  var profilePicIndex = null;
  profilePicIndex = profilePicPath.lastIndexOf("\\") + 1;
  if(profilePicIndex==null)
    profilePicIndex = profilePicPath.lastIndexOf("/") + 1;
  var profilePicName = id + '-profile.' + profilePicExt; 
  var profilePicNewPath = path.join(__dirname + "/../uploads/" + profilePicName);
  
  console.log("Profile picture old path - " + profilePicPath);          
  fs.rename(profilePicPath, profilePicNewPath, function(err){
    if(err){
      console.log("Profile picture renaming error - " + err);
      return callback(statusCodes.operationError, err);
    }
    else{
      console.log("Profile picture renamed");
      amazonS3Methods.uploadProfilePicture(profilePicNewPath, profilePicName, profilePic.type, function(result, message){
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
  var companyLogoIndex = null;
  companyLogoIndex = companyLogoPath.lastIndexOf("\\") + 1;
  if(companyLogoIndex==null)
    companyLogoIndex = companyLogoPath.lastIndexOf("/") + 1;
  var companyLogoName = id + '-company.' + companyLogoExt; 
  var companyLogoNewPath = path.join(__dirname + "/../uploads/" + companyLogoName);
  
  console.log("Company logo old path - " + companyLogoPath);   
  fs.rename(companyLogoPath, companyLogoNewPath, function(err){
    if(err){
      console.log("Company logo renaming error - " + err);
      return callback(statusCodes.operationError, err);
    }
    else{
      console.log("Company logo renamed");
      amazonS3Methods.uploadCompanyLogo(companyLogoNewPath, companyLogoName, companyLogo.type, function(result, message){
        if(message)
          console.log("Error in uploading company logo for " + companyLogoName);
        else
          console.log("Company logo uploaded successfully for " + companyLogoName);

        return callback(result, message);
      });
    }
  });
}

exports.uploadProfilePicture = uploadProfilePicture;
exports.returnProfilePictureToExpressServer = returnProfilePictureToExpressServer;
exports.uploadCompanyLogo = uploadCompanyLogo;
exports.returnCompanyLogoToExpressServer = returnCompanyLogoToExpressServer;
exports.uploadBackup = uploadBackup;
exports.returnBackupToExpressServer = returnBackupToExpressServer;
exports.prepareForProfileImageUpload = prepareForProfileImageUpload;
exports.prepareForCompanyLogoUpload = prepareForCompanyLogoUpload;