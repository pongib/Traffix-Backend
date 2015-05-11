var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');
var gm = require('googlemaps');
var config = require('./api/config'); //config for google map
var routes = require('./routes/index');
var users = require('./routes/users');
var geolocation = require('./routes/geolocation');
var mongoTest = require('./routes/mongoTestGet');
//var connection = require('./mongoConnection/connectionAndReadSchema');
var googleMapApi = require('./routes/googlemap'); 
var busStopDBApi = require('./api/busStop');
var estimateTimeApi = require('./api/estimate');
var busGeoDBApi = require('./api/busGeolocation');
var alarm = require('./api/alarm');
var place = require('./api/place.js');
var BMTA = require('./api/bmta');
var siamTraffic = require('./api/siamtraffic');
//practice mongo db
var testBeer = require('./practice/beer');

var port = process.env.PORT || 9000;
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//app.set('jsonp callback name', '');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(connection.connect());
app.use('/mongo', mongoTest);
app.use('/gmapi', googleMapApi);
// app.use('/api', testBeer);
app.use('/api/bus-stop', busStopDBApi);
app.use('/api/estimate', estimateTimeApi);
app.use('/api/bus-geolocation', busGeoDBApi);
app.use('/api/alarm', alarm);
app.use('/api/place', place);
app.use('/api/bmta', BMTA);
app.use('/api/siamtraffic', siamTraffic);

mongoose.connect('mongodb://localhost/traffix');

fs.readdirSync(__dirname + '/models').forEach(function(filename){
    if(~filename.indexOf('.js')) require(__dirname + '/models/' + filename);
});

// gm.config({
//     key: "AIzaSyB_PaLNPwl9zkFtGtOQ1_vhNC7WpBy_Qyk"
// });
// gm.config('google-private-key', 'AIzaSyB_PaLNPwl9zkFtGtOQ1_vhNC7WpBy_Qyk');

// app.use('/xxx', routes);
// app.use('/users', users);
// app.use('/geolocation', geolocation);

// app.post('/api/user', function(req, res){
//     console.log(req.body.id);
//     res.send("id = "+req.body.id);
// });


// console.log("server start!");





/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// module.exports = app;

app.listen(port);

console.log('Server started! At http://localhost:' + port);
