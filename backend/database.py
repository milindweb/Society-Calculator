import sqlite3
import os

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database")
DB_PATH = os.path.join(DB_DIR, "society.db")

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, gen_no TEXT,
            short_loan REAL, long_loan REAL, ll_interest REAL,
            sl_interest REAL, other_deduction REAL,
            cd REAL, share REAL, dcrb REAL, other_earning REAL,
            total_deduction REAL, total_earning REAL,
            final_amount REAL, status TEXT, remark TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS loans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT, gen_no TEXT,
            present_cd REAL, required_cd REAL,
            present_share REAL, required_share REAL,
            old_long_loan REAL, old_short_loan REAL,
            other_deduction REAL, new_loan_amount REAL,
            interest_rate REAL, principal_recovery REAL,
            cd_deduction REAL, share_deduction REAL,
            total_deduction REAL, amount_in_hand REAL,
            total_interest REAL, total_repayment REAL,
            schedule TEXT, remark TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS fds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fd_no TEXT, name TEXT, amount REAL,
            months INTEGER, rate REAL,
            total_interest REAL, total_amount REAL, remark TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY, value TEXT
        );
    """)
    defaults = {
        "ll_max_amount": "400000",
        "sl_max_amount": "50000",
        "interest_rate": "11.25",
        "share_requirement": "8000",
        "cd_percentage": "20",
        "fd_rate_1_360": "4.0",
        "fd_rate_12": "8.0",
        "fd_rate_24": "8.5",
        "fd_rate_36": "9.5",
    }
    for k, v in defaults.items():
        c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))
    conn.commit()
    migration(c)
    conn.commit()
    conn.close()

def migration(c):
    c.execute("PRAGMA table_info(loans)")
    cols = [row[1] for row in c.fetchall()]
    if "loan_type" in cols:
        c.execute("CREATE TABLE loans_new AS SELECT id,name,gen_no,present_cd,required_cd,present_share,required_share,old_long_loan,old_short_loan,other_deduction,new_loan_amount,interest_rate,principal_recovery,cd_deduction,share_deduction,total_deduction,amount_in_hand,total_interest,total_repayment,schedule,remark,created_at FROM loans")
        c.execute("DROP TABLE loans")
        c.execute("ALTER TABLE loans_new RENAME TO loans")

def get_connection():
    return sqlite3.connect(DB_PATH)

def dict_factory(c, r):
    return {col[0]: r[i] for i, col in enumerate(c.description)}

def get_settings_dict():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT key, value FROM settings")
    rows = c.fetchall()
    conn.close()
    return {k: v for k, v in rows}

def save_setting(key, value):
    conn = get_connection()
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()
