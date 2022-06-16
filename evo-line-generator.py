import json
import requests

"""
Hard-coded regional variant evolutionary lines to add to the json file

PokeAPI doesn't separate regional evolutionary lines, but we want to separate them out as separate claimable Pokemon
Example:
    Kantonian Rattata should be a separate claimable evolutionary line than Alolan Rattata
"""
alolan_forms = {
    "rattata-alola": ["rattata-alola", "raticate-alola"],
    "raticate-alola": ["rattata-alola", "raticate-alola"],
    "raichu-alola": ["raichu-alola"],
    "sandshrew-alola": ["sandshrew-alola", "sandslash-alola"], 
    "sandslash-alola": ["sandshrew-alola", "sandslash-alola"],
    "vulpix-alola": ["vulpix-alola", "ninetales-alola"],
    "ninetales-alola": ["vulpix-alola", "ninetales-alola"],
    "diglett-alola": ["diglett-alola", "dugtrio-alola"],
    "dugtrio-alola": ["diglett-alola", "dugtrio-alola"],
    "meowth-alola": ["meowth-alola", "persian-alola"], 
    "persian-alola": ["meowth-alola", "persian-alola"],
    "geodude-alola": ["geodude-alola", "graveler-alola", "golem-alola"], 
    "graveler-alola": ["geodude-alola", "graveler-alola", "golem-alola"],
    "golem-alola": ["geodude-alola", "graveler-alola", "golem-alola"],
    "grimer-alola": ["grimer-alola", "muk-alola"], 
    "muk-alola": ["grimer-alola", "muk-alola"],
    "exeggutor-alola": ["exeggutor-alola"], 
    "marowak-alola": ["marowak-alola"]
}

galar_forms = {
    "meowth-galar": ["meowth-galar", "perrserker"],
    "perrserker": ["meowth-galar", "perrserker"],
    "ponyta-galar": ["ponyta-galar", "rapidash-galar"],
    "rapidash-galar": ["ponyta-galar", "rapidash-galar"],
    "farfetchd-galar": ["farfetchd-galar", "sirfetchd"],
    "sirfetchd": ["farfetchd-galar", "sirfetchd"],
    "weezing-galar": ["weezing-galar"],
    "mr-mime-galar": ["mr-mime-galar", "mr-rime"],
    "mr-rime": ["mr-mime-galar", "mr-rime"],
    "corsola-galar": ["corsola-galar","cursola-galar"],
    "cursola-galar": ["corsola-galar","cursola-galar"],
    "zigzagoon-galar": ["zigzagoon-galar", "linoone-galar", "obstagoon"],
    "linoone-galar": ["zigzagoon-galar", "linoone-galar", "obstagoon"],
    "obstagoon": ["zigzagoon-galar", "linoone-galar", "obstagoon"],
    "darumaka-galar": ["darumaka-galar","darmanitan-galar"],
    "darmanitan-galar": ["darumaka-galar","darmanitan-galar"],
    "yamask-galar": ["yamask-galar", "runerigus"],
    "runerigus": ["yamask-galar", "runerigus"],
    "stunfisk-galar": ["stunfisk-galar"],
    "slowpoke-galar": ["slowpoke-galar", "slowbro-galar"],
    "slowbro-galar": ["slowpoke-galar", "slowbro-galar"],
    "slowking-galar": ["slowking-galar"],
    "articuno-galar": ["articuno-galar"],
    "zapdos-galar": ["zapdos-galar"],
    "moltres-galar": ["moltres-galar"]
}

hisuian_forms = {
    "growlithe-hisui": ["growlithe-hisui", "arcanine-hisui"],
    "arcanine-hisui": ["growlithe-hisui", "arcanine-hisui"],
    "voltorb-hisui": ["voltorb-hisui", "electrode-hisui"],
    "electrode-hisui": ["voltorb-hisui", "electrode-hisui"],
    "typhlosion-hisui": ["typhlosion-hisui"],
    "qwilfish-hisui": ["qwilfish-hisui", "overqwil"],
    "overqwil": ["qwilfish-hisui", "overqwil"],
    "sneasel-hisui": ["sneasel-hisui", "sneasler"],
    "sneasler": ["sneasel-hisui", "sneasler"],
    "samurott-hisui": ["samurott-hisui"],
    "lilligant-hisui": ["lilligant-hisui"],
    "zorua-hisui": ["zorua-hisui", "zoroark-hisui"],
    "zoroark-hisui": ["zorua-hisui", "zoroark-hisui"],
    "braviary-hisui": ["braviary-hisui"],
    "sliggoo-hisui": ["sliggoo-hisui", "goodra-hisui"],
    "goodra-hisui": ["sliggoo-hisui", "goodra-hisui"],
    "avalugg-hisui": ["avalugg-hisui"],
    "decidueye-hisui": ["decidueye-hisui"],
    "kleavor": ["kleavor"],
    "basculin-hisui": ["basculin-hisui", "basculegion"],
    "basculegion": ["basculin-hisui", "basculegion"],
    "enamorus": ["enamorus"] #technically not a regional form, but PokeAPI doesn't have it so including it here
}

