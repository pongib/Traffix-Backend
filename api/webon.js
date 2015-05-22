var express = require('express');
var router = express.Router();
// var webOn = require('../module/webon')

 var calculateRepayment = function(amount, rate, term, repaymentFreq) {
            if (!isNumber(amount) || !isNumber(rate) || !isNumber(term) || !isNumber(repaymentFreq)) {
                return '';
            }
            var loanAmount = parseFloat(amount);
            var interestRate = parseFloat(rate);
            var loanTerm = parseFloat(term);
            var resultInterestRate = interestRate / 100 / 12;
            var numberOfRepayments = loanTerm * 12;
            var x = Math.pow(1 + resultInterestRate, numberOfRepayments);
            return round((loanAmount * resultInterestRate * x) / (x - 1) / repaymentFreq);
        };

router.get('/:amount/:interest/:year', function (req, res){
	var num = 1;
	var interestInMonth = parseFloat(req.params.interest) / 100 / num;
	var amount = parseFloat(req.params.amount);
	var month = parseInt(req.params.year) * num;
	var period = 1;
	var cal = Math.pow(1 + interestInMonth, month);

	
	var formular = (amount * interestInMonth * cal) / (cal - 1) / period;
	
	res.send({
		value:formular
	});
});


module.exports = router;