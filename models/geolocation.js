var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var geolocationSchema = new Schema({
	lat: {
		type: Number,
		decimal: true,
		min: -90,
		max: 90
	},
	lng: {
		type: Number,
		decimal: true,
		min: -180,
		max: 180
	}
},
{
	collection: 'geolocation'
});

mongoose.model('geolocation', geolocationSchema);