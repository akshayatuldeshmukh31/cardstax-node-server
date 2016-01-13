/*
	*********************************************************************************
	File - status_codes.js

	This file stores the status codes for every type of outcome.

	*********************************************************************************
*/

//Universal success message
exports.successMessage = null;							//No error to report as a message

//For token verification
exports.authenticationFailure = "-1";
exports.authenticationFailureErrorMessage = "Failed to authenticate token!";
exports.authenticationTokenNotProvided = "0";
exports.authenticationTokenNotProvidedErrorMessage = "No token provided!";

//For MongoDB operations
exports.operationError = "-1";							//Error on Mongo's side
exports.dataNotFound = "0";								//No error but the details do not exist
exports.dataNotFoundErrorMessage = "Data not found!";
exports.operationSuccess = "1";							//Operation was executed smoothly

//Whether a particular record/account is alive or dead
exports.recordStatusAlive = "ALIVE";					//Used when accounts are created and are being used
exports.recordStatusDead = "DEAD";						//Used when accounts are deleted


