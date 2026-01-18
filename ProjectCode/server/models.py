from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from decimal import Decimal
from datetime import datetime, date
from enum import Enum

class DonorType(str, Enum):
    individual = "individual"
    enterprise = "enterprise"

class DonorBase(BaseModel):
    donor_id: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    donor_type: DonorType
    donation_event: str = Field(default="General Support", max_length=255)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    source: Optional[str] = Field(None, max_length=255)
    receipt_confirmed: bool = Field(default=False)
    notes: Optional[str] = None

class DonorCreate(DonorBase):
    pass

class DonorUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    donation_event: Optional[str] = Field(None, max_length=255)
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    source: Optional[str] = Field(None, max_length=255)
    receipt_confirmed: Optional[bool] = None
    notes: Optional[str] = None

class DonorResponse(DonorBase):
    donation_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DonorsListResponse(BaseModel):
    individual_donors: list[DonorResponse]
    enterprise_donors: list[DonorResponse]
    
class DonationSummary(BaseModel):
    donor_type: str
    donor_count: int
    total_amount: Decimal
    average_amount: Decimal
    min_amount: Decimal
    max_amount: Decimal


# Member Status Enum
class MemberStatus(str, Enum):
    pending = "pending"  # New signups awaiting committee approval
    runner = "runner"     # Approved regular members
    admin = "admin"       # Admin and committee members with elevated privileges
    quit = "quit"         # Members who left the club


# Member Schemas
class MemberBase(BaseModel):
    username: str = Field(..., max_length=50)
    email: str = Field(..., max_length=255)
    status: MemberStatus = Field(default=MemberStatus.pending)
    committee_position: Optional[str] = Field(None, max_length=100)
    committee_position_cn: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)
    display_name_cn: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    nyrr_member_id: Optional[str] = Field(None, max_length=50)
    join_date: Optional[date] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    show_in_credits: bool = Field(default=True)
    show_in_donors: bool = Field(default=True)
    # Application form data
    running_experience: Optional[str] = None
    running_location: Optional[str] = Field(None, max_length=255)
    weekly_frequency: Optional[str] = Field(None, max_length=100)
    monthly_mileage: Optional[str] = Field(None, max_length=100)
    race_experience: Optional[str] = None
    running_goals: Optional[str] = None
    introduction: Optional[str] = None


class MemberCreate(MemberBase):
    password: str = Field(..., min_length=8)
    firebase_uid: Optional[str] = Field(None, max_length=128)


class MemberUpdate(BaseModel):
    email: Optional[str] = Field(None, max_length=255)
    status: Optional[MemberStatus] = None
    committee_position: Optional[str] = Field(None, max_length=100)
    committee_position_cn: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=100)
    display_name_cn: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    profile_photo_url: Optional[str] = Field(None, max_length=500)
    nyrr_member_id: Optional[str] = Field(None, max_length=50)
    join_date: Optional[date] = None
    registration_credits: Optional[Decimal] = None
    checkin_credits: Optional[Decimal] = None
    volunteer_credits: Optional[Decimal] = None
    activity_credits: Optional[Decimal] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    show_in_credits: Optional[bool] = None
    show_in_donors: Optional[bool] = None
    # Application form data
    running_experience: Optional[str] = None
    running_location: Optional[str] = Field(None, max_length=255)
    weekly_frequency: Optional[str] = Field(None, max_length=100)
    monthly_mileage: Optional[str] = Field(None, max_length=100)
    race_experience: Optional[str] = None
    running_goals: Optional[str] = None
    introduction: Optional[str] = None


class MemberResponse(MemberBase):
    id: int
    firebase_uid: Optional[str] = None
    registration_credits: Decimal = Decimal("0")
    checkin_credits: Decimal = Decimal("0")
    volunteer_credits: Decimal = Decimal("0")
    activity_credits: Decimal = Decimal("0")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MemberPublicResponse(BaseModel):
    """Public member info (no sensitive data)"""
    id: int
    username: str
    display_name: Optional[str] = None
    display_name_cn: Optional[str] = None
    status: MemberStatus
    committee_position: Optional[str] = None
    committee_position_cn: Optional[str] = None
    profile_photo_url: Optional[str] = None
    registration_credits: Decimal = Decimal("0")
    checkin_credits: Decimal = Decimal("0")
    volunteer_credits: Decimal = Decimal("0")
    activity_credits: Decimal = Decimal("0")

    class Config:
        from_attributes = True


class FirebaseUserSync(BaseModel):
    """Sync Firebase user to members table"""
    firebase_uid: str = Field(..., max_length=128)
    email: str = Field(..., max_length=255)
    display_name: Optional[str] = Field(None, max_length=100)
    photo_url: Optional[str] = Field(None, max_length=500)


class JoinApplicationRequest(BaseModel):
    """Join application form submission"""
    name: str = Field(..., max_length=255)
    email: str = Field(..., max_length=255)
    nyrr_id: Optional[str] = Field(None, max_length=50)
    running_experience: str
    location: str
    weekly_frequency: str
    monthly_mileage: str
    race_experience: Optional[str] = None
    goals: str
    introduction: str