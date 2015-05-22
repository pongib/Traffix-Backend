var gm 		= 	require('googlemaps');
var _ 		= 	require('underscore');
var fs 		= 	require('fs');
var async 	= 	require('async');


exports.print = function (req, res){
	console.log("x");
	res.send("x");
};

exports.clean = function (req, res){
	fs.readFile('./dataJson/raw/busStopNameWithLineAndGeo.json', function (err, data){
		var busInfo = JSON.parse(data);
		var busInfoNull = _.filter(busInfo, function (obj){
			if(obj.location.lat != null && obj.location.lng != null){
				return obj;
			}
		});
		fs.writeFile('./dataJson/clean/busStopNameWithLineAndGeo.json', JSON.stringify(busInfoNull, null, 4), function (err){
			console.log('write complete!');
			res.send({result: busInfoNull.length});
		});
	});
};