from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os

from database import get_db, create_tables, Donor, Results, Member
from models import (
    DonorCreate, DonorUpdate, DonorResponse, DonorsListResponse, DonationSummary,
    MemberCreate, MemberUpdate, MemberResponse, MemberPublicResponse, MemberStatus,
    FirebaseUserSync
)
import bcrypt

app = FastAPI(
    title="NewBee Running Club Donors API",
    description="API for managing donors - replacing CSV files with AWS MySQL database",
    version="1.0.0"
)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://newbeerunningclub.org"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    create_tables()

@app.get("/")
def read_root():
    return {"message": "NewBee Running Club API is running!", "database": "AWS MySQL RDS"}

# RACE RESULTS ENDPOINTS

@app.get("/api/results/available-years")
def get_available_years(db: Session = Depends(get_db)):
    """Get list of years that have race data"""
    years = db.query(
        func.extract('year', Results.race_time).label('year')
    ).distinct().order_by(
        func.extract('year', Results.race_time).desc()
    ).all()

    return {"years": [int(year.year) for year in years]}

@app.get("/api/results/men-records")
def get_men_records(year: int = None, db: Session = Depends(get_db)):
    """Get men's top 10 times for each race distance"""
    # Base query for male runners
    query = db.query(Results).filter(
        Results.gender_age.like('M%')  # Filter for male runners
    )

    # Add year filter if specified
    if year:
        query = query.filter(func.extract('year', Results.race_time) == year)

    # Get all results and group by distance
    all_results = query.all()

    # Group by distance and get top 10 for each
    distance_records = {}
    for result in all_results:
        if result.race_distance not in distance_records:
            distance_records[result.race_distance] = []
        distance_records[result.race_distance].append(result)

    # Sort each distance group by time and take top 10
    records = []
    for distance, results in distance_records.items():
        # Sort by overall_time (assuming format allows string comparison)
        sorted_results = sorted(results, key=lambda x: x.overall_time or 'ZZ:ZZ:ZZ')[:10]

        for rank, result in enumerate(sorted_results, 1):
            records.append({
                "distance": distance,
                "rank": rank,
                "time": result.overall_time,
                "runner_name": result.name,
                "race_name": result.race,
                "race_date": result.race_time.strftime('%Y-%m-%d'),
                "age_group": result.gender_age,
                "pace": result.pace
            })

    return {"men_records": records}

@app.get("/api/results/women-records")
def get_women_records(year: int = None, db: Session = Depends(get_db)):
    """Get women's top 10 times for each race distance"""
    # Base query for female runners
    query = db.query(Results).filter(
        Results.gender_age.like('W%')  # Filter for female runners
    )

    # Add year filter if specified
    if year:
        query = query.filter(func.extract('year', Results.race_time) == year)

    # Get all results and group by distance
    all_results = query.all()

    # Group by distance and get top 10 for each
    distance_records = {}
    for result in all_results:
        if result.race_distance not in distance_records:
            distance_records[result.race_distance] = []
        distance_records[result.race_distance].append(result)

    # Sort each distance group by time and take top 10
    records = []
    for distance, results in distance_records.items():
        # Sort by overall_time (assuming format allows string comparison)
        sorted_results = sorted(results, key=lambda x: x.overall_time or 'ZZ:ZZ:ZZ')[:10]

        for rank, result in enumerate(sorted_results, 1):
            records.append({
                "distance": distance,
                "rank": rank,
                "time": result.overall_time,
                "runner_name": result.name,
                "race_name": result.race,
                "race_date": result.race_time.strftime('%Y-%m-%d'),
                "age_group": result.gender_age,
                "pace": result.pace
            })

    return {"women_records": records}

@app.get("/api/results/all-races")
def get_all_races(db: Session = Depends(get_db)):
    """Get list of all races and distances"""
    races = db.query(
        Results.race,
        Results.race_distance,
        Results.race_time,
        func.count(Results.id).label('runner_count')
    ).group_by(
        Results.race, Results.race_distance, Results.race_time
    ).order_by(
        Results.race_time.desc()
    ).all()

    return {
        "races": [
            {
                "race_name": race.race,
                "distance": race.race_distance,
                "date": race.race_time.strftime('%Y-%m-%d'),
                "runner_count": race.runner_count
            } for race in races
        ]
    }

