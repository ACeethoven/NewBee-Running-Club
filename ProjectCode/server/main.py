from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os

from database import get_db, create_tables, Donor, Results, Member
from models import (
    DonorCreate, DonorUpdate, DonorResponse, DonorsListResponse, DonationSummary,
    MemberCreate, MemberUpdate, MemberResponse, MemberPublicResponse, MemberStatus,
    FirebaseUserSync, JoinApplicationRequest
)
from email_service import EmailService
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


# Authorization dependency for admin-only endpoints
def get_current_admin(
    x_firebase_uid: Optional[str] = Header(None, alias="X-Firebase-UID"),
    db: Session = Depends(get_db)
) -> Member:
    """
    Verify that the request is from an authenticated admin user.
    Requires X-Firebase-UID header with a valid admin's Firebase UID.
    """
    if not x_firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )

    member = db.query(Member).filter(Member.firebase_uid == x_firebase_uid).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication. User not found."
        )

    if member.status != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. You do not have permission to perform this action."
        )

    return member


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


@app.get("/api/results/member/{search_key}")
def get_member_race_results(search_key: str, db: Session = Depends(get_db)):
    """
    Get race results for a specific member by name or NYRR ID.
    Returns all results matching the search key along with statistics.
    """
    # Search by name (case-insensitive partial match)
    results = db.query(Results).filter(
        Results.name.ilike(f"%{search_key}%")
    ).order_by(Results.race_time.desc()).all()

    if not results:
        return {
            "results": [],
            "stats": {
                "total_races": 0,
                "prs": {},
                "recent_results": []
            }
        }

    # Calculate PRs by distance
    prs = {}
    for result in results:
        distance = result.race_distance
        if distance and result.overall_time:
            if distance not in prs or result.overall_time < prs[distance]["time"]:
                prs[distance] = {
                    "time": result.overall_time,
                    "race": result.race,
                    "date": result.race_time.strftime('%Y-%m-%d') if result.race_time else None,
                    "pace": result.pace
                }

    # Format results
    formatted_results = [
        {
            "id": r.id,
            "race": r.race,
            "race_date": r.race_time.strftime('%Y-%m-%d') if r.race_time else None,
            "distance": r.race_distance,
            "overall_time": r.overall_time,
            "pace": r.pace,
            "overall_place": r.overall_place,
            "gender_place": r.gender_place,
            "age_group_place": r.age_group_place,
            "gender_age": r.gender_age,
            "age_graded_time": r.age_graded_time,
            "age_graded_percent": float(r.age_graded_percent) if r.age_graded_percent else None
        }
        for r in results
    ]

    return {
        "results": formatted_results,
        "stats": {
            "total_races": len(results),
            "prs": prs,
            "recent_results": formatted_results[:5]
        }
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
    """Get all active members (public info only) - excludes pending and quit members"""
    members = db.query(Member).filter(
        Member.status.in_(['runner', 'admin'])
    ).order_by(Member.display_name).all()
    return members


@app.get("/api/members/credits", response_model=List[MemberPublicResponse])
def get_members_for_credits(db: Session = Depends(get_db)):
    """Get members who opted to show in credits page"""
    members = db.query(Member).filter(
        Member.show_in_credits == True,
        Member.status.in_(['runner', 'admin'])
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
    """Get all committee members (admin status indicates committee member)"""
    members = db.query(Member).filter(
        Member.status == 'admin'
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
        status='pending'  # New signups default to pending status
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


@app.get("/api/members/pending/list", response_model=List[MemberResponse])
def get_pending_members(
    db: Session = Depends(get_db),
    current_admin: Member = Depends(get_current_admin)
):
    """Get all pending member applications (for admin panel) - Admin only"""
    members = db.query(Member).filter(
        Member.status == 'pending'
    ).order_by(Member.created_at.desc()).all()
    return members


@app.put("/api/members/{member_id}/approve")
def approve_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_admin: Member = Depends(get_current_admin)
):
    """Approve a pending member application (changes status to runner and sends notification) - Admin only"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found"
        )

    if member.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member is not in pending status (current status: {member.status})"
        )

    member.status = 'runner'
    db.commit()
    db.refresh(member)

    # Send approval notification email
    try:
        EmailService.send_approval_notification(member.email, member.display_name or member.username)
    except Exception as e:
        print(f"Error sending approval email: {str(e)}")
        # Don't fail the request if email fails

    return {"message": f"Member {member.display_name or member.username} approved successfully", "member_id": member_id}


@app.put("/api/members/{member_id}/reject")
def reject_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_admin: Member = Depends(get_current_admin)
):
    """Reject a pending member application (deletes the member record) - Admin only"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID {member_id} not found"
        )

    if member.status != 'pending':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member is not in pending status (current status: {member.status})"
        )

    db.delete(member)
    db.commit()
    return {"message": f"Member application rejected and removed", "member_id": member_id}


@app.post("/api/join/submit")
def submit_join_application(application: JoinApplicationRequest, db: Session = Depends(get_db)):
    """
    Submit a new member join application
    Sends confirmation email to applicant and notification to committee
    """
    # Check if email already exists
    existing_member = db.query(Member).filter(Member.email == application.email).first()
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in or use a different email."
        )

    # Generate username from name
    username = application.name.lower().replace(" ", "")
    base_username = username
    counter = 1
    while db.query(Member).filter(Member.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1

    # Create member with pending status
    placeholder_hash = bcrypt.hashpw(b"pending-application", bcrypt.gensalt()).decode('utf-8')

    new_member = Member(
        username=username,
        email=application.email,
        password_hash=placeholder_hash,
        display_name=application.name,
        nyrr_member_id=application.nyrr_id,
        status='pending',
        # Application form data
        running_experience=application.running_experience,
        running_location=application.location,
        weekly_frequency=application.weekly_frequency,
        monthly_mileage=application.monthly_mileage,
        race_experience=application.race_experience,
        running_goals=application.goals,
        introduction=application.introduction
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    # Prepare form data for committee notification
    form_data = {
        "Running Experience": application.running_experience,
        "Location": application.location,
        "Weekly Frequency": application.weekly_frequency,
        "Monthly Mileage": application.monthly_mileage,
        "Race Experience": application.race_experience or "No races yet",
        "Goals": application.goals,
        "Introduction": application.introduction
    }

    # Send emails
    try:
        # Send confirmation to applicant
        EmailService.send_join_confirmation(application.email, application.name)

        # Send notification to committee
        EmailService.send_committee_notification(
            application.name,
            application.email,
            application.nyrr_id,
            form_data
        )
    except Exception as e:
        print(f"Error sending emails: {str(e)}")
        # Don't fail the request if email fails, just log it

    return {
        "message": "Application submitted successfully! You will receive a confirmation email shortly.",
        "member_id": new_member.id,
        "status": "pending"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=os.getenv("API_HOST", "0.0.0.0"), 
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )