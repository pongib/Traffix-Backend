var express = require('express');
var router = express.Router();
var gm = require('googlemaps');
var async = require('async');
var _ = require('underscore');
var BusStop = require('../traffix_model/busStop.js');


router.get('/bus-stop/:line', function (req, res){
	var busStopName = [];
	BusStop.find({ line: req.params.line })
	.exec(function (err, busStop){
		async.each(busStop, function (entry, callback){
			if(entry.name){
				busStopName.push(entry.name);
			}
			callback();
		}, function (err){			
			res.jsonp({
				result: busStopName.length,
				busStop: busStopName
			});	
		})
	});
});

router.get('/:preDestination/:busStopName/:line', function (req, res){
	var busStopNames = [], busStopName = "";
	async.waterfall([
		function (callback){				
			BusStop.find({ line: req.params.line })
			.exec(function (err, busStop){
				async.each(busStop, function (entry, callback){
					if(entry.name){
						busStopNames.push(entry.name);
					}
					callback();
				}, function (err){
					var index = _.indexOf(busStopNames, req.params.busStopName);
					if(index - req.params.preDestination >= 0){
						busStopName = busStopNames[index - req.params.preDestination];
						callback(null, busStopName);	
					}else {
						res.jsonp({
							status: "err",
							msg: "please select real predestination bus stop"
						});
					}						
				});
			});
		},
		function (busStopName, callback){
			BusStop.find({ name: busStopName })
			.exec(function (err, busStop){
				if(err) res.jsonp(err);

				if(busStop){
					var alarm = busStop[0].tag;
					callback(null, alarm);
				} 
			})
		}
	], function (err, result){
		res.jsonp({ alarm: result });
	});
});

module.exports = router;