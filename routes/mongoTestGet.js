var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/money', function(req, res){
    mongoose.model('salary').find(function(err, salary){
        res.send(salary);
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
        res.send(users);
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
    mongoose.model('chatX').find(function(err, chat){
        res.send(chat);
    });
});

router.get('/chat', function(req, res){
    mongoose.model('chat').find(function(err, chat){
        res.send(chat);
    });
});


module.exports = router;