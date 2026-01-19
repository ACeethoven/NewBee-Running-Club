from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
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
    quantity: int = Field(default=1, ge=1)
    donation_date: Optional[date] = None
    source: Optional[str] = Field(None, max_length=255)
    receipt_confirmed: bool = Field(default=False)
    notes: Optional[str] = None
    message: Optional[str] = None  # Public message from donor

class DonorCreate(DonorBase):
    pass

class DonorUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    donation_event: Optional[str] = Field(None, max_length=255)
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    quantity: Optional[int] = Field(None, ge=1)
    donation_date: Optional[date] = None
    source: Optional[str] = Field(None, max_length=255)
    receipt_confirmed: Optional[bool] = None
    notes: Optional[str] = None
    message: Optional[str] = None

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
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
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
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
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
    first_name: Optional[str] = None
    last_name: Optional[str] = None
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
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    email: str = Field(..., max_length=255)
    nyrr_id: Optional[str] = Field(None, max_length=50)
    running_experience: str
    location: str
    weekly_frequency: str
    monthly_mileage: str
    race_experience: Optional[str] = None
    goals: str
    introduction: str


# Event Status Enum
class EventStatus(str, Enum):
    upcoming = "Upcoming"
    highlight = "Highlight"
    cancelled = "Cancelled"


# Event Schemas
class EventBase(BaseModel):
    name: str = Field(..., max_length=255)
    chinese_name: Optional[str] = Field(None, max_length=255)
    date: date
    time: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    chinese_location: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    chinese_description: Optional[str] = None
    image: Optional[str] = Field(None, max_length=500)
    signup_link: Optional[str] = Field(None, max_length=500)
    status: EventStatus = Field(default=EventStatus.upcoming)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    chinese_name: Optional[str] = Field(None, max_length=255)
    date: Optional[date] = None
    time: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    chinese_location: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    chinese_description: Optional[str] = None
    image: Optional[str] = Field(None, max_length=500)
    signup_link: Optional[str] = Field(None, max_length=500)
    status: Optional[EventStatus] = None


class EventResponse(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Meeting Minutes Schemas
class MeetingMinutesBase(BaseModel):
    title: str = Field(..., max_length=255)
    meeting_date: date
    content: str  # HTML content from rich text editor


class MeetingMinutesCreate(MeetingMinutesBase):
    pass


class MeetingMinutesUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    meeting_date: Optional[date] = None
    content: Optional[str] = None


class MeetingMinutesResponse(MeetingMinutesBase):
    id: int
    created_by: Optional[str] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Comment Schemas
class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    id: int
    event_id: int
    member_id: int
    content: str
    author_name: Optional[str] = None
    author_photo_url: Optional[str] = None
    is_highlighted: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentWithModeration(CommentResponse):
    """Comment response with moderation fields (for admin view)"""
    is_hidden: bool = False
    hidden_by: Optional[int] = None
    hidden_at: Optional[datetime] = None
    hidden_reason: Optional[str] = None


class CommentHideRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=255)


# Like Schemas
class LikeCreate(BaseModel):
    anonymous_id: Optional[str] = Field(None, max_length=128)


class LikeResponse(BaseModel):
    id: int
    event_id: int
    member_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LikeCountResponse(BaseModel):
    count: int
    user_liked: bool


# Reaction Schemas
ALLOWED_EMOJIS = ["🏃", "🎉", "💪", "👏", "❤️", "🔥", "🐝", "⭐"]


class ReactionCreate(BaseModel):
    emoji: str = Field(..., max_length=10)
    anonymous_id: Optional[str] = Field(None, max_length=128)


class ReactionCountResponse(BaseModel):
    emoji: str
    count: int
    user_reacted: bool


class EventReactionsResponse(BaseModel):
    reactions: List[ReactionCountResponse]


# Event Comment Settings Schemas
class EventCommentSettingsUpdate(BaseModel):
    comments_enabled: Optional[bool] = None
    likes_enabled: Optional[bool] = None
    reactions_enabled: Optional[bool] = None
    closed_reason: Optional[str] = Field(None, max_length=255)


class EventCommentSettingsResponse(BaseModel):
    id: int
    event_id: int
    comments_enabled: bool = True
    likes_enabled: bool = True
    reactions_enabled: bool = True
    closed_at: Optional[datetime] = None
    closed_by: Optional[int] = None
    closed_reason: Optional[str] = None

    class Config:
        from_attributes = True


# Aggregated Engagement Response
class EventEngagementResponse(BaseModel):
    event_id: int
    likes: LikeCountResponse
    reactions: List[ReactionCountResponse]
    comment_count: int
    comments_enabled: bool = True
    likes_enabled: bool = True
    reactions_enabled: bool = True


class BatchEngagementRequest(BaseModel):
    event_ids: List[int]
    anonymous_id: Optional[str] = None


class BatchEngagementResponse(BaseModel):
    engagements: Dict[int, EventEngagementResponse]


# Temp Club Credit Schemas
class CreditType(str, Enum):
    total = "total"
    activity = "activity"
    registration = "registration"
    volunteer = "volunteer"


class TempClubCreditBase(BaseModel):
    full_name: str = Field(..., max_length=255)
    credit_type: CreditType
    registration_credits: Decimal = Field(default=Decimal("0"), decimal_places=2)
    checkin_credits: Decimal = Field(default=Decimal("0"), decimal_places=2)


class TempClubCreditCreate(TempClubCreditBase):
    pass


class TempClubCreditUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    credit_type: Optional[CreditType] = None
    registration_credits: Optional[Decimal] = Field(None, decimal_places=2)
    checkin_credits: Optional[Decimal] = Field(None, decimal_places=2)


class TempClubCreditResponse(TempClubCreditBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True