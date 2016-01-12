/*
	*********************************************************************************
	File - public_access.js

	This file will define routes which are secured. To access these routes, the user
	needs the required token for authorization. The routes will be loaded in 
	./index.js.

	*********************************************************************************
*/

var express = require("express");
var secureRouter = express.Router();

var userAccountMethods = require("./../interfaces/mongodb_accounts_interface");
var cardMethods = require("./../interfaces/mongodb_cards_interface");



