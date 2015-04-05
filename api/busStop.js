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


//find near bus stop
router.get('/findnear/:origin/:destination/:distance', function (req, res){
	var busLine = []; 
	var departureNow = Math.floor((new Date()).getTime()/1000);
	gm.geocode(req.params.destination, function (err, dest){
	if(err) res.send(err)
	if(dest.status == "ZERO_RESULTS") res.json({"msg": "can not convert geo please fill correct destination"})
	else {
	 // console.log(dest.results[0].geometry.location);
	var destination = dest.results[0].geometry.location.lat+','+dest.results[0].geometry.location.lng;
	// console.log("destination "+destination +" type "+ typeof(destination) + " origin = "+req.params.origin+" type "+ typeof(req.params.origin) );
	// to convert string line into array of number of busline
	// var line = req.params.line.split(',').map(Number); 
	// console.log(destination);
		gm.directions(req.params.origin, destination, function(err, data){

			async.waterfall([
				function (callback){
					data.routes.forEach(function (entries){
						entries.legs[0].steps.some(function(entry){
							if(entry.travel_mode == 'TRANSIT'){
								busLine.push(entry.transit_details.line.short_name);
								return true; //want to break use some return true use every return false
							}else return false;
						});
					});

					// unique value in array and sort asc 
					var line = _.sortBy(_.uniq(busLine, false), function (num){
						return num;
					}).map(Number);
					console.log("line = "+line);
					callback(null, line); 
				},
				function (line, callback){
					var origin = req.params.origin.split(',');
					BusStop.find({ line: { $in : line }}).where('loc').near({
						center: { 
							coordinates: [parseFloat(origin[1]), parseFloat(origin[0])], 
							type: 'Point' 
						},
						maxDistance: parseInt(req.params.distance),
						spherical: true
					}).exec(function (err, busStop){
						if(err) res.send(err);	
						
						callback(null, busStop, line);
					});				
				}
			], function (err, result, lineSearch){		
					res.jsonp({
						result: result.length,
						line: lineSearch,
						data: result 
					});
			});
		}, 'false', 'transit', null, true, null, null, null, departureNow, null, 'th');
	  }	
	});
});


router.get('/linetogo/:destination', function (req, res){
	gm.geocode(req.params.destination, function (err, data){
		if(err) res.send(err);
		res.send(data.results[0].geometry.location);
	});
});

// find fill bus stop and estimate
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
				if(err) res.send(err);
	
				callback(null, busStop);
			});			
		},
		function (busStop, callback){
			var _dest = "", temp = "", tag = [];
			async.each(busStop, function (entry, callback){
				//make coordinates to string and split it into arrat of string
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
				if(err) res.send(err);
				res.send(first);
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
				  if(err) res.send("x = "+err);
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
			});
		}
	], 	function (err, results){
		if (err) res.send(err);
		
		res.jsonp(results);
	});
});



// find nearest bus stop
router.get('/nearest/:position', function (req, res){
	var position = req.params.position.split(',');
	BusStop.find().where('loc').near({
		center: {
			coordinates: [parseFloat(position[1]), parseFloat(position[0])],
			type: 'Point'
		},
		maxDistance: 5,
		spherical: true
	}).exec(function (err, result){
		if(err) res.send(err);		
		res.send(result);	
	});
}); 

module.exports = router;