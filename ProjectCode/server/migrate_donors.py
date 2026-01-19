#!/usr/bin/env python3
"""
Migration script to import donor data from CSV files to the database.
Run this script once to migrate existing CSV data.

Usage:
    python migrate_donors.py
"""

import csv
import os
import re
from datetime import datetime, date
from decimal import Decimal
from database import SessionLocal, Donor, create_tables

# Path to CSV files (relative to this script)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'client', 'public', 'data')

INDIVIDUAL_DONORS_CSV = os.path.join(CLIENT_DATA_DIR, 'individualDonors.csv')
ENTERPRISE_DONORS_CSV = os.path.join(CLIENT_DATA_DIR, 'enterpriseDonors.csv')


def parse_amount(amount_str: str) -> Decimal:
    """Parse amount string like '$300.00' or '300' to Decimal"""
    if not amount_str:
        return Decimal('0')
    # Remove $ and commas
    cleaned = re.sub(r'[$,]', '', amount_str.strip())
    try:
        return Decimal(cleaned)
    except:
        return Decimal('0')


def parse_date(date_str: str) -> date:
    """Parse date string in various formats"""
    if not date_str:
        return date.today()

    # Try different date formats
    formats = [
        '%m/%d/%Y',  # 04/02/2025
        '%Y-%m-%d',  # 2024-03-15
        '%m/%d/%y',  # 04/02/25
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue

    return date.today()


def generate_donor_id(name: str, donor_type: str, index: int) -> str:
    """Generate a unique donor ID"""
    # Create a clean ID from name
    clean_name = re.sub(r'[^a-zA-Z0-9]', '', name)[:10].lower()
    prefix = 'IND' if donor_type == 'individual' else 'ENT'
    return f"{prefix}_{clean_name}_{index:04d}"


def migrate_individual_donors(db):
    """Migrate individual donors from CSV"""
    if not os.path.exists(INDIVIDUAL_DONORS_CSV):
        print(f"Individual donors CSV not found: {INDIVIDUAL_DONORS_CSV}")
        return 0

    count = 0
    with open(INDIVIDUAL_DONORS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            name = row.get('WECHAT NAME', '').strip()
            if not name:
                continue

            # Skip anonymous donors
            notes = row.get('NOTES', '').strip()
            if notes == 'Anonymous Donor':
                print(f"Skipping anonymous donor: {name}")
                continue

            amount = parse_amount(row.get('AMOUNT', '0'))
            if amount <= 0:
                continue

            source = row.get('SOURCE (NAME)', '').strip()
            date_str = row.get('DATE', '')
            receipt = row.get('RECEIPT', '').strip().upper() == 'YES'
            donation_dt = parse_date(date_str)

            donor_id = generate_donor_id(name, 'individual', i + 1)

            # Check if donor already exists
            existing = db.query(Donor).filter(Donor.donor_id == donor_id).first()
            if existing:
                print(f"Donor already exists: {donor_id}")
                continue

            # Extract message from notes if it's not just "Anonymous Donor"
            message = notes if notes and notes != 'Anonymous Donor' else None

            donor = Donor(
                donor_id=donor_id,
                name=name,
                donor_type='individual',
                donation_event='General Support',
                amount=amount,
                quantity=1,
                donation_date=donation_dt,
                source=source,
                receipt_confirmed=receipt,
                notes=notes if notes else None,
                message=message,
                created_at=datetime.combine(donation_dt, datetime.min.time()),
                updated_at=datetime.now()
            )

            db.add(donor)
            count += 1
            print(f"Added individual donor: {name} (${amount}) - {donation_dt}")

    return count


def migrate_enterprise_donors(db):
    """Migrate enterprise donors from CSV"""
    if not os.path.exists(ENTERPRISE_DONORS_CSV):
        print(f"Enterprise donors CSV not found: {ENTERPRISE_DONORS_CSV}")
        return 0

    count = 0
    with open(ENTERPRISE_DONORS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            name = row.get('name', '').strip()
            if not name:
                continue

            amount = parse_amount(row.get('amount', '0'))
            if amount <= 0:
                continue

            date_str = row.get('donateTime', '')
            donation_dt = parse_date(date_str)

            donor_id = generate_donor_id(name, 'enterprise', i + 1)

            # Check if donor already exists
            existing = db.query(Donor).filter(Donor.donor_id == donor_id).first()
            if existing:
                print(f"Donor already exists: {donor_id}")
                continue

            donor = Donor(
                donor_id=donor_id,
                name=name,
                donor_type='enterprise',
                donation_event='Corporate Sponsorship',
                amount=amount,
                quantity=1,
                donation_date=donation_dt,
                source='Corporate',
                receipt_confirmed=True,
                notes=None,
                message=None,
                created_at=datetime.combine(donation_dt, datetime.min.time()),
                updated_at=datetime.now()
            )

            db.add(donor)
            count += 1
            print(f"Added enterprise donor: {name} (${amount}) - {donation_dt}")

    return count


def delete_csv_files():
    """Delete the CSV files after successful migration"""
    files_to_delete = [INDIVIDUAL_DONORS_CSV, ENTERPRISE_DONORS_CSV]
    for filepath in files_to_delete:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Deleted: {filepath}")
        else:
            print(f"File not found (already deleted?): {filepath}")


def main():
    print("=" * 60)
    print("Donor Migration Script")
    print("=" * 60)

    # Ensure tables exist
    print("\nEnsuring database tables exist...")
    create_tables()

    # Create database session
    db = SessionLocal()

    try:
        # Migrate individual donors
        print("\n--- Migrating Individual Donors ---")
        individual_count = migrate_individual_donors(db)

        # Migrate enterprise donors
        print("\n--- Migrating Enterprise Donors ---")
        enterprise_count = migrate_enterprise_donors(db)

        # Commit all changes
        db.commit()

        print("\n" + "=" * 60)
        print("Migration Complete!")
        print(f"  Individual donors added: {individual_count}")
        print(f"  Enterprise donors added: {enterprise_count}")
        print(f"  Total donors added: {individual_count + enterprise_count}")
        print("=" * 60)

        # Ask to delete CSV files
        if individual_count > 0 or enterprise_count > 0:
            print("\nDeleting CSV files...")
            delete_csv_files()
            print("CSV files deleted successfully.")

    except Exception as e:
        print(f"\nError during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
