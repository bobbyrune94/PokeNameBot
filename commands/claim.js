const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, addClaimToDatabase, getPokemonClaim,
	getPokemonEvolutionaryLine, getNicknameFromInteraction, didUserRemoveClaim,
	INVALIDPOKEMONNAMESTRING } = require('../utils/database-utils');
const { addMonths } = require('../utils/date-utils');
const { toCapitalCase, generateInvalidNameString, generateUserAlreadyClaimedString, generateDBEditErrors,
	generatePokemonAlreadyClaimedString, generateSuccessfulClaimString, sendDeferredEphemeralMessage,
	generateRemovedClaimString, generateDatabaseErrorString } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('claim')
		.setDescription('Claim a pokemon for your streamer to nickname in their nuzlocke')
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
		interaction.deferReply({ ephemeral: true });

		const user = interaction.user.username;
		const serverName = interaction.guild.name;
		const pokemon_name = interaction.options.getString('pokemon').toLowerCase();

		const userClaim = await getUserClaims(user, interaction.guild.name);
		if (userClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		else if (typeof userClaim == 'object') {
			console.log('User claim found, unable to make claim');
			const nextChangeDate = new Date(userClaim['next-change-date']);
			return sendDeferredEphemeralMessage(interaction, generateUserAlreadyClaimedString(user, nextChangeDate));
		}
		else if (typeof userClaim == 'string' && userClaim.includes('ClaimsFormattingError')) {
			return sendDeferredEphemeralMessage(interaction, userClaim);
		}

		const nextClaimDate = await didUserRemoveClaim(user, serverName);
		if (nextClaimDate == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		else if (typeof nextClaimDate == 'string') {
			return sendDeferredEphemeralMessage(interaction, generateRemovedClaimString(user, new Date(nextClaimDate)));
		}

		const pokemonClaim = await getPokemonClaim(pokemon_name, interaction.guild.name);
		if (pokemonClaim == INVALIDPOKEMONNAMESTRING) {
			return sendDeferredEphemeralMessage(interaction, generateInvalidNameString(pokemon_name));
		}
		else if (pokemonClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		if (pokemonClaim['nickname'] != 'UNDEFINED') {
			return sendDeferredEphemeralMessage(interaction, generatePokemonAlreadyClaimedString(pokemon_name));
		}

		const evoLine = await getPokemonEvolutionaryLine(pokemon_name);
		if (evoLine == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}

		const nickname = await getNicknameFromInteraction(interaction, pokemon_name);
		if (nickname.includes('InvalidGenderedClaimError')) {
			return sendDeferredEphemeralMessage(interaction, nickname);
		}

		const newChangeDate = addMonths(new Date(Date.now()), 3);

		let errorClaims = [];
		for (const index in evoLine) {
			const pokemon = evoLine[index];
			if (!(await addClaimToDatabase(serverName, pokemon, user, nickname, newChangeDate, isPermanent))) {
				console.log('Error adding claim for ' + toCapitalCase(pokemon));
				errorClaims += pokemon;
			}
		}

		if (errorClaims.length > 0) {
			return sendDeferredEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			console.log('Claim has been made successfully.');
			return sendDeferredEphemeralMessage(interaction, generateSuccessfulClaimString(user, evoLine, nickname));
		}
	},
};