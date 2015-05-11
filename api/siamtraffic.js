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


router.get('/encrypt', function (req, res){
	req.connection.setTimeout(600000);
	async.waterfall([
		function (callback){
			var url = "http://www.siamtraffic.net/contentframe.jsp?module=master&body=station&thspage=Station"
			request(url, function (err, response, html){
				if(!err){
					var $ = cheerio.load(html);
					var encBus=[], busLine = [], temp = [];
					$('option').each(function (i, elem){
						if(!isNaN($(this).text().charAt(0))){
							//replace nbsp and replace . with '' and replace multiple space with one space
							var str = $(this).text().replace(/\u00A0/g, '').replace('.', '').replace(/ +/g, ' ');
							var i = str.indexOf(' ');
							var obj = { // use substr faster that slice
								line: str.substr(0,i),
								encrypt: Number($(this).attr('value')),
								start_end: str.substr(i+1)
							};
							busLine.push(obj);
						}				
					});
					// res.send(busLine);
					callback(null, busLine);
				}
			});
		},
		function (busLine, callback){
			async.parallel([				
				function (callback){ // forward 
					var forward = [];
					async.eachSeries(busLine, function (elem, callback){
						var url = "http://www.siamtraffic.net/module/master/stationAjax.jsp?pge=1&trip=f&stre=&stat=&line="+elem.encrypt+"&shw=10000000&order=&by=&_t="+Math.floor(Math.random()*10000000000000);
						request(url, function (err, response, html){
							console.log("forward response "+elem.line);
							var $ = cheerio.load(html);
							var infoForward = {
								line: elem.line,
								encrypt: elem.encrypt,
								start_end: elem.start_end
							};
							infoForward.busForward = [];
							$('td[title]').each(function (i, elem){
								var busStop = $(this).text().slice(0, -1);							
								infoForward.busForward.push(busStop);
							});
							forward.push(infoForward)
							callback();
						});
					}, function(err){
						// res.send(forward);
						callback(null, forward);
					});
				}, 
				function (callback){ // backward
					var backward = [];
					async.eachSeries(busLine, function (elem, callback){
						var url = "http://www.siamtraffic.net/module/master/stationAjax.jsp?pge=1&trip=b&stre=&stat=&line="+elem.encrypt+"&shw=10000000&order=&by=&_t="+Math.floor(Math.random()*10000000000000);
						request(url, function (err, response, html){
							console.log("backward response "+elem.line);
							var $ = cheerio.load(html);
							var infoBackward = {
								line: elem.line,
								encrypt: elem.encrypt,
								start_end: elem.start_end
							};
							infoBackward.busBackward = [];
							$('td[title]').each(function (i, elem){
								var busStop = $(this).text().slice(0, -1);
								infoBackward.busBackward.push(busStop);
							});
							backward.push(infoBackward);
							callback();
						});
					}, function(err){
						 callback(null, backward);
					});
				}
			], function (err, result){
				
				var busInfo = {
					forward: result[0],
					backward: result[1]
				};
				var newBusInfo = [];

				async.eachSeries(busInfo.forward, function (elem, callback){
					var tempBusInfo = {
						line: elem.line,
						encrypt: elem.encrypt,
						start_end: elem.start_end,
						busForward: elem.busForward
					};
					tempBusInfo.busBackward = busInfo.backward[busInfo.forward.indexOf(elem)].busBackward;
					newBusInfo.push(tempBusInfo);
					callback();
				}, function (err){
					fs.writeFile('./dataJson/busStopData.json', JSON.stringify(newBusInfo, null, 4), function(err){
						console.log("write success");
						callback(null, newBusInfo);
					});	
				});						
			});
		}
	], function (err, result){
		res.send(result);
	});
});

router.get('/detail', function (req, res){
	req.connection.setTimeout(600000);
	var forward = [], backward = [];
	fs.readFile('./dataJson/test.json', function(err, data){	
		var busLine = JSON.parse(data);
		console.log(busLine.length);
		async.eachSeries(busLine, function (elem, callback){
			var url = "http://www.siamtraffic.net/module/master/stationAjax.jsp?pge=1&trip=b&stre=&stat=&line="+elem.encrypt+"&shw=10000000&order=&by=&_t="+Math.floor(Math.random()*10000000000000);
			request(url, function (err, response, html){
				console.log("backward response "+elem.line);
				var $ = cheerio.load(html);
				var infoBackward = {
					line: elem.line,
					encrypt: elem.encrypt,
					start_end: elem.start_end
				};
				infoBackward.busForward = [];
				$('td[title]').each(function (i, elem){
					var busStop = $(this).text().slice(0, -1);
					infoBackward.busForward.push(busStop);
				});
				backward.push(infoBackward);
				callback();
			});
		}, function(err){
			 res.send(backward);
		});
		// async.eachSeries(busLine, function (elem, callback){
		// 	console.log("request "+elem.line);
		// 	var url = "http://www.siamtraffic.net/module/master/stationAjax.jsp?pge=1&trip=f&stre=&stat=&line="+elem.encrypt+"&shw=10000000&order=&by=&_t="+Math.floor(Math.random()*10000000000000);
		// 	request(url, function (err, response, html){
		// 		if(!err){
		// 			console.log("response "+elem.line);
		// 			var $ = cheerio.load(html);
		// 			var infoForward = {
		// 				line: elem.line,
		// 				encrypt: elem.encrypt,
		// 				start_end: elem.start_end
		// 			};
		// 			infoForward.busForward = [];
		// 			$('td[title=""]').each(function (i, elem){
		// 				var busStop = $(this).text().slice(0, -1);				
		// 				infoForward.busForward.push(busStop);
		// 			});
		// 			forward.push(infoForward)
		// 			callback();
		// 		}
		// 	});
		// }, function(err){
		// 	res.json({
		// 		result: forward.length,
		// 		data: forward
		// 	});
		// 	// callback(null, forward);
		// });		
	});		
});


router.get('/handle', function (req, res){
	fs.readFile('./dataJson/siamtraffic.json', function (err, data){
		var busInfo = JSON.parse(data);
		var newArray = [];
		async.eachSeries(busInfo.forward, function (elem, callback){
			var newBusInfo = {
				line: elem.line,
				encrypt: elem.encrypt,
				start_end: elem.start_end,
				busForward: elem.busForward
			};
			newBusInfo.busBackward = busInfo.backward[busInfo.forward.indexOf(elem)].busBackward;
			newArray.push(newBusInfo);
			callback();
		}, function (err){
			res.send(newArray);
		});
	});
});


module.exports = router;