/*
	Consists of routing paths and processing of requests to create suitable responses.
*/

var mongo = require("./mongo_starter");
var express = require("express");
var AWS = require("aws-sdk");
var uuid = require("node-uuid");
var app = express();
var bodyParser = require("body-parser");
var environmentVariables = require("./environmentVariables");
var awsS3Method = require("./aws_s3_interface");

//AWS configuration for testing purposes
AWS.config.loadFromPath("./config.json");

var server = null;
var userId, userName, password, flag;

//*** To support JSON-encoded bodies ***
app.use(bodyParser.json());

//*** To support URL-encoded bodies ***
app.use(bodyParser.urlencoded({extended:true}));

//*** Post/Put information in the form ***
//For registering new users of the app
app.post(environmentVariables.registerNewLoginAccount, function(req,res){

	var jsonObj = req.body;
	console.log("REGISTER(POST)--> JSON received - " + JSON.stringify(jsonObj,null,2));

	userId = uuid.v4();

	//For the login collection of the server
	var jsonObjForLoginColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"userName": jsonObj.userName,
		"password": jsonObj.password,
		"channel": jsonObj.channel
	}));
	console.log("REGISTER(POST)--> JSON for login collection - " + JSON.stringify(jsonObjForLoginColl,null,2));

	var jsonObjForMasterColl = JSON.parse(JSON.stringify({
		"_id": userId,
		"First_name": jsonObj.First_name,
		"Last_name": jsonObj.Last_name,
		"Version": 0
	}));
	console.log("REGISTER(POST)--> JSON for master collection - " + JSON.stringify(jsonObjForMasterColl,null,2));
	
	//Call to insert details into login collection of the server
	mongo.insertIntoLoginColl(jsonObjForLoginColl, function(result, err){
		console.log("REGISTER(POST)--> Result of inserting into login collection - " + result);
		
		if(err==null){
			//Call to insert details into master collection of the server
			mongo.insertIntoMasterColl(jsonObjForMasterColl, function(result, err){
				console.log("REGISTER(POST)--> Result of inserting into master collection - " + result);
				
				//Sending a response to the request
				if(err){
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({
						"Success":"0",
						"Error": err
					}));
					console.log("REGISTER(POST)--> Unsuccessful insertion of record with UID " + userId);
				}
				else{
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({
						"Success":"1",
						"Error": err,
						"_id":userId
					}));
					console.log("REGISTER(POST)--> Successful insertion of record with UID " + userId);
				}		
			});	
		}
		else{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"Success":"0",
				"Error": err
			}));
			console.log("REGISTER(POST)--> Unsuccessful insertion of record with UID " + userId);
		}
	});
});

//For logging in existing users of the app
app.post(environmentVariables.login, function(req,res){
	
	var jsonObj = req.body;
	console.log("LOGIN(POST)--> JSON received - " + JSON.stringify(jsonObj,null,2));

	//Search in the login collection
	mongo.findInLoginColl(jsonObj, function(result, err){
		if(err){
			console.log("LOGIN(POST)--> Username and password combination not found.");
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"Success":"0",
				"Error": err
			}));
		}
		else{
			console.log("LOGIN(POST)--> Username and password combination found.");
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"Success":"1",
				"Error": err
			}));
		}
	});
});

//For updating the login details(password only) of the user
app.put(environmentVariables.updateLoginAccount, function(req,res){
	
	var jsonObj = req.body;
	console.log("UPDATE_LOGIN_DETAILS(PUT)--> JSON received - " + JSON.stringify(jsonObj,null,2));

	var jsonUpdateCriteria = JSON.parse(JSON.stringify({
		"_id": jsonObj._id,
		"password": jsonObj.oldPassword
	}));
	
	var jsonUpdatedPassword = JSON.parse(JSON.stringify({
		"password": jsonObj.newPassword
	}));
	
	mongo.updateLoginColl(jsonUpdateCriteria, jsonUpdatedPassword, function(result, err){
		if(err){
			console.log("UPDATE_LOGIN_DETAILS(PUT)--> Password could not be updated.");
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"Success":"0",
				"Error": err
			}));
		}
		else{
			console.log("UPDATE_LOGIN_DETAILS(PUT)--> Password has been successfully updated.");
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"Success":"1",
				"Error": err
			}));
		}
	});	
});

app.delete(environmentVariables.removeLoginAccount, function(req,res){
	
	var jsonRemoveAccount = req.body;
	console.log("REMOVE ACCOUNT(PUT)--> JSON received - " + JSON.stringify(jsonRemoveAccount,null,2));
	
	//Call to remove record from master collection of the server
	mongo.removeFromMasterColl(jsonRemoveAccount, function(result, err){
		console.log("REMOVE ACCOUNT(PUT)--> Result of deleting from login collection - " + result);
		
		if(err==null){
			//Call to remove record from login collection of the server
			mongo.removeFromLoginColl(jsonRemoveAccount, function(result, err){
				console.log("REMOVE ACCOUNT(PUT)--> Result of deleting from master collection - " + result);
				
				//Sending a response to the request
				if(err){
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({
						"Success":"0",
						"Error": err
					}));
					console.log("REMOVE ACCOUNT(PUT)--> Unsuccessful deletion of record with UID " + jsonRemoveAccount._id);
				}
				else{
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({
						"Success":"1",
						"Error": err
					}));
					console.log("REMOVE ACCOUNT(PUT)--> Successful deletion of record with UID " + jsonRemoveAccount._id);
				}		
			});	
		}
		else{
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				"Success":"0",
				"Error": err
			}));
			console.log("REMOVE ACCOUNT(PUT)--> Unsuccessful deletion of record with UID " + jsonRemoveAccount._id);
		}
	});
});

//For logouts while checking for internet connectivity
app.get(environmentVariables.logout, function(req, res){
	console.log("Received request to LOGOUT");
	res.send(JSON.stringify({
		"Success":"1",
	}));
	console.log("LOGOUT executed");
});


//For updating the card details of the user
app.put(environmentVariables.userCardOperation, function(req, res){

	var jsonObj = req.body;

	var jsonObjFindClause = JSON.parse(JSON.stringify({
		"_id": jsonObj._id
	}));

	//TODO
	/*
		1. Is Changed_by required?
		2. Separate images from the header
	*/
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

app.get("/test", function(req,res){
	res.send("Connection ok");
});

//*** Stars server ***
function startExpressServer(){
	server = app.listen(environmentVariables.portNo, function(){
		var host = server.address().address;
		var port = server.address().port;

		console.log("Server is operational : "+host+" "+port);
	});
}

exports.startExpressServer = startExpressServer;

