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
		interaction.deferReply({ ephemeral: true }).catch(err => {
			logMessage('Error Deferring Reploy: ' + err.toString(), interaction.id);
		});
		const user = interaction.user.username;
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

			else if (pokemonClaim['username'] != UNDEFINEDENTRY) {
				logMessage('Pokemon has already been claimed', interaction.id);
				const username = pokemonClaim['username'];
				const nickname = pokemonClaim['nickname'];
				return sendDeferredEphemeralMessage(interaction, generateViewClaimAlreadyClaimedString(user, pokemon, evoline, username, nickname));
			}
			else {
				logMessage('Pokemon has not yet been claimed', interaction.id);
				return sendDeferredEphemeralMessage(interaction, generateViewClaimNotClaimedString(user, pokemon, evoline));
			}
		}
		else if (interaction.options.getSubcommand() === 'claim') {
			const userClaim = await getUserClaims(user, serverName, interaction.id);
			if (userClaim == undefined) {
				return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
			}
			else if (userClaim === NOCLAIMSSTRING) {
				const nextClaimDate = await didUserRemoveClaim(user, serverName, interaction.id);
				if (nextClaimDate != undefined && nextClaimDate != false) {
					return sendDeferredEphemeralMessage(interaction, generateRemovedClaimString(user, nextClaimDate));
				}
				return sendDeferredEphemeralMessage(interaction, generateNoUserClaimString(user));
			}
			else if (typeof userClaim == 'string' && userClaim.includes(CLAIMSFORMATTINGERROR)) {
				return sendDeferredEphemeralMessage(interaction, userClaim);
			}
			else {
				const claimedPokemon = userClaim['claimed-pokemon'];
				const nickname = userClaim['nickname'];
				if (claimedPokemon == undefined || claimedPokemon.length == 0) {
					return sendDeferredEphemeralMessage(interaction, generateNoUserClaimString(user));
				}
				return sendDeferredEphemeralMessage(interaction, generateUserClaimString(user, claimedPokemon, nickname));
			}
		}
	},
};