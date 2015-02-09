var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatXSchema = new Schema({
	id: Number,
	msg: String,
},
{
	collection: 'chat'
});

mongoose.model('chatX', chatXSchema);