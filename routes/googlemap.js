var express = require('express');
var router = express.Router();
var gm = require('googlemaps');
var _ = require('underscore');
// var util = require('util');

// function firstAsync (data, callback) {
// 	var busLine = [];
// 	console.log('data = '+data);
// 	for (var i = 0; i < data.routes.length; i++) {
// 			for(var j = 0; j < data.routes[i].legs.steps.length; j++){
// 				if(data.routes[i].legs.steps[j].travel_mode == "TRANSIT"){
// 					busLine.push(data.routes[i].legs.steps[j].transit_details.line.short_name);
// 			}				
// 		}
// 	}
// 	console.log('busLine = '+busLine);
// 	callback(busLine);
// }

router.get('/geocode/:destination', function(req, res){
	gm.geocode(req.params.destination, function (err, dest){
		res.send(dest);
		if(dest){
			var destination = dest.results[0].geometry.location.lat+','+dest.results[0].geometry.location.lng;
			res.send(destination);
		}else {
			res.send(err);
		}		
	}, null, null, 'th', 'th');
});

router.get('/reversegeo', function(req, res){
	gm.reverseGeocode(req.param('latlng'), function(err, data){
  		res.send({'result': data.results[0].formatted_address});
	});
});

// router.get('/distance', function(req, res){
// 	gm.distance(req.param('from'), req.param('to'), function(err, data){
//   		res.send(data);
// 	});
// });
router.get('/distance/:from/:to', function (req, res){
	gm.distance(req.params.from, req.params.to, function (err, estimate){
		if(err) res.send("err = "+err);
		if(estimate.status == "OK"){
		  	var _estimate = {
			  	status: estimate.status,
			  	estimate: estimate.rows[0].elements
		  	};
		  	res.send(_estimate);
			console.log(_estimate);	
		}else res.send(estimate);	
	}, false, 'transit');
});

router.get('/estimate/:from/:to', function(req, res){
	var options = {
		sensor: 'false',
		mode: 'transit',
		waypoints: 'null',
		alternatives: 'null', 
		avoid: 'null', 
		units: 'null', 
		language: 'null', 
		departureTime: Math.floor((new Date()).getTime()/1000), 
		arrivalTime: 'null', 
		region: 'null'
	};
	var departureNow = Math.floor((new Date()).getTime()/1000);
	var busLine = [];
	console.log(req.params.to);

	gm.directions(req.params.from, req.params.to, function(err, data){
		// res.send(data);
		data.routes.forEach(function (entries){
			entries.legs[0].steps.some(function(entry){
				if(entry.travel_mode == 'TRANSIT'){
					busLine.push(entry.transit_details.line.short_name);
					//console.log(busLine);
					return true; //want to break use some return true use every return false
				}else return false;
			});
		});
		// unique value in array and sort asc 
		res.send(_.sortBy(_.uniq(busLine, false), function (num){
			return num;
		}));
		

	}, 'false', 'transit', null, true, null, null, null, departureNow, null, 'th');
});



module.exports = router;