var connect = function() {
	var fs = require('fs');
	var mongoose = ('mongoose');
	mongoose.connect('mongodb://localhost/traffix');

	fs.readdirSync(__dirname + '/models').forEach(function(filename){
	    if(~filename.indexOf('.js')) require(__dirname + '/models/' + filename);
	});
}

module.exports = connect;