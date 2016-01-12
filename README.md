Current project structure:


	-app

	-----server_starter.js 						//Called by main.js. Contains functions to start the Express server and the MongoDB server.

	-----status_codes.js

	-----routes

	----------index.js 							//Loads routes

	----------public_access.js

	----------secured_access.js

	-----interfaces

	----------mongodb_accounts_interface.js 	//Contains methods related to user accounts

	----------mongodb_card_interface.js 		//Contains methods related to card details

	----------amazons3.js

	-config
	
	-----database.js

	-----cloud.js

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

		a. success (String value of 0 or 1)
		b. error (null if success is 1)
		c. ID of the newly registered user (_id) - To be stored within the application for future correspondence with the server 



* Developed function for logging in an existing user of the application

	JSON Request key values:

		a. userName
		b. password

	JSON Response key values:

		a. Success (String value of 0 or 1)
		b. Error (null if success is 1)

   PENDING! - Need to check the creation of session IDs and maintaining these session IDs.



* Developed function for updating the password of an existing user of the application

	JSON Request key values:

		a. _id
		b. oldPassword (The old one)
		c. newPassword (The new one)

	JSON Response key values:

		a. Success (String value of 0 or 1)
		b. Error (null if success is 1)



* Developed function for deleting the account of the user from the server

	JSON Request key values:

		a. _id

	JSON Response key values:

		a. Success (String value of 0 or 1)
		b. Error (null if success is 1)



*Developed logout function to check for Internet connectivity

	JSON Request key values: 

		None required

	JSON Response key values:

		a. Success (String value of 0 or 1)

		
*** NOTE ***

1. URI for register - /register (HTTP METHOD - POST)

2. URI for login - /logging		(HTTP METHOD - POST)

3. URI for update - /update		(HTTP METHOD - PUT)

4. URI for deletion - /remove	(HTTP METHOD - DELETE)

5. URI for logout - /logout 	(HTTP METHOD - GET)



Additionals -		

1. Improved simple logging

2. UID is automatically given a new value by an ID generator. Currently gives a new number as a new ID.

3. AWSAccessKeyId = AKIAJOE6W23TWYYAHU2Q

4. AWSSecretKey = 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