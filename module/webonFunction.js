exports.calculate = function (req, res){
	var interestInMonth = parseFloat(req.params.interest) / 100 / 12;
	var amount = parseFloat(req.params.amount);
	var month = parseInt(req.params.year) * 12;
	var period = 12;
	var cal = Math.pow(1 + interestInMonth, month);

	var formular = (amount * interestInMonth * cal) / (cal - 1) / period;
	return formular;
}