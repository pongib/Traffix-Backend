var mongoose = require('mongoose');

var bearSchema = mongoose.Schema({
	name: String,
	type: String,
	quantity: Number
});

module.exports = mongoose.model('Beer', bearSchema);