"""
Hard Coded List of Regional Evolutions to Make sure they don't appear in their original evolutionary lines

These are the Pokemon that only evolve if they are a certain regional form of the Pokemon
Example:
    Kantonian Farfetch'd doesn't evolve. Only Galarian Farfetch'd will evolve into a Sirfetch'd
"""
regional_form_evolutions = [
    "perrserker",
    "sirfetchd",
    "mr-rime",
    "cursola",
    "obstagoon",
    "runerigus",
    "overquil",
    "sneasler",
    "kleavor",
    "basculegion"
]

"""
Hard Coded Dictionary of Regional Evolutions that take an existing evolutionary line to a new stage

Example:
    Johtonian Stantler doesn't evolve, but in the Hisui region, it can evolve into Wyrdeer
"""
regional_further_evolutions = {
    "stantler": "wyrdeer",
    "ursaring": "ursaluna"
}

"""
Hard Coded Single-Gendered Pokemon for the Gender-Anomalies File Generation
"""
only_female = [
    "nidoran-f",
    "nidorina",
    "nidoqueen",
    "illumise",
    "latias",
    "froslass",
    "happiny",
    "chansey",
    "blissey",
    "kangaskhan",
    "smoochum",
    "jynx",
    "miltank",
    "cresselia",
    "petilil",
    "liligant",
    "liligant-hisui",
    "vullaby",
    "mandibuzz",
    "flabebe",
    "floette",
    "florges",
    "bounsweet",
    "steenee",
    "tsareena",
    "hatenna",
    "hattrem",
    "hatterene",
    "milcery",
    "alcremie",
    "enamorus"
]

only_male = [
    "nidoran-m",
    "nidorino",
    "nidoking",
    "volbeat",
    "latios",
    "gallade",
    "tyrogue",
    "hitmonlee",
    "hitmonchan",
    "hitmontop",
    "tauros",
    "throh",
    "sawk",
    "rufflet",
    "braviary",
    "braviary-hisui",
    "tornadus",
    "thundurus",
    "landorus",
    "impidimp",
    "morgrem",
    "grimmsnarl"
]

class PokemonData():
    def __init__(self, evo_lines):
        self.dex_num = 0
        self.sprite_url = "UNDEFINED URL"
        self.evo_lines = evo_lines

"""
Handles the evolution chain separately from how other evolution lines are handled. This function will break up any evolution
line into each component part separately.

Example: Eevee -> [[eevee], [vaporeon], [jolteon], [flareon], ...]

Arguments:
json (json object): the evolution-detail json object returned from PokeAPI

Return:
branches (list of lists): the claimable evolution branches
"""
def break_up_multi_evolution_line(json):
    current_mon = json["species"]["name"]

    branches = [[current_mon]]
    for entry in json["evolves_to"]:
        pokemon_name = entry["species"]["name"]
        branches.append([pokemon_name])

    return branches

"""
Parses the Evolution Details from the PokeAPI response

Stores branches as an array of arrays, with each inner-array representing an evolution branch.

The base-form is assigned to the first/primary branch while any subsequent branches will be a separate claimable line.
Examples:
    Non-Branching Evolutionary Line: Growlithe's evolutionary line will return as [["growlithe", "arcanine"]]
    Branching Evolutionary Line: Poliwag's evolutionary line will return as [["poliwag", "poliwhirl", "poliwrath"], ["politoed"]]

Arguments:
json (json object): the evolution-detail json object returned from PokeAPI

Return:
branches (list of lists): the claimable evolution branches
"""
def parse_evo_details(json):
    current_mon = json["species"]["name"]

    # Don't include regional evolutions in their base-evolution line
    # The will be added in separately
    if regional_form_evolutions.__contains__(current_mon):
        return []

    # handle eevee separately from other evolution lines
    if current_mon == "eevee" or current_mon == "tyrogue":
        return break_up_multi_evolution_line(json)

    branches = [[current_mon]]
    for entry in json["evolves_to"]:
        if json["evolves_to"].index(entry) == 0:
            evo_branches = parse_evo_details(entry)
            for branch in evo_branches:
                if current_mon == "wurmple":
                    branches.append(branch) # separate wurmple from each of its branched evolutions
                elif evo_branches.index(branch) == 0:
                    # only add the base-form to the first evolutionary branch
                    branches[0] += branch 
                else:
                    branches.append(branch)
        else:
            for branch in parse_evo_details(entry):
                # add mothim to the burmy evolutionary line
                if current_mon == "burmy":
                    branches[0] += branch
                else:
                    branches.append(branch)

    # add any further regional evolutions if possible
    if regional_further_evolutions.keys().__contains__(current_mon):
        branches[0].append(regional_further_evolutions[current_mon])

    return branches

