var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var BusStop = require('../traffix_model/busStop.js');


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
		})
	});
});

// -------------END Manage Database -----------------------//


//find near bus stop
router.get('/findnear/:lng/:lat/:distance', function (req, res){
	console.log(req.params.lng+" "+req.params.lat);
	console.log(BusStop);
	BusStop.where('loc').near({
		center: { 
			coordinates: [parseFloat(req.params.lng), parseFloat(req.params.lat)], 
			type: 'Point' 
		},
		maxDistance: parseInt(req.params.distance),
		spherical: true
	}).exec(function (err, busStop){
		if(err) res.send(err);

		res.json({
			result: busStop.length,
			data: busStop 
		});
	});
});

module.exports = router;