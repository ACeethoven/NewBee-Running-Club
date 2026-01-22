"""
Database Migration: Add Gallery and Recurrence Features

This script adds the necessary columns and tables for:
1. Event Gallery (event_gallery_images, event_gallery_image_likes)
2. Event Recurrence (columns on events table, event_recurrence_rules table)

Run this script once to update the database schema.
Usage: python migrations/add_gallery_and_recurrence.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from database import engine, Base, Event, EventGalleryImage, EventGalleryImageLike, EventRecurrenceRule

def run_migration():
    """Run the database migration to add new columns and tables."""

    print("Starting migration: Add Gallery and Recurrence Features")
    print("=" * 60)

    with engine.connect() as conn:
        # Check if we're using SQLite or MySQL
        dialect = engine.dialect.name
        print(f"Database dialect: {dialect}")

        # ===== EVENTS TABLE UPDATES =====
        print("\n1. Adding recurrence columns to events table...")

        # Check if columns already exist
        if dialect == 'sqlite':
            result = conn.execute(text("PRAGMA table_info(events)"))
            existing_columns = [row[1] for row in result.fetchall()]
        else:  # MySQL
            result = conn.execute(text("""
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'events' AND TABLE_SCHEMA = DATABASE()
            """))
            existing_columns = [row[0] for row in result.fetchall()]

        print(f"   Existing columns: {existing_columns}")

        # Add is_recurring column
        if 'is_recurring' not in existing_columns:
            print("   Adding is_recurring column...")
            if dialect == 'sqlite':
                conn.execute(text("ALTER TABLE events ADD COLUMN is_recurring BOOLEAN DEFAULT 0"))
            else:
                conn.execute(text("ALTER TABLE events ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("   ✓ is_recurring added")
        else:
            print("   ✓ is_recurring already exists")

        # Add parent_event_id column
        if 'parent_event_id' not in existing_columns:
            print("   Adding parent_event_id column...")
            if dialect == 'sqlite':
                conn.execute(text("ALTER TABLE events ADD COLUMN parent_event_id INTEGER REFERENCES events(id) ON DELETE SET NULL"))
            else:
                conn.execute(text("ALTER TABLE events ADD COLUMN parent_event_id INTEGER"))
                # Add foreign key separately for MySQL
                try:
                    conn.execute(text("""
                        ALTER TABLE events ADD CONSTRAINT fk_events_parent
                        FOREIGN KEY (parent_event_id) REFERENCES events(id) ON DELETE SET NULL
                    """))
                except Exception as e:
                    print(f"   Note: Foreign key may already exist: {e}")
            conn.commit()
            print("   ✓ parent_event_id added")
        else:
            print("   ✓ parent_event_id already exists")

        # Add next_occurrence_date column
        if 'next_occurrence_date' not in existing_columns:
            print("   Adding next_occurrence_date column...")
            conn.execute(text("ALTER TABLE events ADD COLUMN next_occurrence_date DATE"))
            conn.commit()
            print("   ✓ next_occurrence_date added")
        else:
            print("   ✓ next_occurrence_date already exists")

        # Add indexes for new columns
        print("\n2. Adding indexes for events table...")
        try:
            if dialect == 'sqlite':
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_event_is_recurring ON events(is_recurring)"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_event_parent_id ON events(parent_event_id)"))
            else:
                # MySQL - check if index exists first
                result = conn.execute(text("""
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_NAME = 'events' AND INDEX_NAME = 'idx_event_is_recurring'
                """))
                if result.fetchone()[0] == 0:
                    conn.execute(text("CREATE INDEX idx_event_is_recurring ON events(is_recurring)"))

                result = conn.execute(text("""
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_NAME = 'events' AND INDEX_NAME = 'idx_event_parent_id'
                """))
                if result.fetchone()[0] == 0:
                    conn.execute(text("CREATE INDEX idx_event_parent_id ON events(parent_event_id)"))
            conn.commit()
            print("   ✓ Indexes added/verified")
        except Exception as e:
            print(f"   Note: Index creation: {e}")

        # ===== CREATE NEW TABLES =====
        print("\n3. Creating new tables...")

        # Create event_gallery_images table
        print("   Creating event_gallery_images table...")
        try:
            if dialect == 'sqlite':
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS event_gallery_images (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                        image_url TEXT NOT NULL,
                        caption VARCHAR(500),
                        caption_cn VARCHAR(500),
                        display_order INTEGER DEFAULT 0,
                        is_active BOOLEAN DEFAULT 1,
                        uploaded_by_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
                        uploaded_by_name VARCHAR(100),
                        like_count INTEGER DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS event_gallery_images (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        event_id INT NOT NULL,
                        image_url TEXT NOT NULL,
                        caption VARCHAR(500),
                        caption_cn VARCHAR(500),
                        display_order INT DEFAULT 0,
                        is_active BOOLEAN DEFAULT TRUE,
                        uploaded_by_id INT,
                        uploaded_by_name VARCHAR(100),
                        like_count INT DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                        FOREIGN KEY (uploaded_by_id) REFERENCES members(id) ON DELETE SET NULL,
                        INDEX idx_gallery_event_id (event_id),
                        INDEX idx_gallery_display_order (display_order),
                        INDEX idx_gallery_is_active (is_active)
                    )
                """))
            conn.commit()
            print("   ✓ event_gallery_images table created")
        except Exception as e:
            print(f"   Note: {e}")

        # Create event_gallery_image_likes table
        print("   Creating event_gallery_image_likes table...")
        try:
            if dialect == 'sqlite':
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS event_gallery_image_likes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        image_id INTEGER NOT NULL REFERENCES event_gallery_images(id) ON DELETE CASCADE,
                        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
                        firebase_uid VARCHAR(128),
                        anonymous_id VARCHAR(128),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(image_id, member_id),
                        UNIQUE(image_id, anonymous_id)
                    )
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS event_gallery_image_likes (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        image_id INT NOT NULL,
                        member_id INT,
                        firebase_uid VARCHAR(128),
                        anonymous_id VARCHAR(128),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (image_id) REFERENCES event_gallery_images(id) ON DELETE CASCADE,
                        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
                        INDEX idx_gallery_like_image_id (image_id),
                        UNIQUE KEY uq_gallery_like_image_member (image_id, member_id),
                        UNIQUE KEY uq_gallery_like_image_anonymous (image_id, anonymous_id)
                    )
                """))
            conn.commit()
            print("   ✓ event_gallery_image_likes table created")
        except Exception as e:
            print(f"   Note: {e}")

        # Create event_recurrence_rules table
        print("   Creating event_recurrence_rules table...")
        try:
            if dialect == 'sqlite':
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS event_recurrence_rules (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        event_id INTEGER NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
                        recurrence_type VARCHAR(50) NOT NULL,
                        days_of_week VARCHAR(50),
                        day_of_month INTEGER,
                        week_of_month INTEGER,
                        month_of_year INTEGER,
                        custom_rule TEXT,
                        end_date DATE,
                        max_occurrences INTEGER,
                        occurrences_created INTEGER DEFAULT 0,
                        last_generated_date DATE,
                        is_active BOOLEAN DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS event_recurrence_rules (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        event_id INT NOT NULL UNIQUE,
                        recurrence_type VARCHAR(50) NOT NULL,
                        days_of_week VARCHAR(50),
                        day_of_month INT,
                        week_of_month INT,
                        month_of_year INT,
                        custom_rule TEXT,
                        end_date DATE,
                        max_occurrences INT,
                        occurrences_created INT DEFAULT 0,
                        last_generated_date DATE,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                        INDEX idx_recurrence_event_id (event_id),
                        INDEX idx_recurrence_type (recurrence_type),
                        INDEX idx_recurrence_is_active (is_active)
                    )
                """))
            conn.commit()
            print("   ✓ event_recurrence_rules table created")
        except Exception as e:
            print(f"   Note: {e}")

    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("\nNew features available:")
    print("- Event Gallery: Upload, view, like photos for events")
    print("- Event Recurrence: Create recurring events with automatic generation")


if __name__ == "__main__":
    run_migration()
