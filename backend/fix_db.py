import sqlite3
import os

# Database path (assuming relative to backend root or instance folder)
# Usually instance/app.db or app.db
# Let's check config.py or instance folder. Assuming instance/database.sqlite or similar.
# I'll check common paths.

db_paths = [
    'instance/adaptive_learning.db',
    'instance/app.db',
    'instance/database.sqlite',
    'app.db',
    'database.sqlite',
    'instance/project.db' 
]

found_db = None
for path in db_paths:
    if os.path.exists(path):
        found_db = path
        break

if not found_db:
    # Check instance folder specifically
    if os.path.exists('instance'):
        files = os.listdir('instance')
        for f in files:
            if f.endswith('.db') or f.endswith('.sqlite'):
                found_db = os.path.join('instance', f)
                break

if not found_db:
    print("Database not found!")
    exit(1)

print(f"Found database at: {found_db}")

conn = sqlite3.connect(found_db)
cursor = conn.cursor()

try:
    # Check if column exists
    cursor.execute("PRAGMA table_info(assessment_submissions)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if 'concept_scores' in columns:
        print("Column 'concept_scores' already exists.")
    else:
        print("Adding 'concept_scores' column...")
        cursor.execute("ALTER TABLE assessment_submissions ADD COLUMN concept_scores TEXT")
        conn.commit()
        print("Column added successfully.")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
