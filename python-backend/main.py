from fastapi import FastAPI, Depends, Query, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, execute_query
from models import BookResponse, StockResponse, PublicationResponse, AuthorResponse, PaginationParams
from typing import Optional, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NewBee Running Club API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "NewBee Running Club API"}

@app.get("/randombook", response_model=BookResponse)
async def get_random_book():
    query = """
        SELECT PublicationID, Title, PublicationURL, Type
        FROM Publications
        WHERE Type = 'Book'
        ORDER BY RANDOM()
        LIMIT 1;
    """
    
    try:
        result = await execute_query(query)
        if result:
            row = result[0]
            return BookResponse(
                publication_id=row.publicationid,
                title=row.title,
                publication_url=row.publicationurl,
                type=row.type
            )
        else:
            raise HTTPException(status_code=404, detail="No books found")
    except Exception as e:
        logger.error(f"Error fetching random book: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/home/top-stocks", response_model=List[StockResponse])
async def get_top_stocks(
    field: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100)
):
    pagination = PaginationParams(page=page, limit=limit)
    
    query = """
        SELECT s.StockID, s.Symbol, s.Region, s.Field, sp.MarketCap
        FROM Stocks s
        JOIN StockParameters sp ON s.StockID = sp.StockID
        WHERE sp.Date = (
            SELECT MAX(Date) FROM StockParameters WHERE StockID = s.StockID
        )
    """
    
    params = {}
    if field:
        query += " AND s.Field = :field"
        params["field"] = field
    
    query += " ORDER BY sp.MarketCap DESC LIMIT :limit OFFSET :offset"
    params.update({"limit": pagination.limit, "offset": pagination.offset})
    
    try:
        result = await execute_query(query, params)
        return [
            StockResponse(
                stock_id=row.stockid,
                symbol=row.symbol,
                region=row.region,
                field=row.field,
                market_cap=row.marketcap
            )
            for row in result
        ]
    except Exception as e:
        logger.error(f"Error fetching top stocks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/home/latest-papers", response_model=List[PublicationResponse])
async def get_latest_papers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    pagination = PaginationParams(page=page, limit=limit)
    
    query = """
        SELECT PublicationID, Title, PublicationURL, Type, PublishDate
        FROM Publications
        WHERE Type IN ('Conference', 'Journal')
        ORDER BY PublishDate DESC
        LIMIT :limit OFFSET :offset
    """
    
    params = {"limit": pagination.limit, "offset": pagination.offset}
    
    try:
        result = await execute_query(query, params)
        return [
            PublicationResponse(
                publication_id=row.publicationid,
                title=row.title,
                publication_url=row.publicationurl,
                type=row.type,
                publish_date=row.publishdate
            )
            for row in result
        ]
    except Exception as e:
        logger.error(f"Error fetching latest papers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/home/top-rated-books", response_model=List[BookResponse])
async def get_top_rated_books(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    pagination = PaginationParams(page=page, limit=limit)
    
    query = """
        SELECT PublicationID, Title, PublicationURL, Type
        FROM Publications
        WHERE Type = 'Book'
        ORDER BY RANDOM()
        LIMIT :limit OFFSET :offset
    """
    
    params = {"limit": pagination.limit, "offset": pagination.offset}
    
    try:
        result = await execute_query(query, params)
        return [
            BookResponse(
                publication_id=row.publicationid,
                title=row.title,
                publication_url=row.publicationurl,
                type=row.type
            )
            for row in result
        ]
    except Exception as e:
        logger.error(f"Error fetching top rated books: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)