Work done till date - 

(STATUS - UPDATED ON 22 DEC 2015!!!)
1. Developed function for implementing the registration module on the server side for registering new users on the master and login collections. 

	JSON Request key values:
		a. First_name
		b. Last_name
		c. userName
		d. password
		e. channel

	JSON Response key values:
		a. Success (String value of 0 or 1)
		b. Error (Null if success is 1)
		c. ID of the newly registered user (_id) - To be stored within the application for future correspondence with the server 

(STATUS - NO CHANGE SINCE LAST COMMIT)
2. Developed function for logging in an existing user of the application

	JSON Request key values:
		a. userName
		b. password

	JSON Response key values:
		a. Success (String value of 0 or 1)
		b. Error (Null if success is 1)

   PENDING! - Need to check the creation of session IDs and maintaining these session IDs.

(STATUS - INCLUDED ON 22 DEC 2015)
3. Developed function for updating the password of an existing user of the application

	JSON Request key values:
		a. _id
		b. oldPassword (The old one)
		c. newPassword (The new one)

	JSON Response key values:
		a. Success (String value of 0 or 1)
		b. Error (Null if success is 1)

*** NOTE ***
1. URI for register - /register
2. URI for login - /login
3. URI for update - /update


Additionals -		
1. Improved simple logging
2. UID is automatically given a new value by an ID generator. Currently gives a new number as a new ID.