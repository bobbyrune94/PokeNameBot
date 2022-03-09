const pokemonEvoLines = require('../pokemon-evolution-lines.json');
const genderAnomalyPokemon = require('../pokemon-gender-anomaly.json');
const { addMonths } = require('./date-utils.js');
const { toCapitalCase, generateListString, generateInvalidGenderedNickname,
	generateGenderedNickname } = require('./string-utils.js');

/**
 * Queries the claims database to add the user and nickname claims for the pokemon
 * @param {string} pokemon the pokemon to add the claim to
 * @param {string} user the user that claimed the pokemon
 * @param {string} nickname the nickname for the pokemon
 * @param {boolean} isPermanent whether the claim is permament
 * @returns whether the database edit was successful
 */
function addClaimToDatabase(pokemon, user, nickname, isPermanent) {
	const nextChangeDate = addMonths(Date.now(), 3);
	console.log('Adding claim for ' + toCapitalCase(pokemon) + ' from ' + user + ' as ' + nickname + ' Next Date to Change Claim: ' + nextChangeDate.toDateString());
	isPermanent ? console.log('Claim will be permanent') : console.log('Claim will not be permanent and deleted after 1 year');
	// TODO: update with API call to database once it is set up
	console.log('Successfully added claim for ' + toCapitalCase(pokemon) + ' into database.');
	return true;
}

/**
 * Edits the claims database to remove the claim from the pokemon.
 * Keeps the database entry, but clears the user, nickname, and timestamp fields
 * @param {string} pokemon the pokemon to remove the claim from
 * @returns whether the database edit was successful
 */
function removeClaimFromDatabase(pokemon) {
	console.log('Removing claim from ' + toCapitalCase(pokemon));
	// TODO: update with API call to database once it is set up
	console.log('Successfully removed claim for ' + toCapitalCase(pokemon) + ' from database.');
	return true;
}

/**
 * Queries the claims database to get all of the claims that a user has placed
 * @param {string} user the user to get the claims for
 * @returns all claims that the user has made formatted as a JSON object
 */
function getUserClaims(user) {
	console.log('Getting all Claims for ' + user);
	// TODO: update with API call to database once it is set up
	console.log('Retrieved ' + user + '\'s claim from the database.');
	return undefined;
}

/**
 * Queries the claims database to get the claim data for a certain pokemon
 * @param {string} pokemon the pokemon to get claim data for
 * @returns the claim data for the associated pokemon
 */
function getPokemonClaim(pokemon) {
	console.log('Getting claim for ' + toCapitalCase(pokemon));
	// TODO: update with API call to claims database once it is set up
	console.log('Retrieved ' + toCapitalCase(pokemon) + '\'s claim data from the database.');
	return undefined;
}

/**
 * Queries the evo-line database to check if the given argument is a valid pokemon name
 * @param {string} name the name of the pokemon name to check
 * @returns whether the name parameter is a valid claimable pokemon name
 */
function isValidPokemon(name) {
	// TODO: replace with API query to evo-lines database
	console.log('Checking if ' + name + ' is a valid Pokemon');
	const isValid = name in pokemonEvoLines;

	isValid ? console.log(name + ' is a valid Pokemon name.') : console.log(name + ' is not a valid Pokemon name.');
	return isValid;
}

/**
 * Queries the evo-line database to get the evolutionary line for the given pokemon
 * @param {string} pokemon the pokemon name to get the evolutionary line to
 * @returns the list of pokemon in the argument's evolutionary line
 */
function getPokemonEvolutionaryLine(pokemon) {
	// TODO: replace with API query to evo-lines database
	console.log('Getting the evolutionary line for ' + pokemon);
	const evoLine = pokemonEvoLines[pokemon];
	console.log('Evolutionary line for ' + pokemon + ': ' + generateListString(evoLine));
	return evoLine;
}

/**
 * Queries the gender-anomaly database to check if the given pokemon is a gender anomaly
 * Gender anomalies include all pokemon who are genderless, only males, and only females
 * @param {string} pokemon the pokemon to check for
 * @returns whether the pokemon is an anomaly. True if it is, false if it has two genders
 */
function isGenderAnomalyPokemon(pokemon) {
	// TODO: replace with API query to gender-anomalies database
	console.log('Checking if ' + pokemon + ' is a gender anomaly');

	const isGenderless = genderAnomalyPokemon['genderless'].includes(pokemon);
	const isOnlyMale = genderAnomalyPokemon['only_male'].includes(pokemon);
	const isOnlyFemale = genderAnomalyPokemon['only_female'].includes(pokemon);

	if (isGenderless) {
		console.log(pokemon + ' are genderless pokemon.');
	}
	else if (isOnlyMale) {
		console.log(pokemon + ' are only male pokemon.');
	}
	else if (isOnlyFemale) {
		console.log(pokemon + ' are only female pokemon.');
	}
	return [isGenderless, isOnlyMale, isOnlyFemale];
}

