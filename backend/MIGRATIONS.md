# Using Flask-Migrate for Database Migrations

This project uses Flask-Migrate to handle database schema changes. Flask-Migrate is an extension that handles SQLAlchemy database migrations for Flask applications using Alembic.

## How Flask-Migrate Works

Flask-Migrate works by:

1. Tracking your model definitions in a version control system for your database schema
2. Detecting changes between your current database schema and your model definitions
3. Generating migration scripts to apply those changes
4. Providing commands to upgrade or downgrade your database to specific versions

## Initial Setup

The setup has already been done for you:

1. Flask-Migrate has been added to `requirements.txt`
2. The `migrate` object has been initialized in `extensions.py`
3. The `migrate` object is being initialized with the app and db in `main.py`

## Setting Up Your Migration Environment

After cloning the repository and installing dependencies, you need to initialize the migration repository:

```bash
# Initialize the migrations directory
flask db init
```

This will create a `migrations` directory in your project with the Alembic configuration.

## How to Make Database Changes

### Step 1: Modify Your Models

First, make changes to your SQLAlchemy models. For example, if you want to add a new column to the `User` model:

```python
# models.py
class User(db.Model):
    # Existing columns...
    
    # Add a new column
    profile_picture = db.Column(db.String(255), nullable=True)
```

### Step 2: Generate a Migration

After modifying your models, generate a migration script:

```bash
# Generate a migration script
flask db migrate -m "Add profile picture to user model"
```

This command will:
- Detect the changes between your models and the current database schema
- Create a new migration script in the `migrations/versions` directory
- Include an appropriate upgrade and downgrade function

### Step 3: Review the Migration Script

Always review the generated migration script before applying it. It's located in `migrations/versions/`.

### Step 4: Apply the Migration

Apply the migration to update your database:

```bash
# Apply the migration
flask db upgrade
```

## Common Migration Commands

### View Migration History

```bash
# Show migration history
flask db history
```

### Check Current Database Version

```bash
# Show current revision
flask db current
```

### Downgrade Database

```bash
# Downgrade one revision
flask db downgrade

# Downgrade to a specific revision
flask db downgrade <revision_id>
```

### Upgrade to a Specific Version

```bash
# Upgrade to a specific revision
flask db upgrade <revision_id>
```

## Example Workflow for Adding a New Field

1. Add a new field to your model:

```python
# models.py
class User(db.Model):
    # Existing fields...
    birth_date = db.Column(db.Date, nullable=True)
```

2. Generate migration:

```bash
flask db migrate -m "Add birth_date to User model"
```

3. Apply the migration:

```bash
flask db upgrade
```

## Managing Migrations in Different Environments

When deploying to different environments (development, testing, production), always:

1. Never edit a migration that has been applied to production
2. Apply migrations in the same order across all environments
3. Keep your migration repository in version control

## Troubleshooting

### Migration Not Detecting Changes

If your migration isn't detecting changes:

1. Make sure your models are being imported somewhere in your application
2. Check if your model is properly defined as a SQLAlchemy model
3. Ensure your database connection is correct

### Conflict with Existing Tables

If you're implementing migrations on an existing database:

```bash
# Create a stamp for the current database state
flask db stamp head
```

This tells Flask-Migrate that your database is up-to-date with the latest migration.

## Conclusion

Flask-Migrate makes database schema changes manageable and version-controlled. It allows you to evolve your database schema over time while maintaining data integrity. 