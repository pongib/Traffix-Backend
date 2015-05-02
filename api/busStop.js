var express = require('express');
var mongoose = require('mongoose');
var gm = require('googlemaps');
var _ = require('underscore');
var async = require('async');
var router = express.Router();
var BusStop = require('../traffix_model/busStop.js');
var BusGeo = require('../traffix_model/busGeolocation');


// query all bus stop
router.get('/all', function (req, res){
	BusStop.find(function (err, busStop){
		if(err) res.send(err);

		res.send({
			result: busStop.length,
			data: busStop
		});
	});
});




router.post('/', function (req, res){
	console.log(req.body);
	

	var busStop = new BusStop({
	  name: req.body.name,
	  //place array directly on line [Number] and it work like magic.
	  line: req.body.line,
	  loc: {
		type: "Point",
		coordinates: [req.body.lng, req.body.lat]
	  }
	});

	busStop.save(function (err){
		if (err) res.send(err);

		res.json({
			msg: 'save to collection complete',
			data: busStop
		});
	})
});

router.delete('/:id', function (req, res){
	BusStop.findByIdAndRemove(req.params.id, function (err){
		if(err) res.send(err);

		res.json({
			msg: 'Delete complete with id '+req.params.id
		});
	});
});

// -------------END Manage Database -----------------------//

//query bus stop with line
router.get('/:busline', function (req, res){
	BusStop
	.find({ line: req.params.busline })
	.exec(function (err, busStop){
		if(err) res.send(err);

		if(busStop.length != 0){
			res.jsonp({
				status: 'OK',
				busstop: busStop
			});
		}else {
			res.jsonp({
				status: 'NO RESULT',
				msg: 'Not found bus stop'
			});
		}			
	});
});

router.get('/near/destination/:origin/:destination', function (req, res){	
	async.waterfall([
		function (callback){
			gm.geocode(req.params.destination, function (err, dest){
				if(dest){
					var destination = dest.results[0].geometry.location.lat+','+dest.results[0].geometry.location.lng;
				}else {
					res.jsonp({
						status: 'ERROR',
						msg: 'can not convert destination to geo location'
					});
				}
				callback(null, destination);
			});			
		},
		function (geolocation, callback){
			var departureNow = Math.floor((new Date()).getTime()/1000);
			var destBusStopGeo = [], busLine = [];
			gm.directions(req.params.origin, geolocation, function (err, data){
				// res.send(data.routes);				
				async.each(data.routes, function (entries, callback){
					var endDest = {};
					entries.legs[0].steps.some(function(entry){
						if(entry.travel_mode == 'TRANSIT'){
							endDest.line = entry.transit_details.line.short_name;
							endDest.geolocation = entry.end_location;
							destBusStopGeo.push(endDest);
							busLine.push(endDest.line);
							return true; //want to break use some return true use every return false
						}else return false;
					});
					callback();
				}, function (err){
					line = _.sortBy(_.uniq(busLine, false), function (num){
						return num;
					}).map(Number);
					// res.send(destBusStopGeo);
					callback(null, destBusStopGeo, line);
				});
			}, 'false', 'transit', null, true, null, null, null, departureNow, null, 'th')
		},
		function (destBusStopGeo, line, callback){
			var busArr =  [];
			async.each(destBusStopGeo, function (entry, callback){
				var destBusStopGeo = {
					line: entry.line,
					dest_geolocation: entry.geolocation
				};
				BusStop.find().where('loc').near({
					center: {
						coordinates: [parseFloat(entry.geolocation.lng), parseFloat(entry.geolocation.lat)],
						type: 'Point'
					},
					maxDistance: 30,
					spherical: true
				}).exec(function (err, result){
					if(err) res.jsonp(err);
					if(result.length >= 1){
						destBusStopGeo.name = result[0].name;
						destBusStopGeo.tag = result[0]._id;
						busArr.push(destBusStopGeo);
					}else {
						destBusStopGeo.name = "no bus stop result"
						busArr.push(destBusStopGeo);
					}
					callback();				
				});
			}, function (err){
				callback(null, line, busArr);				
			});	
		}
	], function(err, line, busArr){
		res.jsonp({
			line: line,
			data: busArr					
		});
	});
});

