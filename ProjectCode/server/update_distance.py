#!/usr/bin/env python3
"""
Script to update race distances from "10 Mile" to "10M"
"""
from sqlalchemy import text
from database import engine

def update_distance():
    """Update race distance from '10 Mile' to '10M'"""
    with engine.connect() as connection:
        try:
            # Update the race distance
            result = connection.execute(text(
                "UPDATE results SET race_distance = '10M' WHERE race_distance = '10 Mile'"
            ))
            connection.commit()
            print(f"✅ Successfully updated {result.rowcount} records from '10 Mile' to '10M'")

        except Exception as e:
            connection.rollback()
            print(f"❌ Error updating distance: {e}")
            raise

if __name__ == "__main__":
    print("Updating race distance from '10 Mile' to '10M'...")
    update_distance()