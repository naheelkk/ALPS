import sqlite3
from flask import Blueprint, jsonify
from app import db
from sqlalchemy import text

debug_bp_advanced = Blueprint('debug_advanced', __name__)

@debug_bp_advanced.route('/db-check', methods=['GET'])
def db_check():
    try:
        # Check bandit_params table
        result = db.session.execute(text("PRAGMA table_info(bandit_params)")).fetchall()
        columns = [row[1] for row in result] if result else []
        
        # Check if any bandit params exist
        count = 0
        if columns:
            count = db.session.execute(text("SELECT COUNT(*) FROM bandit_params")).scalar()
            
        return jsonify({
            'status': 'success',
            'table_columns': columns,
            'row_count': count
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

# Need to register this somewhere temporarily, I'll put it in check_bandit.py that I run
