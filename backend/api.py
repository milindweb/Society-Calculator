import json
from .database import (
    init_db, get_connection, dict_factory,
    get_settings_dict, save_setting
)

class Api:
    def __init__(self):
        init_db()

    def get_settings(self):
        return get_settings_dict()

    def save_settings(self, settings_json):
        settings = json.loads(settings_json)
        for k, v in settings.items():
            save_setting(k, str(v))
        return {"ok": True}

    # --- SETTLEMENT ---

    def calculate_settlement(self, data_json):
        d = json.loads(data_json)
        sl = float(d.get("short_loan", 0))
        ll = float(d.get("long_loan", 0))
        lli = float(d.get("ll_interest", 0))
        sli = float(d.get("sl_interest", 0))
        od = float(d.get("other_deduction", 0))
        cd = float(d.get("cd", 0))
        sh = float(d.get("share", 0))
        dcrb = float(d.get("dcrb", 0))
        oe = float(d.get("other_earning", 0))
        total_ded = sl + ll + lli + sli + od
        total_earn = cd + sh + dcrb + oe
        final_amt = total_ded - total_earn
        status = "Member Pays" if final_amt > 0 else "Society Pays" if final_amt < 0 else "Settled"
        return {
            "total_deduction": round(total_ded, 2),
            "total_earning": round(total_earn, 2),
            "final_amount": round(final_amt, 2),
            "status": status,
        }

    def save_settlement(self, data_json):
        d = json.loads(data_json)
        conn = get_connection()
        c = conn.cursor()
        c.execute("""INSERT INTO settlements
            (name, gen_no, short_loan, long_loan, ll_interest, sl_interest,
             other_deduction, cd, share, dcrb, other_earning,
             total_deduction, total_earning, final_amount, status, remark)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (d["name"], d["gen_no"], d["short_loan"], d["long_loan"],
             d["ll_interest"], d["sl_interest"], d["other_deduction"],
             d["cd"], d["share"], d["dcrb"], d["other_earning"],
             d["total_deduction"], d["total_earning"],
             d["final_amount"], d["status"], d.get("remark", "")))
        conn.commit()
        rid = c.lastrowid
        conn.close()
        return {"id": rid}

    def get_settlements(self, search_json=""):
        conn = get_connection()
        conn.row_factory = dict_factory
        c = conn.cursor()
        params = []
        where = []
        if search_json:
            s = json.loads(search_json)
            q = s.get("query", "")
            if q:
                where.append("(name LIKE ? OR gen_no LIKE ?)")
                params.extend([f"%{q}%", f"%{q}%"])
            df = s.get("date_from", "")
            dt = s.get("date_to", "")
            if df:
                where.append("date(created_at) >= ?")
                params.append(df)
            if dt:
                where.append("date(created_at) <= ?")
                params.append(dt)
        sql = "SELECT * FROM settlements"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY created_at DESC"
        c.execute(sql, params)
        rows = c.fetchall()
        conn.close()
        return rows

    def get_settlement(self, rid):
        conn = get_connection()
        conn.row_factory = dict_factory
        c = conn.cursor()
        c.execute("SELECT * FROM settlements WHERE id=?", (rid,))
        row = c.fetchone()
        conn.close()
        return row

    def update_settlement(self, rid, data_json):
        d = json.loads(data_json)
        conn = get_connection()
        c = conn.cursor()
        c.execute("""UPDATE settlements SET
            name=?, gen_no=?, short_loan=?, long_loan=?, ll_interest=?,
            sl_interest=?, other_deduction=?, cd=?, share=?, dcrb=?,
            other_earning=?, total_deduction=?, total_earning=?,
            final_amount=?, status=?, remark=?
            WHERE id=?""",
            (d["name"], d["gen_no"], d["short_loan"], d["long_loan"],
             d["ll_interest"], d["sl_interest"], d["other_deduction"],
             d["cd"], d["share"], d["dcrb"], d["other_earning"],
             d["total_deduction"], d["total_earning"],
             d["final_amount"], d["status"], d.get("remark", ""), rid))
        conn.commit()
        conn.close()
        return {"ok": True}

    def delete_settlement(self, rid):
        conn = get_connection()
        c = conn.cursor()
        c.execute("DELETE FROM settlements WHERE id=?", (rid,))
        conn.commit()
        conn.close()
        return {"ok": True}

    # --- LOAN ---

    def calculate_loan(self, data_json):
        d = json.loads(data_json)
        settings = get_settings_dict()
        interest_rate = float(d.get("interest_rate", settings.get("interest_rate", "11.25")))
        present_cd = float(d.get("present_cd", 0))
        required_cd = float(d.get("required_cd", 0))
        present_share = float(d.get("present_share", 0))
        required_share = float(d.get("required_share", settings.get("share_requirement", "8000")))
        old_ll = float(d.get("old_long_loan", 0))
        old_sl = float(d.get("old_short_loan", 0))
        other_ded = float(d.get("other_deduction", 0))
        new_loan = float(d.get("new_loan_amount", 0))
        principal_rec = float(d.get("principal_recovery", 0))
        cd_deduction = max(0, required_cd - present_cd)
        share_deduction = max(0, required_share - present_share)
        total_ded = cd_deduction + share_deduction + old_ll + old_sl + other_ded
        amount_in_hand = new_loan - total_ded
        monthly_rate = interest_rate / 100 / 12
        outstanding = new_loan
        total_interest = 0
        schedule = []
        emi_no = 0
        while outstanding > 0 and principal_rec > 0:
            emi_no += 1
            interest = outstanding * monthly_rate
            principal_part = min(principal_rec, outstanding)
            total_emi = round(principal_part + interest, 2)
            closing = round(outstanding - principal_part, 2)
            total_interest += interest
            schedule.append({
                "emi_no": emi_no,
                "principal": round(principal_part, 2),
                "interest": round(interest, 2),
                "total_emi": total_emi,
                "balance": closing,
                "remark": "Loan Closed" if closing <= 0 else "",
            })
            outstanding = closing
            if emi_no > 600:
                break
        total_repayment = new_loan + round(total_interest, 2)
        return {
            "cd_deduction": round(cd_deduction, 2),
            "share_deduction": round(share_deduction, 2),
            "total_deduction": round(total_ded, 2),
            "amount_in_hand": round(amount_in_hand, 2),
            "total_interest": round(total_interest, 2),
            "total_repayment": round(total_repayment, 2),
            "schedule": schedule,
        }

    def save_loan(self, data_json):
        d = json.loads(data_json)
        conn = get_connection()
        c = conn.cursor()
        c.execute("""INSERT INTO loans
            (name, gen_no, present_cd, required_cd,
             present_share, required_share, old_long_loan, old_short_loan,
             other_deduction, new_loan_amount, interest_rate, principal_recovery,
             cd_deduction, share_deduction, total_deduction,
             amount_in_hand, total_interest, total_repayment, schedule, remark)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (d["name"], d["gen_no"],
             d["present_cd"], d["required_cd"],
             d["present_share"], d["required_share"],
             d["old_long_loan"], d["old_short_loan"],
             d["other_deduction"], d["new_loan_amount"],
             d["interest_rate"], d["principal_recovery"],
             d["cd_deduction"], d["share_deduction"], d["total_deduction"],
             d["amount_in_hand"], d["total_interest"], d["total_repayment"],
             json.dumps(d.get("schedule", [])), d.get("remark", "")))
        conn.commit()
        rid = c.lastrowid
        conn.close()
        return {"id": rid}

    def get_loans(self, search_json=""):
        conn = get_connection()
        conn.row_factory = dict_factory
        c = conn.cursor()
        cols = "id, created_at, name, gen_no, new_loan_amount, total_deduction, amount_in_hand, total_interest, total_repayment"
        params = []
        where = []
        if search_json:
            s = json.loads(search_json)
            q = s.get("query", "")
            if q:
                where.append("(name LIKE ? OR gen_no LIKE ?)")
                params.extend([f"%{q}%", f"%{q}%"])
            df = s.get("date_from", "")
            dt = s.get("date_to", "")
            if df:
                where.append("date(created_at) >= ?")
                params.append(df)
            if dt:
                where.append("date(created_at) <= ?")
                params.append(dt)
        sql = f"SELECT {cols} FROM loans"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY created_at DESC"
        c.execute(sql, params)
        rows = c.fetchall()
        conn.close()
        return rows

    def get_loan(self, rid):
        conn = get_connection()
        conn.row_factory = dict_factory
        c = conn.cursor()
        c.execute("SELECT * FROM loans WHERE id=?", (rid,))
        row = c.fetchone()
        conn.close()
        if row and row.get("schedule"):
            row["schedule"] = json.loads(row["schedule"])
        return row

    def update_loan(self, rid, data_json):
        d = json.loads(data_json)
        conn = get_connection()
        c = conn.cursor()
        c.execute("""UPDATE loans SET
            name=?, gen_no=?, present_cd=?, required_cd=?,
            present_share=?, required_share=?, old_long_loan=?, old_short_loan=?,
            other_deduction=?, new_loan_amount=?, interest_rate=?, principal_recovery=?,
            cd_deduction=?, share_deduction=?, total_deduction=?,
            amount_in_hand=?, total_interest=?, total_repayment=?, schedule=?, remark=?
            WHERE id=?""",
            (d["name"], d["gen_no"],
             d["present_cd"], d["required_cd"],
             d["present_share"], d["required_share"],
             d["old_long_loan"], d["old_short_loan"],
             d["other_deduction"], d["new_loan_amount"],
             d["interest_rate"], d["principal_recovery"],
             d["cd_deduction"], d["share_deduction"], d["total_deduction"],
             d["amount_in_hand"], d["total_interest"], d["total_repayment"],
             json.dumps(d.get("schedule", [])), d.get("remark", ""), rid))
        conn.commit()
        conn.close()
        return {"ok": True}

    def delete_loan(self, rid):
        conn = get_connection()
        c = conn.cursor()
        c.execute("DELETE FROM loans WHERE id=?", (rid,))
        conn.commit()
        conn.close()
        return {"ok": True}

    # --- FD ---

    def calculate_fd(self, data_json):
        d = json.loads(data_json)
        amount = float(d.get("amount", 0))
        months = int(d.get("months", 0))
        rate = float(d.get("rate", 4.0))
        settings = get_settings_dict()
        if months >= 36:
            suggested = float(settings.get("fd_rate_36", "9.5"))
        elif months >= 24:
            suggested = float(settings.get("fd_rate_24", "8.5"))
        elif months >= 12:
            suggested = float(settings.get("fd_rate_12", "8.0"))
        else:
            suggested = float(settings.get("fd_rate_1_360", "4.0"))
        if rate == 0:
            rate = suggested
        total_interest = amount * (rate / 100) * (months / 12)
        total_amount = amount + total_interest
        return {
            "total_interest": round(total_interest, 2),
            "total_amount": round(total_amount, 2),
            "suggested_rate": suggested,
        }

    def save_fd(self, data_json):
        d = json.loads(data_json)
        conn = get_connection()
        c = conn.cursor()
        c.execute("""INSERT INTO fds
            (fd_no, name, amount, months, rate, total_interest, total_amount, remark)
            VALUES (?,?,?,?,?,?,?,?)""",
            (d["fd_no"], d["name"], d["amount"], d["months"],
             d["rate"], d["total_interest"], d["total_amount"], d.get("remark", "")))
        conn.commit()
        rid = c.lastrowid
        conn.close()
        return {"id": rid}

    def get_fds(self, search_json=""):
        conn = get_connection()
        conn.row_factory = dict_factory
        c = conn.cursor()
        params = []
        where = []
        if search_json:
            s = json.loads(search_json)
            q = s.get("query", "")
            if q:
                where.append("(name LIKE ? OR fd_no LIKE ?)")
                params.extend([f"%{q}%", f"%{q}%"])
            df = s.get("date_from", "")
            dt = s.get("date_to", "")
            if df:
                where.append("date(created_at) >= ?")
                params.append(df)
            if dt:
                where.append("date(created_at) <= ?")
                params.append(dt)
        sql = "SELECT * FROM fds"
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY created_at DESC"
        c.execute(sql, params)
        rows = c.fetchall()
        conn.close()
        return rows

    def get_fd(self, rid):
        conn = get_connection()
        conn.row_factory = dict_factory
        c = conn.cursor()
        c.execute("SELECT * FROM fds WHERE id=?", (rid,))
        row = c.fetchone()
        conn.close()
        return row

    def update_fd(self, rid, data_json):
        d = json.loads(data_json)
        conn = get_connection()
        c = conn.cursor()
        c.execute("""UPDATE fds SET
            fd_no=?, name=?, amount=?, months=?, rate=?,
            total_interest=?, total_amount=?, remark=? WHERE id=?""",
            (d["fd_no"], d["name"], d["amount"], d["months"],
             d["rate"], d["total_interest"], d["total_amount"],
             d.get("remark", ""), rid))
        conn.commit()
        conn.close()
        return {"ok": True}

    def delete_fd(self, rid):
        conn = get_connection()
        c = conn.cursor()
        c.execute("DELETE FROM fds WHERE id=?", (rid,))
        conn.commit()
        conn.close()
        return {"ok": True}

    # --- CALCULATOR HISTORY ---

    def save_calc(self, data_json):
        d = json.loads(data_json)
        conn = get_connection()
        c = conn.cursor()
        c.execute("INSERT INTO calc_results (expression, result) VALUES (?, ?)",
                  (d.get("expression", ""), d.get("result", "")))
        conn.commit()
        rid = c.lastrowid
        conn.close()
        return {"id": rid}

    def get_calcs(self, search_json=""):
        conn = get_connection()
        conn.row_factory = dict_factory
        c = conn.cursor()
        c.execute("SELECT * FROM calc_results ORDER BY created_at DESC")
        rows = c.fetchall()
        conn.close()
        return rows

    def delete_calc(self, rid):
        conn = get_connection()
        c = conn.cursor()
        c.execute("DELETE FROM calc_results WHERE id=?", (rid,))
        conn.commit()
        conn.close()
        return {"ok": True}

    def open_url(self, url):
        import webbrowser, threading
        def _open():
            webbrowser.open(url)
        threading.Thread(target=_open, daemon=True).start()
        return {"ok": True}
