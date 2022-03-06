const pokemonEvoLines = require('../pokemon-evolution-lines.json');
const genderAnomalyPokemon = require('../pokemon-gender-anomaly.json');
const { toCapitalCase, generateListString, generateInvalidGenderedNickname,
	generateGenderedNickname } = require('./string-utils.js');

/**
 * Queries the claims database to add the user and nickname claims for the pokemon
 * @param {string} pokemon the pokemon to add the claim to
 * @param {string} user the user that claimed the pokemon
 * @param {string} nickname the nickname for the pokemon
 * @returns whether the database edit was successful
 */
function addClaimToDatabase(pokemon, user, nickname) {
	console.log('Adding claim for ' + toCapitalCase(pokemon) + ' from ' + user + ' as ' + nickname);
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
 * Gets the subscriber role for the provided server or returns undefined if the role doesn't exist
 * An 'undefined' return means that any member of the server can claim a pokemon
 * @param {string} server the discord server name
 * @returns the subscriber role for the server or undefined if there is none
 */
function getSubscriberRole(server) {
	console.log('Getting subscriber role for server ' + server);
	// TODO: update with API call to roles database once it is set up
	console.log('Retrieved subscriber role for server.');
	return undefined;
}

module.exports = { addClaimToDatabase, removeClaimFromDatabase, getUserClaims, getPokemonClaim, getSubscriberRole,
	isValidPokemon, getPokemonEvolutionaryLine, isGenderAnomalyPokemon, getNicknameFromInteraction };