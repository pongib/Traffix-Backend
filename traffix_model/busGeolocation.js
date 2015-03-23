var mongoose = require('mongoose');

var busGeoSchema = mongoose.Schema({
	userId: String,
	line: Number,
	accuracy: Number,
	speed: Number,
	loc: {
		type: { type: String },
		coordinates: [Number]
	},
	time: { 
		type: Date, 
		default: Date.now 
	},
	tag: [String]
});

busGeoSchema.index({ loc: '2dsphere' });
module.exports = mongoose.model('traffix_bus_geolocation', busGeoSchema); 