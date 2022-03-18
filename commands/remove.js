const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, removeClaimFromDatabase, addEntryToRemoveClaimTable, NOCLAIMSSTRING,
	generateDatabaseErrorString } = require('../utils/database-utils');
const { generateNoUserClaimString, generateDBEditErrors, generateSuccessfulRemovalString,
	toCapitalCase, sendDeferredEphemeralMessage } = require('../utils/string-utils');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Delete your claim from the system'),
	// eslint-disable-next-line no-unused-vars
	async execute(interaction, isPermanent) {
		interaction.deferReply({ ephemeral: true });
		const user = interaction.user.username;
		const serverName = interaction.guild.name;

		const userClaim = await getUserClaims(user, serverName);
		if (userClaim == undefined) {
			return sendDeferredEphemeralMessage(interaction, generateDatabaseErrorString());
		}
		else if (userClaim == NOCLAIMSSTRING) {
			return sendDeferredEphemeralMessage(interaction, generateNoUserClaimString(user));
		}
		else if (typeof userClaim == 'string' && userClaim.includes('ClaimsFormattingError')) {
			return sendDeferredEphemeralMessage(interaction, userClaim);
		}

		const claimedPokemon = userClaim['claimed-pokemon'];
		const nextChangeDate = new Date(userClaim['next-change-date']);

		let errorClaims = [];
		for (const index in claimedPokemon) {
			const pokemon = claimedPokemon[index];
			if (!(await removeClaimFromDatabase(pokemon, serverName))) {
				console.log('Error removing claim for ' + toCapitalCase(pokemon));
				errorClaims += pokemon;
			}
		}

		if (!(await addEntryToRemoveClaimTable(user, serverName, nextChangeDate))) {
			console.error('Error removing ' + user + '\'s entry from remove-claims database');
		}

		if (errorClaims.length > 0) {
			return sendDeferredEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			console.log('Claims removed successfully');
			return sendDeferredEphemeralMessage(interaction, generateSuccessfulRemovalString(user, claimedPokemon, nextChangeDate));
		}
	},
};