# Main endpoint for SponsorsPage - replaces CSV fetching
@app.get("/api/donors", response_model=DonorsListResponse)
def get_all_donors(db: Session = Depends(get_db)):
    """
    Get all donors separated by type for SponsorsPage
    Replaces: /data/individualDonors.csv and /data/enterpriseDonors.csv
    """
    individual_donors = db.query(Donor).filter(
        Donor.donor_type == "individual",
        Donor.notes != "Anonymous Donor"  # Exclude anonymous donors as per original logic
    ).order_by(Donor.name).all()
    
    enterprise_donors = db.query(Donor).filter(
        Donor.donor_type == "enterprise"
    ).order_by(Donor.name).all()
    
    return DonorsListResponse(
        individual_donors=individual_donors,
        enterprise_donors=enterprise_donors
    )

@app.get("/api/donors/{donor_type}", response_model=List[DonorResponse])
def get_donors_by_type(donor_type: str, db: Session = Depends(get_db)):
    """Get donors by type (individual or enterprise)"""
    if donor_type not in ["individual", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donor type must be 'individual' or 'enterprise'"
        )
    
    donors = db.query(Donor).filter(Donor.donor_type == donor_type).order_by(Donor.name).all()
    return donors

@app.post("/api/donors", response_model=DonorResponse)
def create_donor(donor: DonorCreate, db: Session = Depends(get_db)):
    """Create a new donor"""
    # Check if donor_id already exists
    existing = db.query(Donor).filter(Donor.donor_id == donor.donor_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Donor with ID {donor.donor_id} already exists"
        )
    
    db_donor = Donor(**donor.dict())
    db.add(db_donor)
    db.commit()
    db.refresh(db_donor)
    return db_donor

@app.get("/api/donors/id/{donor_id}", response_model=DonorResponse)
def get_donor_by_id(donor_id: str, db: Session = Depends(get_db)):
    """Get a specific donor by donor_id"""
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Donor with ID {donor_id} not found"
        )
    return donor

@app.put("/api/donors/{donor_id}", response_model=DonorResponse)
def update_donor(donor_id: str, donor_update: DonorUpdate, db: Session = Depends(get_db)):
    """Update a donor"""
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Donor with ID {donor_id} not found"
        )
    
    update_data = donor_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donor, field, value)
    
    db.commit()
    db.refresh(donor)
    return donor

@app.delete("/api/donors/{donor_id}")
def delete_donor(donor_id: str, db: Session = Depends(get_db)):
    """Delete a donor"""
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Donor with ID {donor_id} not found"
        )
    
    db.delete(donor)
    db.commit()
    return {"message": f"Donor {donor_id} deleted successfully"}

@app.get("/api/donors/stats/summary", response_model=List[DonationSummary])
def get_donation_summary(db: Session = Depends(get_db)):
    """Get donation statistics by donor type for stakeholder reporting"""
    summary = db.query(
        Donor.donor_type,
        func.count(Donor.donation_id).label('donor_count'),
        func.sum(Donor.amount).label('total_amount'),
        func.avg(Donor.amount).label('average_amount'),
        func.min(Donor.amount).label('min_amount'),
        func.max(Donor.amount).label('max_amount')
    ).group_by(Donor.donor_type).all()

    return [
        DonationSummary(
            donor_type=row.donor_type,
            donor_count=row.donor_count,
            total_amount=row.total_amount,
            average_amount=row.average_amount,
            min_amount=row.min_amount,
            max_amount=row.max_amount
        ) for row in summary
    ]


# MEMBER ENDPOINTS

@app.get("/api/members", response_model=List[MemberPublicResponse])
def get_all_members(db: Session = Depends(get_db)):
    """Get all active members (public info only)"""
    members = db.query(Member).filter(
        Member.status != 'not_with_newbee_anymore'
    ).order_by(Member.display_name).all()
    return members


@app.get("/api/members/credits", response_model=List[MemberPublicResponse])
def get_members_for_credits(db: Session = Depends(get_db)):
    """Get members who opted to show in credits page"""
    members = db.query(Member).filter(
        Member.show_in_credits == True,
        Member.status != 'not_with_newbee_anymore'
    ).order_by(
        (Member.registration_credits + Member.checkin_credits +
         Member.volunteer_credits + Member.activity_credits).desc()
    ).all()
    return members


