var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var router = express.Router();
var _ = require('underscore');
var BusGeo = require('../traffix_model/busGeolocation');
var BusStop = require('../traffix_model/busStop.js');



router.use(function	(req, res, next){
	console.log('Date:', Date.now());
	next();
}); 

// router.use('/all', function (req, res, next){
// 	console.log('Requset UrL:', req.originalUrl);
// 	next();
// }, function (req, res, next){
// 	console.log("Requset type:", req.method);
// 	next();
// });

// a middleware sub-stack shows request info for any type of HTTP request to /user/:id
router.use('/all', function(req, res, next) {
  console.log('Request URL: '+req.originalUrl+' Request Type: '+req.method);
  next();
});

router.get('/all', function (req, res) {
	BusGeo.find(function (err, result){
		if(err) res.send(err);

		res.send({
			result: result.length,
			data: result
		});
	});
});

// check user id 
// test by don't have user id
	// {
	// 		"userId": "",
	// 		"line": 141,
	// 		"accuracy": 5,
	// 		"speed": 40,
	//   		"lng": 100.4985161,
	//   		"lat": 13.6567275,	
	// 		"date": 1426567532014,
	// 		"tag": ["54fff522ea4818acc35289ef"]
	// }

router.post('/', function (req, res, next){
	// check "", null, undefind, false, 0, NaN
	if(!req.body.userId)
		res.json({
			status: "Error",
			msg: "User id not found!"
		});
	else next();
});

// find near bus for return bus line to user 
// test by don't have line and added sample bus to database
	// with have nearest this test 
	 // "data": {
	 //        "__v": 0,
	 //        "userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
	 //        "line": 75,
	 //        "accuracy": 5,
	 //        "speed": 40,
	 //        "_id": "551e76deda1628d8134c688e",
	 //        "tag": [
	 //            "54fff522ea4818acc35289ef"
	 //        ],
	 //        "time": "2015-03-17T04:45:32.014Z",
	 //        "loc": {
	 //            "type": "Point",
	 //            "coordinates": [
	 //                100.4918161,
	 //                13.6567275
	 //            ]
	 //        }
	 //    }

	//  ++++++++++++ test with ++++++++++++
	//  {
	// 		"userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
	// 		"line": "",
	// 		"accuracy": 5,
	// 		"speed": 40,
	//   		"lng": 100.4918161,
	//   		"lat": 13.6567275,	
	// 		"date": 1426567532014,
	// 		"tag": ["54fff522ea4818acc35289ef"]
	// }

router.post('/', function (req, res, next){
	var line = [], speed = parseInt(req.body.speed);
	if(!req.body.line){
		BusGeo.find()
		.where('speed').gte(speed - 2).lte(speed + 2)
		.where('loc').near({
			center: {
				coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
				type: 'Point'
			},
			maxDistance: 1,
			spherical: true
		}).exec(function (err, result){
			if(err) res.send(err);
			if(result.length >= 1){
				async.each(result, function (entry, callback){
					if(entry.line){
						line.push(entry.line);
					}
					callback();
				}, function (err){
					res.json({
					  status: "Line",
					  line: _.uniq(line)
					});
				});
			}else{
				BusStop.find()
				.where('loc').near({
					center: {
						coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
						type: 'Point'
					},
					maxDistance: 100,
					spherical: true
				}).exec(function (err, result){
					if(err) res.send(err);
					if(result.length >= 1){
						async.each(result, function (entry, callback){
							if(entry.line){
								async.each(entry.line, function (index, callback){
									line.push(index);
									callback();
								}, function (err){
									callback();
								});
							}							
						}, function (err){
							res.json({
							  status: "Line",
							  line: _.uniq(line)
							});
						});
					}else {
						res.send({
				 			status: "No Line"
						});
					}
				});				
			}		
		});
	}else next();
});

