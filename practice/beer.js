var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

var Beer = require('../beer_model/beerModel');

router.get('/', function(req, res){
	res.json({hi:"this is my mongo api"});
});

// save beer to locker
router.post('/beers', function(req, res){
	var beer = new Beer();

	beer.name = req.body.name;
	beer.type = req.body.type;
	beer.quantity = req.body.quantity;

	beer.save(function(err){
		if(err) res.send(err);

		res.send({
			message: 'Beer added to the locker!' , 
			data: beer
		});
	});
});

// get all 
router.get('/beers', function(req, res){

	Beer.find(function(err, beers){
		if(err) res.send(err);

		res.send(beers);
	});
});

router.get('/beers/:beer_id', function(req, res){
	Beer.findById(req.params.beer_id, function(err, beer){
		if (err) res.send(err);
		console.log(req.params.beer_id);
		res.send(beer);	
	});
});

router.put('/beers/:beer_id', function(req, res){
	Beer.findById(req.params.beer_id, function(err, beer){
		if(err) res.send(err);

		console.log(beer);
		beer.quantity = req.body.quantity;

		beer.save(function(err){
			if(err) res.send(err);

			res.send(beer);
		});
	});
});

router.delete('/beers/:beer_id', function(req, res){
	Beer.findByIdAndRemove(req.params.beer_id, function(err){
		if(err) res.send(err);

		res.send({message: 'remove beer already!'});
	});
});

router.get('/beers/findname/:name', function(req, res){
	Beer.find({ name: /+req.params.name+/i }, function(err, result){
		res.send(result);
	});
});



module.exports = router;