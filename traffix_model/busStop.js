var mongoose = require('mongoose');
 
var busStopSchema = mongoose.Schema({
	name: String,
	line: [Number],
	loc: {
		type: String,
		coordinates: [Number]
	}
});

busStopSchema.index({ loc: '2dsphere' });
module.exports = mongoose.model('Traffix_Bus_stop', busStopSchema);