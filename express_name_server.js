//Starts Express server

var mongo = require("./mongo_starter");
var express = require("express");
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var environmentVariables = require("./environmentVariables");

var server = null;
var userId, userName, password, flag;

//*** To support JSON-encoded bodies ***
app.use(bodyParser.json());

//*** To support URL-encoded bodies ***
app.use(bodyParser.urlencoded({extended:true}));

//*** Post/Put information in the form ***
//For registering new users of the app
app.post(environmentVariables.register, function(req,res){

	var outcomeDecider = 1;	
	var jsonObj = req.body;
	console.log("REGISTER(POST)--> JSON received - " + JSON.stringify(jsonObj,null,2));

	userId = fs.readFileSync("IdGenerator.txt", 'utf8');
	
	//For the login collection of the server
	var jsonLoginTemp = JSON.stringify({
		"_id": userId,
		"userName": jsonObj.userName,
		"password": jsonObj.password,
		"channel": jsonObj.channel
	});

	var jsonObjForLoginColl = JSON.parse(jsonLoginTemp);
	console.log("REGISTER(POST)--> JSON for login collection - " + JSON.stringify(jsonObjForLoginColl,null,2));

	var jsonMasterTemp = JSON.stringify({
		"_id": userId,
		"First_name": jsonObj.First_name,
		"Last_name": jsonObj.Last_name
	});

	var jsonObjForMasterColl = JSON.parse(jsonMasterTemp);
	console.log("REGISTER(POST)--> JSON for master collection - " + JSON.stringify(jsonObjForMasterColl,null,2));
	
	
	//Call to insert details into login collection of the server
	mongo.insertIntoLoginColl(jsonObjForLoginColl, function(result){
		console.log("REGISTER(POST)--> Result of inserting into login collection - " + result);
		outcomeDecider = outcomeDecider&&result;

		if(outcomeDecider==1){
			//Call to insert details into master collection of the server
			mongo.insertIntoMasterColl(jsonObjForMasterColl, function(result){
				console.log("REGISTER(POST)--> Result of inserting into master collection - " + result);
				outcomeDecider = outcomeDecider&&result;

				//Sending a response to the request
				if(outcomeDecider==0){
					res.send("0");
					console.log("REGISTER(POST)--> Unsuccessful insertion of record with UID " + userId);
				}
				else{
					res.send("1");
					console.log("REGISTER(POST)--> Successful insertion of record with UID " + userId);
					updateIdFile();
				}		
			});	
		}
		else{
			res.send("0");
			console.log("REGISTER(POST)--> Unsuccessful insertion of record with UID " + userId);
		}
	});
});


app.post(environmentVariables.login, function(req,res){
	userName = req.body.u_name;
	password = req.body.pswd;

	mongo.findInDb(userName, password, res);
});

app.post(environmentVariables.update, function(req,res){
	userName = req.body.u_name;
	password = req.body.pswd;

	mongo.updateDb(userName, password, res);
});

app.post(environmentVariables.remove, function(req,res){
	userName = req.body.u_name;
	password = req.body.pswd;

	mongo.removeFromDb(userName, password, res);
});

//*** Stars server ***
function startExpressServer(){
	server = app.listen(environmentVariables.portNo, function(){
		var host = server.address().address;
		var port = server.address().port;

		console.log("Server is operational : "+host+" "+port);
	});
}

//*** Generates a new ID number(UID) for every newly registered user ***
function updateIdFile(){
	fs.readFile('IdGenerator.txt', 'utf8', function(err,data){
		if(err){
			console.log(err);
		}

		data = parseInt(data, 10);
		data += 1;
		fs.truncate('IdGenerator.txt', 0, function(){
		});

		fs.writeFile('IdGenerator.txt', data, function(err){
			if(err){
				console.log("Data insertion error: "+data+" --> "+"IdGenerator.txt");
			}
		});
	});



}

exports.startExpressServer = startExpressServer;

