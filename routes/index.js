var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  console.log("xxx");
  res.render('index', { title: 'Express' });
});

module.exports = router;
