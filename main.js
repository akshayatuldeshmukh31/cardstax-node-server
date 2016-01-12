/*
	*********************************************************************************
	File - main.js

	This file will be referred by Heroku to execute the Node.js server. It contains
	function calls to initialize the Express server and the MongoDB server. The 
	functions, which are being called, are implemented in server_starter.js

	*********************************************************************************
*/

var serverInitializer = require("./app/server_starter");

serverInitializer.startMongoServer();
serverInitializer.startExpressServer();