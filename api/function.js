var gm 		= 	require('googlemaps');
var _ 		= 	require('underscore');
var fs 		= 	require('fs');
var async 	= 	require('async');
var request =   require('request'); 
var BusTest = 	require('../traffix_model/busTest');
var BusStop =  	require('../traffix_model/busStop');

exports.print = function (req, res){
	console.log("x");
	res.send("x");
};


exports.saveBusInfoToMongoReal = function (req, res){
	async.waterfall([
	  function (callback){
	    fs.readFile('./dataJson/clean/busStopNameWithLineAndGeoPlusGeoBustop.json', function (err, data){
	    	var busInfo = JSON.parse(data);
	    	// res.send(busInfo.length);
	    	callback(null, busInfo);
	    });
	  },
	  function (busInfo, callback){
	  	var url = "http://localhost:9000/api/bus-stop/test/save";
	  	async.each(busInfo, function(item, callback) {		  		
	  		// console.log("count "+busInfo.indexOf(item) + 1 + '\n');  		
			// request.post({ url: url, form: item }, function (err, res, data){
			// 	if(err){
			// 		callback(err);
			// 	}

			// 	if(!err && res.statusCode == 200){					
			// 		// console.log(data + '\n');
			// 		callback();
			// 	}

			// });	   

			var busStop = new BusStop({
			  name: item.name,
			  //place array directly on line [Number] and it work like magic.
			  line: item.line,
			  loc: {
				type: "Point",
				coordinates: [item.bus_station_location.lng, item.bus_station_location.lat]
			  }
			});

			busStop.save(function (err){
				if (err) callback(err);
				console.log('save complete');		
				callback();					
			});   
	  	}, function (err){
	  		if(err){
	  			res.send(err);
	  		}
	  		callback(null, 'write to data base complete');
	  	});
	  }
	],function (err, result){
	 	res.send({status : result});
	});
}

exports.saveBusInfoToMongoTest = function (req, res){
	async.waterfall([
	  function (callback){
	    fs.readFile('./dataJson/clean/busStopNameWithLineAndGeoPlusGeoBustop.json', function (err, data){
	    	var busInfo = JSON.parse(data);
	    	// res.send(busInfo.length);
	    	callback(null, busInfo);
	    });
	  },
	  function (busInfo, callback){
	  	var url = "http://localhost:9000/api/bus-stop/test/save";
	  	async.each(busInfo, function(item, callback) {		  		
	  		// console.log("count "+busInfo.indexOf(item) + 1 + '\n');  		
			// request.post({ url: url, form: item }, function (err, res, data){
			// 	if(err){
			// 		callback(err);
			// 	}

			// 	if(!err && res.statusCode == 200){					
			// 		// console.log(data + '\n');
			// 		callback();
			// 	}

			// });	   

			var busTest = new BusTest({
			  name: item.name,
			  //place array directly on line [Number] and it work like magic.
			  line: item.line,
			  loc: {
				type: "Point",
				coordinates: [item.bus_station_location.lng, item.bus_station_location.lat]
			  }
			});

			busTest.save(function (err){
				if (err) callback(err);
				console.log('save complete');		
				callback();					
			});   
	  	}, function (err){
	  		if(err){
	  			res.send(err);
	  		}
	  		callback(null, 'write to data base complete');
	  	});
	  }
	],function (err, result){
	 	res.send({status : result});
	});
}



exports.cleanPlus = function (req, res){
	fs.readFile('./dataJson/raw/busStopNameWithLineAndGeoPlusGeoBustop.json', function (err, data){
		var busInfo = JSON.parse(data);
		var busInfoNull = _.filter(busInfo, function (obj){
			if(obj.bus_station_location.lat != null && obj.bus_station_location.lng != null){
				return obj;
			}
		});
		fs.writeFile('./dataJson/clean/busStopNameWithLineAndGeoPlusGeoBustop.json', JSON.stringify(busInfoNull, null, 4), function (err){
			console.log('write complete!');
			res.send({result: busInfoNull.length});
		});
	});
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

exports.nearby = function (req, res){
	async.waterfall([
	  function (callback){
	  	async.parallel([
	  	  function (callback){
	  	    fs.readFile('./dataJson/clean/busStopNameWithLineAndGeo.json', function (err, data){
		    	var busInfo = JSON.parse(data);
		    	res.send(busInfo.length);
		    	var temp = _.findWhere(busInfo, { name: "การประปาส่วนภูมิภาค" });						
				var sliceBusInfo = busInfo.slice(busInfo.indexOf(temp) + 1);
				res.send(sliceBusInfo);
		    	// callback(null, sliceBusInfo);
	   		});	  	    
	  	  },
	  	  function (callback){
	  		 fs.readFile('./dataJson/raw/busStopNameWithLineAndGeoPlusGeoBustop.json', function (err, data){
		    	var busInfo = JSON.parse(data);
		    	callback(null, busInfo);
		    });	  	  	    
	  	  }
	  	],function (err, result){
	  	  	callback(null, result[0], result[1])
	  	});	   	 
	  },
	  function (arrGeo, arrPlusGeo, callback){
		async.eachSeries(arrGeo, function(item, callback) {
			console.log("count "+(arrGeo.indexOf(item) + 1));
			var options = {
				location: item.location.lat +','+ item.location.lng,
				types: 'bus_station',
				language: 'th',
				rankby: 'distance'
			};
			var objBus = {
				name: item.name,
				line: item.line,
				place_location: item.location 
			}
			gm.nearby(options, function (err, data){
				if(err) {
					console.log("status error "+ err);
					callback(err);
				}
				if(data){
					if(data.status == 'OVER_QUERY_LIMIT'){
						callback('over limit');
					}else if(data.status == 'OK'){
						objBus.bus_station_location = data.results[0].geometry.location;					
						arrPlusGeo.push(objBus);	
						callback();	
					}else if(data.status == 'ZERO_RESULTS') {
						objBus.bus_station_location = { lat: null, lng: null };						
						arrPlusGeo.push(objBus);	
						callback();	
					}					
				}				
			});
		}, function (err){
			if(err){
				console.log("Err is "+err);
				callback(null, arrPlusGeo);			
			}else {
				callback(null, arrPlusGeo);
			}			
		});	    
	  }, 
	  function (arrPlusGeo, callback){
	  	fs.writeFile('./dataJson/raw/busStopNameWithLineAndGeoPlusGeoBustop.json', JSON.stringify(arrPlusGeo, null, 4), function (err){
			console.log('write complete! with '+arrPlusGeo.length+ ' result');
			callback(null, arrPlusGeo);
		});
	  }
	],function (err, result){
		res.send({ result: result.length });
	});
};