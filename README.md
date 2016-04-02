API KEY - 11858c3d-ec29-4773-85df-d771ef7c2c3c

Current project structure:


	-/app

	-----server_starter.js 						//Called by main.js. Contains functions to start the Express server and the MongoDB server.

	-----status_codes.js

	-----/routes

	----------index.js 							//Loads routes

	----------public_access.js 					//Routes which do not require any authentication

	----------secured_access.js 				//Routes which require authentication

	-----/interfaces

	----------mongodb_accounts_interface.js 	//Contains methods related to user accounts

	----------mongodb_card_interface.js 		//Contains methods related to card details

	----------amazon_s3_interface.js

	-----/uploads

	-/config
	
	-----config.js

	-----config.json

	-----environmentVariables.js

	-package.json
	
	-main.js 									//Contains functions calls to start the Express server and the MongoDB server


 
Work done till date - 



* Developed function for implementing the registration module on the server side for registering new users on the master and login collections. 

	HTTP header key values:

		a. Content-Type = application/json

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

	HTTP header key values:

		a. Content-Type = application/json

	JSON Request key values:

		a. userName
		b. password

	JSON Response key values:

		a. success 
		b. error 
		c. ID of the logged in user (_id)
		d. token



* Developed function for updating the password of an existing user of the application

	HTTP header key values:

		a. Content-Type = application/json
		b. x-access-token

	JSON Request key values:

		a. _id
		b. oldPassword (The old one)
		c. newPassword (The new one)

	JSON Response key values:

		a. success 
		b. error 



* Developed function for deleting the account of the user from the server (App is responsible for deleting the token from shared preferences after receiving the response from the server)

	HTTP header key values:

		a. x-access-token

	JSON Response key values:

		a. success 
		b. error



* Developed logout function to check for Internet connectivity (App is responsible for deleting the token from shared preferences after receiving the response from the server)

	HTTP header key values:

		a. x-access-token

	JSON Request key values: 

		a. Nothing

	JSON Response key values:

		a. success
		b. error



* Developed endpoints to save card details of the user. This endpoint is activated when a user clicks on the SAVE button after making changes to his/her card. The functions take care of profile picture and company logo uploads into Amazon S3.

	HTTP header key values:

		a. x-access-token
		b. Do not add Content-Type

	form-data Request key values:

		a. savedCardDetails (string; convert JSON to string using toString())
		b. profilePic (Profile picture image file)
		c. companyLogo (Company logo image file)

	savedCardDetails json format:

		a. _id
		b. firstName
    	c. lastName
    	d. company
    	e. designation
    	f. companyAddress
    	g. country
    	h. email
    	i. phoneNumber
    	j. templateId
    	k. changedOn
    	l. changedBy

	JSON Response key values:

		a. success
		b. error


* Developed function to implement backup saves in Amazon S3

	HTTP header key values:

		a. x-access-token
		b. Content-Type = application/json

	JSON body format:

		{
			"_id": "User's ID comes here",
			"cards": [{"_id": "Contact 1's ID", "circle": "Which circle he comes in"},
					  {"_id": "Contact 2's ID", "circle": "Which circle he comes in"}
					 ]

		}

		
* Developed endpoint to retrieve backup of a user's cardstack which includes his/her contact details along with the corresponding pictures.

	HTTP Request Header key values:

		a. x-access-token

	JSON Response body:

		Information is returned as a multipart form. The key values of images are:

		a. UID-profile	(Consider UID to be the UID of the contact)
		b. UID-company	(Consider UID to be the UID of the contact)
		c. cardStack  	(JSON)

		cardStack includes the following fields:

		a. _id
		b. firstName
    	c. lastName
    	d. company
    	e. designation
    	f. companyAddress
    	g. country
    	h. templateId
    	i. changedOn
    	j. changedBy
    	k. cards 			(An array of contacts of the users. Has the same contents, from a. to j., along with an additional field called 'circle')
    	l. failedRetrievals	(An array which consists of UIDs of contacts)

    	Please note that failedRetrievals will be filled ONLY in the case of unsuccessful retrieval of card details from MongoDB. IT WILL NOT ACKNOWLEDGE UNSUCCESSFUL RETRIEVAL OF IMAGES AS INFORMATION FROM MONGODB CAN STILL BE SUFFICIENT FOR INFO ABOUT THE PARTICULAR CONTACT!!! Image retrievals can fail due to lack of internet connection, faults at Amazon and the non-existence of an image if that contact hasn't uploaded any image.



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

1. URI for register - /public/register 			(HTTP METHOD - POST)

2. URI for login - /public/login				(HTTP METHOD - POST)

3. URI for update - /secure/update				(HTTP METHOD - PUT)

4. URI for deletion - /secure/remove			(HTTP METHOD - DELETE)

5. URI for logout - /secure/logout 				(HTTP METHOD - GET)

6. URI for saving card details - /secure/cards 	(HTTP METHOD - POST)

7. URI for saving backup - /secure/backup		(HTTP METHOD - POST)

8. URI for retrieving backups - /secure/cards 	(HTTP METHOD - GET)


*** Naming Convention for Files in Amazon S3 ***

1. Profile pics --> (UID of the user) + "-profile." + fileExtension

2. Company logo --> (UID of the user) + "-company." + fileExtension

3. Backup 		--> (UID of the user) + "-backup.json"



Additionals -		

1. Improved simple logging

2. UID is automatically given a new value by an ID generator. Currently gives a new number as a new ID.

3. AWSAccessKeyId = AKIAJOE6W23TWYYAHU2Q

4. AWSSecretKey = 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

