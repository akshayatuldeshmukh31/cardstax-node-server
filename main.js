//Main program to begin Express and MongoDB servers

var mongo = require("./mongo_starter");
var expressServer = require("./express_name_server");

mongo.startMongoServer();
expressServer.startExpressServer();