/**
 * Generates the nickname for the pokemon from getting the subcommands and options from the interaction.
 * Will return an error message when the interaction makes a gendered nickname claim when the pokemon doesn't have two genders
 * @param {Interaction} interaction the interaction to parse
 * @param {string} pokemon the pokemon getting nicknamed
 * @returns the properly formatted nickname or the InvalidGenderedClaimError message
 */
function getNicknameFromInteraction(interaction, pokemon) {
	console.log('Getting Nickname for ' + toCapitalCase(pokemon));
	if (interaction.options.getSubcommand() === 'default') {
		const nickname = interaction.options.getString('nickname');
		console.log('Got nickname for ' + toCapitalCase(pokemon) + ' as ' + nickname);
		return nickname;
	}
	else if (interaction.options.getSubcommand() === 'gendered') {
		const genderAnomalyArray = isGenderAnomalyPokemon(pokemon);
		if (genderAnomalyArray.includes(true)) {
			return generateInvalidGenderedNickname(pokemon, genderAnomalyArray);
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
 * @returns a JSON object with 'claimRoles' and 'permaClaimRoles' as fields with their associated lists of roles
 */
function getClaimableRoles(server) {
	console.log('Getting claimable roles for server ' + server);
	// TODO: update with API call to roles database once it is set up
	console.log('Retrieved claimable roles for server.');
	return {
		'claimRoles': ['@everyone'],
		'permaClaimRoles': ['@everyone'],
	};
}

/**
 * Checks if the user that sent a message has the roles necessary to make a claim or a permanent claim
 * @param {Member} member the member executing a command
 * @param {string} server the name of the discord server
 * @returns a two-element boolean array where the first element represents whether the user can make a claim
 * and the second element represents whether the claim will be permanent.
 */
function canUserMakeClaim(member, server) {
	const claimRoles = getClaimableRoles(server);

	console.log('Checking if ' + member.user.username + ' has the appropriate roles to make a claim.');
	const userRoles = member.roles.cache;

	// eslint-disable-next-line prefer-const
	let canClaimArray = [false, false];
	userRoles.each(role => {
		console.log('Checking if ' + role.name + ' can make a claim in the system');
		if (claimRoles['claimRoles'].includes(role.name)) {
			console.log('User has ' + role.name + ' role, allowing them to make a claim in the system');
			canClaimArray[0] = true;
		}
		if (claimRoles['permaClaimRoles'].includes(role.name)) {
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
function addEntryToRemoveClaimTable(user, server, nextClaimDate) {
	console.log('Adding ' + user + '\'s removed claim in the ' + server + ' to the database.');
	// TODO: add entry to the remove-claims database
	console.log('Entry has been added. The next time you can claim is ' + nextClaimDate.toDateString());
	return true;
}

/**
 * Removes an entry from the remove-claim table. This is most likely due to the next-claim date expiring
 * @param {string} user the username of the person who removed their claim
 * @param {string} server the name of the discord server the command was executed in
 * @returns true if the entry was successfully removed, false if there was an error
 */
function removeEntryFromRemoveClaimTable(user, server) {
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
 * @returns undefined if the user can make a claim, the next possible claim date if not
 */
function didUserRemoveClaim(user, server) {
	console.log('Checking Remove Claims Database for ' + user + ' from ' + server);
	// TODO: add query for remove-claims database for user and server
	const removedClaim = undefined;
	console.log('Retrieved remove claim data');

	if (removedClaim != undefined) {
		console.log('No entry found in remove-claims table');
		return undefined;
	}

	const nextClaimDate = new Date('2022-01-20');
	if (nextClaimDate > Date.now()) {
		console.log('User made a claim within the past 3 months. The next available claim date is ' + nextClaimDate.toDateString());
		return nextClaimDate;
	}
	console.log('User made a claim that they removed more than 3 months ago. Removing claim from remove-claim table.');
	removeEntryFromRemoveClaimTable(user, server);
	return undefined;
}

module.exports = { addClaimToDatabase, removeClaimFromDatabase, getUserClaims, getPokemonClaim, canUserMakeClaim,
	isValidPokemon, getPokemonEvolutionaryLine, getNicknameFromInteraction, didUserRemoveClaim, addEntryToRemoveClaimTable };