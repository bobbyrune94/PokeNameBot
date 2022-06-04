/* eslint-disable no-undef */
const axios = require('axios');
const emojiRegex = require('emoji-regex');
const { logMessage } = require('./logging-utils.js');
const { toCapitalCase, generateInvalidGenderedNickname, generateGenderedNickname, generateClaimsTableName,
	CONTACTKENNYISSUESSTRING, INVALIDPOKEMONNAMESTRING, INVALIDSERVERNAME, NOCLAIMSSTRING, NOREMOVECLAIMDATA,
	ERRORCLAIMSTRING, CLAIMSFORMATTINGERROR, INVALIDNICKNAMEERROR, TWOGENDEREDSTRING } = require('./string-utils.js');

const emojis = emojiRegex();

/**
 * Queries the claims database to add the user and nickname claims for the pokemon
 * @param {string} serverName the name of the server the command was called in
 * @param {string} pokemon the pokemon to add the claim to
 * @param {string} userId the discord Id of the user that claimed the pokemon
 * @param {string} username the discord username of the user that claimed the pokemon
 * @param {string} nickname the nickname for the pokemon
 * @param {boolean} isPermanent whether the claim is permament
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns whether the database edit was successful
 */
async function addClaimToDatabase(serverName, pokemon, userId, username, nickname, nextChangeDate, isPermanent, interactionId) {
	const claimsTableName = generateClaimsTableName(serverName);

	logMessage('Adding claim for ' + toCapitalCase(pokemon) + ' from ' + userId + ' in table ' + claimsTableName + ' as "'
	+ nickname + '". Next Date to Change Claim: ' + nextChangeDate.toDateString(), interactionId);
	isPermanent ? logMessage('Claim will be permanent', interactionId) : logMessage('Claim will not be permanent and deleted after 1 year', interactionId);
	let successful = false;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimtablesaddclaim',
		{
			'table-name': claimsTableName,
			'pokemon': pokemon,
			'discord-id': userId,
			'discord-username': username,
			'nickname': nickname,
			'next-change-date': nextChangeDate,
			'is-permanent': isPermanent,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Successfully added claim for ' + toCapitalCase(pokemon) + ' into ' + claimsTableName + ' database.', interactionId);
				successful = true;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return successful;
}

/**
 * Edits the claims database to remove the claim from the pokemon.
 * Keeps the database entry, but clears the user, nickname, and timestamp fields
 * @param {string} pokemon the pokemon to remove the claim from
 * @param {string} serverName the name of the discord server the command was called in
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns whether the database edit was successful
 */
async function removeClaimFromDatabase(pokemon, serverName, interactionId) {
	logMessage('Removing claim from ' + toCapitalCase(pokemon), interactionId);

	const claimsTableName = generateClaimsTableName(serverName);
	let successful = false;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimtablesremoveclaim',
		{
			'table-name': claimsTableName,
			'pokemon': pokemon,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Successfully removed claim for ' + toCapitalCase(pokemon) + ' in ' + claimsTableName + ' database.', interactionId);
				successful = true;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return successful;
}

/**
 * Formats the given response into a simplified JSON object for the bot to consume
 * @param {string} userId the discord Id of the user that claimed the pokemon
 * @param {string} username the discord username of the user that claimed the pokemon
 * @param {[Object]} response API response from GetUserClaims
 * @returns the simplified JSON object or error string if there was an error with the claims
 */
function formatUserClaims(userId, username, response) {
	const pokemonClaimed = [];
	let nickname = undefined;
	let nextChangeDate = undefined;
	let isPermanent = undefined;
	response.forEach(claim => {
		pokemonClaimed.push(claim['pokemon']);

		if (nickname == undefined) { // ensure the nickname is consistent among all claims
			nickname = claim['nickname'];
		}
		else {
			if (claim['nickname'] != nickname) {
				return ERRORCLAIMSTRING;
			}
		}

		if (nextChangeDate == undefined) { // ensure the next-change-date is consistent among all claims
			nextChangeDate = claim['next-change-date'];
		}
		else {
			if (claim['next-change-date'] != nextChangeDate) {
				return ERRORCLAIMSTRING;
			}
		}

		if (isPermanent == undefined) { // ensure the permanence is consistent among all claims
			isPermanent = claim['is-permanent'];
		}
		else {
			if (claim['is-permanent'] != isPermanent) {
				return ERRORCLAIMSTRING;
			}
		}
	});
	return {
		'claimed-pokemon': pokemonClaimed,
		'nickname': nickname,
		'discord-id': userId,
		'discord-username': username,
		'next-change-date': nextChangeDate,
		'is-permanent': isPermanent,
	};
}

/**
 * Queries the claims database to get all of the claims that a user has placed
 * @param {string} userId the discord Id of the user that claimed the pokemon
 * @param {string} username the discord username of the user that claimed the pokemon
 * @param {string} serverName the name of the discord server the user called the command in
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns all claims that the user has made formatted as a JSON object
 */
async function getUserClaims(userId, username, serverName, interactionId) {
	const claimsTableName = generateClaimsTableName(serverName);
	logMessage('Getting all Claims for ' + userId + ' in ' + claimsTableName, interactionId);
	let userClaims = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimtablesgetuserclaim',
		{
			'table-name': claimsTableName,
			'discord-id': userId,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Got User Claim: ' + JSON.stringify(result['data']['body']), interactionId);
				const formattedClaims = formatUserClaims(userId, username, result['data']['body']);
				if (formattedClaims == ERRORCLAIMSTRING) {
					logMessage('Error formatting user claims. Some of the fields may be mismatched', interactionId);
					userClaims = CLAIMSFORMATTINGERROR + ': Error formatting user claims ' + JSON.stringify(result['data']['body']) +
					' Please contact a moderator to resolve this issue. ' + CONTACTKENNYISSUESSTRING;
				}
				else {
					logMessage('Successfully formatted user claims into following object: ' + JSON.stringify(formattedClaims), interactionId);
					userClaims = formattedClaims;
				}
			}
			else if (statusCode == 404) {
				logMessage('No Claims Found for ' + userId, interactionId);
				userClaims = NOCLAIMSSTRING;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return userClaims;
}

/**
 * Queries the claims database to get the claim data for a certain pokemon
 * @param {string} pokemon the pokemon to get claim data for
 * @param {string} serverName the name of the discord server the command was called in
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns the claim data for the associated pokemon
 */
async function getPokemonClaim(pokemon, serverName, interactionId) {
	const claimsTableName = generateClaimsTableName(serverName);
	logMessage('Getting claim for ' + toCapitalCase(pokemon), interactionId);
	let pokemonClaim = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimtablesgetpokemonclaim',
		{
			'table-name': claimsTableName,
			'pokemon': pokemon,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Got Pokemon Claim: ' + JSON.stringify(result['data']['body']), interactionId);
				pokemonClaim = result['data']['body'];
			}
			else if (statusCode == 404) {
				logMessage('Invalid Pokemon Name', interactionId);
				pokemonClaim = INVALIDPOKEMONNAMESTRING;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return pokemonClaim;
}

/**
 * Queries the evo-line database to get the evolutionary line for the given pokemon
 * @param {string} pokemon the pokemon name to get the evolutionary line to
 * @param {string} interactionId the id of the interaction that called this function. Used for logging purposes
 * @returns the list of pokemon in the argument's evolutionary line,
 * UndefinedPokemon if the pokemon doesn't exist,
 * or undefined if there was an error
 */
async function getPokemonEvolutionaryLine(pokemon, interactionId) {
	// TODO: replace with API query to evo-lines database
	logMessage('Getting the evolutionary line for ' + pokemon, interactionId);

	let evoline = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/evolinetableget',
		{
			'pokemon': pokemon,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Database Evolution Line: ' + JSON.stringify(result['data']['body']), interactionId);
				evoline = result['data']['body'];
			}
			else if (statusCode == 404) {
				logMessage('Invalid pokemon name', interactionId);
				evoline = INVALIDPOKEMONNAMESTRING;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return evoline;
}

/**
 * Queries the gender-anomaly database to check if the given pokemon is a gender anomaly
 * Gender anomalies include all pokemon who are genderless, only males, and only females
 * @param {string} pokemon the pokemon to check for
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns the string representation of the pokemon's gender situation
 * 'genderless', 'only_male', or 'only_female' if there is an anomaly
 * 'two_gendered' if the pokemon can be male or female
 * undefined if there was an issue
 */
async function isGenderAnomalyPokemon(pokemon, interactionId) {
	// TODO: replace with API query to gender-anomalies database
	logMessage('Checking if ' + pokemon + ' is a gender anomaly', interactionId);

	let anomaly = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/genderanomalytableget',
		{
			'pokemon': pokemon,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Claim Roles: ' + JSON.stringify(result['data']['body']), interactionId);
				anomaly = result['data']['body'];
			}
			else if (statusCode == 404) {
				logMessage('Pokemon Has Two Genders', interactionId);
				anomaly = TWOGENDEREDSTRING;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return anomaly;
}

/**
 * Validates that the nickname follows the following rules:
 * No discord server emotes (animated or static)
 * No emojis
 * Less than 12 characters in length
 * @param {string} nickname the nickname to validate
 * @param {Interaction} interaction the interaction that triggered this function. Used for logging purposes
 * @returns the nickname if it's a valid nickname, otherwsie a string containing InvalidNicknameError
 */
function validateNickname(nickname, interaction) {
	if (nickname.match(/<:.+?:\d+>/g)) {
		const errorMessage = INVALIDNICKNAMEERROR + ': Nickname cannot contain static discord emotes.';
		logMessage(errorMessage, interaction.id);
		return errorMessage;
	}
	else if (nickname.match(/<a:.+?:\d+>|<:.+?:\d+>/g)) {
		const errorMessage = INVALIDNICKNAMEERROR + ': Nickname cannot contain animated discord emotes.';
		logMessage(errorMessage, interaction.id);
		return errorMessage;
	}
	else if (nickname.match(emojis)) {
		const errorMessage = INVALIDNICKNAMEERROR + ': Nickname cannot contain emojis.';
		logMessage(errorMessage, interaction.id);
		return errorMessage;
	}
	else if (nickname.length > 12) {
		const errorMessage = INVALIDNICKNAMEERROR + ': Nickname length is greater than 12 characters.';
		logMessage(errorMessage, interaction.id);
		return errorMessage;
	}
	logMessage(nickname + ' is a valid nickname', interaction.id);
	return nickname;
}

/**
 * Generates the nickname for the pokemon from getting the subcommands and options from the interaction.
 * Will return an error message when the interaction makes a gendered nickname claim when the pokemon doesn't have two genders
 * @param {Interaction} interaction the interaction to parse
 * @param {string} pokemon the pokemon getting nicknamed
 * @returns the properly formatted nickname or the InvalidGenderedClaimError message
 */
async function getNicknameFromInteraction(interaction, pokemon) {
	logMessage('Getting Nickname for ' + toCapitalCase(pokemon), interaction.id);
	if (interaction.options.getSubcommand() === 'default') {
		const nickname = interaction.options.getString('nickname');
		logMessage('Got nickname for ' + toCapitalCase(pokemon) + ' as ' + nickname, interaction.id);
		return validateNickname(nickname, interaction);
	}
	else if (interaction.options.getSubcommand() === 'gendered') {
		const anomalyString = await isGenderAnomalyPokemon(pokemon, interaction.id);
		if (anomalyString != TWOGENDEREDSTRING) {
			return generateInvalidGenderedNickname(pokemon, anomalyString);
		}

		const maleNickname = validateNickname(interaction.options.getString('male-nickname'), interaction);
		if (maleNickname.includes(INVALIDNICKNAMEERROR)) {
			return maleNickname;
		}

		const femaleNickname = validateNickname(interaction.options.getString('female-nickname'), interaction);
		if (femaleNickname.includes(INVALIDNICKNAMEERROR)) {
			return femaleNickname;
		}

		const formattedGenderNicknames = generateGenderedNickname(maleNickname, femaleNickname);
		logMessage('Generated the formatted string for the gender nicknames for ' + toCapitalCase(pokemon) + ': ' + formattedGenderNicknames, interaction.id);

		return formattedGenderNicknames;
	}
}

/**
 * Queries the claimable-role database to get the roles in a discord server that are allowed to make claims
 * The database is expected to return two values: claimRoles and permanentClaimRoles
 * claimRoles represents the roles that are allowed to make claims. Claims, be default, will clear after 1 year. An empty array represents that anyone can make a claim
 * permanentClaimRoles represent those roles who can make permanent claims that won't clear after 1 year. An empty array represents that all claims are permanent
 * @param {string} server the discord server name
 * @param {string} interactionId the id for the interaction that called this function. Used for logging purposes
 * @returns a JSON object with 'claim-roles' and 'perma-claim-roles' as fields with their associated lists of roles
 */
async function getClaimableRoles(server, interactionId) {
	logMessage('Getting claimable roles for server ' + server, interactionId);
	let claimRoles = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimrolestableget',
		{
			'server-name': server,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Claim Roles: ' + JSON.stringify(result['data']['body']), interactionId);
				claimRoles = result['data']['body'];
			}
			else if (statusCode == 404) {
				logMessage('Invalid Server Name: ' + server, interactionId);
				evoline = INVALIDSERVERNAME;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	logMessage('Retrieved claimable roles for server.', interactionId);
	return claimRoles;
}

/**
 * Checks if the user that sent a message has the roles necessary to make a claim or a permanent claim
 * @param {Member} member the member executing a command
 * @param {string} server the name of the discord server
 * @param {string} interactionId the id of the interaction that is being checked. Used for logging purposes
 * @returns a two-element boolean array where the first element represents whether the user can make a claim
 * and the second element represents whether the claim will be permanent.
 */
async function canUserMakeClaim(member, server, interactionId) {
	const claimRoles = await getClaimableRoles(server, interactionId);

	if (claimRoles == INVALIDSERVERNAME) {
		logMessage('INVALIDSERVERERROR: Server has not been onboarded to system yet', interactionId);
		return [false, false];
	}
	else if (claimRoles == undefined) {
		return [false, false];
	}

	logMessage('Checking if ' + member.user.username + ' has the appropriate roles to make a claim.', interactionId);
	const userRoles = member.roles.cache;
	logMessage('User\'s roles: ' + JSON.stringify(userRoles));

	if (claimRoles['perma-claim-roles'].includes('@everyone')) {
		logMessage('Everyone is allowed to make permanent claims. Allowing user to make claims', interactionId);
		return [true, true];
	}

	if (claimRoles['claim-roles'].includes('@everyone')) {
		logMessage('Everyone is allowed to make a claim in this server.', interactionId);
		canClaimArray[0] = true;
	}

	// eslint-disable-next-line prefer-const
	let canClaimArray = [false, false];
	for (const role of userRoles) {
		const roleId = role[1].id;
		logMessage('Checking if ' + role.name + ' can make a claim in the system', interactionId);
		// if user hasn't been determined to make a claim yet
		if (!canClaimArray[0]) {
			if (claimRoles['claim-roles'].includes(roleId)) {
				logMessage('User has ' + role.name + ' role, allowing them to make a claim in the system', interactionId);
				canClaimArray[0] = true;
			}
		}

		// if user hasn't been determined to make a permanent claim
		if (!canClaimArray[1] && claimRoles['perma-claim-roles'].length > 0) {
			if (claimRoles['perma-claim-roles'].includes(roleId)) {
				logMessage('User has ' + role.name + ' role, allowing them to make a permanent claim in the system', interactionId);
				canClaimArray[1] = true;
				canClaimArray[0] = true; // a permanent claim role allows them to make a claim
				break;
			}
		}
	}

	return canClaimArray;
}

/**
 * Adds an entry into the remove-claim table with the provided information
 * @param {string} userId the discord Id of the user that claimed the pokemon
 * @param {string} server the name of the discord server the command was executed in
 * @param {Date} nextClaimDate the next available date the user can make a claim
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns true if the entry was added, false if there was an error
 */
async function addEntryToRemoveClaimTable(userId, server, nextClaimDate, interactionId) {
	logMessage('Adding ' + userId + '\'s removed claim in the ' + server + ' to the database.', interactionId);
	let successful = false;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/removedclaimstableadd',
		{
			'discord-id': userId,
			'server-name': server,
			'next-claim-date': nextClaimDate,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Entry has been added. The next time you can claim is ' + nextClaimDate.toDateString(), interactionId);
				successful = true;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return successful;
}

/**
 * Removes an entry from the remove-claim table. This is most likely due to the next-claim date expiring
 * @param {string} userId the discord Id of the user that claimed the pokemon
 * @param {string} server the name of the discord server the command was executed in
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns true if the entry was successfully removed, false if there was an error
 */
async function removeEntryFromRemoveClaimTable(userId, server, interactionId) {
	logMessage('Removing entry in remove-claims database for ' + userId + ' in discord server ' + server, interactionId);
	let successful = false;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/removedclaimstableremove',
		{
			'discord-id': userId,
			'server-name': server,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Removed-Claims entry has been removed. ' + userId + ' can now claim another pokemon.', interactionId);
				successful = true;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	return successful;
}

/**
 * Searches the remove-claims database for a user's claim data and determines if the user can make a claim
 * If the user made a claim greater than 3 months ago, the entry will be removed from the database
 * This is to prevent people from removing claims and immediately re-claiming something
 * @param {string} userId the discord Id of the user that claimed the pokemon
 * @param {string} server the name of the server
 * @param {string} interactionId the id of the interaction that triggered this function. Used for logging purposes
 * @returns the next available claim date if the user made a claim within the last three months
 * false if the user can make a claim now (either no entry or entry > 3 months old)
 * undefined if there was an error
 */
async function didUserRemoveClaim(userId, server, interactionId) {
	logMessage('Checking Remove Claims Database for ' + userId + ' from ' + server, interactionId);

	let nextClaimDate = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/removedclaimstableget',
		{
			'discord-id': userId,
			'server-name': server,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				logMessage('Remove-Claim Data: ' + JSON.stringify(result['data']['body']), interactionId);
				nextClaimDate = result['data']['body'];
			}
			else if (statusCode == 404) {
				logMessage('No Remove-Claim Data Found', interactionId);
				nextClaimDate = NOREMOVECLAIMDATA;
			}
			else {
				logMessage(result['data']['body'], interactionId);
			}
		})
		.catch(error => {
			logMessage(error, interactionId);
		});
	logMessage('Retrieved remove claim data', interactionId);

	if (nextClaimDate == NOREMOVECLAIMDATA) {
		logMessage('No entry found in remove-claims table', interactionId);
		return false;
	}
	if (nextClaimDate == undefined) {
		logMessage('Unknown ddb error occurred', interactionId);
		return undefined;
	}

	const returnedDate = new Date(nextClaimDate);
	if (returnedDate > Date.now()) {
		logMessage('User made a claim within the past 3 months. The next available claim date is ' + returnedDate.toDateString(), interactionId);
		return nextClaimDate;
	}
	logMessage('User made a claim that they removed more than 3 months ago. Removing claim from remove-claim table.', interactionId);
	await removeEntryFromRemoveClaimTable(userId, server, interactionId);
	return false;
}

module.exports = { addClaimToDatabase, removeClaimFromDatabase, getUserClaims, getPokemonClaim, canUserMakeClaim, NOCLAIMSSTRING,
	getPokemonEvolutionaryLine, getNicknameFromInteraction, didUserRemoveClaim, addEntryToRemoveClaimTable, INVALIDPOKEMONNAMESTRING,
	CLAIMSFORMATTINGERROR, INVALIDNICKNAMEERROR };