var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var usersSchema = new Schema({
	name: String,
	msg: String
}); 

mongoose.model('users', usersSchema);