/**
 * The string to display when requiring users to contact the system designer and builder for any serious issues.
 */
const CONTACTKENNYSTRING = 'If there are further issues, contact Kenny on Discord at bobbyrune94#9138.';

function sendEphemeralMessage(interaction, string) {
	interaction.reply({
		content: string,
		ephemeral: true,
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

/**
 * Generates the error output string for a pokemon that has a gender anomaly, but is getting claimed with gender-specific nicknames
 * Will return separate messages depending on if it's a genderless, only male, or only female pokemon
 * @param {*} pokemon the pokemon with a gender-anomaly
 * @param {*} genderAnomalyArray the array representing which gender-anomaly the pokemon has
 * @returns the formatted error string
 */
function generateInvalidGenderedNickname(pokemon, genderAnomalyArray) {
	if (genderAnomalyArray.length != 3) {
		return 'InvalidGenderedClaimError: Invalid Gender Anomaly Array ' + generateListString(genderAnomalyArray)
        + ' Please contact Kenny on Discord at bobbyrune94#9138 so he can investigate this issue';
	}
	if (genderAnomalyArray[0] == true) {
		return 'InvalidGenderedClaimError: ' + toCapitalCase(pokemon) + ' has a genderless evolutionary line. Please try again with the "default" subcommand.';
	}
	else if (genderAnomalyArray[1] == true) {
		return 'InvalidGenderedClaimError: ' + toCapitalCase(pokemon) + ' has a male-only evolutionary line. Please try again with the "default" subcommand.';
	}
	else if (genderAnomalyArray[2] == true) {
		return 'InvalidGenderedClaimError: ' + toCapitalCase(pokemon) + ' has a female-only evolutionary line. Please try again with the "default" subcommand.';
	}
}

/**
 * Generates the output string for when a user views a claimable pokemon and doesn't have a claim of their own
 * @param {string} user the user executing the command
 * @param {string} pokemon the pokemon the user is checking the claims for
 * @returns the formatted error string
 */
function generateViewClaimNoUserClaimString(user, pokemon) {
	return user + ', ' + toCapitalCase(pokemon)
    + ' has not been claimed yet and you have not claimed a Pokemon yet. Use the "/claim" command if you wish to claim it.';
}

/**
 * Generates the output string for when a user views a claimable pokemon, but has already made a claim of their own.
 * @param {string} user the user executing the command
 * @param {string} pokemon the pokemon the user is checking claims for
 * @returns the formatted error string
 */
function generateViewClaimUserHasClaimString(user, pokemon) {
	return user + ', ' + toCapitalCase(pokemon)
    + ' has not been claimed yet, but you have already claimed a Pokemon. Use the "/change" command if you want to change your claim.';
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
 * @returns the formatted error string
 */
function generateSuccessfulRemovalString(user, oldClaims) {
	const capitalizedOldClaims = oldClaims.map(pokemon => toCapitalCase(pokemon));
	return user + ', you have successfully removed your claims for ' + generateListString(capitalizedOldClaims)
    + ' from the system. If you would like to claim a pokemon again, use the "/claim" command';
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
		errorString += 'Please contact a moderator so they can manually add them. ' + CONTACTKENNYSTRING;
	}

	return errorString;
}

module.exports = { CONTACTKENNYSTRING, toCapitalCase, generateInvalidNameString, generateInvalidGenderedNickname,
	generatePokemonAlreadyClaimedString, generateNoUserClaimString, generateUserClaimString,
	generateUserAlreadyClaimedString, generateSuccessfulClaimString, generateViewClaimNoUserClaimString,
	generateViewClaimUserHasClaimString, generateDBEditErrors, generateGenderedNickname,
	generateSuccessfulUpdateString, generateEarlyClaimChangeString, generateSuccessfulClaimChangeString,
	generateSuccessfulRemovalString, generateCommandString, generateListString, sendEphemeralMessage };