"""
Formats the provided evolutionary chain for the json output file

For each evolutionary chain, each Pokemon is mapped to its entire evolution line such that any look-up to the json object
will return the whole evolutionary line. This line, formatted as a json-array, is ordered by evolution stage, with the base-form
being the first element in the list (list[0]) and each subsequent element being a further evolution.

The reasoning behind this formatting: the json file generated from this script will be used in a discord bot for nuzlocke name claims.
If someone were to claim a second- or third-stage evolution, we'd need an easy way to both find its base form and the entire evolution
line. This formatting solves both use cases.

Arguments:
evo_branches (list of lists): a list of lists that represent all possible evolutionary branches in a Pokemon line
is_end (boolean): a boolean dictating if it's the end of the file

Return:
formatted_branches (list of strings): a list of json-formatted strings to output to the file.
"""
def add_branches_to_data(evo_branches, evo_data):
    for branch in evo_branches:
        for pokemon in branch:
            evo_data[pokemon] = PokemonData(branch)

def capitalize(str):
    return str.capitalize()

def generate_pokemon_selection_element(name):
    split_name = name.split('-')

    split_name_capitalized = list(map(capitalize, split_name))
    for index in range(0, len(split_name_capitalized)):
        if split_name_capitalized[index] == "Mr" or split_name_capitalized[index] == "Jr":
            split_name_capitalized[index] += "."
        elif split_name_capitalized[index] == "M":
            split_name_capitalized[index] = "(Male)"
        elif split_name_capitalized[index] == "F":
            split_name_capitalized[index] = "(Female)"
        elif split_name_capitalized[index] == "Farfetchd":
            split_name_capitalized[index] = "Farfetch'd"
        elif split_name_capitalized[index] == "Sirfetchd":
            split_name_capitalized[index] = "Sirfetch'd"
        elif split_name_capitalized[index] == "Alola" or split_name_capitalized[index] == "Galar" or split_name_capitalized[index] == "Hisui":
            split_name_capitalized[index] = "(" + split_name_capitalized[index] + " Form)"

    return [name, " ".join(split_name_capitalized)]

"""
Pulls evolution data from PokeAPI and writes it to a file.
"""
def generate_evo_chain_data():
    end_index = 476
    evo_line_data = {}
    error_indices = []
    for index in range(1, end_index + 1):
        print(index)
        try:
            response = requests.get("https://pokeapi.co/api/v2/evolution-chain/" + str(index))
            evo_branches = parse_evo_details(response.json()["chain"])
            add_branches_to_data(evo_branches, evo_line_data)
        except:
            print("Error has occurred on index " + str(index))
            error_indices.append(index)

    print("Adding Regional Forms")
    for form in alolan_forms:
        evo_line_data[form] = PokemonData(alolan_forms[form])
    
    for form in galar_forms:
        evo_line_data[form] = PokemonData(galar_forms[form])

    for form in hisuian_forms:
        evo_line_data[form] = PokemonData(hisuian_forms[form])

    return evo_line_data
    
    # file = open("pokemon-evolution-lines.json", "w")

    # file.write(json.dumps(evo_line_data, indent=4))

    # print("Indices with error: ")
    # print(error_indices)

"""
Pulls all gender-less Pokemon from PokeAPI and outputs it to a file
"""
def generate_gender_anomaly_pokemon_data():
    gender_anomalies = {}

    response = requests.get("https://pokeapi.co/api/v2/gender/3")
    response_list = response.json()["pokemon_species_details"]
    genderless_pokemon_list = []
    for species_data in response_list:
        genderless_pokemon_list.append(species_data["pokemon_species"]["name"])

    gender_anomalies["genderless"] = genderless_pokemon_list
    gender_anomalies["only_male"] = only_male
    gender_anomalies["only_female"] = only_female

    file = open("pokemon-gender-anomaly.json", "w")
    file.write(json.dumps(gender_anomalies, indent=4))

def get_pokemon_id_and_sprite_url(pokemon_data):
    for pokemon in pokemon_data:
        print(pokemon)
        try:
            response = requests.get("https://pokeapi.co/api/v2/pokemon/" + pokemon)
            pokemon_data[pokemon].dex_num = response.json()["id"]
            pokemon_data[pokemon].sprite_url = response.json()["sprites"]["front_default"]
        except:
            print("Error occurred with getting data for " + pokemon)

    return pokemon_data


def main():
    pokemon_evo_data = generate_evo_chain_data()
    # generate_gender_anomaly_pokemon_data()
    pokemon_data = get_pokemon_id_and_sprite_url(pokemon_evo_data)

    file = open("pokemon-data.json", "w")
    file.write("{\n")
    is_first = True
    for pokemon in pokemon_data:
        if is_first:
            is_first = False
        else:
            file.write(',\n')
        file.write('\t"' + pokemon + '": ')
        file.write(json.dumps(pokemon_data[pokemon].__dict__))
    file.write("\n}")

if __name__ == "__main__":
    main()