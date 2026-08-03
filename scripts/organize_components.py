import os
import re
import shutil

# Definição de onde cada componente vai ficar
components_map = {
    'CardModal': 'Card',
    'OpcgCard': 'Card',
    'LeaderMetaStats': 'Card',
    
    'AutoDeckWizard': 'Deck',
    'ManualDeckWizard': 'Deck',
    'DeckList': 'Deck',
    'DeckSummary': 'Deck',
    'DeckAnalyzerModal': 'Deck',
    'ViewDeckModal': 'Deck',
    
    'ProfileView': 'Views',
    'LeaksFeed': 'Views',
    'BanlistViewModal': 'Views',
    
    'DialogContext': 'UI'
}

# Arquivos que não têm o mesmo nome base ou arquivos extras:
extra_files_map = {
    'CardModalMarket.css': 'Card',
    'CustomDialog.css': 'UI'
}

base_dir = r"C:\Users\maiki\Documents\PESSOAL\opcg-deckbuilder\src"
components_dir = os.path.join(base_dir, "components")

# 1. Criar diretórios
for folder in set(components_map.values()):
    os.makedirs(os.path.join(components_dir, folder), exist_ok=True)

# 2. Mover arquivos e atualizar mapa de paths
file_locations = {} # filename -> subfolder
for f in os.listdir(components_dir):
    if os.path.isdir(os.path.join(components_dir, f)): continue
    
    name, ext = os.path.splitext(f)
    if f in extra_files_map:
        target_folder = extra_files_map[f]
    elif name in components_map:
        target_folder = components_map[name]
    else:
        print(f"Skipping {f}")
        continue
        
    src_path = os.path.join(components_dir, f)
    dst_path = os.path.join(components_dir, target_folder, f)
    shutil.move(src_path, dst_path)
    file_locations[name] = target_folder

# 3. Atualizar imports nos arquivos
def update_imports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    is_app = os.path.basename(file_path) == "App.tsx"
    current_folder = ""
    if not is_app:
        name = os.path.splitext(os.path.basename(file_path))[0]
        current_folder = components_map.get(name, "")

    # Regex para imports relativos
    # ex: import { X } from './OpcgCard'; ou from '../types'
    
    def replacer(match):
        full_match = match.group(0)
        import_path = match.group(1)
        
        # Imports de fora da pasta components (ex: ../types, ../services/api)
        if import_path.startswith('../') and not is_app:
            # Como fomos 1 nível mais fundo, precisamos adicionar ../
            return full_match.replace(import_path, f"../{import_path}")
            
        # Imports de outros componentes (ex: ./OpcgCard)
        if import_path.startswith('./') and not is_app:
            comp_name = import_path.replace('./', '')
            if comp_name in components_map:
                target_folder = components_map[comp_name]
                if target_folder == current_folder:
                    return full_match # Mesmo diretório, continua ./Comp
                else:
                    return full_match.replace(import_path, f"../{target_folder}/{comp_name}")
                    
        # Para App.tsx (ex: ./components/OpcgCard)
        if is_app and import_path.startswith('./components/'):
            comp_name = import_path.replace('./components/', '')
            if comp_name in components_map:
                target_folder = components_map[comp_name]
                return full_match.replace(import_path, f"./components/{target_folder}/{comp_name}")
                
        return full_match

    # Aplicar regex (cobrindo tsx e css)
    # import { X } from './Comp' -> group 1 is ./Comp
    # import './Comp.css' -> group 1 is ./Comp.css
    new_content = re.sub(r"from\s+['\"]([^'\"]+)['\"]", replacer, content)
    new_content = re.sub(r"import\s+['\"]([^'\"]+)['\"]", replacer, new_content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

# Update todos os arquivos TSX dentro de src
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            update_imports(os.path.join(root, file))

print("Organização concluída!")
