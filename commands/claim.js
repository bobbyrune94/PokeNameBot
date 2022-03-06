const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, addClaimToDatabase, getPokemonClaim, isValidPokemon,
	getPokemonEvolutionaryLine, getNicknameFromInteraction } = require('../utils/database-utils');
const { toCapitalCase, generateInvalidNameString, generateUserAlreadyClaimedString, generateDBEditErrors,
	generatePokemonAlreadyClaimedString, generateSuccessfulClaimString, sendEphemeralMessage } = require('../utils/string-utils');

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
	async execute(interaction) {
		const user = interaction.user.username;

		const pokemon_name = interaction.options.getString('pokemon').toLowerCase();
		if (!isValidPokemon(pokemon_name)) {
			return sendEphemeralMessage(generateInvalidNameString(pokemon_name));
		}

		const userClaim = getUserClaims(user);
		if (userClaim != undefined) {
			const expireDate = new Date('2022-10-12'); // TODO: get date from userClaims and add 3 months to it
			return sendEphemeralMessage(interaction, generateUserAlreadyClaimedString(user, expireDate));
		}

		const pokemonClaim = getPokemonClaim(pokemon_name);
		if (pokemonClaim != undefined) {
			return sendEphemeralMessage(interaction, generatePokemonAlreadyClaimedString(pokemon_name));
		}

		const nickname = getNicknameFromInteraction(interaction, pokemon_name);
		if (nickname.includes('InvalidGenderedClaimError')) {
			return sendEphemeralMessage(interaction, nickname);
		}

		const evoLine = getPokemonEvolutionaryLine(pokemon_name);

		let errorClaims = [];
		evoLine.forEach(pokemon => {
			if (!addClaimToDatabase(pokemon, user, nickname)) {
				console.log('Error adding claim for ' + toCapitalCase(pokemon));
				errorClaims += pokemon;
			}
		});

		if (errorClaims.length > 0) {
			return sendEphemeralMessage(interaction, generateDBEditErrors(errorClaims, undefined));
		}
		else {
			console.log('Claim has been made successfully.');
			return sendEphemeralMessage(interaction, generateSuccessfulClaimString(user, evoLine, nickname));
		}
	},
};