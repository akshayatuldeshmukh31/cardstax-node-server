Work done till date - 



(STATUS - NO CHANGE SINCE LAST COMMIT)

* Developed function for implementing the registration module on the server side for registering new users on the master and login collections. 

	JSON Request key values:

		a. First_name
		b. Last_name
		c. userName
		d. password
		e. channel

	JSON Response key values:

		a. Success (String value of 0 or 1)
		b. Error (null if success is 1)
		c. ID of the newly registered user (_id) - To be stored within the application for future correspondence with the server 



(STATUS - NO CHANGE SINCE LAST COMMIT)

* Developed function for logging in an existing user of the application

	JSON Request key values:

		a. userName
		b. password

	JSON Response key values:

		a. Success (String value of 0 or 1)
		b. Error (null if success is 1)

   PENDING! - Need to check the creation of session IDs and maintaining these session IDs.



(STATUS - NO CHANGE SINCE LAST COMMIT)

* Developed function for updating the password of an existing user of the application

	JSON Request key values:

		a. _id
		b. oldPassword (The old one)
		c. newPassword (The new one)

	JSON Response key values:

		a. Success (String value of 0 or 1)
		b. Error (null if success is 1)


(STATUS - INCLUDED IN THIS COMMIT)

* Developed function for deleting the account of the user from the server

	JSON Request key values:

		a. _id

	JSON Response key values:

		a. Success (String value of 0 or 1)
		b. Error (null if success is 1)


*Developed logout function to check for Internet connectivity

	JSON Request key values: None required

	JSON Response key values:

		a. Success (String value of 0 or 1)

		
*** NOTE ***

1. URI for register - /register (HTTP METHOD - POST)

2. URI for login - /logging		(HTTP METHOD - POST)

3. URI for update - /update		(HTTP METHOD - PUT)

4. URI for deletion - /remove	(HTTP METHOD - DELETE)



Additionals -		

1. Improved simple logging

2. UID is automatically given a new value by an ID generator. Currently gives a new number as a new ID.