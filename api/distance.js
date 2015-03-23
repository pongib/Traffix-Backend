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
				function (err, result){
				  if(err) res.send(err); 

				  res.json({
				  	origin: currentBus,
				  	busstop: req.params.busStop,
				  	data: result
				  });
				}, false, "transit");
			});
	    }); 
});	  
				


module.exports = router;