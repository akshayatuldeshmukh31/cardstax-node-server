/*
	*********************************************************************************
	File - index.js

	This file will load routes which are both publicly and privately accessible.

	*********************************************************************************
*/

var expressServerInstanceProvider = require("./../server_starter");
var bodyParser = require("body-parser");
var publicRoutes = require("./public_access");
var securedRoutes = require("./secured_access");

//Function to load routes for publicly and privately accessible routes
function loadAppRoutes(app){
	//To support JSON-encoded bodies
	app.use(bodyParser.json());

	//To support URL-encoded bodies
	//app.use(bodyParser.urlencoded({extended:true}));

	//Load routes which require no authorization (publicly available)
	app.use("/public", publicRoutes);

	//Load routes which require authorization (secured access)
	app.use("/secure", securedRoutes);

	//TEST route
	app.get("/", function(req,res){
		res.send("Hello! You have reached the index.");
	});
}

exports.loadAppRoutes = loadAppRoutes;