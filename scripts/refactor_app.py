import os

filepath = r"C:\Users\maiki\Documents\PESSOAL\opcg-deckbuilder\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Generic renames
content = content.replace('DbfwCard', 'OpcgCard')
content = content.replace('dbfwData', 'allCards')
content = content.replace('dbfw_data.json', '')
content = content.replace('dbfw', 'opcg')
content = content.replace('DBFW', 'OPCG')
content = content.replace('Dbfw', 'Opcg')

content = content.replace('card.id', 'card.card_set_id')
content = content.replace('card.name', 'card.card_name')
content = content.replace('card.color', 'card.card_color')
content = content.replace('card.type', 'card.card_type')
content = content.replace('card.cost', 'card.card_cost')
content = content.replace('card.power', 'card.card_power')
content = content.replace('card.combo', 'card.counter_amount')
content = content.replace('card.skill', 'card.card_text')

# Fix arrays
content = content.replace("const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Black'];", "const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'Purple', 'Multicolor'];")
content = content.replace("const TYPES = ['LEADER', 'BATTLE', 'EXTRA'];", "const TYPES = ['Leader', 'Character', 'Event', 'Stage'];")

# Replace fetch block
fetch_old = """  useEffect(() => {
    fetch('/')
      .then(res => res.json())
      .then(data => {
        setOpcgData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar banco de dados:", err);
        setIsLoading(false);
      });
  }, []);"""

fetch_new = """  useEffect(() => {
    import('./services/api').then(({ fetchAllCards }) => {
      fetchAllCards()
        .then(data => {
          setAllCards(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Erro ao carregar banco de dados:", err);
          setIsLoading(false);
        });
    });
  }, []);"""
  
content = content.replace(fetch_old, fetch_new)

# Some other specific OPCG string replacements
content = content.replace("setOpcgData", "setAllCards")
content = content.replace("opcgData", "allCards")
content = content.replace("parseInt(card.card_power)", "parseInt(card.card_power || '0')")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("App.tsx refactored.")
