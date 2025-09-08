import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    rds_host: str = os.getenv("RDS_HOST", "localhost")
    rds_user: str = os.getenv("RDS_USER", "admin")
    rds_password: str = os.getenv("RDS_PASSWORD", "")
    rds_port: int = int(os.getenv("RDS_PORT", "5432"))
    rds_db: str = os.getenv("RDS_DB", "running_club")
    
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.rds_user}:{self.rds_password}@{self.rds_host}:{self.rds_port}/{self.rds_db}"

settings = Settings()