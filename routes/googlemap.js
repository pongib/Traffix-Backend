var express = require('express');
var router = express.Router();
var gm = require('googlemaps');
// var util = require('util');

router.get('/reversegeo', function(req, res){
	gm.reverseGeocode(req.param('latlng'), function(err, data){
  		res.send({'result': data.results[0].formatted_address});
	});
});

router.get('/distance', function(req, res){
	gm.distance(req.param('from'), req.param('to'), function(err, data){
  		res.send(data);
	});
});

router.get('/estimate', function(req, res){
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
	gm.directions(req.param('from'), req.param('to'), function(err, data){
  		res.send(data);
	}, 'false', 'transit', null, null, null, null, null, departureNow);
});



module.exports = router;