//find near bus stop
router.get('/findnear/:origin/:distance/:line', function (req, res){		
	var origin = req.params.origin.split(',');
	var line = req.params.line.split(',');
	BusStop.find({ line: { $in : line }}).where('loc').near({
		center: { 
			coordinates: [parseFloat(origin[1]), parseFloat(origin[0])], 
			type: 'Point' 
		},
		maxDistance: parseInt(req.params.distance),
		spherical: true
	}).exec(function (err, busStop){
		if(err) res.jsonp(err);	
		res.jsonp({
			result: busStop.length,
			line: line,
			data: busStop 
		});
	});								
});
//find near bus stop
// router.get('/findnear/:origin/:destination/:distance', function (req, res){
// 	var busLine = [], geo = []; 
// 	var departureNow = Math.floor((new Date()).getTime()/1000);
// 	gm.geocode(req.params.destination, function (err, dest){
// 	if(err) res.send(err);
// 	if(!dest) res.json({"msg": "can not convert geo please fill correct destination"})
// 	else if(dest){
// 	 // console.log(dest.results[0].geometry.location);
// 	var destination = dest.results[0].geometry.location.lat+','+dest.results[0].geometry.location.lng;
// 	// console.log("destination "+destination +" type "+ typeof(destination) + " origin = "+req.params.origin+" type "+ typeof(req.params.origin) );
// 	// to convert string line into array of number of busline
// 	// var line = req.params.line.split(',').map(Number); 
// 	//console.log(destination);
// 		gm.directions(req.params.origin, destination, function(err, data){
// 			async.waterfall([ 
// 				function (callback){
// 					data.routes.forEach(function (entries){
// 						entries.legs[0].steps.some(function(entry){
// 							if(entry.travel_mode == 'TRANSIT'){
// 								busLine.push(entry.transit_details.line.short_name);
// 								geo.push(entry.end_location);								
// 								return true; //want to break use some return true use every return false
// 							}else return false;
// 						});
// 					});

					
// 					// res.send(geo);
// 					// unique value in array and sort asc 
// 					var line = _.sortBy(_.uniq(busLine, false), function (num){
// 						return num;
// 					}).map(Number);
// 					console.log("line = "+line);
// 					callback(null, line); 
// 				},
// 				function (line, callback){
// 					var origin = req.params.origin.split(',');
// 					BusStop.find({ line: { $in : line }}).where('loc').near({
// 						center: { 
// 							coordinates: [parseFloat(origin[1]), parseFloat(origin[0])], 
// 							type: 'Point' 
// 						},
// 						maxDistance: parseInt(req.params.distance),
// 						spherical: true
// 					}).exec(function (err, busStop){
// 						if(err) res.send(err);	
						
// 						callback(null, busStop, line);
// 					});				
// 				}
// 			], function (err, result, lineSearch){		
// 					res.jsonp({
// 						result: result.length,
// 						line: lineSearch,
// 						data: result 
// 					});
// 			});
// 		}, 'false', 'transit', null, true, null, null, null, departureNow, null, 'th');
// 	  }	
// 	}, null, null, 'th', 'th');
// });


router.get('/linetogo/:destination', function (req, res){
	gm.geocode(req.params.destination, function (err, data){
		if(err) res.send(err);
		res.send(data.results[0].geometry.location);
	});
});

// find fill bus stop and estimate
// need inbound or outbound condition 
router.get('/findfill/:origin/:line/:distance', function (req, res){
	var origin = req.params.origin.split(',');
	async.waterfall([
		function (callback){
			BusStop.find({ line: req.params.line }).where('loc').near({
				center: { 
					coordinates: [parseFloat(origin[1]), parseFloat(origin[0])], 
					type: 'Point' 
				},
				maxDistance: parseInt(req.params.distance),
				spherical: true
			}).exec(function (err, busStop){
				if(err) res.jsonp(err);

				callback(null, busStop);
			});			
		},
		function (busStop, callback){
			var _dest = "", temp = "", tag = [];
			async.each(busStop, function (entry, callback){
				//make coordinates to string and split it into array of string
				temp = String(entry.loc.coordinates).split(',');
				// make bus stop string and set last bus stop with no '|'
				if(entry != busStop[busStop.length - 1]){
					_dest += temp[1]+','+temp[0]+'|';
				}else _dest += temp[1]+','+temp[0];

				if(entry._id){
					tag.push(entry._id);
				}

					
				callback();
				// console.log(_dest);
			}, function (err) {			
				callback(null, _dest, tag);
			});
		}
		,function (busStop, tags, callback){
			console.log(tags);
			var busStopJson = []; 
			BusGeo.find().and([{ line: req.params.line }, { tag : { $nin : tags }}])
			.where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
			.exec(function (err, first){
				if(err) res.jsonp(err);
				// res.send(first);
				if(first.length >= 1){
					var currentBus = first[0].loc.coordinates[1]+','+first[0].loc.coordinates[0];
					console.log("currentBus = "+currentBus+" busStop = "+busStop);

					busStop.split('|').forEach(function (entry){
						busStopJson.push(JSON.parse('{ "lat": '+entry.split(',')[0]+', "lng": '+entry.split(',')[1]+'}'));
					});
					// res.send(result);	
					gm.distance(
					currentBus, //origin
					busStop,  //destination
					function (err, estimate){
					  if(err) res.jsonp("x = "+err);
					  // res.send(estimate); 
					  if(estimate.status == "OK"){
					  	var _estimate = {
						  	status: estimate.status,
						  	line: parseInt(req.params.line),
						  	origin: currentBus,
						  	busstop: busStopJson,					  	
						  	estimate: estimate.rows[0].elements
					  	};
						callback(null, _estimate);
					  }else res.jsonp(estimate);				  
					}, false, "transit");
				}				
			});
		}
	], 	function (err, results){
		if (err) res.jsonp(err);
		
		res.jsonp(results);
	});
});



// find nearest bus stop
router.get('/nearest/:position', function (req, res){
	var position = req.params.position.split(','), line = [];
	BusStop.find().where('loc').near({
		center: {
			coordinates: [parseFloat(position[1]), parseFloat(position[0])],
			type: 'Point'
		},
		maxDistance: 100,
		spherical: true
	}).exec(function (err, result){
		if(err) res.jsonp(err);		
		res.jsonp(result);	
		// async.each(result, function (entry, callback){
		// 	if(entry.line){
		// 		async.each(entry.line, function (index, callback){
		// 			line.push(index);
		// 			callback();
		// 		}, function (err){
		// 			callback();
		// 		});
		// 	}							
		// }, function (err){
		// 	res.json({
		// 	  status: "Line",
		// 	  line: _.uniq(line)
		// 	});
		// });
	});
}); 

module.exports = router;