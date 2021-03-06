const { SlashCommandBuilder } = require('@discordjs/builders');
const { getPokemonClaim, getUserClaims, NOCLAIMSSTRING, didUserRemoveClaim, INVALIDPOKEMONNAMESTRING,
	getPokemonEvolutionaryLine, CLAIMSFORMATTINGERROR } = require('../utils/database-utils');
const { logMessage } = require('../utils/logging-utils');
const { generateInvalidNameString, generateViewClaimAlreadyClaimedString, generateViewClaimNotClaimedString,
	generateNoUserClaimString, generateUserClaimString, sendDeferredEphemeralMessage,
	generateRemovedClaimString, generateDatabaseErrorString, UNDEFINEDENTRY } = require('../utils/string-utils');

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
	// eslint-disable-next-line no-unused-vars
	async execute(interaction, isPermanent) {
		const userId = interaction.user.id;
		const username = interaction.member.nickname != null ? interaction.member.nickname : interaction.user.username;

		const serverName = interaction.guild.name;

		if (interaction.options.getSubcommand() === 'pokemon') {
			const pokemon = interaction.options.getString('pokemon').toLowerCase();
			const pokemonClaim = await getPokemonClaim(pokemon, serverName, interaction.id);
			if (pokemonClaim == INVALIDPOKEMONNAMESTRING) {
				return sendDeferredEphemeralMessage(interaction, generateInvalidNameString(pokemon));
			}
			else if (pokemonClaim == undefined) {
				return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
			}

			const evoline = await getPokemonEvolutionaryLine(pokemon, interaction.id);
			if (evoline == undefined) {
				return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
			}

			else if (pokemonClaim['discord-id'] != UNDEFINEDENTRY) {
				logMessage('Pokemon has already been claimed', interaction.id);
				const claimer = pokemonClaim['discord-username'];
				const nickname = pokemonClaim['nickname'];
				return sendDeferredEphemeralMessage(interaction, generateViewClaimAlreadyClaimedString(pokemon, evoline, claimer, nickname));
			}
			else {
				logMessage('Pokemon has not yet been claimed', interaction.id);
				return sendDeferredEphemeralMessage(interaction, generateViewClaimNotClaimedString(pokemon, evoline));
			}
		}
		else if (interaction.options.getSubcommand() === 'claim') {
			const userClaim = await getUserClaims(userId, username, serverName, interaction.id);
			if (userClaim == undefined) {
				return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
			}
			else if (userClaim === NOCLAIMSSTRING) {
				const nextClaimDate = await didUserRemoveClaim(userId, serverName, interaction.id);
				if (nextClaimDate != undefined && nextClaimDate != false) {
					return sendDeferredEphemeralMessage(interaction, generateRemovedClaimString(nextClaimDate));
				}
				return sendDeferredEphemeralMessage(interaction, generateNoUserClaimString());
			}
			else if (typeof userClaim == 'string' && userClaim.includes(CLAIMSFORMATTINGERROR)) {
				return sendDeferredEphemeralMessage(interaction, userClaim);
			}
			else {
				const claimedPokemon = userClaim['claimed-pokemon'];
				const nickname = userClaim['nickname'];
				const nextChangeDate = new Date(userClaim['next-change-date']);
				if (claimedPokemon == undefined || claimedPokemon.length == 0) {
					return sendDeferredEphemeralMessage(interaction, generateNoUserClaimString());
				}
				return sendDeferredEphemeralMessage(interaction, generateUserClaimString(claimedPokemon, nickname, nextChangeDate));
			}
		}
	},
};