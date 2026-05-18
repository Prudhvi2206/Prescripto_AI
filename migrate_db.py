import sqlite3

def migrate():
    conn = sqlite3.connect("backend/sql_app.db")
    cursor = conn.cursor()
    
    # Check if columns exist in users
    cursor.execute("PRAGMA table_info(users)")
    users_columns = [col[1] for col in cursor.fetchall()]
    
    if "phone_number" not in users_columns:
        print("Adding phone_number to users")
        cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR;")
    
    if "profile_picture_url" not in users_columns:
        print("Adding profile_picture_url to users")
        cursor.execute("ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR;")
        
    # Check if columns exist in medicines
    cursor.execute("PRAGMA table_info(medicines)")
    medicines_columns = [col[1] for col in cursor.fetchall()]
    
    if "frequency" not in medicines_columns:
        print("Adding frequency to medicines")
        cursor.execute("ALTER TABLE medicines ADD COLUMN frequency VARCHAR DEFAULT 'Daily';")
        
    if "notes" not in medicines_columns:
        print("Adding notes to medicines")
        cursor.execute("ALTER TABLE medicines ADD COLUMN notes VARCHAR;")
        
    if "status" not in medicines_columns:
        print("Adding status to medicines")
        cursor.execute("ALTER TABLE medicines ADD COLUMN status VARCHAR DEFAULT 'Upcoming';")
        
    if "reminder_enabled" not in medicines_columns:
        print("Adding reminder_enabled to medicines")
        cursor.execute("ALTER TABLE medicines ADD COLUMN reminder_enabled BOOLEAN DEFAULT 0;")
        
    # Check if columns exist in prescriptions
    cursor.execute("PRAGMA table_info(prescriptions)")
    prescriptions_columns = [col[1] for col in cursor.fetchall()]
    
    if "doctor_name" not in prescriptions_columns:
        print("Adding doctor_name to prescriptions")
        cursor.execute("ALTER TABLE prescriptions ADD COLUMN doctor_name VARCHAR;")
        
    if "patient_name" not in prescriptions_columns:
        print("Adding patient_name to prescriptions")
        cursor.execute("ALTER TABLE prescriptions ADD COLUMN patient_name VARCHAR;")
        
    if "hospital_name" not in prescriptions_columns:
        print("Adding hospital_name to prescriptions")
        cursor.execute("ALTER TABLE prescriptions ADD COLUMN hospital_name VARCHAR;")
        
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
