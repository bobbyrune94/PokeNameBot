const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, removeClaimFromDatabase, addEntryToRemoveClaimTable, NOCLAIMSSTRING,
	generateDatabaseErrorString, CLAIMSFORMATTINGERROR } = require('../utils/database-utils');
const { logMessage } = require('../utils/logging-utils');
const { generateNoUserClaimString, generateDBEditErrors, generateSuccessfulRemovalString,
	toCapitalCase, sendDeferredEphemeralMessage } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Delete your claim from the system'),
	// eslint-disable-next-line no-unused-vars
	async execute(interaction, isPermanent) {
		const userId = interaction.user.id;
		const username = interaction.user.username;
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
		const nextChangeDate = new Date(userClaim['next-change-date']);

		let errorClaims = [];
		for (const index in claimedPokemon) {
			const pokemon = claimedPokemon[index];
			if (!(await removeClaimFromDatabase(pokemon, serverName, interaction.id))) {
				logMessage('Error removing claim for ' + toCapitalCase(pokemon), interaction.id);
				errorClaims += pokemon;
			}
		}

		if (!(await addEntryToRemoveClaimTable(userId, serverName, nextChangeDate, interaction.id))) {
			logMessage('Error removing ' + userId + '\'s entry from remove-claims database', interaction.id);
		}

		if (errorClaims.length > 0) {
			return sendDeferredEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			logMessage('Claims removed successfully', interaction.id);
			return sendDeferredEphemeralMessage(interaction, generateSuccessfulRemovalString(claimedPokemon, nextChangeDate));
		}
	},
};