var mongoose = require('mongoose');

var busTestSchema = mongoose.Schema({
	name: String,
	line: [String],
	loc: {
		type: { type: String },
		coordinates: [Number]
	}
});

busTestSchema.index({ loc: '2dsphere' });
module.exports = mongoose.model('Traffix_Bus_test', busTestSchema);