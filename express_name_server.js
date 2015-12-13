//Starts Express server

var mongo = require("./mongo_starter");
var express = require("express");
var app = express();
var fs = require("fs");
var bodyParser = require("body-parser");
var environmentVariables = require("./environmentVariables");

var server = null;
var userId, userName, password, flag;

//To support JSON-encoded bodies
app.use(bodyParser.json());

//To support URL-encoded bodies
app.use(bodyParser.urlencoded({extended:true}));

app.get("/index.html", function(req,res){
	res.sendFile(__dirname + "/index.html");
});

app.get("/loginDetails_get", function(req,res){
	res.sendFile(__dirname + "/login.html");
});

app.get("/registerDetails_get", function(req,res){
	res.sendFile(__dirname + "/register.html");
});

app.get("/updateDetails_get", function(req,res){
	res.sendFile(__dirname + "/update.html");
});

app.get("/deleteDetails_get", function(req,res){
	res.sendFile(__dirname + "/delete.html");
});

//Post/Put information in the form
app.post(environmentVariables.registerDetails, function(req,res){
	userName = req.body.u_name;
	password = req.body.pswd;
	userId = fs.readFileSync("IdGenerator.txt", 'utf8');
	console.log(userId);
	updateIdFile();
	mongo.insertIntoDb(userId, userName, password, res);
});

app.post(environmentVariables.loginDetails, function(req,res){
	userName = req.body.u_name;
	password = req.body.pswd;

	mongo.findInDb(userName, password, res);
});

app.post(environmentVariables.updateDetails, function(req,res){
	userName = req.body.u_name;
	password = req.body.pswd;

	mongo.updateDb(userName, password, res);
});

app.post(environmentVariables.removeDetails, function(req,res){
	userName = req.body.u_name;
	password = req.body.pswd;

	mongo.removeFromDb(userName, password, res);
});

function startExpressServer(){
	server = app.listen(environmentVariables.portNo, function(){
		var host = server.address().address;
		var port = server.address().port;

		console.log("Server is operational : "+host+" "+port);
	});
}

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

