var express = require('express');
var gm = require('googlemaps');
var router = express.Router();
var BusGeo = require('../traffix_model/busGeolocation');


// User
// .where('age').gte(21).lte(65)
// .where('name', /^vonderful/i)
// .where('friends').slice(10)
// .exec(callback)


router.get('/near/1/:busStop/:firstLine/:tag', function (req, res){	
	var result = [];
	var tags = req.params.tag.split(",");

	BusGeo.find().and([{ line: req.params.firstLine }, { tag: { $nin : tags }}])
	.where('accuracy').lte(20)
	.sort({accuracy: 'asc'}).limit(10)
	.exec(function (err, first){	
		if(err) {
			res.jsonp({
				status: 'ERROR',
				msg: 'Not found bus geo and '+err,
				origin: -1,
			  	busstop: req.params.busStop,
			  	line1: {
			  		line: parseInt(req.params.firstLine),
			  		distance: -1,
			  		duration: -1
			  	}
			});
		}	
		if(first.length){
			result.push(first[0]);

			var currentBus = result[0].loc.coordinates[1]+','+result[0].loc.coordinates[0];

			// res.send(result);
			gm.distance(
			currentBus, //origin
			req.params.busStop,  //destination
			function (err, estimate){
			  if(err) {
		  		res.jsonp({
					status: 'ERROR',
					msg: 'Can not estimate and '+err,
					origin: currentBus,
					busstop: req.params.busStop,
				  	line1: {
				  		line: parseInt(req.params.firstLine),
				  		distance: -1,
				  		duration: -1
				  	}
				});
			  }
			  if(estimate){
			  	if(estimate.status == "OK"){
				  	res.jsonp({
					  	status: estimate.status,
					  	origin: currentBus,
					  	busstop: req.params.busStop,
					  	line1: {
					  		line: parseInt(req.params.firstLine),
					  		distance: estimate.rows[0].elements[0].distance.value,
					  		duration: estimate.rows[0].elements[0].duration.value
					  	}
				  	});
			  	}else {
			  		res.jsonp({
					  	status: estimate.status,
					  	origin: currentBus,
					  	busstop: req.params.busStop,
					  	line1: {
					  		line: parseInt(req.params.firstLine),
					  		distance: -1,
					  		duration: -1
					  	}
				  	});
			  	}
			  }else {
			  	res.jsonp({
					status: 'ERROR',
					msg: 'Can not estimate bus stop',
					origin: currentBus,
					busstop: req.params.busStop,
				  	line1: {
				  		line: parseInt(req.params.firstLine),
				  		distance: -1,
				  		duration: -1
				  	}
				});
			  }
			}, false, "transit");
		}else {
			res.jsonp({
				status: 'ERROR',
				msg: 'Bus search not found',
				origin: -1,
				busstop: req.params.busStop,
			  	line1: {
			  		line: parseInt(req.params.firstLine),
			  		distance: -1,
			  		duration: -1
			  	}
			});
		}		
	});

});	  

