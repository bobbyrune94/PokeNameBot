const { SlashCommandBuilder } = require('@discordjs/builders');
const { generateDirectionsString } = require('../utils/string-utils');


module.exports = {
	data : new SlashCommandBuilder()
		.setName('directions')
		.setDescription('Get instructions on how to use these commands'),
	// eslint-disable-next-line no-unused-vars
	async execute(interaction, isPermanent) {
		return interaction.reply({
			content: generateDirectionsString(),
			ephemeral: true,
		});
	},
};