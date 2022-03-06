const { SlashCommandBuilder } = require('@discordjs/builders');
const { getUserClaims, addClaimToDatabase, getPokemonClaim, removeClaimFromDatabase,
	isValidPokemon, getPokemonEvolutionaryLine, getNicknameFromInteraction } = require('../utils/database-utils');
const { addMonths } = require('../utils/date-utils');
const { toCapitalCase, generateInvalidNameString, generateNoUserClaimString, generateDBEditErrors,
	generatePokemonAlreadyClaimedString, generateEarlyClaimChangeString,
	generateSuccessfulClaimChangeString, sendEphemeralMessage } = require('../utils/string-utils');

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
	async execute(interaction) {
		const user = interaction.user.username;

		const pokemon_name = interaction.options.getString('pokemon').toLowerCase();
		if (!isValidPokemon(pokemon_name)) {
			return sendEphemeralMessage(interaction, generateInvalidNameString(pokemon_name));
		}

		const pokemonClaim = getPokemonClaim(pokemon_name);
		if (pokemonClaim == undefined) {
			return sendEphemeralMessage(interaction, generatePokemonAlreadyClaimedString(pokemon_name));
		}

		const userClaim = getUserClaims(user);
		if (userClaim != undefined) {
			return sendEphemeralMessage(interaction, generateNoUserClaimString(user));
		}

		// TODO: get this data from userClaims
		const oldNickname = 'Tiggs';
		const oldClaims = ['shinx', 'luxio', 'luxray'];

		const claimDate = new Date('2020-10-12'); // TODO: get date from userClaims
		const changeClaimDate = addMonths(claimDate, 3);
		if (Date.now() < changeClaimDate) {
			return sendEphemeralMessage(interaction, generateEarlyClaimChangeString(user, changeClaimDate));
		}

		const newNickname = getNicknameFromInteraction(interaction, pokemon_name);
		if (newNickname.includes('InvalidGenderedClaimError')) {
			return sendEphemeralMessage(interaction, newNickname);
		}

		const newEvoLine = getPokemonEvolutionaryLine(pokemon_name);

		let addClaimErrors = [];
		newEvoLine.forEach(pokemon => {
			if (!addClaimToDatabase(pokemon, user, newNickname)) {
				console.log('Error adding claim for ' + toCapitalCase(pokemon));
				addClaimErrors += pokemon;
			}
		});

		let removeClaimErrors = [];
		oldClaims.forEach(pokemon => {
			if (!removeClaimFromDatabase(pokemon)) {
				console.log('Error removing claim for ' + toCapitalCase(pokemon));
				removeClaimErrors += pokemon;
			}
		});

		if (addClaimErrors.length > 0 || removeClaimErrors.length > 0) {
			return sendEphemeralMessage(interaction, generateDBEditErrors(addClaimErrors, removeClaimErrors));
		}
		else {
			console.log('Claim has been changed successfully.');
			return sendEphemeralMessage(interaction, generateSuccessfulClaimChangeString(user, newEvoLine, newNickname, oldClaims, oldNickname));
		}
	},
};