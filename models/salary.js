var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var salarySchema = new Schema({
	money: Number,
	name: String
});

mongoose.model('salary', salarySchema);