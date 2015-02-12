var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var busStopSchema = new Schema({
	busLine: [String],
	busStopName: String
},
{
	collection: 'busStop'
});  

mongoose.model('busStop', busStopSchema); 