var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postsSchema = new Schema({
	content: String,
	user: String
}); 

mongoose.model('posts', postsSchema);