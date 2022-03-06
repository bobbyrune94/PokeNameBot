const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, removeClaimFromDatabase } = require('../utils/database-utils');
const { generateNoUserClaimString, generateDBEditErrors, generateSuccessfulRemovalString,
	toCapitalCase, sendEphemeralMessage } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Delete your claim from the system'),
	async execute(interaction) {
		const user = interaction.user.username;
		const userClaim = getUserClaims(user);
		if (userClaim == undefined) {
			return sendEphemeralMessage(interaction, generateNoUserClaimString(user));
		}

		// TODO: replace this once the database API is designed to parse the response
		const claimedPokemon = ['happiny', 'chansey', 'blissey']; // something like userClaim.claimedPokemonList

		let errorClaims = [];
		claimedPokemon.forEach(pokemon => {
			if (!removeClaimFromDatabase(pokemon)) {
				console.log('Error removing claim for ' + toCapitalCase(pokemon));
				errorClaims += pokemon;
			}
		});

		if (errorClaims.length > 0) {
			return sendEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			console.log('Claims removed successfully');
			return sendEphemeralMessage(interaction, generateSuccessfulRemovalString(user, claimedPokemon));
		}
	},
};