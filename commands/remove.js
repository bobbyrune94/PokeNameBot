const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, removeClaimFromDatabase, addEntryToRemoveClaimTable } = require('../utils/database-utils');
const { generateNoUserClaimString, generateDBEditErrors, generateSuccessfulRemovalString,
	toCapitalCase, sendEphemeralMessage } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Delete your claim from the system'),
	// eslint-disable-next-line no-unused-vars
	async execute(interaction, isPermanent) {
		const user = interaction.user.username;
		const userClaim = getUserClaims(user);
		if (userClaim == undefined) {
			return sendEphemeralMessage(interaction, generateNoUserClaimString(user));
		}

		// TODO: replace this once the database API is designed to parse the response
		const claimedPokemon = ['happiny', 'chansey', 'blissey']; // something like userClaim.claimedPokemonList
		const expireDate = new Date('2022-04-06'); // something like userClaim.expireDate

		let errorClaims = [];
		claimedPokemon.forEach(pokemon => {
			if (!removeClaimFromDatabase(pokemon)) {
				console.log('Error removing claim for ' + toCapitalCase(pokemon));
				errorClaims += pokemon;
			}
		});

		if (!addEntryToRemoveClaimTable(user, interaction.guild.name, expireDate)) {
			console.error('Error removing ' + user + '\'s entry from remove-claims database');
		}

		if (errorClaims.length > 0) {
			return sendEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			console.log('Claims removed successfully');
			return sendEphemeralMessage(interaction, generateSuccessfulRemovalString(user, claimedPokemon, expireDate));
		}
	},
};