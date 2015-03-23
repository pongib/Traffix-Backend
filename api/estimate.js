var express = require('express');
var gm = require('googlemaps');
var router = express.Router();
var BusGeo = require('../traffix_model/busGeolocation');
var result = [];

// User
// .where('age').gte(21).lte(65)
// .where('name', /^vonderful/i)
// .where('friends').slice(10)
// .exec(callback)


router.get('/near/1/:busStop/:firstLine', function (req, res){	

	BusGeo.find({ line: req.params.firstLine }).where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
	.exec(function (err, second){
		if(err) res.send(err);
		result.push(second[0]);

		var currentBus = result[0].loc.coordinates[1]+','+result[0].loc.coordinates[0];

		// res.send(result);
		gm.distance(
		currentBus, //origin
		req.params.busStop,  //destination
		function (err, estimate){
		  if(err) res.send(err); 
		  if(estimate.status == "OK"){
		  	res.json({
			  	status: estimate.status,
			  	origin: currentBus,
			  	busstop: req.params.busStop,
			  	line1: {
			  		line: parseInt(req.params.firstLine),
			  		distance: estimate.rows[0].elements[0].distance.value,
			  		duration: estimate.rows[0].elements[0].duration.value
			  	}
		  	});
		  }else res.send(estimate);				  
		}, false, "transit");
	});

});	  

router.get('/near/2/:busStop/:firstLine/:secondLine', function (req, res){	

		BusGeo.find({ line: req.params.firstLine }).where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
	    .exec(function (err, first){
	    	if(err) res.send(err);
	    	result.push(first[0]);

	    	BusGeo.find({ line: req.params.secondLine }).where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
	    	.exec(function (err, second){
	    		if(err) res.send(err);
	    		result.push(second[0]);

	    		var currentBus = result[0].loc.coordinates[1]+','+result[0].loc.coordinates[0]+'|'+
	    			result[1].loc.coordinates[1]+','+result[1].loc.coordinates[0];

	    		// res.send(result);
	    		gm.distance(
				currentBus, //origin
				req.params.busStop,  //destination
				function (err, estimate){
				  if(err) res.send(err); 
				  if(estimate.status == "OK"){
				  	res.json({
					  	status: estimate.status,
					  	origin: currentBus,
					  	busstop: req.params.busStop,
					  	line1: {
					  		line: parseInt(req.params.firstLine),
					  		distance: estimate.rows[0].elements[0].distance.value,
					  		duration: estimate.rows[0].elements[0].duration.value
					  	},
					  	line2: {
					  		line: parseInt(req.params.secondLine),
					  		distance: estimate.rows[1].elements[0].distance.value,
					  		duration: estimate.rows[1].elements[0].duration.value
					  	}
				  	});
				  }else res.send(estimate);				  
				}, false, "transit");
			});
	    }); 
});	  
				


module.exports = router;