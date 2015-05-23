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
var f = require('./function');

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
					fs.writeFile('./dataJson/raw/busStopData.json', JSON.stringify(newBusInfo, null, 4), function(err){
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
	fs.readFile('./dataJson/raw/siamtraffic.json', function (err, data){
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

// get bus stop name all put in array and write it to file
router.get('/busstopname/all', function (req, res){
	fs.readFile('./dataJson/raw/busStopData.json', function (err, data){
		var busInfo = JSON.parse(data);
		var busStopNameForward = [], busStopNameBackward = [];
		async.each(busInfo, function (elem, callback){
			async.parallel([
				function (callback){
					async.each(elem.busForward, function (forward, callback){
						busStopNameForward.push(forward);
						callback();
					}, function (err){
						callback(null, busStopNameForward);
					});
				}, 
				function (callback){
					async.each(elem.busBackward, function (backward, callback){
						busStopNameBackward.push(backward);
						callback();
					}, function (err){
						callback(null, busStopNameBackward);
					});
				}
			], function (err, result){
				callback();
			});
		}, function(err){
			var uf = _.uniq(busStopNameForward), ub =  _.uniq(busStopNameBackward);
			var inter = _.intersection(uf, ub);
			var union = _.union(uf, ub);
			fs.writeFile('./dataJson/raw/busStopNameAll.json', JSON.stringify(union, null, 4), function(err){
				console.log("write success");
				res.send({
					f: busStopNameForward.length,
					b: busStopNameBackward.length,
					uf: uf.length,
					ub: ub.length,
					inter: inter.length,
					union: union.length
				});
			});			
		});
	});
});

router.get('/busstopname/line', function (req, res){
	async.waterfall([
		function (callback){
			fs.readFile('./dataJson/raw/busStopNameAll.json', function (err, data){
				var busNameAll = JSON.parse(data);
				fs.readFile('./dataJson/busStopData.json', function (err, data){
					var busInfo = JSON.parse(data);
					callback(null, busNameAll, busInfo);
				});
			});
		},
		function (busNameAll, busInfo, callback){		
			var busInfoArr = [];
			async.each(busNameAll, function (name, callback){
				var busNameAndLine = {
					name: name
				}; 
				busNameAndLine.line = [];
				async.each(busInfo, function (item, callback) {
					if(item.busForward.indexOf(name) != -1 || item.busBackward.indexOf(name) != -1){
						busNameAndLine.line.push(item.line);
					}	
					callback();				
				}, function (err){
					busInfoArr.push(busNameAndLine);
					callback();
				});					
			}, function (err){
				callback(null, busInfoArr);
			});
		},
		function (busInfo, callback){
			fs.writeFile('./dataJson/raw/busStopNameWithLine.json', JSON.stringify(busInfo, null, 4), function(err){
				console.log('write file complete');
				callback(null, busInfo);
			});
		}
	], function (err, result){
		res.json({
			result: result.length
		});
	});
});


router.get('/busstopname/line/geocode', function (req, res){

	async.waterfall([
		function (callback){
			fs.readFile('./dataJson/raw/busStopNameWithLineAndGeo.json', function (err, data){
				var busInfoGeo = JSON.parse(data);
				// callback(null, busInfoGeo);
			});
		},
		function (busInfoGeo, callback){
			fs.readFile('./dataJson/raw/busStopNameWithLine.json', function (err, data){

			    var busInfo = JSON.parse(data);	
				var temp = _.findWhere(busInfo, { name: "โรงเรียนบดินทรเดชา" });						
				var newBusInfo = busInfo.slice(busInfo.indexOf(temp) + 1);
				callback(null, busInfoGeo, newBusInfo);
			});
		},
		function (busInfoGeo, busInfo, callback){
			// var busArr = [];
			async.eachSeries(busInfo, function (item, callback) {
				var busInfoObj = {
					name: item.name,
					line: item.line
				}
				gm.geocode(item.name, function (err, data){
					if(err) {
						console.log({msg: 'err is '+ err});
						callback(err);
					}
					if(data){
						if(data.status != "ZERO_RESULTS"){
							busInfoObj.location = data.results[0].geometry.location;
						}else {
							busInfoObj.location = {"lat": null, "lng": null};
						}
						busInfoGeo.push(busInfoObj);
						callback();
					}					
				}, false, null, 'th', 'th');  
			}, function (err){				
				fs.writeFile('./dataJson/raw/busStopNameWithLineAndGeo.json', JSON.stringify(busInfoGeo, null, 4), function(err){
					console.log('write file complete');					
					callback(null, busInfoGeo);
				});
			});
		}
	], function (err, result){
		res.send({ result: result.length });
	});
});

router.get('/busstopname/line/geocode/clean', f.clean);
router.get('/busstopname/line/geocode/plusgeo', f.nearby);
router.get('/busstopname/line/geocode/plusgeo/clean', f.cleanPlus);
router.get('/busstop/save', f.saveBusInfoToMongo);

module.exports = router;