router.get('/near/2/:busStop/:firstLine/:secondLine/:tag', function (req, res){	
		var result = [];
		var tags = req.params.tag.split(",");

		BusGeo.find().and([{ line: req.params.firstLine }, { tag: { $nin : tags }}])
		.where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
	    .exec(function (err, first){
	    	if(err) {
	    		res.jsonp({
					status: 'ERROR',
					msg: 'Not found bus geo and '+err,
					origin: -1,
				  	busstop: req.params.busStop,
				  	line1: {
				  		line: parseInt(req.params.firstLine),
				  		distance: -1,
				  		duration: -1
				  	},
				  	line2: {
				  		line: parseInt(req.params.secondLine),
				  		distance: -1,
				  		duration: -1
				  	}
				});
	    	}
	    	if(first.length > 0){
	    		result.push(first[0]);

	    		BusGeo.find().and([{ line: req.params.secondLine }, { tag: { $nin : tags }}])
		    	.where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
		    	.exec(function (err, second){
		    		if(err) {
				  		res.jsonp({
							status: 'ERROR',
							msg: 'Not found bus geo and '+err,
							origin: -1,
						  	busstop: req.params.busStop,
						  	line1: {
						  		line: parseInt(req.params.firstLine),
						  		distance: -1,
						  		duration: -1
						  	},
						  	line2: {
						  		line: parseInt(req.params.secondLine),
						  		distance: -1,
						  		duration: -1
						  	}
						});
					}
					if(second){
						result.push(second[0]);
			    		var currentBus = result[0].loc.coordinates[1]+','+result[0].loc.coordinates[0]+'|'+
			    			result[1].loc.coordinates[1]+','+result[1].loc.coordinates[0];

			    		// res.send(result);
			    		gm.distance(
						currentBus, //origin
						req.params.busStop,  //destination
						function (err, estimate){
							if(err) {
								res.jsonp({
									status: 'ERROR',
									msg: 'Can not estimate and '+err,
									origin: currentBus,
								  	busstop: req.params.busStop,
								  	line1: {
								  		line: parseInt(req.params.firstLine),
								  		distance: -1,
								  		duration: -1
								  	},
								  	line2: {
								  		line: parseInt(req.params.secondLine),
								  		distance: -1,
								  		duration: -1
								  	}
								});
							} 
							if(estimate){
								if(estimate.status == "OK"){
							  	res.jsonp({
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
							  }else {
							 //  	res.jsonp({
								// 	status: estimate.status,
								// 	msg: 'Can not estimate bus stop'
								// });
								res.jsonp({
								  	status: estimate.status,
								  	origin: currentBus,
								  	busstop: req.params.busStop,
								  	line1: {
								  		line: parseInt(req.params.firstLine),
								  		distance: -1,
								  		duration: -1
								  	},
								  	line2: {
								  		line: parseInt(req.params.secondLine),
								  		distance: -1,
								  		duration: -1
								  	}
							  	});
							  }			
							}else {
							  	res.jsonp({
									status: 'ERROR',
									msg: 'Can not estimate bus stop',
									origin: currentBus,
								  	busstop: req.params.busStop,
								  	line1: {
								  		line: parseInt(req.params.firstLine),
								  		distance: -1,
								  		duration: -1
								  	},
								  	line2: {
								  		line: parseInt(req.params.secondLine),
								  		distance: -1,
								  		duration: -1
								  	}
								});
							}						   
						}, false, "transit");
					}		    		
				});
	    	}else {
				res.jsonp({
					status: 'ERROR',
					msg: 'Bus search not found',
					origin: -1,
				  	busstop: req.params.busStop,
				  	line1: {
				  		line: parseInt(req.params.firstLine),
				  		distance: -1,
				  		duration: -1
				  	},
				  	line2: {
				  		line: parseInt(req.params.secondLine),
				  		distance: -1,
				  		duration: -1
				  	}
				});
			}			    		  
	    }); 
});	  
				
router.get('/near/3/:busStop/:firstLine/:secondLine/:thirdLine/:tag', function (req, res){	
		var tags = req.params.tag.split(",");

		BusGeo.find().and([{ line: req.params.firstLine }, { tag: { $nin : tags }}])
		.where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
	    .exec(function (err, first){	    	
	    	if(err) res.send(err);
	    	result.push(first[0]);

	    	BusGeo.find().and([{ line: req.params.secondLine }, { tag: { $nin : tags }}])
	    	.where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
	    	.exec(function (err, second){	    
	    		if(err) res.send(err);
	    		result.push(second[0]);

	    			BusGeo.find().and([{ line: req.params.thirdLine }, { tag: { $nin : tags }}])
	    			.where('accuracy').lte(10).sort({accuracy: 'asc'}).limit(1)
				    .exec(function (err, third){				   
				    	if(err) res.third(err);
				    	result.push(third[0]);

			    		var currentBus = result[0].loc.coordinates[1]+','+result[0].loc.coordinates[0]+'|'+
			    			result[1].loc.coordinates[1]+','+result[1].loc.coordinates[0]+'|'+
			    			result[2].loc.coordinates[1]+','+result[2].loc.coordinates[0];
			    		// res.send(result);
			    		gm.distance(
						currentBus, //origin
						req.params.busStop,  //destination
						function (err, estimate){
						  if(err) res.send(err); 
						  if(estimate.status == "OK"){
						  	res.jsonp({
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
							  	},
							  	line3: {
							  		line: parseInt(req.params.thirdLine),
							  		distance: estimate.rows[2].elements[0].distance.value,
							  		duration: estimate.rows[2].elements[0].duration.value
							  	}
						  	});
						  }else res.send(estimate);				  
						}, false, "transit");
				});
			});
	    }); 
});	  

module.exports = router;