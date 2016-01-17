/*
	Consists of AWS S3 methods to handle functions related to cloud backup and picture dumps.
*/

var AWS = require("aws-sdk");
var fs = require("fs");
var environmentVariables = require("./../../config/environmentVariables");
var configuration = require("./../../config/config");
var awsConfig = require("./../../config/aws_config.json");

//AWS configuration
AWS.config.loadFromPath(__dirname + "./../../config/aws_config.json");

var s3 = new AWS.S3();
var profilePicBucket = configuration.awsProfilePicBucket;



function uploadProfilePicture(filePath, fileName, fileMimeType){
	//TODO Function to upload profile picture
	console.log("AWS mimetype " + fileMimeType);

	fs.readFile(filePath, function read(err, data) {
		if(err)
        	console.log("Error in reading file");
        else{
    		var params = {Bucket: profilePicBucket, Key: fileName, Body: data, ContentType: fileMimeType, ACL: 'public-read'};
    		s3.putObject(params, function(err, data) {
      			if (err)       
        			console.log(err)     
      			else       
        			console.log("Successfully uploaded file " + fileName + " to " + profilePicBucket + "/" + filePath);   
   			});    	
        }
    });
}

function returnProfilePictureToExpressServer(){
	//TODO Function to return the profile picture of a particular user
}

function uploadCompanyLogo(){
	//TODO Function to upload company logo
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