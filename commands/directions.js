const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
	data : new SlashCommandBuilder()
		.setName('directions')
		.setDescription('Get instructions on how to use these commands'),
	// eslint-disable-next-line no-unused-vars
	async execute(interaction, isPermanent) {
		const selectMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('command')
					.setPlaceholder('Select Command to Get More Info For')
					.addOptions([
						{
							label: 'Directions',
							description: 'See info for the description command',
							value: 'description',
						},
						{
							label: 'Claim',
							description: 'See usage info for the claim command',
							value: 'claim',
						},
						{
							label: 'View',
							description: 'See usage info for the view command',
							value: 'view',
						},
						{
							label: 'Edit',
							description: 'See info for the edit command',
							value: 'edit',
						},
						{
							label: 'Change',
							description: 'See usage info for the change command',
							value: 'change',
						},
						{
							label: 'Remove',
							description: 'See info for the remove command',
							value: 'remove',
						},
						{
							label: 'Show All',
							description: 'Show directions for all commands',
							value: 'showall',
						},
					]),
			);

		return interaction.reply({
			content: 'Choose a command to get more information for.',
			components: [selectMenu],
			ephemeral: true,
		});
	},
};