@app.get("/api/members/{member_id}", response_model=MemberResponse)
def get_member(member_id: int, db: Session = Depends(get_db)):
    """Get a specific member by ID (full info for authenticated user)"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found"
        )
    return member


@app.get("/api/members/username/{username}", response_model=MemberResponse)
def get_member_by_username(username: str, db: Session = Depends(get_db)):
    """Get a specific member by username"""
    member = db.query(Member).filter(Member.username == username).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with username {username} not found"
        )
    return member


@app.post("/api/members", response_model=MemberResponse)
def create_member(member: MemberCreate, db: Session = Depends(get_db)):
    """Create a new member"""
    # Check if username already exists
    existing_username = db.query(Member).filter(Member.username == member.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username {member.username} already exists"
        )

    # Check if email already exists
    existing_email = db.query(Member).filter(Member.email == member.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {member.email} already exists"
        )

    # Hash the password
    password_hash = bcrypt.hashpw(member.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Create member dict without password, add password_hash
    member_data = member.model_dump(exclude={'password'})
    member_data['password_hash'] = password_hash
    member_data['status'] = member_data['status'].value  # Convert enum to string

    db_member = Member(**member_data)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


@app.put("/api/members/{member_id}", response_model=MemberResponse)
def update_member(member_id: int, member_update: MemberUpdate, db: Session = Depends(get_db)):
    """Update a member"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found"
        )

    update_data = member_update.model_dump(exclude_unset=True)

    # Convert enum to string if status is being updated
    if 'status' in update_data and update_data['status']:
        update_data['status'] = update_data['status'].value

    for field, value in update_data.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


@app.put("/api/members/{member_id}/privacy", response_model=MemberResponse)
def update_member_privacy(
    member_id: int,
    show_in_credits: bool = None,
    show_in_donors: bool = None,
    db: Session = Depends(get_db)
):
    """Update member privacy settings (for dashboard toggle)"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found"
        )

    if show_in_credits is not None:
        member.show_in_credits = show_in_credits
    if show_in_donors is not None:
        member.show_in_donors = show_in_donors

    db.commit()
    db.refresh(member)
    return member


@app.delete("/api/members/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    """Delete a member (admin only)"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found"
        )

    db.delete(member)
    db.commit()
    return {"message": f"Member {member_id} deleted successfully"}


@app.get("/api/members/committee/list", response_model=List[MemberPublicResponse])
def get_committee_members(db: Session = Depends(get_db)):
    """Get all committee members"""
    members = db.query(Member).filter(
        Member.status.in_(['committee', 'admin'])
    ).order_by(Member.display_name).all()
    return members


@app.post("/api/members/firebase-sync", response_model=MemberResponse)
def sync_firebase_user(user_data: FirebaseUserSync, db: Session = Depends(get_db)):
    """
    Sync a Firebase user to the members table.
    Creates a new member if not exists, returns existing member if already synced.
    Used after Firebase signup/login to ensure user exists in our database.
    """
    # Check if member already exists with this firebase_uid
    existing_member = db.query(Member).filter(Member.firebase_uid == user_data.firebase_uid).first()
    if existing_member:
        # Update display name and photo if changed
        if user_data.display_name and user_data.display_name != existing_member.display_name:
            existing_member.display_name = user_data.display_name
        if user_data.photo_url and user_data.photo_url != existing_member.profile_photo_url:
            existing_member.profile_photo_url = user_data.photo_url
        db.commit()
        db.refresh(existing_member)
        return existing_member

    # Check if member exists with this email (might have been created before Firebase link)
    existing_email = db.query(Member).filter(Member.email == user_data.email).first()
    if existing_email:
        # Link existing member to Firebase account
        existing_email.firebase_uid = user_data.firebase_uid
        if user_data.display_name:
            existing_email.display_name = user_data.display_name
        if user_data.photo_url:
            existing_email.profile_photo_url = user_data.photo_url
        db.commit()
        db.refresh(existing_email)
        return existing_email

    # Create new member
    # Generate username from email (part before @)
    username = user_data.email.split('@')[0]

    # Ensure username is unique
    base_username = username
    counter = 1
    while db.query(Member).filter(Member.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1

    # Create member with placeholder password (Firebase handles auth)
    placeholder_hash = bcrypt.hashpw(b"firebase-auth-user", bcrypt.gensalt()).decode('utf-8')

    new_member = Member(
        username=username,
        email=user_data.email,
        password_hash=placeholder_hash,
        firebase_uid=user_data.firebase_uid,
        display_name=user_data.display_name,
        profile_photo_url=user_data.photo_url,
        status='member'
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member


@app.get("/api/members/firebase/{firebase_uid}", response_model=MemberResponse)
def get_member_by_firebase_uid(firebase_uid: str, db: Session = Depends(get_db)):
    """Get a member by their Firebase UID"""
    member = db.query(Member).filter(Member.firebase_uid == firebase_uid).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with Firebase UID not found"
        )
    return member


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=os.getenv("API_HOST", "0.0.0.0"), 
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )