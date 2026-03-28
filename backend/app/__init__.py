from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow
import os

from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
ma = Marshmallow()

def create_app(config_name='default'):
    app = Flask(__name__)
    print("Backend server reloading... API updates applied (Quiz Schema Fix).")
    app.config.from_object(config[config_name])
    
    # Create upload folder
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'uploads'), exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    ma.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'message': 'Token has expired',
            'error': 'token_expired'
        }), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'message': f'Invalid token: {error}',
            'error': 'invalid_token'
        }), 422
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'message': 'Authorization token is missing',
            'error': 'authorization_required'
        }), 401
    
    # File serving route
    @app.route('/api/uploads/<path:folder>/<path:filename>')
    def serve_upload(folder, filename):
        upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], folder)
        return send_from_directory(upload_folder, filename)
    
    # Register blueprints
    from app.routes import (
        auth_bp, courses_bp, quizzes_bp, 
        recommendations_bp, progress_bp, 
        admin_bp,
        assessments_bp
    )
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(quizzes_bp, url_prefix='/api')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(progress_bp, url_prefix='/api/progress')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(assessments_bp, url_prefix='/api')
    
    # Create tables
    # with app.app_context():
    #     db.create_all()
    
    return app