portNo = 8888;
mongoDbUri = "mongodb://localhost:27017/master_server";
mongoLoginDetailsCollectionName = "login_details";
mongoMasterCollectionName = "master_collection";

registerNewLoginAccount = "/register";
login = "/login";
removeLoginAccount = "/remove";
updateLoginAccount = "/update";

successfulMessage = "/sc.html";
unsuccessfulMessage = "/unsc.html";

exports.portNo = portNo;
exports.mongoDbUri = mongoDbUri;
exports.mongoLoginDetailsCollectionName = mongoLoginDetailsCollectionName;
exports.mongoMasterCollectionName = mongoMasterCollectionName;

exports.registerNewLoginAccount = registerNewLoginAccount;
exports.login = login;
exports.removeLoginAccount = removeLoginAccount;
exports.updateLoginAccount = updateLoginAccount;

exports.successfulMessage = successfulMessage;
exports.unsuccessfulMessage = unsuccessfulMessage;