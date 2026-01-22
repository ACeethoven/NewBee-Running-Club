"""
Database Migration: Add Gender and Birth Year to Members

This script adds gender and birth_year columns to the members table
for more accurate race result matching using gender_age.

Run this script once to update the database schema.
Usage: python migrations/add_member_gender_birth_year.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from database import engine

def run_migration():
    """Run the database migration to add gender and birth_year columns."""

    print("Starting migration: Add Gender and Birth Year to Members")
    print("=" * 60)

    with engine.connect() as conn:
        # Check if we're using SQLite or MySQL
        dialect = engine.dialect.name
        print(f"Database dialect: {dialect}")

        # Check existing columns
        print("\n1. Checking existing columns in members table...")

        if dialect == 'sqlite':
            result = conn.execute(text("PRAGMA table_info(members)"))
            existing_columns = [row[1] for row in result.fetchall()]
        else:  # MySQL
            result = conn.execute(text("""
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'members' AND TABLE_SCHEMA = DATABASE()
            """))
            existing_columns = [row[0] for row in result.fetchall()]

        print(f"   Existing columns count: {len(existing_columns)}")

        # Add gender column
        if 'gender' not in existing_columns:
            print("\n2. Adding gender column...")
            if dialect == 'sqlite':
                conn.execute(text("ALTER TABLE members ADD COLUMN gender VARCHAR(1)"))
            else:
                conn.execute(text("ALTER TABLE members ADD COLUMN gender VARCHAR(1)"))
            conn.commit()
            print("   ✓ gender column added")
        else:
            print("\n2. ✓ gender column already exists")

        # Add birth_year column
        if 'birth_year' not in existing_columns:
            print("\n3. Adding birth_year column...")
            if dialect == 'sqlite':
                conn.execute(text("ALTER TABLE members ADD COLUMN birth_year INTEGER"))
            else:
                conn.execute(text("ALTER TABLE members ADD COLUMN birth_year INT"))
            conn.commit()
            print("   ✓ birth_year column added")
        else:
            print("\n3. ✓ birth_year column already exists")

    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("\nNew columns added to members table:")
    print("- gender: VARCHAR(1) - 'M' or 'F' for race record matching")
    print("- birth_year: INTEGER - Birth year for calculating gender_age")
    print("\nThese fields enable accurate matching of race results using")
    print("the combination of name + calculated gender_age (e.g., 'M35').")


if __name__ == "__main__":
    run_migration()
