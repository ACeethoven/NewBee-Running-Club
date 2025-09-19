from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Index, Time
from sqlalchemy.types import DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
USE_SQLITE = os.getenv("USE_SQLITE", "False").lower() == "true"

if USE_SQLITE:
    # SQLite for local development
    DATABASE_URL = "sqlite:///./newbee_running_club.db"
else:
    # AWS MySQL Database Configuration for newbee-running-club-db
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "3306")
    DB_USER = os.getenv("DB_USER", "admin")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_NAME = os.getenv("DB_NAME", "newbee_running_club")

    # MySQL connection string for AWS RDS
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

if USE_SQLITE:
    engine = create_engine(
        DATABASE_URL,
        echo=os.getenv("DEBUG", "False").lower() == "true"
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,  # Recycle connections after 1 hour
        echo=os.getenv("DEBUG", "False").lower() == "true"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Donor Model for consolidated donor table
class Donor(Base):
    __tablename__ = "donors"
    
    donation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    donor_id = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    donor_type = Column(String(20), nullable=False)  # 'individual' or 'enterprise'
    donation_event = Column(String(255), default='General Support')
    amount = Column(DECIMAL(10, 2), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Additional fields from original CSV data
    source = Column(String(255))
    receipt_confirmed = Column(Boolean, default=False)
    notes = Column(Text)
    
    # Indexes for better query performance
    __table_args__ = (
        Index('idx_donor_type', 'donor_type'),
        Index('idx_donation_event', 'donation_event'),
        Index('idx_amount', 'amount'),
        Index('idx_created_at', 'created_at'),
    )

# Results Model for race results
class Results(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    overall_place = Column(Integer)
    gender_place = Column(Integer)
    age_group_place = Column(Integer)
    bib = Column(String(20))
    name = Column(String(255), nullable=False)
    gender_age = Column(String(10))  # e.g., "M50"
    iaaf = Column(String(10))  # Country code like "CHN"
    overall_time = Column(String(20))  # Time format like "0:58:18"
    pace = Column(String(20))  # Pace format like "05:50"
    gun_time = Column(String(20))  # Gun time format like "0:58:28"
    age_graded_time = Column(String(20))  # Age graded time like "0:51:43"
    age_graded_place = Column(Integer)
    age_graded_percent = Column(DECIMAL(5, 2))  # Percentage like 85.09
    race = Column(String(255), nullable=False)  # Race name like "bronx 10 mile"
    race_time = Column(DateTime, nullable=False)  # Date and time of the race
    race_distance = Column(String(50), nullable=False)  # Race distance like "10 Mile"
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Indexes for better query performance
    __table_args__ = (
        Index('idx_race', 'race'),
        Index('idx_race_time', 'race_time'),
        Index('idx_name', 'name'),
        Index('idx_overall_place', 'overall_place'),
        Index('idx_gender_age', 'gender_age'),
    )

# Database dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)