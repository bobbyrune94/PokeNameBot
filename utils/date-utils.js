/**
 * Adds a certain number of months to the given date.
 * @param {Date} date the "start" date to add to
 * @param {integer} months the number of months to add to
 * @returns the date that is the given number of months after the provided start date.
 * Note: this modifies the provided start date
 */
function addMonths(date, months) {
	console.log('Adding ' + months + ' months to ' + date.toDateString());
	const d = date.getDate();
	date.setMonth(date.getMonth() + +months);
	if (date.getDate() != d) {
		date.setDate(0);
	}
	console.log('New Date: ' + date.toDateString());
	return date;
}

module.exports = { addMonths };