# Use an official Python runtime as a parent image
FROM python:3.12-alpine

# # Set environment variables
# ENV PYTHONDONTWRITEBYTECODE 1
# ENV PYTHONUNBUFFERED 1

# Install system dependencies
# Alpine Linux uses 'apk' instead of 'apt-get'
# 'build-base' is a meta-package that includes gcc and other common build tools.
# 'python3-dev' provides headers for building Python C extensions.
# 'postgresql-dev' provides headers for libpq (for PostgreSQL).
RUN apk update && apk add --no-cache \
    build-base \
    python3-dev \
    postgresql-dev \
    # Add any other system dependencies here if needed
    && rm -rf /var/cache/apk/*

# Create and set the working directory
WORKDIR /app

# Copy the application code into the container
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Set environment variables for Flask
# FLASK_APP is now set to run.py which contains the app instance
ENV FLASK_APP=run.py 
# FLASK_RUN_HOST and FLASK_RUN_PORT are read from environment in run.py
# Set them here if you want to fix them for the container, otherwise they can be set at runtime.
# ENV FLASK_RUN_HOST=0.0.0.0
# ENV FLASK_RUN_PORT=5000
# ENV FLASK_CONFIG=production # Example: set to production for Docker builds

# Command to run the application
# run.py will use environment variables for host and port, defaulting to 0.0.0.0:5000
CMD ["python", "run.py"]
