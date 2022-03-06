const { SlashCommandBuilder } = require('@discordjs/builders');
const { getPokemonClaim, getUserClaims, isValidPokemon } = require('../utils/database-utils');
const { generateInvalidNameString, generateViewClaimNoUserClaimString, generateViewClaimUserHasClaimString,
	generateNoUserClaimString, generateUserClaimString, sendEphemeralMessage } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('view')
		.setDescription('View your claims or if a Pokemon has already been claimed')
		.addSubcommand(subcommand =>
			subcommand
				.setName('pokemon')
				.setDescription('Check if a Pokemon is available to claim')
				.addStringOption(option =>
					option
						.setName('pokemon')
						.setDescription('Select the Pokemon to check')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('claim')
				.setDescription('Check your own claim if it exists'),
		),
	async execute(interaction) {
		const user = interaction.user.username;
		if (interaction.options.getSubcommand() === 'pokemon') {
			const pokemon = interaction.options.getString('pokemon').toLowerCase();

			if (!isValidPokemon(pokemon)) {
				return sendEphemeralMessage(interaction, generateInvalidNameString(pokemon));
			}

			if (getPokemonClaim(pokemon) != undefined) {
				return sendEphemeralMessage(interaction, generateViewClaimNoUserClaimString(user, pokemon));
			}
			else {
				return sendEphemeralMessage(interaction, generateViewClaimUserHasClaimString(user, pokemon));
			}
		}
		else if (interaction.options.getSubcommand() === 'claim') {
			const userClaim = getUserClaims(user);
			if (userClaim == undefined) {
				return sendEphemeralMessage(interaction, generateNoUserClaimString(user));
			}
			else {
				// TODO: fill in with data from API response
				const claimedPokemon = ['pokemon1', 'pokemon2']; // something like userClaim.claimedPokemonList
				const nickname = 'nickname'; // something like userClaim.nickname
				return sendEphemeralMessage(interaction, generateUserClaimString(user, claimedPokemon, nickname));
			}
		}
	},
};