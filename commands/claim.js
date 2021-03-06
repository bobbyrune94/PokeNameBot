const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, addClaimToDatabase, getPokemonClaim,
	getPokemonEvolutionaryLine, getNicknameFromInteraction, didUserRemoveClaim, INVALIDPOKEMONNAMESTRING,
	CLAIMSFORMATTINGERROR, INVALIDNICKNAMEERROR } = require('../utils/database-utils');
const { addMonths } = require('../utils/date-utils');
const { logMessage } = require('../utils/logging-utils');
const { toCapitalCase, generateInvalidNameString, generateUserAlreadyClaimedString, generateDBEditErrors,
	generatePokemonAlreadyClaimedString, generateSuccessfulClaimString, sendDeferredEphemeralMessage,
	generateRemovedClaimString, generateDatabaseErrorString, UNDEFINEDENTRY, INVALIDGENDEREDCLAIMERROR } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('claim')
		.setDescription('Claim a pokemon for your streamer to nickname in their playthrough')
		.addSubcommand(subcommand =>
			subcommand
				.setName('default')
				.setDescription('If you wish to give one nickname for any gender of the pokemon')
				.addStringOption(option =>
					option
						.setName('pokemon')
						.setDescription('The pokemon you want to claim')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('nickname')
						.setDescription('The nickname for your pokemon')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('gendered')
				.setDescription('If you wish to give different nickname depending on the gender of the pokemon')
				.addStringOption(option =>
					option
						.setName('pokemon')
						.setDescription('The pokemon you want to claim')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('male-nickname')
						.setDescription('The nickname for a MALE pokemon')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('female-nickname')
						.setDescription('The nickname for a FEMALE pokemon')
						.setRequired(true),
				),
		),
	async execute(interaction, isPermanent) {
		const userId = interaction.user.id;
		const username = interaction.member.nickname != null ? interaction.member.nickname : interaction.user.username;
		const serverName = interaction.guild.name;
		const pokemon_name = interaction.options.getString('pokemon').toLowerCase();

		const userClaim = await getUserClaims(userId, username, interaction.guild.name, interaction.id);
		if (userClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		else if (typeof userClaim == 'object') {
			logMessage('User claim found, unable to make claim', interaction.id);
			const nextChangeDate = new Date(userClaim['next-change-date']);
			return sendDeferredEphemeralMessage(interaction, generateUserAlreadyClaimedString(nextChangeDate));
		}
		else if (typeof userClaim == 'string' && userClaim.includes(CLAIMSFORMATTINGERROR)) {
			return sendDeferredEphemeralMessage(interaction, userClaim);
		}

		const nextClaimDate = await didUserRemoveClaim(userId, serverName, interaction.id);
		if (nextClaimDate == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		else if (typeof nextClaimDate == 'string') {
			return sendDeferredEphemeralMessage(interaction, generateRemovedClaimString(new Date(nextClaimDate)));
		}

		const pokemonClaim = await getPokemonClaim(pokemon_name, interaction.guild.name, interaction.id);
		if (pokemonClaim == INVALIDPOKEMONNAMESTRING) {
			return sendDeferredEphemeralMessage(interaction, generateInvalidNameString(pokemon_name));
		}
		else if (pokemonClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		if (pokemonClaim['nickname'] != UNDEFINEDENTRY) {
			return sendDeferredEphemeralMessage(interaction, generatePokemonAlreadyClaimedString(pokemon_name));
		}

		const evoLine = await getPokemonEvolutionaryLine(pokemon_name, interaction.id);
		if (evoLine == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}

		const nickname = await getNicknameFromInteraction(interaction, pokemon_name, interaction.id);
		if (nickname.includes(INVALIDGENDEREDCLAIMERROR) || nickname.includes(INVALIDNICKNAMEERROR)) {
			return sendDeferredEphemeralMessage(interaction, nickname);
		}

		const newChangeDate = addMonths(new Date(Date.now()), 3, interaction.id);

		let errorClaims = [];
		for (const index in evoLine) {
			const pokemon = evoLine[index];
			if (!(await addClaimToDatabase(serverName, pokemon, userId, username, nickname, newChangeDate, isPermanent, interaction.id))) {
				logMessage('Error adding claim for ' + toCapitalCase(pokemon), interaction.id);
				errorClaims += pokemon;
			}
		}

		if (errorClaims.length > 0) {
			return sendDeferredEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			logMessage('Claim has been made successfully.', interaction.id);
			return sendDeferredEphemeralMessage(interaction, generateSuccessfulClaimString(evoLine, nickname));
		}
	},
};