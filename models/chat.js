var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema({
	id: Number,
	msg: String
});

mongoose.model('chat', chatSchema);