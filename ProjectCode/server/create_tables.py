#!/usr/bin/env python3
"""
Script to create database tables for NewBee Running Club
"""
from database import create_tables

if __name__ == "__main__":
    print("Creating database tables...")
    try:
        create_tables()
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")