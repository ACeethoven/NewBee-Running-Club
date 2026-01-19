#!/usr/bin/env python3
"""
One-time migration script to import events from CSV to database.

Usage:
    cd ProjectCode/server
    python migrate_events.py

This script reads events from the CSV file and inserts them into the database.
It can be safely re-run as it checks for existing events by ID.
"""

import csv
import os
from datetime import datetime
from pathlib import Path

from database import SessionLocal, Event, create_tables
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def parse_date(date_str):
    """Parse date string in YYYY-MM-DD format."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
    except ValueError:
        print(f"Warning: Could not parse date '{date_str}'")
        return None


def migrate_events():
    """Migrate events from CSV to database."""
    # Path to CSV file (relative to server directory)
    csv_path = Path(__file__).parent.parent / 'client' / 'public' / 'data' / 'events.csv'

    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return False

    print(f"Reading events from: {csv_path}")

    # Create tables if they don't exist
    create_tables()
    print("Database tables created/verified.")

    # Create database session
    db = SessionLocal()

    try:
        # Read CSV file
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            events_added = 0
            events_skipped = 0
            events_updated = 0

            for row in reader:
                # Skip empty rows
                if not row.get('id') or not row.get('name'):
                    continue

                csv_id = int(row['id'].strip())

                # Check if event already exists
                existing_event = db.query(Event).filter(Event.id == csv_id).first()

                event_data = {
                    'name': row.get('name', '').strip(),
                    'chinese_name': row.get('chineseName', '').strip() or None,
                    'date': parse_date(row.get('date', '')),
                    'time': row.get('time', '').strip() or None,
                    'location': row.get('location', '').strip() or None,
                    'chinese_location': row.get('chineseLocation', '').strip() or None,
                    'description': row.get('description', '').strip() or None,
                    'chinese_description': row.get('chineseDescription', '').strip() or None,
                    'image': row.get('image', '').strip() or None,
                    'signup_link': row.get('signupLink', '').strip() or None,
                    'status': row.get('status', 'Upcoming').strip() or 'Upcoming',
                }

                if existing_event:
                    # Update existing event
                    for key, value in event_data.items():
                        setattr(existing_event, key, value)
                    events_updated += 1
                    print(f"  Updated: {event_data['name']} (ID: {csv_id})")
                else:
                    # Create new event with specific ID
                    new_event = Event(id=csv_id, **event_data)
                    db.add(new_event)
                    events_added += 1
                    print(f"  Added: {event_data['name']} (ID: {csv_id})")

            # Commit all changes
            db.commit()

            print("\n" + "=" * 50)
            print("Migration Summary:")
            print(f"  Events added: {events_added}")
            print(f"  Events updated: {events_updated}")
            print(f"  Events skipped: {events_skipped}")
            print("=" * 50)

            return True

    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        return False

    finally:
        db.close()


def verify_migration():
    """Verify the migration by querying the database."""
    db = SessionLocal()
    try:
        events = db.query(Event).all()
        print(f"\nVerification: Found {len(events)} events in database:")
        for event in events:
            print(f"  - {event.id}: {event.name} ({event.status}) - {event.date}")
    finally:
        db.close()


if __name__ == '__main__':
    print("Starting events migration...")
    print()

    success = migrate_events()

    if success:
        verify_migration()
        print("\nMigration completed successfully!")
    else:
        print("\nMigration failed!")
        exit(1)
