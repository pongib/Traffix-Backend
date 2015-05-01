var express = require('express');
var mongoose = require('mongoose');
var gm = require('googlemaps');
var _ = require('underscore');
var fs = require('fs');
var async = require('async');
var router = express.Router();
var BusStop = require('../traffix_model/busStop.js');
var BusGeo = require('../traffix_model/busGeolocation');


router.get('/radar/:geo/:radius', function (req, res){
	var options = {
		location: req.params.geo,
		radius: req.params.radius,
		types: 'bus_station',
		language: 'th'
	};
	var id = [], geolocation = [], details = {};
	gm.radarPlaces(options, function (err, busStops){
		if(err) res.send("ERR "+err);
		async.waterfall([
			function (callback){
				async.each(busStops.results, function (busStop, callback){
					if(busStop.place_id){
						id.push(busStop.place_id);							
						callback();
					}				
				}, function (err){
					 // res.send(id);
					callback(null, id);
				})				
			},
			function (id, callback){			
				async.each(id, function (entry, callback){							
					gm.placeDetails(entry, 'th', function (err, details){						
						if(err) res.send("err"+err);
						if(details){
							detail = {
								location: details.result.geometry.location,
								name: details.result.name,
								place_id: details.result.place_id
							};
							geolocation.push(detail);					
							callback();	
						}						
					});								
				}, function (err){					
					callback(null, geolocation);
				});	
			},
			function (geolocation, callback){
				var temp = null,  busStopDetails = [];
				fs.readFile('output.json', function(err, data){
					temp = JSON.parse(data);
					async.each(geolocation, function (element, callback){
						var line = [];
						var busStopDetail = {
							location: element.location,
							name: element.name,
							place_id: element.place_id
						};
						async.each(temp, function (entry, callback){
							// if(element.name.search("ซอย") != -1){
							// 		element.name.replace('ซอย','');
							// 	if(entry.busstop.search(element.name) != -1){
							// 		line.push(entry.line);
							// 		console.log(line);
							// 	}
							// }

							var name = element.name;
							if(name.search("ซอย") == 0 && !isNaN(name.charAt(name.length - 1))){
								var temp = name.replace("ซอย", '').split(" ");
								var newName = temp[0] + " ซอย "+ temp[1];

								if(entry.busstop.search(newName) != -1){
									line.push(entry.line);
								}
							}else {
								if(entry.busstop.search(name) != -1){
									line.push(entry.line);
								}
							}							
							callback();
						}, function (err){							
						 	busStopDetail.line = _.sortBy(line, function (num){
								return num;
							});	
							busStopDetails.push(busStopDetail);
							// res.send(_.sortBy(line, function (num){
							// 	return num;
							// }));
						});
					callback();
					}, function (err){
						callback(null, busStopDetails);
					});
				});
			}				
		], function (err, result){
			if(err){
				res.send(err);
			}else {
				console.log("send");
				res.send(result);
			}
			
		});
			
	});
});

router.get('/details/:id/:language', function (req, res){
	gm.placeDetails(req.params.id, req.params.language, function (err, details){
		if(err) res.send(err);

		res.send(details);
	})
});

router.get('/search/:query/:types', function (req, res){
	var options = {
		query: req.params.query,
		types: req.params.types
	};
	gm.placeName(options, function (err, details){
		if(err) res.send(err);

		res.send(details);
	})
});

module.exports = router; 