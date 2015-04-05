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
			res.json({
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
					}else {
						res.json({
							status: "err",
							msg: "please select real predestination bus stop"
						});
					}	
					callback(null, busStopName);
				})
			});
		},
		function (busStopName, callback){
			BusStop.find({ name: busStopName })
			.exec(function (err, busStop){
				if(err) res.send(err);

				if(busStop){
					var tag = busStop[0]._id;
					callback(null, tag);
				} 
			})
		}
	], function (err, result){
		res.jsonp({ tag: result });
	});
});

module.exports = router;