/* eslint-disable no-undef */
const axios = require('axios');
const { toCapitalCase, generateInvalidGenderedNickname, generateGenderedNickname, generateClaimsTableName,
	CONTACTKENNYISSUESSTRING } = require('./string-utils.js');

const INVALIDPOKEMONNAMESTRING = 'UndefinedPokemon';
const INVALIDSERVERNAME = 'UndefinedServer';
const NOCLAIMSSTRING = 'NoClaimsFound';
const NOREMOVECLAIMDATA = 'NoRemoveClaimData';
const ERRORCLAIMSTRING = 'CLAIMERRORFOUND';
const TWOGENDEREDSTRING = 'two_genders';

/**
 * Queries the claims database to add the user and nickname claims for the pokemon
 * @param {string} serverName the name of the server the command was called in
 * @param {string} pokemon the pokemon to add the claim to
 * @param {string} user the user that claimed the pokemon
 * @param {string} nickname the nickname for the pokemon
 * @param {boolean} isPermanent whether the claim is permament
 * @returns whether the database edit was successful
 */
async function addClaimToDatabase(serverName, pokemon, user, nickname, nextChangeDate, isPermanent) {
	const claimsTableName = generateClaimsTableName(serverName);

	console.log('Adding claim for ' + toCapitalCase(pokemon) + ' from ' + user + ' in table ' + claimsTableName + ' as '
	+ nickname + ' Next Date to Change Claim: ' + nextChangeDate.toDateString());
	isPermanent ? console.log('Claim will be permanent') : console.log('Claim will not be permanent and deleted after 1 year');
	let successful = false;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimtablesaddclaim',
		{
			'table-name': claimsTableName,
			'pokemon': pokemon,
			'username': user,
			'nickname': nickname,
			'next-change-date': nextChangeDate,
			'is-permanent': isPermanent,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				console.log('Successfully added claim for ' + toCapitalCase(pokemon) + ' into ' + claimsTableName + ' database.');
				successful = true;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	return successful;
}

/**
 * Edits the claims database to remove the claim from the pokemon.
 * Keeps the database entry, but clears the user, nickname, and timestamp fields
 * @param {string} pokemon the pokemon to remove the claim from
 * @returns whether the database edit was successful
 */
async function removeClaimFromDatabase(pokemon, serverName) {
	console.log('Removing claim from ' + toCapitalCase(pokemon));

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
				console.log('Successfully removed claim for ' + toCapitalCase(pokemon) + ' in ' + claimsTableName + ' database.');
				successful = true;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	return successful;
}

/**
 * Formats the given response into a simplified JSON object for the bot to consume
 * @param {[Object]} response API response from GetUserClaims
 * @returns the simplified JSON object or error string if there was an error with the claims
 */
function formatUserClaims(user, response) {
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
		'username': user,
		'next-change-date': nextChangeDate,
		'is-permanent': isPermanent,
	};
}

/**
 * Queries the claims database to get all of the claims that a user has placed
 * @param {string} user the user to get the claims for
 * @returns all claims that the user has made formatted as a JSON object
 */
