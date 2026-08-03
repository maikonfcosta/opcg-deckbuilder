import os
import re

opcg_dir = r"C:\Users\maiki\Documents\PESSOAL\opcg-deckbuilder\src"
components_dir = os.path.join(opcg_dir, "components_dbfw")
new_components_dir = os.path.join(opcg_dir, "components")

if os.path.exists(new_components_dir):
    import shutil
    shutil.rmtree(new_components_dir)

os.rename(components_dir, new_components_dir)

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Generic renames
    content = content.replace('DbfwCard', 'OpcgCard')
    content = content.replace('dbfwData', 'allCards')
    content = content.replace('dbfw_data.json', '')
    content = content.replace('dbfw', 'opcg')
    content = content.replace('DBFW', 'OPCG')
    content = content.replace('Dbfw', 'Opcg')
    
    # OPCG specific fields instead of DBFW fields
    # dbfw uses card.id, card.name, card.color, card.type, card.cost, card.power, card.combo, card.skill
    # opcg uses card.card_set_id, card.card_name, card.card_color, card.card_type, card.card_cost, card.card_power, card.counter_amount, card.card_text, card.card_image
    
    content = content.replace('card.id', 'card.card_set_id')
    content = content.replace('card.name', 'card.card_name')
    content = content.replace('card.color', 'card.card_color')
    content = content.replace('card.type', 'card.card_type')
    content = content.replace('card.cost', 'card.card_cost')
    content = content.replace('card.power', 'card.card_power')
    content = content.replace('card.combo', 'card.counter_amount')
    content = content.replace('card.skill', 'card.card_text')
    content = content.replace('card.image', 'card.card_image')
    content = content.replace('card.image_url', 'card.card_image')
    
    # Pre-render fixes
    content = content.replace('parseInt(card.card_power)', 'parseInt(card.card_power || "0")')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Refactor all files in components
for root, dirs, files in os.walk(new_components_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.css') or file.endswith('.ts'):
            refactor_file(os.path.join(root, file))
            
# Also rename files that have Dbfw in their name
for root, dirs, files in os.walk(new_components_dir):
    for file in files:
        if 'Dbfw' in file:
            old_path = os.path.join(root, file)
            new_path = os.path.join(root, file.replace('Dbfw', 'Opcg'))
            os.rename(old_path, new_path)

print("Components refactored.")
