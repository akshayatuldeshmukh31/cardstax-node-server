/*
	*********************************************************************************
	File - public_access.js

	This file will define routes which are secured. To access these routes, the user
	needs the required token for authorization. The routes will be loaded in 
	./index.js.

	*********************************************************************************
*/

var jwt = require("jsonwebtoken");
var express = require("express");
var secureRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");
var config = require("./../../config/config");

secureRouter.use(function(req, res, next){

	// check header or url parameters or post parameters for token
  	var token = req.body.token || req.query.token || req.headers['x-access-token'];

  	// decode token
  	if (token) {

    	// verifies secret and checks exp
    	jwt.verify(token, config.secret, function(err, decoded) {      
      	if (err) {
        	return res.json({ 
        		"success": "0", 
        		"message": "Failed to authenticate token." 
        	});    
      	} 
      	else {
        	// if everything is good, save to request for use in other routes
        	req.decoded = decoded;
        	console.log(decoded);    
        	next();
      	}
    	});

  	} 
  	else {

    	// if there is no token
    	// return an error
    	return res.status(403).send({ 
       		success: false, 
        	message: 'No token provided.' 
    	});
  	}
});


//TEST route
secureRouter.get("/test", function(req, res){
	res.send("Welcome to our secure site!");
});

module.exports = secureRouter;



