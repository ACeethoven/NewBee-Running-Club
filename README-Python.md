# NewBee Running Club - Python Refactor

This is the Python refactored version of the NewBee Running Club application, converted from JavaScript to a full Python stack.

## Architecture

- **Backend**: FastAPI with PostgreSQL
- **Frontend**: Streamlit web app
- **Database**: PostgreSQL (compatible with AWS RDS)

## Setup Instructions

### 1. Database Configuration

Update your AWS RDS MySQL database connection in `.env` files:

```bash
# Copy example env file
cp python-backend/.env.example python-backend/.env
```

Edit `.env` with your RDS details:
```
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_USER=admin
RDS_PASSWORD=your-password
RDS_PORT=3306
RDS_DB=running_club
```

### 2. Backend Setup

```bash
cd python-backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: http://localhost:8000
API documentation: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd python-frontend
pip install -r requirements.txt
streamlit run app.py
```

The web app will be available at: http://localhost:8501

## Key Features Converted

✅ **Backend API Endpoints**:
- `/randombook` - Get random book recommendation
- `/home/top-stocks` - Top performing stocks
- `/home/latest-papers` - Latest research papers
- `/home/top-rated-books` - Top rated books

✅ **Frontend Components**:
- Home dashboard with book recommendations
- Stock analysis with interactive charts
- Publications browser
- Responsive layout with sidebar navigation

## Database Compatibility

The Python backend is configured to work with both:
- PostgreSQL (original)
- MySQL (your AWS RDS instance)

Update the `database_url` in `config.py` based on your database type.

## Next Steps

1. Configure your AWS RDS connection details
2. Run database migrations if needed
3. Deploy to your preferred cloud platform
4. Add authentication (Firebase Auth integration available)

## Original JavaScript Code

The original JavaScript code remains in:
- `ProjectCode/server/` - Node.js/Express backend
- `ProjectCode/client/` - React frontend