from sqlalchemy import create_engine, Column, Integer, String, Decimal, DateTime, Boolean, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

# AWS MySQL Database Configuration for newbee-running-club-db
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "newbee_running_club")

# MySQL connection string for AWS RDS
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

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
    amount = Column(Decimal(10, 2), nullable=False)
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