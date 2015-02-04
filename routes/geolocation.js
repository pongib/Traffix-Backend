var express = require('express');
var router = express.Router();

router.post('/getGeo', function(req, res){
	console.log("lat = "+req.param('lat')+" long = "+req.param('lng'));
	res.send({status: "send geolocation complete"});
});

module.exports = router;