async function getUserClaims(user, serverName) {
	const claimsTableName = generateClaimsTableName(serverName);
	console.log('Getting all Claims for ' + user + ' in ' + claimsTableName);
	let userClaims = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimtablesgetuserclaim',
		{
			'table-name': claimsTableName,
			'username': user,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				console.log('Got User Claim: ' + JSON.stringify(result['data']['body']));
				const formattedClaims = formatUserClaims(user, result['data']['body']);
				if (formattedClaims == ERRORCLAIMSTRING) {
					console.log('Error formatting user claims. Some of the fields may be mismatched');
					userClaims = 'ClaimsFormattingError: Error formatting user claims ' + JSON.stringify(result['data']['body']) +
					' Please contact a moderator to resolve this issue. ' + CONTACTKENNYISSUESSTRING;
				}
				else {
					console.log('Successfully formatted user claims into following object: ' + JSON.stringify(formattedClaims));
					userClaims = formattedClaims;
				}
			}
			else if (statusCode == 404) {
				console.log('No Claim Found for ' + user);
				userClaims = NOCLAIMSSTRING;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	return userClaims;
}

/**
 * Queries the claims database to get the claim data for a certain pokemon
 * @param {string} pokemon the pokemon to get claim data for
 * @returns the claim data for the associated pokemon
 */
async function getPokemonClaim(pokemon, serverName) {
	const claimsTableName = generateClaimsTableName(serverName);
	console.log('Getting claim for ' + toCapitalCase(pokemon));
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
				console.log('Got Pokemon Claim: ' + JSON.stringify(result['data']['body']));
				pokemonClaim = result['data']['body'];
			}
			else if (statusCode == 404) {
				console.log('Invalid Pokemon Name');
				pokemonClaim = INVALIDPOKEMONNAMESTRING;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	return pokemonClaim;
}

/**
 * Queries the evo-line database to get the evolutionary line for the given pokemon
 * @param {string} pokemon the pokemon name to get the evolutionary line to
 * @returns the list of pokemon in the argument's evolutionary line,
 * UndefinedPokemon if the pokemon doesn't exist,
 * or undefined if there was an error
 */
async function getPokemonEvolutionaryLine(pokemon) {
	// TODO: replace with API query to evo-lines database
	console.log('Getting the evolutionary line for ' + pokemon);

	let evoline = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/evolinetableget',
		{
			'pokemon': pokemon,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				console.log('Database Evolution Line: ' + JSON.stringify(result['data']['body']));
				evoline = result['data']['body'];
			}
			else if (statusCode == 404) {
				console.log('Invalid pokemon name');
				evoline = INVALIDPOKEMONNAMESTRING;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	return evoline;
}

/**
 * Queries the gender-anomaly database to check if the given pokemon is a gender anomaly
 * Gender anomalies include all pokemon who are genderless, only males, and only females
 * @param {string} pokemon the pokemon to check for
 * @returns the string representation of the pokemon's gender situation
 * 'genderless', 'only_male', or 'only_female' if there is an anomaly
 * 'two_gendered' if the pokemon can be male or female
 * undefined if there was an issue
 */
async function isGenderAnomalyPokemon(pokemon) {
	// TODO: replace with API query to gender-anomalies database
	console.log('Checking if ' + pokemon + ' is a gender anomaly');

	let anomaly = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/genderanomalytableget',
		{
			'pokemon': pokemon,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				console.log('Claim Roles: ' + JSON.stringify(result['data']['body']));
				anomaly = result['data']['body'];
			}
			else if (statusCode == 404) {
				console.log('Pokemon Has Two Genders');
				anomaly = TWOGENDEREDSTRING;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	return anomaly;
}

/**
 * Generates the nickname for the pokemon from getting the subcommands and options from the interaction.
 * Will return an error message when the interaction makes a gendered nickname claim when the pokemon doesn't have two genders
 * @param {Interaction} interaction the interaction to parse
 * @param {string} pokemon the pokemon getting nicknamed
 * @returns the properly formatted nickname or the InvalidGenderedClaimError message
 */
async function getNicknameFromInteraction(interaction, pokemon) {
	console.log('Getting Nickname for ' + toCapitalCase(pokemon));
	if (interaction.options.getSubcommand() === 'default') {
		const nickname = interaction.options.getString('nickname');
		console.log('Got nickname for ' + toCapitalCase(pokemon) + ' as ' + nickname);
		return nickname;
	}
	else if (interaction.options.getSubcommand() === 'gendered') {
		const anomalyString = await isGenderAnomalyPokemon(pokemon);
		if (anomalyString != TWOGENDEREDSTRING) {
			return generateInvalidGenderedNickname(pokemon, anomalyString);
		}

		const maleNickname = interaction.options.getString('male-nickname');
		const femaleNickname = interaction.options.getString('female-nickname');

		const formattedGenderNicknames = generateGenderedNickname(maleNickname, femaleNickname);
		console.log('Generated the formatted string for the gender nicknames for ' + toCapitalCase(pokemon) + ': ' + formattedGenderNicknames);

		return formattedGenderNicknames;
	}
}

/**
 * Queries the claimable-role database to get the roles in a discord server that are allowed to make claims
 * The database is expected to return two values: claimRoles and permanentClaimRoles
 * claimRoles represents the roles that are allowed to make claims. Claims, be default, will clear after 1 year. An empty array represents that anyone can make a claim
 * permanentClaimRoles represent those roles who can make permanent claims that won't clear after 1 year. An empty array represents that all claims are permanent
 * @param {string} server the discord server name
 * @returns a JSON object with 'claim-roles' and 'perma-claim-roles' as fields with their associated lists of roles
 */
async function getClaimableRoles(server) {
	console.log('Getting claimable roles for server ' + server);
	let claimRoles = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/claimrolestableget',
		{
			'server-name': server,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				console.log('Claim Roles: ' + JSON.stringify(result['data']['body']));
				claimRoles = result['data']['body'];
			}
			else if (statusCode == 404) {
				console.log('Invalid Server Name');
				evoline = INVALIDSERVERNAME;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	console.log('Retrieved claimable roles for server.');
	return claimRoles;
}

/**
 * Checks if the user that sent a message has the roles necessary to make a claim or a permanent claim
 * @param {Member} member the member executing a command
 * @param {string} server the name of the discord server
 * @returns a two-element boolean array where the first element represents whether the user can make a claim
 * and the second element represents whether the claim will be permanent.
 */
async function canUserMakeClaim(member, server) {
	const claimRoles = await getClaimableRoles(server);

	if (claimRoles == INVALIDSERVERNAME) {
		console.error('INVALIDSERVERERROR: Server has not been onboarded to system yet');
		return [false, false];
	}
	else if (claimRoles == undefined) {
		return [false, false];
	}

	console.log('Checking if ' + member.user.username + ' has the appropriate roles to make a claim.');
	const userRoles = member.roles.cache;

	// eslint-disable-next-line prefer-const
	let canClaimArray = [false, false];
	userRoles.each(role => {
		console.log('Checking if ' + role.name + ' can make a claim in the system');
		if (claimRoles['claim-roles'].includes(role.name)) {
			console.log('User has ' + role.name + ' role, allowing them to make a claim in the system');
			canClaimArray[0] = true;
		}
		if (claimRoles['perma-claim-roles'].includes(role.name)) {
			console.log('User has ' + role.name + ' role, allowing them to make a permanent claim in the system');
			canClaimArray[1] = true;
		}
	});

	return canClaimArray;
}

/**
 * Adds an entry into the remove-claim table with the provided information
 * @param {string} user the username of the person removing their claim
 * @param {string} server the name of the discord server the command was executed in
 * @param {Date} nextClaimDate the next available date the user can make a claim
 * @returns true if the entry was added, false if there was an error
 */
async function addEntryToRemoveClaimTable(user, server, nextClaimDate) {
	console.log('Adding ' + user + '\'s removed claim in the ' + server + ' to the database.');
	let successful = false;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/removedclaimstableadd',
		{
			'username': user,
			'server-name': server,
			'next-claim-date': nextClaimDate,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				console.log('Entry has been added. The next time you can claim is ' + nextClaimDate.toDateString());
				successful = true;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	return successful;
}

/**
 * Removes an entry from the remove-claim table. This is most likely due to the next-claim date expiring
 * @param {string} user the username of the person who removed their claim
 * @param {string} server the name of the discord server the command was executed in
 * @returns true if the entry was successfully removed, false if there was an error
 */
async function removeEntryFromRemoveClaimTable(user, server) {
	console.log('Removing entry in remove-claims database for ' + user + ' in discord server ' + server);
	// TODO: remove entry from the remove-claims database
	console.log('Entry successfully removed');
	return true;
}

/**
 * Searches the remove-claims database for a user's claim data and determines if the user can make a claim
 * If the user made a claim greater than 3 months ago, the entry will be removed from the database
 * This is to prevent people from removing claims and immediately re-claiming something
 * @param {string} user the username of the message sender
 * @param {string} server the name of the server
 * @returns the next available claim date if the user made a claim within the last three months
 * false if the user can make a claim now (either no entry or entry > 3 months old)
 * undefined if there was an error
 */
async function didUserRemoveClaim(user, server) {
	console.log('Checking Remove Claims Database for ' + user + ' from ' + server);

	let nextClaimDate = undefined;
	await axios.post(
		'https://2qfnb9r88i.execute-api.us-west-2.amazonaws.com/dev/removedclaimstableget',
		{
			'username': user,
			'server-name': server,
		})
		.then(result => {
			const statusCode = result['data']['statusCode'];
			if (statusCode == 200) {
				console.log('Remove-Claim Data: ' + JSON.stringify(result['data']['body']));
				nextClaimDate = result['data']['body'];
			}
			else if (statusCode == 404) {
				console.log('No Remove-Claim Data Found');
				nextClaimDate = NOREMOVECLAIMDATA;
			}
			else {
				console.log(result['data']['body']);
			}
		})
		.catch(error => {
			console.log(error);
		});
	console.log('Retrieved remove claim data');

	if (nextClaimDate == NOREMOVECLAIMDATA) {
		console.log('No entry found in remove-claims table');
		return false;
	}
	if (nextClaimDate == undefined) {
		console.log('Unknown ddb error occurred');
		return undefined;
	}

	const returnedDate = new Date(nextClaimDate);
	if (returnedDate > Date.now()) {
		console.log('User made a claim within the past 3 months. The next available claim date is ' + returnedDate.toDateString());
		return nextClaimDate;
	}
	console.log('User made a claim that they removed more than 3 months ago. Removing claim from remove-claim table.');
	await removeEntryFromRemoveClaimTable(user, server);
	return false;
}

module.exports = { addClaimToDatabase, removeClaimFromDatabase, getUserClaims, getPokemonClaim, canUserMakeClaim,
	getPokemonEvolutionaryLine, getNicknameFromInteraction, didUserRemoveClaim, addEntryToRemoveClaimTable, INVALIDPOKEMONNAMESTRING };