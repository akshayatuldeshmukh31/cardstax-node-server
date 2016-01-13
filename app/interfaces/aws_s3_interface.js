/*
	Consists of AWS S3 methods to handle functions related to cloud backup and picture dumps.
*/

var AWS = require("aws-sdk");
var environmentVariables = require("./../../config/environmentVariables");

//AWS configuration
AWS.config.loadFromPath("./config.json");

function uploadProfilePicture(){
	//TODO Function to upload profile picture
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