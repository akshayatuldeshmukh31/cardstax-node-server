var fs = require("fs");

function readSeq(callback){
fs.readFile('IdGenerator.txt', 'utf8', function(err,data){
		if(err){
			console.log(err);
		}
		else{
			console.log(data);
		}

		data = parseInt(data, 10);
		data += 1;
		fs.truncate('IdGenerator.txt', 0, function(){
		});

		fs.writeFile('IdGenerator.txt', data, function(err){
			if(err){
				console.log("Data insertion error: "+data+" --> "+"IdGenerator.txt");
			}
		});
		callback();
	});
}

readSeq(function(){
	console.log("done");
});