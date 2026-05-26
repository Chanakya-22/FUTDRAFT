import csv
import json

# ==========================================
# SYSTEM ARCHITECT CONFIGURATION
# ==========================================
INPUT_CSV = 'all_players.csv'
OUTPUT_JSON = 'fc_base_800_players.json'
TOTAL_PLAYERS_NEEDED = 800

def format_dataset():
    all_players = []
    
    print(f"📂 Reading data from {INPUT_CSV}...")
    
    try:
        with open(INPUT_CSV, mode='r', encoding='utf-8-sig') as csv_file:
            reader = csv.DictReader(csv_file)
            
            # Print the headers so we can see exactly what the Kaggle dataset uses
            headers = reader.fieldnames
            print(f"📊 Found Columns: {headers[:10]}...") 
            
            player_id_counter = 1
            
            for row in reader:
                if player_id_counter > TOTAL_PLAYERS_NEEDED:
                    break
                
                # Kaggle datasets sometimes contain Icons/Heroes. 
                # We skip them if their 'League' or 'Team' indicates they aren't active base cards.
                league = row.get('League', '')
                if 'Icon' in league or 'Hero' in league:
                    continue

                try:
                    # Mapping Kaggle's columns to our Supabase Schema
                    player_data = {
                        "id": player_id_counter,
                        "name": row.get('Name', 'Unknown').strip(),
                        "rating": int(row.get('OVR', 0)),
                        "position": row.get('Position', 'N/A').strip(),
                        "club": row.get('Team', 'N/A').strip(),
                        "nation": row.get('Nation', 'N/A').strip(),
                        "pace": int(row.get('PAC', 0)),
                        "shooting": int(row.get('SHO', 0)),
                        "passing": int(row.get('PAS', 0)),
                        "dribbling": int(row.get('DRI', 0)),
                        "defending": int(row.get('DEF', 0)),
                        "physical": int(row.get('PHY', 0)),
                        # For the image, we will use a placeholder UI in the app for now
                        "image_url": "placeholder.png" 
                    }
                    
                    all_players.append(player_data)
                    player_id_counter += 1
                    
                except ValueError as e:
                    # Skip any row that has missing numbers
                    continue

        # Save to JSON
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(all_players, f, indent=4, ensure_ascii=False)

        print(f"✅ SUCCESS: Formatted {len(all_players)} players to {OUTPUT_JSON}!")
        print("🚀 You can now upload this file directly to Supabase.")

    except FileNotFoundError:
        print(f"❌ ERROR: Could not find '{INPUT_CSV}'. Make sure you downloaded the Kaggle CSV and placed it in this folder.")

if __name__ == "__main__":
    format_dataset()