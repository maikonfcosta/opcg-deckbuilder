import re
import sys

filepath = r"C:\Users\maiki\Documents\PESSOAL\opcg-deckbuilder\src\App.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# find all usages of something.id that refer to card.id
# card.id is usually c.id, card.id, etc.
# We will just replace card.id and c.id
content = content.replace("card.id", "card.card_set_id")
content = content.replace("c.id", "c.card_set_id")

# But wait, d.id (deck.id) and savedDeck.id are perfectly fine.
# Let's fix back d.card_set_id to d.id if we accidentally replaced it, but we only target card.id and c.id

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced card.id and c.id")