// find in bus stop to add tags with 5 meter
// test case not duplicate
	// {
	// 		"userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
	// 		"line": "75",
	// 		"accuracy": 5,
	// 		"speed": 40,
	//   		"lng": 100.4967136, 
	//   		"lat": 13.6540672,	
	// 		"date": 1426567532014,
	// 		"tag": ["54fff522ea4818acc35289ef"]
	// }
	// 	test case duplicate
	// {
	// 		"userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
	// 		"line": "75",
	// 		"accuracy": 5,
	// 		"speed": 40,
	//   		"lng": 100.4967136, 
	//   		"lat": 13.6540672,	
	// 		"date": 1426567532014,
	// 		"tag": ["54fff522ea4818acc35289ef", "54fff53fea4818acc35289f0"]
	// }


router.post('/', function (req, res, next){	
	var tags = [];
	BusStop.where('loc').near({
		center: {
			coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
			type: 'Point'
		},
		maxDistance: 40,
		spherical: true
	}).exec(function (err, result){

		if(re)
		if(err) res.send(err);	
		if(result.length >= 1){
			//check value in array are not duplicate
			//result 0 because mongo return nearest first
			if(_.indexOf(req.body.tag, String(result[0]._id)) == -1){
				req.body.tag.push(String(result[0]._id));
				next();
			}else {
				//in case already have value in tag array
				next(); 
			}					
		}else{ 
		// can't find bus stop at this moment
		// so, no tag added
			next();
		}
	});
});

// alarm checking
// test case when reached alarm bus stop
// {
// 			"userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
// 			"line": "75",
// 			"accuracy": 5,
// 			"speed": 40,
// 	  		"lng": 100.4967136, 
// 	  		"lat": 13.6540672,	
// 			"date": 1426567532014,
// 			"tag": ["54fff522ea4818acc35289ef"],
//       	"alarm":  "54fff53fea4818acc35289f0"
// }   

// test case when not reach alarm bus stop
 // 	{
	// 		"userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
	// 		"line": "75",
	// 		"accuracy": 5,
	// 		"speed": 40,
	//   	"lng": 100.4967136, 
	//   	"lat": 13.6540672,	
	// 		"date": 1426567532014,
	// 		"tag": ["54fff522ea4818acc35289ef"],
    //      "alarm":  "54fff556ea4818acc35289fa"
	// }    

router.post('/', function (req, res, next){
	if(req.body.alarm){
		// check if tag added and found in array 
		// mean alert passenger  
		if(_.indexOf(req.body.tag, req.body.alarm) != -1){
			res.jsonp({
				status: 'Alarm',
				msg: "Alert user!! and delete parameter alarm."
			});
			next();
		}else{
		// in case of not yet destination
			next();	
		}
	}else{
	// user not set alarm
		next();	
	} 
});

// reach destination checking by check tag
// get destination from when fill line and bus stop
// front end will save selected _id of bus stop destination
// and send to backend
// test case when reach destination 
// {
// 			"userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
// 			"line": "75",
// 			"accuracy": 5,
// 			"speed": 40,
// 	  		"lng": 100.4967136, 
// 	  		"lat": 13.6540672,	
// 			"date": 1426567532014,
// 			"tag": ["54fff522ea4818acc35289ef"],
//       		"destination":  "54fff53fea4818acc35289f0"
// }   

//in case of not yet destination
// {
// 			"userId": "84a516841ba77a5b4648de2cd0dfcb30ea46dbb4",
// 			"line": "75",
// 			"accuracy": 5,
// 			"speed": 40,
// 	  		"lng": 100.4967136, 
// 	  		"lat": 13.6540672,	
// 			"date": 1426567532014,
// 			"tag": ["54fff522ea4818acc35289ef"],
//       		"destination":  "54fff552ea4818acc35289f8"
// } 
router.post('/', function (req, res, next){
	if(req.body.destination){
		// check if tag added and found in array 
		// mean passenger go out from bus  
		if(_.indexOf(req.body.tag, req.body.destination) != -1){
			res.jsonp({
				status: 'OUT',
				msg: "Passenger out and delete value parameter line and destination."
			});
			next(); 
		}else{
		// in case of not yet destination
			next();	
		}
	}else{
	// user not set destination
		next();	
	} 
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
		// return tag for use in next request time
		console.log("save to collection completed");
		res.send({
			msg: 'save to collection complete',
			data: busGeo,
			tag: busGeo.tag
		});
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