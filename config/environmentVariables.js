portNo = process.env.PORTNO || 8800;
database = process.env.MONGOLAB_URI || "mongodb://127.0.0.1:27017/master_server";
mongoLoginDetailsCollectionName = "login_details";
mongoMasterCollectionName = "master_collection";

registerNewLoginAccount = "/register";
login = "/login";
removeLoginAccount = "/remove";
updateLoginAccount = "/update";
logout = "/logout";

userCardOperation = "card";

//AWS related variables
profilePictureBucket = "mp-profile-picture";

exports.portNo = portNo;
exports.database = database;
exports.mongoLoginDetailsCollectionName = mongoLoginDetailsCollectionName;
exports.mongoMasterCollectionName = mongoMasterCollectionName;

exports.registerNewLoginAccount = registerNewLoginAccount;
exports.login = login;
exports.removeLoginAccount = removeLoginAccount;
exports.updateLoginAccount = updateLoginAccount;
exports.logout = logout;

exports.userCardOperation = userCardOperation;

//Export of AWS related variables
exports.profilePictureBucket = profilePictureBucket;