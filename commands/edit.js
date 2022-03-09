const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, addClaimToDatabase, getNicknameFromInteraction } = require('../utils/database-utils');
const { generateNoUserClaimString, generateDBEditErrors, generateSuccessfulUpdateString,
	toCapitalCase, sendEphemeralMessage } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('edit')
		.setDescription('Edit the nickname for your existing claim')
		.addSubcommand(subcommand =>
			subcommand
				.setName('default')
				.setDescription('If you wish to give one nickname for any gender of the pokemon')
				.addStringOption(option =>
					option
						.setName('new-nickname')
						.setDescription('The new nickname for your pokemon')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('gendered')
				.setDescription('If you wish to give different nickname depending on the gender of the pokemon')
				.addStringOption(option =>
					option
						.setName('new-male-nickname')
						.setDescription('The new nickname for a MALE pokemon')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('new-female-nickname')
						.setDescription('The new nickname for a FEMALE pokemon')
						.setRequired(true),
				),
		),
	async execute(interaction, isPermanent) {
		const user = interaction.user.username;

		const userClaim = getUserClaims(user);
		if (userClaim == undefined) {
			return sendEphemeralMessage(interaction, generateNoUserClaimString(user));
		}

		// TODO: replace this once the database API is designed to parse the response
		const claimedPokemon = ['blissey']; // something like userClaim.claimedPokemonList

		const nickname = getNicknameFromInteraction(interaction, claimedPokemon[0]);
		if (nickname.includes('InvalidGenderedClaimError')) {
			return sendEphemeralMessage(interaction, nickname);
		}

		let errorClaims = [];
		claimedPokemon.forEach(pokemon => {
			if (!addClaimToDatabase(pokemon, user, nickname, isPermanent)) {
				console.log('Error adding claim for ' + toCapitalCase(pokemon));
				errorClaims += pokemon;
			}
		});

		if (errorClaims.length > 0) {
			return sendEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			console.log('Nickname has been updated successfully');
			return sendEphemeralMessage(interaction, generateSuccessfulUpdateString(user, claimedPokemon, nickname));
		}
	},
};