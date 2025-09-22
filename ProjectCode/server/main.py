from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import os

from database import get_db, create_tables, Donor, Results
from models import DonorCreate, DonorUpdate, DonorResponse, DonorsListResponse, DonationSummary

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=os.getenv("API_HOST", "0.0.0.0"), 
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )