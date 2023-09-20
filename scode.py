import random
import string
import sys

num_strings = 200  # number of strings to generate

if num_strings == 10:
    string_length = 6  # length of each string
    filename = "ten_random_strings.txt"
elif num_strings == 50:
    string_length = 6
    filename = "fifty_random_strings.txt"
elif num_strings == 200:
    string_length = 6
    filename = "strings.txt"

# define the set of characters to use in the strings
characters = string.ascii_letters

# open the output file in write mode
with open(filename, "w") as f:
    generated_strings = set()  # to store generated strings and check for duplicates
    while len(generated_strings) < num_strings:
        random_string = "".join(random.choice(characters) for _ in range(string_length))
        if random_string not in generated_strings:
            generated_strings.add(random_string)
            f.write("('" + random_string + "'),\n")
