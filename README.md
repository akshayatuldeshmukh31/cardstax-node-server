Current project structure:


	-app

	-----server_starter.js 						//Called by main.js. Contains functions to start the Express server and the MongoDB server.

	-----status_codes.js

	-----routes

	----------index.js 							//Loads routes

	----------public_access.js 					//Routes which do not require any authentication

	----------secured_access.js 				//Routes which require authentication

	-----interfaces

	----------mongodb_accounts_interface.js 	//Contains methods related to user accounts

	----------mongodb_card_interface.js 		//Contains methods related to card details

	----------amazons3.js

	-config
	
	-----config.js

	-package.json
	
	-main.js 									//Contains functions calls to start the Express server and the MongoDB server



Work done till date - 



* Developed function for implementing the registration module on the server side for registering new users on the master and login collections. 

	JSON Request key values:

		a. firstName
		b. lastName
		c. userName
		d. password
		e. channel

	JSON Response key values:

		a. success 
		b. error 
		c. ID of the newly registered user (_id) - To be stored within the application for future correspondence with the server 



* Developed function for logging in an existing user of the application

	JSON Request key values:

		a. userName
		b. password
		c. token

	JSON Response key values:

		a. success 
		b. error 

   PENDING! - Need to check the creation of session IDs and maintaining these session IDs.



* Developed function for updating the password of an existing user of the application

	JSON Request key values:

		a. _id
		b. oldPassword (The old one)
		c. newPassword (The new one)
		d. token

	JSON Response key values:

		a. success 
		b. error 



* Developed function for deleting the account of the user from the server (App is responsible for deleting the token from shared preferences after receiving the response from the server)

	JSON Request key values:

		a. _id
		b. token

	JSON Response key values:

		a. success 
		b. error



* Developed logout function to check for Internet connectivity (App is responsible for deleting the token from shared preferences after receiving the response from the server)

	JSON Request key values: 

		a. token

	JSON Response key values:

		a. success
		b. error


* Implemented test implementation of JSON Web Tokens (Authentication + Sessions). To be expanded and tested...


*** STATUS CODES (RESPONSES AS RECEIVED BY THE APP) ***

* Token Authorization

	a. If success = "-1", then authorization has failed because either the token is damaged or your session has expired. (error = "Failed to authenticate token!")

	b. If success = "0", then the app has forgotten to send a token. (error = "No token provided!")

	c. You will not receive success as 1 if the authorization is successful. Your request will then be handled by server methods.

* Database-related operations

	a. Operation error will give:

		i. success = "-1"

		ii. error will be the error message given by MongoDB

	b. No errors but the record does not exist

		i. success = "0"

		ii. error = "Data not found!"

	c. No errors and the record exists

		i. success = "1"

		ii. error = null (not a string!!)


*** STATUS CODES (FOR AUDIT PURPOSES) ***

* status = "ALIVE" 	(Accounts which have been created)

* status = "DEAD"	(Accounts which have been deleted and will never be used again)

		
*** URLs ***

1. URI for register - /public/register 	(HTTP METHOD - POST)

2. URI for login - /public/login		(HTTP METHOD - POST)

3. URI for update - /secure/update		(HTTP METHOD - PUT)

4. URI for deletion - /secure/remove	(HTTP METHOD - DELETE)

5. URI for logout - /secure/logout 		(HTTP METHOD - GET)



Additionals -		

1. Improved simple logging

2. UID is automatically given a new value by an ID generator. Currently gives a new number as a new ID.

3. AWSAccessKeyId = AKIAJOE6W23TWYYAHU2Q

4. AWSSecretKey = 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


