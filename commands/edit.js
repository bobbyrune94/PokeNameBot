const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, addClaimToDatabase, getNicknameFromInteraction, NOCLAIMSSTRING,
	generateDatabaseErrorString, CLAIMSFORMATTINGERROR, INVALIDNICKNAMEERROR } = require('../utils/database-utils');
const { logMessage } = require('../utils/logging-utils');
const { generateNoUserClaimString, generateDBEditErrors, generateSuccessfulUpdateString,
	toCapitalCase, sendDeferredEphemeralMessage, INVALIDGENDEREDCLAIMERROR } = require('../utils/string-utils');

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
						.setName('nickname')
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
						.setName('male-nickname')
						.setDescription('The new nickname for a MALE pokemon')
						.setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('female-nickname')
						.setDescription('The new nickname for a FEMALE pokemon')
						.setRequired(true),
				),
		),
	async execute(interaction, isPermanent) {
		const userId = interaction.user.id;
		const username = interaction.member.nickname;
		const serverName = interaction.guild.name;

		const userClaim = await getUserClaims(userId, username, serverName, interaction.id);
		if (userClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		else if (userClaim == NOCLAIMSSTRING) {
			return sendDeferredEphemeralMessage(interaction, generateNoUserClaimString());
		}
		else if (typeof userClaim == 'string' && userClaim.includes(CLAIMSFORMATTINGERROR)) {
			return sendDeferredEphemeralMessage(interaction, userClaim);
		}

		const claimedPokemon = userClaim['claimed-pokemon'];
		const nextChangeDate = new Date(Date.parse(userClaim['next-change-date']));

		const nickname = await getNicknameFromInteraction(interaction, claimedPokemon[0]);
		if (nickname.includes(INVALIDGENDEREDCLAIMERROR) || nickname.includes(INVALIDNICKNAMEERROR)) {
			return sendDeferredEphemeralMessage(interaction, nickname);
		}

		let errorClaims = [];
		for (const index in claimedPokemon) {
			const pokemon = claimedPokemon[index];
			if (!(await addClaimToDatabase(serverName, pokemon, userId, username, nickname, nextChangeDate, isPermanent, interaction.id))) {
				logMessage('Error adding claim for ' + toCapitalCase(pokemon), interaction.id);
				errorClaims += pokemon;
			}
		}

		if (errorClaims.length > 0) {
			return sendDeferredEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			logMessage('Nickname has been updated successfully', interaction.id);
			return sendDeferredEphemeralMessage(interaction, generateSuccessfulUpdateString(claimedPokemon, nickname));
		}
	},
};