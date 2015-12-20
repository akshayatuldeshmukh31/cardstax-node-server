portNo = 8888;
mongoDbUri = "mongodb://localhost:27017/master_server";
mongoLoginDetailsCollectionName = "login_details";
mongoMasterCollectionName = "master_collection";

register = "/register";
login = "/process";
remove = "/remove";
update = "/update";

successfulMessage = "/sc.html";
unsuccessfulMessage = "/unsc.html";

exports.portNo = portNo;
exports.mongoDbUri = mongoDbUri;
exports.mongoLoginDetailsCollectionName = mongoLoginDetailsCollectionName;
exports.mongoMasterCollectionName = mongoMasterCollectionName;

exports.register = register;
exports.login = login;
exports.remove = remove;
exports.update = update;

exports.successfulMessage = successfulMessage;
exports.unsuccessfulMessage = unsuccessfulMessage;