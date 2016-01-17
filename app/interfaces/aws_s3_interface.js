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
        			return callback(statusCodes.operationSuccess, null);   
        		}
   			});    	
        }
    });
}

function returnCompanyLogoToExpressServer(){
	//TODO Function to return the company logo of a particular user
}

function uploadBackup(){
	//TODO Function to save backup of cards owned and acquired by the user
}

function returnBackupToExpressServer(){
	//TODO Function to return the backup of cards owned and acquired by a particular user
}

exports.uploadProfilePicture = uploadProfilePicture;
exports.returnProfilePictureToExpressServer = returnProfilePictureToExpressServer;
exports.uploadCompanyLogo = uploadCompanyLogo;
exports.returnCompanyLogoToExpressServer = returnCompanyLogoToExpressServer;
exports.uploadBackup = uploadBackup;
exports.returnBackupToExpressServer = returnBackupToExpressServer;