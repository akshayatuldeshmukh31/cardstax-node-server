portNo = 8888;
mongoDbUri = "mongodb://localhost:27017/loginDBTest1";
mongoCollectionName = "login_details";

registerDetails = "/registerDetails_post";
loginDetails = "/loginDetails_post";
removeDetails = "/removeDetails_post";
updateDetails = "/updateDetails_post";

successfulMessage = "/sc.html";
unsuccessfulMessage = "/unsc.html";

exports.portNo = portNo;
exports.mongoDbUri = mongoDbUri;
exports.mongoCollectionName = mongoCollectionName;

exports.registerDetails = registerDetails;
exports.loginDetails = loginDetails;
exports.removeDetails = removeDetails;
exports.updateDetails = updateDetails;

exports.successfulMessage = successfulMessage;
exports.unsuccessfulMessage = unsuccessfulMessage;