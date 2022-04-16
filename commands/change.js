const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, addClaimToDatabase, getPokemonClaim, removeClaimFromDatabase,
	INVALIDPOKEMONNAMESTRING, getPokemonEvolutionaryLine, getNicknameFromInteraction,
	NOCLAIMSSTRING } = require('../utils/database-utils');
const { addMonths } = require('../utils/date-utils');
const { logMessage } = require('../utils/logging-utils');
const { toCapitalCase, generateInvalidNameString, generateNoUserClaimString, generateDBEditErrors,
	generatePokemonAlreadyClaimedString, generateEarlyClaimChangeString,
	generateSuccessfulClaimChangeString, sendDeferredEphemeralMessage, generateDatabaseErrorString } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('change')
		.setDescription('Change your existing claim to a different pokemon')
		.addSubcommand(subcommand =>
			subcommand
				.setName('default')
				.setDescription('If you wish to give one nickname for any gender of the pokemon')
				.addStringOption(option =>
					option
						.setName('pokemon')
						.setDescription('The pokemon you want to change your claim to')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('nickname')
						.setDescription('The nickname for your new claim')
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
						.setDescription('The pokemon you want to change your claim to')
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
		interaction.deferReply({ ephemeral: true }).catch(err => {
			logMessage('Error Deferring Reploy: ' + err.toString(), interaction.id);
		});

		const user = interaction.user.username;
		const serverName = interaction.guild.name;
		const pokemon_name = interaction.options.getString('pokemon').toLowerCase();

		const pokemonClaim = await getPokemonClaim(pokemon_name, serverName, interaction.id);
		if (pokemonClaim == INVALIDPOKEMONNAMESTRING) {
			return sendDeferredEphemeralMessage(interaction, generateInvalidNameString(pokemon_name));
		}
		else if (pokemonClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		if (pokemonClaim['nickname'] != 'UNDEFINED') {
			return sendDeferredEphemeralMessage(interaction, generatePokemonAlreadyClaimedString(pokemon_name));
		}

		const userClaim = await getUserClaims(user, serverName, interaction.id);
		if (userClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		else if (userClaim == NOCLAIMSSTRING) {
			return sendDeferredEphemeralMessage(interaction, generateNoUserClaimString(user));
		}
		else if (typeof userClaim == 'string' && userClaim.includes('ClaimsFormattingError')) {
			return sendDeferredEphemeralMessage(interaction, userClaim);
		}

		const oldNickname = userClaim['nickname'];
		const oldClaims = userClaim['claimed-pokemon'];
		const changeClaimDate = new Date(Date.parse(userClaim['next-change-date']));

		logMessage('Checking if the change occurred too early. Current date ' + new Date(Date.now()) + ' must be after ' + changeClaimDate.toDateString(), interaction.id);
		if (new Date(Date.now()) < changeClaimDate) {
			logMessage('Claim change was too early', interaction.id);
			return sendDeferredEphemeralMessage(interaction, generateEarlyClaimChangeString(user, changeClaimDate));
		}
		logMessage('Claim is past 3 month change threshold. Continuing', interaction.id);

		const newNickname = await getNicknameFromInteraction(interaction, pokemon_name);
		if (newNickname.includes('InvalidGenderedClaimError') || newNickname.includes('InvalidNicknameError')) {
			return sendDeferredEphemeralMessage(interaction, newNickname);
		}

		const newEvoLine = await getPokemonEvolutionaryLine(pokemon_name, interaction.id);
		const newChangeDate = addMonths(new Date(Date.now()), 3, interaction.id);

		let addClaimErrors = [];
		for (const index in newEvoLine) {
			const pokemon = newEvoLine[index];
			if (!(await addClaimToDatabase(serverName, pokemon, user, newNickname, newChangeDate, isPermanent, interaction.id))) {
				logMessage('Error adding claim for ' + toCapitalCase(pokemon), interaction.id);
				addClaimErrors += pokemon;
			}
		}

		let removeClaimErrors = [];
		for (const index in oldClaims) {
			const pokemon = oldClaims[index];
			if (!removeClaimFromDatabase(pokemon, serverName, interaction.id)) {
				logMessage('Error removing claim for ' + toCapitalCase(pokemon), interaction.id);
				removeClaimErrors += pokemon;
			}
		}

		if (addClaimErrors.length > 0 || removeClaimErrors.length > 0) {
			return sendDeferredEphemeralMessage(interaction, generateDBEditErrors(addClaimErrors, removeClaimErrors));
		}
		else {
			logMessage('Claim has been changed successfully.', interaction.id);
			return sendDeferredEphemeralMessage(interaction, generateSuccessfulClaimChangeString(user, newEvoLine, newNickname, oldClaims, oldNickname));
		}
	},
};