#!/usr/bin/env python3
"""
Script to import race results from CSV to database
"""
import csv
import os
import glob
from datetime import datetime
from sqlalchemy.orm import sessionmaker
from database import engine, Results

# Create session
Session = sessionmaker(bind=engine)

def clean_percentage(value):
    """Remove % symbol and convert to decimal"""
    if isinstance(value, str) and value.strip().endswith('%'):
        return float(value.strip().rstrip('%'))
    return None

def parse_csv_and_import():
    """Parse CSV file and import data to database"""
    csv_file = "/Users/xiaoqingguo/Documents/NewBee-Running-Club/ProjectCode/server/data/RMS_NBRC_team_runners_2025_09_19_02_25_14.csv"

    # Race details
    race_name = "2025 NYRR Joe Kleinerman 10K"
    race_date = datetime(2025, 1, 11, 8, 0)  # Jan 11, 2025 8:00 AM
    race_distance = "10K"

    session = Session()

    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            # Skip header rows (first 6 rows)
            for _ in range(6):
                next(file)

            csv_reader = csv.reader(file)
            imported_count = 0

            for row in csv_reader:
                # Skip empty rows
                if not row or not row[0].strip():
                    continue

                # Parse data from CSV columns
                try:
                    name = row[4].strip()
                    bib = row[3].strip() if row[3].strip() else None

                    # Check if record already exists (by name, bib, and race)
                    existing_result = session.query(Results).filter_by(
                        name=name,
                        bib=bib,
                        race=race_name
                    ).first()

                    if existing_result:
                        # Update existing record
                        existing_result.overall_place = int(row[0]) if row[0].strip() else None
                        existing_result.gender_place = int(row[1]) if row[1].strip() else None
                        existing_result.age_group_place = int(row[2]) if row[2].strip() else None
                        existing_result.gender_age = row[5].strip() if row[5].strip() else None
                        existing_result.iaaf = row[6].strip() if row[6].strip() else None
                        existing_result.overall_time = row[7].strip() if row[7].strip() else None
                        existing_result.pace = row[8].strip() if row[8].strip() else None
                        existing_result.gun_time = row[9].strip() if row[9].strip() else None
                        existing_result.age_graded_time = row[10].strip() if row[10].strip() else None
                        existing_result.age_graded_place = int(row[12]) if len(row) > 12 and row[12].strip() else None
                        existing_result.age_graded_percent = clean_percentage(row[14]) if len(row) > 14 and row[14].strip() else None
                        existing_result.race_time = race_date
                        existing_result.race_distance = race_distance
                        print(f"Updated existing record for {name}")
                    else:
                        # Create new record
                        result = Results(
                            overall_place=int(row[0]) if row[0].strip() else None,
                            gender_place=int(row[1]) if row[1].strip() else None,
                            age_group_place=int(row[2]) if row[2].strip() else None,
                            bib=bib,
                            name=name,
                            gender_age=row[5].strip() if row[5].strip() else None,
                            iaaf=row[6].strip() if row[6].strip() else None,
                            overall_time=row[7].strip() if row[7].strip() else None,
                            pace=row[8].strip() if row[8].strip() else None,
                            gun_time=row[9].strip() if row[9].strip() else None,
                            age_graded_time=row[10].strip() if row[10].strip() else None,
                            age_graded_place=int(row[12]) if len(row) > 12 and row[12].strip() else None,
                            age_graded_percent=clean_percentage(row[14]) if len(row) > 14 and row[14].strip() else None,
                            race=race_name,
                            race_time=race_date,
                            race_distance=race_distance
                        )
                        session.add(result)
                        print(f"Added new record for {name}")

                    imported_count += 1

                except (ValueError, IndexError) as e:
                    print(f"Skipping row due to error: {e}")
                    print(f"Row data: {row}")
                    continue

            session.commit()
            print(f"✅ Successfully imported {imported_count} race results!")

            # Clean up CSV files in data directory after successful import
            data_dir = "/Users/xiaoqingguo/Documents/NewBee-Running-Club/ProjectCode/server/data/"
            csv_files = glob.glob(os.path.join(data_dir, "*.csv"))
            for csv_file in csv_files:
                os.remove(csv_file)
                print(f"🧹 Cleaned up: {os.path.basename(csv_file)}")

            if csv_files:
                print(f"✅ Removed {len(csv_files)} CSV file(s) from data directory")

    except Exception as e:
        session.rollback()
        print(f"❌ Error importing data: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("Importing 2025 NYRR Joe Kleinerman 10K results from CSV...")
    parse_csv_and_import()