import requests
import json
from app import create_app

# Create app context to get access to configuration if needed, 
# but for a request we can just hit the local URL if the server is running.
# However, I don't know the port for sure (usually 5000), and I can't easily hit localhost from inside the container if the server is running on the host?
# Wait, I am on the user's machine via the agent. I can run python code.
# But `requests` hitting localhost might fail if the server isn't running in a way I can access.
# BETTER APPROACH: Manually invoke the view function in a script context.

from app import create_app, db
from flask import Flask

app = create_app()

with app.test_request_context('/api/courses/3'):
    # We need to authenticate or mock authentication? 
    # The route might be @jwt_required(optional=True) or similar.
    # Let's check the route definition in the view_file output first.
    # If it's pure optional, we can just call the view function.
    
    # We need to import the blueprint view function.
    # It's registered as 'courses.get_course'.
    try:
        from app.routes.courses import get_course
        # Mocking db access might be needed if not running against real db?
        # But we actully want to run against the real DB.
        
        # We need to simulate the request context so 'verify_jwt_in_request' works.
        # But if jwt is optional, maybe we can skip?
        
        response = get_course(3)
        # response is (json_response, status_code) or just json_response
        
        if isinstance(response, tuple):
            print("Response Keys:", response[0].json.keys())
            print("Assessments Value:", response[0].json.get('assessments'))
        else:
            print("Response Keys:", response.json.keys())
            print("Assessments Value:", response.json.get('assessments'))
            
    except Exception as e:
        print(f"Error: {e}")
