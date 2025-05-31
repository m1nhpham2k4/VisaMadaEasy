#!/usr/bin/env python
"""
This script demonstrates how to use Flask-Migrate to manage database migrations.
Run this script directly to see available migration commands.
"""

from flask.cli import FlaskGroup
from run import app # Import the app instance directly from run.py
from app.extensions import db # Import db for Flask-Migrate
from app.auth.models import * # Import all models from auth
from app.chat.models import * # Import all models from chat

# The FlaskGroup cli needs the app and db
# We can pass the app instance directly
cli = FlaskGroup(create_app=lambda info: app) 

if __name__ == '__main__':
    # To make `flask db` commands work, Flask-Migrate needs to know about the app and db.
    # Usually, Flask-Migrate finds these through the app context when FLASK_APP is set.
    # This script is more for direct execution if needed, or to understand the setup.
    # For `flask db` commands, ensure FLASK_APP=run.py is set in your environment.
    cli() 