var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/money', function(req, res){
    mongoose.model('salary').find(function(err, salary){
        res.jsonp(salary);
    });
});


router.get('/salary/:money/:name', function(req, res){
    mongoose.model('salary').create({money: req.param('money') , name: req.params.name}, function(err, small){
        if (err) return handleError(err);
        res.send(small);
    });
});

router.get('/users', function(req, res){
    mongoose.model('users').find(function(err, users){
        res.json(users);
    });
});


router.get('/posts', function(req, res){
    mongoose.model('posts').find(function(err, posts){
        res.send(posts);
    });
});

router.get('/chat/:msg', function(req, res){
    mongoose.model('chat').create({id: ++i, msg: req.params.msg}, function(err, chat){
        res.send(chat);
    });
});

router.get('/chatX', function(req, res){
    res.jsonp({name: 'pong'});
    // mongoose.model('chatX').find(function(err, chat){
    //     res.send(chat);
    // });
});

router.get('/chat', function(req, res){
    mongoose.model('chat').find(function(err, chat){
        res.send(chat);
    });
});

router.get('/busstop', function(req, res){
    console.log("line = "+req.param('line')+" busstop = "+req.param('busStopName'));
    mongoose.model('busStop').create({busLine: [req.param('line')], busStopName: req.param('busStopName')}, function(err, busStop){
        if (err) return handleError(err);
        res.send("add to collection complete");
    });
});

router.get('/findbusstop', function(req, res){
    mongoose.model('busStop').find({busLine: req.param('line')}, function(err, result){
        res.jsonp(result);
    });
});

router.post('/geolocation', function(req, res){
    mongoose.model('geolocation').create({lat: req.param('lat'), lng: req.param('lng')}, function(err, result){
        if (err) res.send(err);
        console.log("lat: "+req.param('lat')+" lng: "+req.param('lng'));
        console.log(req.body.lat);
        res.send("receive OK "+result);
    });
});

router.get('/findgeolocation', function(req, res){
    mongoose.model('geolocation').find({lat: req.param('lat'), lng: req.param('lng')}, function(err, result){
        res.send(result);
    });
});

module.exports = router;