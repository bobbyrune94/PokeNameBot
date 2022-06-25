const { logMessage } = require('./logging-utils');

/**
 * Adds a certain number of months to the given date.
 * @param {Date} date the "start" date to add to
 * @param {integer} months the number of months to add to
 * @param {string} interactionId the id of the interaction that called this function. Used for logging purposes
 * @returns the date that is the given number of months after the provided start date.
 * Note: this modifies the provided start date
 */
function addMonths(date, months, interactionId) {
	logMessage('Adding ' + months + ' months to ' + date.toDateString(), interactionId);
	const d = date.getDate();
	date.setMonth(date.getMonth() + +months);
	if (date.getDate() != d) {
		date.setDate(0);
	}
	logMessage('New Date: ' + date.toDateString(), interactionId);
	return date;
}

module.exports = { addMonths };