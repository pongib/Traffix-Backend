var gm 		= 	require('googlemaps');
var _ 		= 	require('underscore');
var fs 		= 	require('fs');
var async 	= 	require('async');
var request =   require('request'); 
var crypto  =	require('crypto'); 	
var BusTest = 	require('../traffix_model/busTest');
var BusStop =  	require('../traffix_model/busStop');
var BusGeo = require('../traffix_model/busGeolocation');

exports.print = function (req, res){
	console.log("x");
	res.send("x");
};

exports.findFill = function (req, res){
	
	// var origin = req.params.origin.split(',');
	async.waterfall([
		function (callback){
			BusStop.find({ name: req.params.origin })
			.exec(function (err, busStop){
				if(err){
					res.jsonp({
						status: 'ERROR',
						msg: 'cannot find bus stop result and ' + err
					});
				}
				if(busStop){
					if(busStop.length >= 1){
						var originGeo = busStop[0].loc.coordinates;
						var tag = busStop[0].tag;
						// res.send(originGeo);
						callback(null, originGeo, tag);
					}else {
						res.jsonp({
							status: 'ERROR',
							msg: 'cannot find bus stop result'
						});
					}
				}				
			});			
		},
		// function (busStop, callback){
		// 	var _dest = "", temp = "", tag = [];
		// 	async.each(busStop, function (entry, callback){
		// 		//make coordinates to string and split it into array of string
		// 		temp = String(entry.loc.coordinates).split(',');
		// 		// make bus stop string and set last bus stop with no '|'
		// 		if(entry != busStop[busStop.length - 1]){
		// 			_dest += temp[1]+','+temp[0]+'|';
		// 		}else _dest += temp[1]+','+temp[0];

		// 		if(entry.tag){
		// 			tag.push(entry.tag);
		// 		}

					
		// 		callback();
		// 		// console.log(_dest);
		// 	}, function (err) {			
		// 		callback(null, _dest, tag);
		// 	});
		// }
		function (busStop, tags, callback){
			console.log(tags);

			var busStopJson = [], busStopGeo = busStop[1]+','+busStop[0]; 
			BusGeo.find().and([{ line: req.params.line }, { tag : { $ne : tags }}])
			.where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
			.exec(function (err, first){
				if(err) {
					res.jsonp({
						status: 'ERROR',
						msg: 'cannot find bus geo result and ' + err
					});
				}
				if(first.length >= 1){
					var currentBus = first[0].loc.coordinates[1]+','+first[0].loc.coordinates[0];
					console.log("currentBus = "+currentBus+" busStopGeo = "+busStopGeo);

					// busStop.split('|').forEach(function (entry){
					// 	busStopJson.push(JSON.parse('{ "lat": '+entry.split(',')[0]+', "lng": '+entry.split(',')[1]+'}'));
					// });
					// res.send(result);	
					gm.distance(
					currentBus, //origin
					busStopGeo,  //destination is bus stip
					function (err, estimate){
					  if(err) {
					  	res.jsonp({
							status: 'ERROR',
							msg: 'cannot find bus stop result and ' + err
						});				
					  }
					  // res.send(estimate); 
					  if(estimate){
					  	if(estimate.status == "OK"){
						  	var _estimate = {
							  	status: estimate.status,
							  	line: parseInt(req.params.line),
							  	origin: currentBus,
							  	busstop: busStopGeo,					  	
							  	estimate: estimate.rows[0].elements
						  	};
							callback(null, _estimate);
						 }else res.jsonp(estimate);		
					  }else {
					  	res.jsonp({
							status: 'ERROR',
							msg: 'cannot estimate the time'
						});		
					  }
					}, false, "transit");
				}				
			});
		}
	], 	function (err, results){
		if (err) res.jsonp(err);
		
		res.jsonp(results);
	});
}

exports.genTag = function (req, res){
	async.waterfall([
	    function (callback){
	      	fs.readFile('./dataJson/clean/busStopNoSpace.json', function (err, data){
				var busInfo = JSON.parse(data);
				callback(null, busInfo);
			});
	    },	  
	    function (busInfo, callback){
	    	var arrBus = [];	    	
	   		async.eachSeries(busInfo, function (item, callback) {
	   			var objBus = item;
	   			crypto.randomBytes(16, function (err, data){
	    			if(err) throw err;
		    		if(data){
		    			objBus.tag = data.toString('hex');
		    			arrBus.push(objBus);
		    			callback();
		    		}
	    		});
	   		}, function (err){
	   			callback(null, arrBus);
	   		});	   		   
	    },
	    function (arrBus, callback){
	    	fs.writeFile('./dataJson/clean/busStopNoSpaceWithTag.json', JSON.stringify(arrBus, null, 4), function (err){
				console.log('write complete!');
				callback(null, arrBus);
			});
	    }
	],function (err, result){
	 	res.send({ 
	  		result: result.length,
	  		data: result
	  	});
	});
};


exports.clearLastSpace = function (req, res){
	async.waterfall([
		function (callback){
			fs.readFile('./dataJson/clean/busStopNameWithLineAndGeoPlusGeoBustop.json', function (err, data){
				var busInfo = JSON.parse(data);
				callback(null, busInfo);
			});
		},
		function (busInfo, callback){
			var arrBus = [], num = [];
			async.eachSeries(busInfo, function (item, callback) {
				var Obj = item;
				if(item.name.charAt(item.name.length - 1) == ' '){
					num.push(item.name);
					Obj.name = item.name.slice(0 , -1);
					arrBus.push(Obj);
				}else {
					arrBus.push(Obj);
				}
				callback();
			}, function (err){
				callback(null, arrBus, num);		
			});
		}
	],function (err, arrBus, num){
		fs.writeFile('./dataJson/clean/busStopNoSpace.json', JSON.stringify(arrBus, null, 4), function (err){
			console.log('write complete!');
			res.send({ 
		  		result: arrBus.length,
		  		numAmount: num.length,
		  		num: num,
		  		data: arrBus
		  	});
		});

	  	
	});
};

exports.saveBusInfoToMongoReal = function (req, res){
	async.waterfall([
	  function (callback){
	    fs.readFile('./dataJson/clean/busStopNoSpaceWithTag.json', function (err, data){
	    	var busInfo = JSON.parse(data);
	    	// res.send(busInfo);
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
			  tag: item.tag,
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