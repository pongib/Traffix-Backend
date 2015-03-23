var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var BusGeo = require('../traffix_model/busGeolocation');

router.get('/all', function (req, res) {
	BusGeo.find(function (err, result){
		if(err) res.send(err);

		res.send({
			result: result.length,
			data: result
		});
	})
});

router.post('/', function (req, res){
	
	console.log(req.body);
	var busGeo = new BusGeo({
		userId: req.body.userId,
		line: req.body.line,
		accuracy: parseFloat(req.body.accuracy),
		speed: parseFloat(req.body.speed),
		loc: {
			type: 'Point',
			coordinates: [ parseFloat(req.body.lng), parseFloat(req.body.lat) ]
		},
		time: req.body.date,
		tag: req.body.tag  //already send with [] so doesn't need [] here 
	});

	busGeo.save(function (err){
		if(err) res.send(err);

		res.send({
			msg: 'save to collection complete',
			data: busGeo
		})
	});
});

router.delete('/:id', function (req, res){
	BusGeo.findByIdAndRemove(req.params.id, function (err){
		if(err) res.send(err);

		res.json({
			msg: 'Delete complete with id '+req.params.id
		})
	});
});


module.exports = router;