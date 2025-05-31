#!/usr/bin/env python
"""
This script demonstrates how to use Flask-Migrate to manage database migrations.
Run this script directly to see available migration commands.
"""

from flask import Flask
from flask.cli import FlaskGroup
from main import create_app

app = create_app()
cli = FlaskGroup(create_app=lambda: app)

if __name__ == '__main__':
    cli() 