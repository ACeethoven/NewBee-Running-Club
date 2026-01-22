"""
Migration: Alter event_gallery_images.image_url from TEXT to LONGTEXT

MySQL TEXT has a 64KB limit which truncates base64-encoded images.
LONGTEXT supports up to 4GB which is sufficient for any image.

Run this migration to fix truncated gallery images.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, USE_SQLITE
from sqlalchemy import text


def run_migration():
    """Alter image_url column to LONGTEXT for MySQL"""

    if USE_SQLITE:
        print("SQLite detected - TEXT type has no size limit in SQLite.")
        print("No migration needed.")
        return True

    print("MySQL detected - altering image_url column to LONGTEXT...")

    try:
        with engine.connect() as conn:
            # Alter the column type from TEXT to LONGTEXT
            conn.execute(text("""
                ALTER TABLE event_gallery_images
                MODIFY COLUMN image_url LONGTEXT NOT NULL
            """))
            conn.commit()

        print("Successfully altered image_url column to LONGTEXT!")
        print("\nIMPORTANT: Previously uploaded images that were truncated")
        print("will need to be re-uploaded to restore the full image.")
        return True

    except Exception as e:
        print(f"Migration failed: {e}")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
