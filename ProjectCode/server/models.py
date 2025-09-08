from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime
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