var express = require('express');
var mongoose = require('mongoose');
var gm = require('googlemaps');
var _ = require('underscore');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var router = express.Router();
var BusStop = require('../traffix_model/busStop.js');
var BusGeo = require('../traffix_model/busGeolocation');

router.get('/bus/:number', function (req, res) {
	req.connection.setTimeout(600000);
	// var url = "http://www.bmta.co.th/?q=th/content/21";
	var json = { line: "", busstop: "" }, busStop = [];
	async.waterfall([
		function (callback){
			var n = req.params.number, number = [];
			for (var i = 1; i <= n; i++) {
				number.push(i);	
			};
			callback(null, number);
		},
		function (number, callback){
			async.each(number, function (entry, callback){
				var json = { line: "", busstop: "" };
				var url = "http://www.bmta.co.th/?q=th/content/"+entry;
				console.log(url);
				// var url = "http://www.bmta.co.th/?q=th/content/1";
				request(url, function (error, response, html){
					if(!error){
						var $ = cheerio.load(html);					
						$('.page-title').filter(function (){
							var data = $(this);
							json.line = data.text();
							console.log(json.line);
							$('.field.field-name-field-busline-inbound.field-type-text-long.field-label-above').filter(function (){
								var data = $(this);
								json.busstop += data.children('.field-items').children().text();
								$('.field.field-name-field-busline-outbound.field-type-text-long.field-label-above').filter(function (){
									var data = $(this);
									json.busstop += ' '+data.children('.field-items').children().text();	
									busStop.push(json);	
								});
							});
						});
					}
					callback();	
				});
			}, function (err){
				callback(null, busStop);
			});
		},
		function (busStop, callback){
			fs.writeFile('output2.json', JSON.stringify(busStop, null, 4), function(err){
				console.log("success");
				callback(null, busStop);
			});		
		}
	], function(err, result){
		res.send(result);
		console.log("write success!");
	});
	

	
});


router.get('/search/:name', function (req, res){
	var temp = null, line = [];
	fs.readFile('output.json', function(err, data){
		temp = JSON.parse(data);
		async.each(temp, function (entry, callback){
			// if(entry.busstop.search(req.params.name) != -1){
			// 	line.push(entry.line);
			// }

			if(req.params.name.search("ซอย") != -1){
				//req.params.name.replace('ซอย','');
				// res.send(req.params.name.replace('ซอย',''));
				if(entry.busstop.search(req.params.name.replace('ซอย','')) != -1){
					line.push(entry.line);
					console.log(line);
				}
			}
			callback();
		}, function (err){			
			res.send(_.sortBy(line, function (num){
				return num;
			}));
		});
	});
});

module.exports = router;