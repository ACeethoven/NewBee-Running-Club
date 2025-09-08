from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BookResponse(BaseModel):
    publication_id: int
    title: str
    publication_url: str
    type: str

class StockResponse(BaseModel):
    stock_id: int
    symbol: str
    region: str
    field: str
    market_cap: float

class PublicationResponse(BaseModel):
    publication_id: int
    title: str
    publication_url: Optional[str]
    type: str
    publish_date: Optional[datetime]

class AuthorResponse(BaseModel):
    author_id: int
    name: str
    h_index: Optional[float]

class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 10
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit