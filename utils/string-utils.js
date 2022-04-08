/**
 * The string to display when requiring users to contact the system designer and builder for any serious issues.
 */
const CONTACTKENNYISSUESSTRING = 'If there are further issues, contact Kenny on Discord at bobbyrune94#9138.';
const CONTACTKENNYINFOSTRING = 'If you would like more information on how all of this is set up, feel free to shoot Kenny a message on Discord at bobbyrune94#9138.';

function sendEphemeralMessage(interaction, string) {
	interaction.reply({
		content: string,
		ephemeral: true,
	});
}

function sendDeferredEphemeralMessage(interaction, string) {
	console.log('Interaction ID: ' + interaction.id);
	interaction.editReply({
		content: string,
		ephemeral: true,
	}).catch(err => {
		console.log('Error sending original message: ' + err.toString());
		interaction.reply({
			content: string,
			ephemeral: true,
		});
	});
}

/**
 * Converts the provided string to capital case.
 * Capital Case means that the first letter is capitalized and the rest of the string is lowercase
 * @param {string} string the string to make capital case
 * @returns the string formatted in capital case
 */
function toCapitalCase(string) {
	return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Converts the given list to a formatted string to display
 * Example outputs: [1, 2, 3] or [a, b, c]
 * @param {list} list the list to get the string of
 * @returns the string representation of the list.
 */
function generateListString(list) {
	return '[' + list.join(', ') + ']';
}

/**
 * Generates the command that was executed in the given interaction
 * Example outputs:
 * /remove
 * /change gendered Options: [{"name":"pokemon","type":"STRING","value":"eevee"},{"name":"male-nickname","type":"STRING","value":"a"},{"name":"female-nickname","type":"STRING","value":"b"}]
 * @param {Interaction} interaction interaction to get the command from
 * @returns the command that was executed in a string format
 */
function generateCommandString(interaction) {
	let commandString = '/';

	commandString += interaction.commandName;

	if (interaction.options.data.length > 0) {
		commandString += ' ' + interaction.options.getSubcommand() + ' Options: ' +
        JSON.stringify(interaction.options.data[0]['options']);
	}

	return commandString;
}

/**
 * Generates the properly formatted nickname for claims that choose separate names depending on the gender
 * The outputted format will look like: [maleNickname] (Male), [femaleNickname] (Female)
 * @param {string} maleNickname the nickname to give to males of a pokemon
 * @param {string} femaleNickname the nickname to give to females of a pokemon
 * @returns the formatted nickname string to be stored in the database
 */
function generateGenderedNickname(maleNickname, femaleNickname) {
	return maleNickname + ' (Male), ' + femaleNickname + ' (Female)';
}

/**
 * Generates the error output string for when a user has not claimed a pokemon yet
 * @param {string} user the user executing the command
 * @returns the formatted error string
 */
function generateNoUserClaimString(user) {
	return 'NoExistingClaimError: ' + user + ', you have not claimed a Pokemon yet. Use the "/claim" command to make your claim.';
}

/**
 * Generates the error output string for when the user already has a claim.
 * The string also displays the next available time the user can change their claim
 * @param {string} user the user executing the command
 * @param {Date} expireDate the date that the user can change their claim
 * @returns the formatted error string
 */
function generateUserAlreadyClaimedString(user, expireDate) {
	return 'ExistingClaimError: ' + user + ', you have already claimed a Pokemon. Please wait until ' +
    expireDate.toDateString() + ' if you would like to change your claim.';
}

/**
 * Generates the error output string for when the user tries to change their claim too early.
 * The string also displays the next available time the user can change their claim
 * @param {string} user the user executing the command
 * @param {Date} expireDate the date that the user can change their claim
 * @returns the formatted error string
 */
function generateEarlyClaimChangeString(user, date) {
	return 'EarlyChangeClaimError: ' + user + ', you are unable to change your claim at this time. Please wait until ' +
     date.toDateString() + ' if you would like to change your claim.';
}

/**
 * Generates the error output string for an invalid pokemon name.
 * @param {string} invalidName the invalid pokemon name
 * @returns the formatted error string
 */
function generateInvalidNameString(invalidName) {
	return 'InvalidPokemonNameError: ' + invalidName + ' is not a valid pokemon name. Please Try Again.';
}

/**
 * Generates the error output string for a pokemon that has already been claimed
 * @param {string} pokemon the already-claimed pokemon
 * @returns the formatted error string
 */
function generatePokemonAlreadyClaimedString(pokemon) {
	return 'AlreadyClaimedError: ' + toCapitalCase(pokemon) + ' has already been claimed.';
}

function formatGenderAnomalyString(genderAnomalyString) {
	switch (genderAnomalyString) {
	case 'genderless':
		return 'Genderless';
	case 'only_male':
		return 'Only Male';
	case 'only_female':
		return 'Only Female';
	default:
		return 'Unknown Anomaly String: ' + genderAnomalyString;
	}
}

/**
 * Generates the error output string for a pokemon that has a gender anomaly, but is getting claimed with gender-specific nicknames
 * Will return separate messages depending on if it's a genderless, only male, or only female pokemon
 * @param {string} pokemon the pokemon with a gender-anomaly
 * @param {string} genderAnomalyString a string representing the gender anomaly. Expected values are: 'genderless' | 'only_male' | 'only_female'
 * @returns the formatted error string
 */
function generateInvalidGenderedNickname(pokemon, genderAnomalyString) {
	if (genderAnomalyString == undefined) {
		return 'DDBError: The bot had issues accessing the gender-anomaly database. Please try again in a couple minutes as there might be an outage.';
	}
	return 'InvalidGenderedClaimError: ' + toCapitalCase(pokemon) + ' has a ' + formatGenderAnomalyString(genderAnomalyString) +
	' evolutionary line. Please try again with the "default" subcommand.';
}

/**
 * Generates the output string for when the user views a pokemon that has already been claimed
 * @param {string} user the username of the user calling the command
 * @param {string} pokemon the name of the pokemon
 * @param {list of string} evoline the list of pokemon in the evolutionary line
 * @param {string} username the username of the person who claimed it
 * @param {string} nickname the nickname that the claimer chose
 * @returns the formatted string
 */
function generateViewClaimAlreadyClaimedString(user, pokemon, evoline, username, nickname) {
	return user + ', ' + toCapitalCase(pokemon) + ' has already been claimed by ' + username + ' with the nickname ' + nickname +
	'. They have also claimed ' + generateListString(evoline);
}

/**
 * Generates the output string for when a user views a claimable pokemon and doesn't have a claim of their own
 * @param {string} user the user executing the command
 * @param {string} pokemon the pokemon the user is checking the claims for
 * @returns the formatted string
 */
function generateViewClaimNotClaimedString(user, pokemon, evoline) {
	return user + ', ' + toCapitalCase(pokemon) + ' has not been claimed yet. If you wish to claim this pokemon, you will also claim ' +
	generateListString(evoline);
}

/**
 * Generates the output string for a user with existing claims viewing their claims
 * @param {string} user the user executing the command
 * @param {list of string} claimedPokemon the pokemon that the user has claimed
 * @param {string} nickname the nickname the user claimed for the pokemon
 * @returns the formatted error string
 */
function generateUserClaimString(user, claimedPokemon, nickname) {
	const capitalizedPokemon = claimedPokemon.map(pokemon => toCapitalCase(pokemon));
	return user + ', you have claimed the following pokemon: ' + generateListString(capitalizedPokemon)
    + ' with the nickname "' + nickname + '".';
}

/**
 * Generates the output string when a user successfully claims a list of pokemon with a given nickname
 * @param {string} user the user executing the command
 * @param {list of string} claimedPokemon the pokemon that the user has claimed
 * @param {string} nickname the nickname the user wishes to name the pokemon
 * @returns the formatted error string
 */
function generateSuccessfulClaimString(user, claimedPokemon, nickname) {
	const capitalizedPokemon = claimedPokemon.map(pokemon => toCapitalCase(pokemon));
	return user + ' has successfully claimed the nickname "' + nickname + '" for the pokemon line '
    + generateListString(capitalizedPokemon) + '.';
}

/**
 * Generates the output message when a user successfully updates their nickname for their given claim
 * @param {string} user the user executing the command
 * @param {list of string} claimedPokemon the pokemon that the user has claimed
 * @param {string} nickname the new nickname the user has updated to
 * @returns the formatted error string
 */
function generateSuccessfulUpdateString(user, claimedPokemon, nickname) {
	const capitalizedPokemon = claimedPokemon.map(pokemon => toCapitalCase(pokemon));
	return user + ' has successfully updated their nickname for the pokemon line '
    + generateListString(capitalizedPokemon) + ' to ' + nickname + '.';
}

/**
 * Generates the output string for when a user successfully updates their claim from one group of pokemon to another
 * @param {string} user the user executing the command
 * @param {list of strings} newClaims the new pokemon that the user has changed their claim to
 * @param {string} newNickname the nickname for the new pokemon the user has claimed
 * @param {list of strings} oldClaims the old pokemon that the user has moved their claim away from
 * @param {string} oldNickname the former nickname for the formerly-claimed pokemon
 * @returns the formatted error string
 */
function generateSuccessfulClaimChangeString(user, newClaims, newNickname, oldClaims, oldNickname) {
	const capitalizedNewClaims = newClaims.map(pokemon => toCapitalCase(pokemon));
	const capitalizedOldClaims = oldClaims.map(pokemon => toCapitalCase(pokemon));
	return user + ', you\'ve successfully claimed the nickname "' + newNickname + '" for '
    + generateListString(capitalizedNewClaims) + '. Your old nickname claim of "' + oldNickname + '" for '
    + generateListString(capitalizedOldClaims) + ' has been removed.';
}

/**
 * Generates the output string for then a user successfully removes all of their claims from the system
 * @param {string} user the user executing the command
 * @param {list of strings} oldClaims the pokemon that the user had claimed, but are no longer claimed
 * @param {Date} nextClaimDate the next date the user can claim a date
 * @returns the formatted error string
 */
function generateSuccessfulRemovalString(user, oldClaims, nextClaimDate) {
	const capitalizedOldClaims = oldClaims.map(pokemon => toCapitalCase(pokemon));
	return user + ', you have successfully removed your claims for ' + generateListString(capitalizedOldClaims)
    + ' from the system. If you would like to claim a pokemon again, please wait until ' + nextClaimDate.toDateString() + ' before using the \'claim\' command again.';
}

/**
 * Generates the output string for when the database was unable to update the given pokemon
 * @param {list of strings} addErrors the new pokemon being claimed that had errors
 * @param {list of strings} removeErrors the pokemon whose claims were being removed that had errors
 * @returns the formatted error string
 */
function generateDBEditErrors(addErrors, removeErrors) {
	let errorString = 'DatabaseEditError: ';
	if (addErrors != undefined && addErrors.length > 0) {
		errorString += 'Error setting nicknames for '
        + generateListString(addErrors.map(errorPokemon => toCapitalCase(errorPokemon))) + '. ';
	}
	if (removeErrors != undefined && removeErrors.length > 0) {
		errorString += 'Error removing nicknames for '
        + generateListString(removeErrors.map(errorPokemon => toCapitalCase(errorPokemon))) + '. ';
	}

	if (errorString.length > 0) {
		errorString += 'Please contact a moderator so they can manually add them. ' + CONTACTKENNYISSUESSTRING;
	}

	return errorString;
}

/**
 * Generates the string for when the user made a claim within the last 3 months, but removed it
 * @param {string} user the user who executed the message
 * @param {Date} nextClaimDate the next date that the user can claim a Pokemon
 * @returns the formatted string
 */
function generateRemovedClaimString(user, nextClaimDate) {
	return user + ', you have removed a claim within the last three months. The next time you can claim a Pokemon is ' + nextClaimDate.toDateString();
}

/**
 * Generates the name of the claims table from the discord server's name
 * It strips away any non-alphanumeric characters, then appends 'ClaimsTable' to the end
 * Examples:
 * Server Name: KungFu Krew -> KungFuKrewClaimsTable
 * Server Name: Ta6's Terrible Server -> Ta6sTerribleServerClaimsTable
 * @param {string} serverName the name of the discord server
 * @returns the name of the discord's claim table
 */
function generateClaimsTableName(serverName) {
	return serverName.replace(/[^a-zA-Z0-9]+/g, '') + 'ClaimsTable';
}

function generateDatabaseErrorString() {
	return 'Database Error: An Error Occurred in the database. Please wait a while before trying again as this is likely an outage. If the issue persists, contact Kenny on discord at bobbyrune94#9138';
}

/**
 * Generates the usage information for the directions command
 * @returns the formatted info string
 */
function generateDirectionsCommandInfoString() {
	return '**/directions**: View usage instructions for this discord bot\n';
}

/**
 * Generates the usage information for the claim command
 * @returns the formatted info string
 */
function generateClaimCommandInfoString() {
	return '**/claim**: Claim a Pokemon (and its evolutionary line) for the streamer to use in a nuzlocke. \n' +
		'\t - /claim default [pokemon] [nickname]\n' +
			'\t\t - Ex: /claim eevee buddy\n' +
		'\t - /claim gendered [pokemon] [male nickname] [female nickname]\n' +
			'\t\t - Ex: /claim eevee adam eve\n';
}

/**
 * Generates the usage information for the view command
 * @returns the formatted info string
 */
function generateViewCommandInfoString() {
	return '**/view**: View claim data for either yourself or a given Pokemon\n' +
	'\t - /view claim” to view your claims\n' +
	'\t - /view pokemon [pokemon]” to see if a Pokemon has been claimed\n' +
		'\t\t - Ex: /view pokemon eevee\n';
}

/**
 * Generates the usage information for the edit command
 * @returns the formatted info string
 */
function generateEditCommandInfoString() {
	return '**/edit**: Edit the nickname for your existing claim.\n' +
	'\t - /edit default [new nickname]\n' +
		'\t\t - Ex: /edit fluffy\n' +
	'\t - /edit gendered [new male nickname] [new female nickname]\n' +
		'\t\t - Ex: /edit king queen\n';
}

/**
 * Generates the usage information for the change command
 * @returns the formatted info string
 */
function generateChangeCommandInfoString() {
	return '**/change**: Changes your claim from one Pokemon line to another. Note: you can only do this once every 3 months.\n' +
	'\t - /change default [new pokemon] [new nickname]\n' +
		'\t\t - Ex: /change default shinx tiger\n' +
	'\t - /change gendered [new pokemon] [new male nickname] [new female nickname]\n' +
		'\t\t - Ex: /change gendered shinx tiggs tigress\n';
}

/**
 * Generates the usage information for the remove command
 * @returns the formatted info string
 */
function generateRemoveCommandInfoString() {
	return '**/remove**: Removes your existing claims. Once you remove a claim, you will still not be able to make another claim until 3 months after your original claim was made.\n' +
	'\t - /remove\n';
}

/**
 * Generates the notes for Pokemon name formatting
 * @returns the formatted info string
 */
function generatePokemonNameNotes() {
	return 'Pokemon names have some name-formatting anomalies to make note of\n' +
	'\t - For Farfetch\'d and Sirfetch\'d, remove the apostrophe\n' +
		'\t\t - Ex: /claim farfetchd birdo\n' +
	'\t - For the Mime family, put a dash (-) instead of a space\n' +
		'\t\t - Ex: /claim mr-mime clown\n' +
	'\t - For regional variants, put the pokemon name, then a dash (-), then the region name\n' +
		'\t\t - Ex: /claim vulpix tails (kantonian) or /claim vulpix-alola tails (alolan)\n';
}

/**
 * Generates the invalid command selection string for the directions select menu
 * @returns the formatted info string
 */
function generateInvalidCommandNameString() {
	return 'Invalid command selection. Please try again';
}

/**
 * Generates the string to display all necessary information on how to use the bot commands
 * @returns the formatted string
 */
function generateAllCommandInfoString() {
	return 'Discord Bot Commands:\n' +
	generateDirectionsCommandInfoString + generateClaimCommandInfoString + generateViewCommandInfoString() +
	generateEditCommandInfoString() + generateChangeCommandInfoString() + generateRemoveCommandInfoString() +
	'**Notes**:\n' + generatePokemonNameNotes() + CONTACTKENNYINFOSTRING;
}

module.exports = { CONTACTKENNYISSUESSTRING, CONTACTKENNYINFOSTRING, toCapitalCase, generateInvalidNameString, generateInvalidGenderedNickname,
	generatePokemonAlreadyClaimedString, generateNoUserClaimString, generateUserClaimString,
	generateUserAlreadyClaimedString, generateSuccessfulClaimString, generateViewClaimAlreadyClaimedString,
	generateViewClaimNotClaimedString, generateDBEditErrors, generateGenderedNickname,
	generateSuccessfulUpdateString, generateEarlyClaimChangeString, generateSuccessfulClaimChangeString,
	generateSuccessfulRemovalString, generateCommandString, generateListString, sendEphemeralMessage, generateAllCommandInfoString,
	generateRemovedClaimString, generateDirectionsCommandInfoString, generateClaimCommandInfoString, generateViewCommandInfoString,
	generateEditCommandInfoString, generateChangeCommandInfoString, generateRemoveCommandInfoString, generatePokemonNameNotes,
	generateInvalidCommandNameString, generateClaimsTableName, generateDatabaseErrorString, sendDeferredEphemeralMessage };