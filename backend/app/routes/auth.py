from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity
)
from app import db
from app.models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'message': 'Name, email and password are required'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 409
        
        user = User(
            name=data['name'],
            email=data['email'],
            role='student'  # Default role
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
    except Exception as e:
        print(f"Registration error: {e}")
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(int(user_id))
        return jsonify(user.to_dict()), 200
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({'message': 'Failed to get profile', 'error': str(e)}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(int(user_id))
        data = request.get_json()
        
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            existing = User.query.filter_by(email=data['email']).first()
            if existing and existing.id != user.id:
                return jsonify({'message': 'Email already in use'}), 409
            user.email = data['email']
        if 'bio' in data:
            user.bio = data['bio']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        print(f"Update profile error: {e}")
        db.session.rollback()
        return jsonify({'message': 'Failed to update profile', 'error': str(e)}), 500


@auth_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        user = User.query.get_or_404(int(user_id))
        data = request.get_json()
        
        if not user.check_password(data.get('current_password', '')):
            return jsonify({'message': 'Current password is incorrect'}), 400
        
        if not data.get('new_password') or len(data['new_password']) < 8:
            return jsonify({'message': 'New password must be at least 8 characters'}), 400
        
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password updated successfully'}), 200
    except Exception as e:
        print(f"Change password error: {e}")
        db.session.rollback()
        return jsonify({'message': 'Failed to change password', 'error': str(e)}), 500