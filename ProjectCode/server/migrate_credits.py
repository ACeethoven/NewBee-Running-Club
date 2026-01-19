#!/usr/bin/env python3
"""
Migration script to import club credits from CSV files to the database.

Usage:
    python migrate_credits.py

This script reads the following CSV files from the client's public/data directory:
- total_credits.csv
- activity_credits.csv
- registration_credits.csv
- volunteer_credits.csv

And inserts them into the temp_club_credits table with the appropriate credit_type.
"""

import csv
import os
import sys
from decimal import Decimal
from pathlib import Path

# Add the server directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, TempClubCredit, create_tables


def parse_csv_file(file_path: str) -> list[dict]:
    """Parse a CSV file and return a list of dictionaries."""
    data = []

    if not os.path.exists(file_path):
        print(f"Warning: File not found: {file_path}")
        return data

    with open(file_path, 'r', encoding='utf-8') as f:
        # Detect delimiter (tab or comma)
        sample = f.read(1024)
        f.seek(0)

        if '\t' in sample and ',' not in sample:
            delimiter = '\t'
        else:
            delimiter = ','

        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            if row.get('fullName'):
                data.append({
                    'full_name': row['fullName'].strip(),
                    'registration_credits': Decimal(row.get('registration_sum', '0') or '0'),
                    'checkin_credits': Decimal(row.get('checkin_sum', '0') or '0')
                })

    return data


def migrate_credits():
    """Main migration function."""
    # Determine the path to the CSV files
    script_dir = Path(__file__).parent
    client_data_dir = script_dir.parent / 'client' / 'public' / 'data'

    # Define the CSV files and their credit types
    csv_files = [
        ('total_credits.csv', 'total'),
        ('activity_credits.csv', 'activity'),
        ('registration_credits.csv', 'registration'),
        ('volunteer_credits.csv', 'volunteer'),
    ]

    # Create tables if they don't exist
    print("Ensuring database tables exist...")
    create_tables()

    # Get database session
    db = SessionLocal()

    try:
        # Clear existing temp credits (optional - comment out to append instead)
        existing_count = db.query(TempClubCredit).count()
        if existing_count > 0:
            print(f"Found {existing_count} existing records. Clearing...")
            db.query(TempClubCredit).delete()
            db.commit()

        total_imported = 0

        for csv_file, credit_type in csv_files:
            file_path = client_data_dir / csv_file
            print(f"\nProcessing {csv_file}...")

            data = parse_csv_file(str(file_path))

            if not data:
                print(f"  No data found in {csv_file}")
                continue

            # Insert records
            for record in data:
                credit = TempClubCredit(
                    full_name=record['full_name'],
                    credit_type=credit_type,
                    registration_credits=record['registration_credits'],
                    checkin_credits=record['checkin_credits']
                )
                db.add(credit)

            db.commit()
            print(f"  Imported {len(data)} records with credit_type='{credit_type}'")
            total_imported += len(data)

        print(f"\n{'='*50}")
        print(f"Migration complete! Total records imported: {total_imported}")
        print(f"{'='*50}")

        # Show summary by credit type
        print("\nSummary by credit type:")
        for csv_file, credit_type in csv_files:
            count = db.query(TempClubCredit).filter(
                TempClubCredit.credit_type == credit_type
            ).count()
            print(f"  {credit_type}: {count} records")

    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_credits()
