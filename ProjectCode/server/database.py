from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Index, Time, Date, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.types import DECIMAL
import enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
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
    quantity = Column(Integer, default=1)  # Number of donations
    donation_date = Column(Date)  # Date of donation
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Additional fields from original CSV data
    source = Column(String(255))
    receipt_confirmed = Column(Boolean, default=False)
    notes = Column(Text)
    message = Column(Text)  # Optional donor message to display publicly

    # Indexes for better query performance
    __table_args__ = (
        Index('idx_donor_type', 'donor_type'),
        Index('idx_donation_event', 'donation_event'),
        Index('idx_amount', 'amount'),
        Index('idx_donation_date', 'donation_date'),
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


# Member status enum
class MemberStatus(enum.Enum):
    pending = "pending"  # New signups awaiting committee approval
    runner = "runner"     # Approved regular members
    admin = "admin"       # Admin and committee members with elevated privileges
    quit = "quit"         # Members who left the club


# Member Model for club members
class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Authentication
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    firebase_uid = Column(String(128), unique=True)

    # Status & Role
    status = Column(String(30), nullable=False, default='pending')  # New signups default to pending
    committee_position = Column(String(100))
    committee_position_cn = Column(String(100))

    # Profile
    first_name = Column(String(50))
    last_name = Column(String(50))
    display_name = Column(String(100))
    display_name_cn = Column(String(100))
    phone = Column(String(20))
    profile_photo_url = Column(String(500))

    # Club Data
    nyrr_member_id = Column(String(50))
    join_date = Column(Date)

    # Credits (for dashboard)
    registration_credits = Column(DECIMAL(10, 2), default=0)
    checkin_credits = Column(DECIMAL(10, 2), default=0)
    volunteer_credits = Column(DECIMAL(10, 2), default=0)
    activity_credits = Column(DECIMAL(10, 2), default=0)

    # Emergency Contact
    emergency_contact_name = Column(String(100))
    emergency_contact_phone = Column(String(20))

    # Application Data (from join form)
    running_experience = Column(Text)
    running_location = Column(String(255))
    weekly_frequency = Column(String(100))
    monthly_mileage = Column(String(100))
    race_experience = Column(Text)
    running_goals = Column(Text)
    introduction = Column(Text)

    # Privacy Settings (kill switches)
    show_in_credits = Column(Boolean, default=True)  # Show in club credit pages
    show_in_donors = Column(Boolean, default=True)   # Show in donor pages

    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Indexes for better query performance
    __table_args__ = (
        Index('idx_member_status', 'status'),
        Index('idx_member_nyrr_id', 'nyrr_member_id'),
        Index('idx_member_email', 'email'),
    )


# Event Model for club events/activities
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    chinese_name = Column(String(255))
    date = Column(Date, nullable=False)
    time = Column(String(50))  # Store as string like "8:00 AM"
    location = Column(String(255))
    chinese_location = Column(String(255))
    description = Column(Text)
    chinese_description = Column(Text)
    image = Column(String(500))
    signup_link = Column(String(500))
    status = Column(String(50), default='Upcoming')  # 'Upcoming', 'Highlight', 'Cancelled'
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Indexes for better query performance
    __table_args__ = (
        Index('idx_event_status', 'status'),
        Index('idx_event_date', 'date'),
    )


# Meeting Minutes Model for committee meeting records
class MeetingMinutes(Base):
    __tablename__ = "meeting_minutes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    meeting_date = Column(Date, nullable=False)
    content = Column(Text, nullable=False)  # HTML content from rich text editor
    created_by = Column(String(100))  # Name of admin who created
    created_by_id = Column(Integer)  # Member ID of creator
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Indexes for better query performance
    __table_args__ = (
        Index('idx_meeting_date', 'meeting_date'),
        Index('idx_meeting_created_at', 'created_at'),
    )


# Comment Model for event comments
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    member_id = Column(Integer, ForeignKey('members.id', ondelete='CASCADE'), nullable=False)
    firebase_uid = Column(String(128), nullable=False)
    content = Column(Text, nullable=False)
    author_name = Column(String(100))
    author_photo_url = Column(String(500))

    # Moderation fields
    is_highlighted = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)
    hidden_by = Column(Integer, ForeignKey('members.id', ondelete='SET NULL'))
    hidden_at = Column(DateTime)
    hidden_reason = Column(String(255))

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    event = relationship("Event", backref="comments")
    member = relationship("Member", foreign_keys=[member_id], backref="comments")
    hidden_by_member = relationship("Member", foreign_keys=[hidden_by])

    __table_args__ = (
        Index('idx_comment_event_id', 'event_id'),
        Index('idx_comment_member_id', 'member_id'),
        Index('idx_comment_created_at', 'created_at'),
    )


# Like Model for event likes
class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    member_id = Column(Integer, ForeignKey('members.id', ondelete='CASCADE'), nullable=True)  # Nullable for anonymous
    firebase_uid = Column(String(128))  # Nullable for anonymous
    anonymous_id = Column(String(128))  # For non-logged-in users (stored in localStorage)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    event = relationship("Event", backref="likes")
    member = relationship("Member", backref="likes")

    __table_args__ = (
        Index('idx_like_event_id', 'event_id'),
        UniqueConstraint('event_id', 'member_id', name='uq_like_event_member'),
        UniqueConstraint('event_id', 'anonymous_id', name='uq_like_event_anonymous'),
    )


# Reaction Model for event emoji reactions
class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    member_id = Column(Integer, ForeignKey('members.id', ondelete='CASCADE'), nullable=True)  # Nullable for anonymous
    firebase_uid = Column(String(128))  # Nullable for anonymous
    anonymous_id = Column(String(128))  # For non-logged-in users
    emoji = Column(String(10), nullable=False)  # Store emoji character
    created_at = Column(DateTime, default=func.now())

    # Relationships
    event = relationship("Event", backref="reactions")
    member = relationship("Member", backref="reactions")

    __table_args__ = (
        Index('idx_reaction_event_id', 'event_id'),
        Index('idx_reaction_emoji', 'emoji'),
        UniqueConstraint('event_id', 'member_id', 'emoji', name='uq_reaction_event_member_emoji'),
        UniqueConstraint('event_id', 'anonymous_id', 'emoji', name='uq_reaction_event_anonymous_emoji'),
    )


# EventCommentSettings Model for per-event engagement settings
class EventCommentSettings(Base):
    __tablename__ = "event_comment_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey('events.id', ondelete='CASCADE'), nullable=False, unique=True)

    comments_enabled = Column(Boolean, default=True)
    likes_enabled = Column(Boolean, default=True)
    reactions_enabled = Column(Boolean, default=True)

    closed_at = Column(DateTime)
    closed_by = Column(Integer, ForeignKey('members.id', ondelete='SET NULL'))
    closed_reason = Column(String(255))

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    event = relationship("Event", backref="comment_settings")
    closed_by_member = relationship("Member")

    __table_args__ = (
        Index('idx_event_comment_settings_event_id', 'event_id'),
    )


# TempClubCredit Model for storing credits for people who haven't registered as members yet
class TempClubCredit(Base):
    __tablename__ = "temp_club_credits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False, index=True)
    credit_type = Column(String(50), nullable=False)  # 'total', 'activity', 'registration', 'volunteer'
    registration_credits = Column(DECIMAL(10, 2), default=0)
    checkin_credits = Column(DECIMAL(10, 2), default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Indexes for better query performance
    __table_args__ = (
        Index('idx_temp_credit_full_name', 'full_name'),
        Index('idx_temp_credit_type', 'credit_type'),
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