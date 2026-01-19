# AI Runner Companion - Architecture Design Document

## Overview

The AI Runner Companion is a personalized running coach feature for NewBee Running Club members. It provides AI-powered training plans, personalized feedback, and community-driven training content.

## Vision

Create an intelligent training assistant that combines:
- Scientific training methodologies from established running coaches
- Personalized recommendations based on user data
- Community wisdom from NewBee club members
- Integration with popular running platforms (Strava, Garmin, etc.)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (React Frontend)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Training   │  │   AI Chat   │  │  Progress   │              │
│  │   Wizard    │  │  Interface  │  │  Dashboard  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Community  │  │   Workout   │  │    Route    │              │
│  │    Tips     │  │   Library   │  │   Library   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│  /api/training/plan      - Generate personalized training plan  │
│  /api/training/feedback  - Get AI feedback on workouts          │
│  /api/training/tips      - Community training tips CRUD         │
│  /api/training/routes    - Community route library              │
│  /api/training/workouts  - Workout templates and history        │
│  /api/strava/auth        - Strava OAuth integration             │
│  /api/strava/activities  - Fetch user activities                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI/ML SERVICES                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Training Plan Generator                                  │   │
│  │  - Jack Daniels VDOT calculator                          │   │
│  │  - Pfitzinger/Douglas periodization                      │   │
│  │  - Hansons cumulative fatigue model                      │   │
│  │  - 80/20 training distribution                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Workout Analyzer                                         │   │
│  │  - Pace analysis vs target                               │   │
│  │  - Heart rate zone analysis                              │   │
│  │  - Fatigue detection                                     │   │
│  │  - Recovery recommendations                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LLM Integration (Claude/GPT)                            │   │
│  │  - Natural language coaching                             │   │
│  │  - Workout explanation                                   │   │
│  │  - Injury prevention advice                              │   │
│  │  - Motivation and encouragement                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   MySQL/RDS   │  │   External    │  │     Cache     │       │
│  │   Database    │  │     APIs      │  │    (Redis)    │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│  - Training plans    - Strava API      - Session data          │
│  - User profiles     - Weather API     - API responses         │
│  - Workout history   - NYRR results    - Training cache        │
│  - Community tips    - Garmin API      - User preferences      │
│  - Routes/workouts                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema Extensions

### TrainingPlan Table
```sql
CREATE TABLE training_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    plan_name VARCHAR(255),
    race_type VARCHAR(50),       -- '5k', '10k', 'half', 'full'
    target_time VARCHAR(20),      -- 'HH:MM:SS'
    start_date DATE,
    end_date DATE,
    weeks INT,
    plan_json JSON,               -- Full plan structure
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (member_id) REFERENCES members(id)
);
```

### Workout Table
```sql
CREATE TABLE workouts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    plan_id INT,
    workout_date DATE,
    workout_type VARCHAR(50),     -- 'easy', 'tempo', 'interval', 'long', 'recovery'
    planned_distance DECIMAL(5,2),
    planned_pace VARCHAR(20),
    actual_distance DECIMAL(5,2),
    actual_pace VARCHAR(20),
    strava_activity_id VARCHAR(50),
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATETIME,
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (plan_id) REFERENCES training_plans(id)
);
```

### CommunityTip Table
```sql
CREATE TABLE community_tips (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    category VARCHAR(50),         -- 'nutrition', 'recovery', 'technique', 'gear', 'mental'
    title VARCHAR(255),
    title_cn VARCHAR(255),
    content TEXT,
    content_cn TEXT,
    upvotes INT DEFAULT 0,
    created_at DATETIME,
    FOREIGN KEY (member_id) REFERENCES members(id)
);
```

### CommunityRoute Table
```sql
CREATE TABLE community_routes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT,
    name VARCHAR(255),
    name_cn VARCHAR(255),
    description TEXT,
    description_cn TEXT,
    distance DECIMAL(5,2),
    elevation_gain INT,
    difficulty VARCHAR(20),       -- 'easy', 'moderate', 'hard'
    start_location VARCHAR(255),
    route_data JSON,              -- GPX or polyline data
    image_url VARCHAR(500),
    rating DECIMAL(3,2),
    rating_count INT DEFAULT 0,
    created_at DATETIME,
    FOREIGN KEY (member_id) REFERENCES members(id)
);
```

## API Endpoints Design

### Training Plan Endpoints
```
POST   /api/training/plans              Create a new training plan
GET    /api/training/plans              Get user's training plans
GET    /api/training/plans/{id}         Get specific plan details
PUT    /api/training/plans/{id}         Update plan
DELETE /api/training/plans/{id}         Delete plan
GET    /api/training/plans/{id}/week/{week_num}  Get week's schedule
```

### Workout Endpoints
```
GET    /api/training/workouts           Get user's workouts
POST   /api/training/workouts           Log a workout
PUT    /api/training/workouts/{id}      Update workout
GET    /api/training/workouts/today     Get today's scheduled workout
POST   /api/training/workouts/{id}/sync Sync with Strava activity
```

### AI Feedback Endpoints
```
POST   /api/training/feedback           Get AI feedback on recent performance
POST   /api/training/chat               Chat with AI coach
GET    /api/training/recommendations    Get personalized recommendations
```

### Community Content Endpoints
```
GET    /api/training/tips               Get community tips
POST   /api/training/tips               Submit a tip
PUT    /api/training/tips/{id}/upvote   Upvote a tip
GET    /api/training/routes             Get community routes
POST   /api/training/routes             Submit a route
GET    /api/training/routes/{id}        Get route details
POST   /api/training/routes/{id}/rate   Rate a route
```

### External Integration Endpoints
```
GET    /api/strava/auth                 Initiate Strava OAuth
GET    /api/strava/callback             OAuth callback
GET    /api/strava/activities           Fetch user activities
POST   /api/strava/sync                 Sync activities with workouts
```

## Training Plan Generation Algorithm

### Phase 1: Assess Fitness Level
1. Collect user's recent race times (5K, 10K, Half, Full)
2. Calculate VDOT score using Jack Daniels' formula
3. Determine training paces for each zone:
   - Easy (E): 59-74% VO2max
   - Marathon (M): 75-84% VO2max
   - Threshold (T): 83-88% VO2max
   - Interval (I): 97-100% VO2max
   - Repetition (R): 105-110% VO2max

### Phase 2: Build Plan Structure
1. Determine training phases:
   - Base Building (4-8 weeks)
   - Strength/Hills (2-4 weeks)
   - Speed Development (2-4 weeks)
   - Race-Specific (4-8 weeks)
   - Taper (1-3 weeks)

2. Apply periodization principles:
   - Progressive overload (10% weekly mileage increase max)
   - Recovery weeks (every 3-4 weeks)
   - Cumulative fatigue management

### Phase 3: Generate Weekly Schedules
1. Distribute weekly mileage across days
2. Place key workouts (long run, tempo, intervals)
3. Balance hard/easy days
4. Include cross-training and rest days

## User Interface Components

### 1. Training Dashboard
- Current week's schedule
- Progress towards goal
- Recent workout summary
- AI coach tips of the day

### 2. Plan Generator Wizard (Enhanced)
- Step 1: Introduction to AI coach
- Step 2: Race goal selection
- Step 3: Current fitness assessment
- Step 4: Training duration selection
- Step 5: Schedule preferences
- Step 6: Plan preview and confirmation

### 3. Workout View
- Daily workout details
- Target paces and distances
- Workout explanation from AI
- Log/sync workout button

### 4. AI Chat Interface
- Conversational coaching
- Ask questions about training
- Get feedback on workouts
- Request plan adjustments

### 5. Community Hub
- Training tips feed
- Route library with map
- Workout templates
- Success stories

## Strava Integration Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Frontend│────▶│  Backend │────▶│  Strava  │
│  clicks  │     │  /strava │     │  /api    │     │   API    │
│  connect │     │  /connect│     │  /strava │     │          │
└──────────┘     └──────────┘     │  /auth   │     │          │
                                  └──────────┘     └──────────┘
                                       │                │
                                       │  OAuth Flow    │
                                       │◀───────────────│
                                       │                │
┌──────────┐     ┌──────────┐     ┌──────────┐          │
│  User    │◀────│  Frontend│◀────│  Backend │◀─────────┘
│  sees    │     │  /profile│     │  stores  │
│  connected│    │          │     │  tokens  │
└──────────┘     └──────────┘     └──────────┘
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Enhance Training page with AI companion branding
- [ ] Add training plan database models
- [ ] Implement basic plan generation API
- [ ] Create workout logging functionality

### Phase 2: AI Integration (Weeks 3-4)
- [ ] Integrate VDOT calculator
- [ ] Implement plan generation algorithm
- [ ] Add AI feedback system
- [ ] Create chat interface for AI coach

### Phase 3: External Integrations (Weeks 5-6)
- [ ] Strava OAuth integration
- [ ] Activity sync and matching
- [ ] Weather API for outdoor recommendations
- [ ] NYRR results import

### Phase 4: Community Features (Weeks 7-8)
- [ ] Community tips system
- [ ] Route library with map display
- [ ] Workout template sharing
- [ ] User success stories

### Phase 5: Polish and Launch (Weeks 9-10)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Beta testing with club members
- [ ] Documentation and training

## Security Considerations

1. **API Authentication**: All training endpoints require Firebase JWT
2. **Data Privacy**: Users control visibility of their training data
3. **External Tokens**: Encrypt Strava/Garmin tokens at rest
4. **Rate Limiting**: Prevent abuse of AI endpoints
5. **Input Validation**: Sanitize all user inputs

## Performance Optimization

1. **Caching**: Redis cache for frequently accessed plans
2. **Lazy Loading**: Load workout details on demand
3. **Batch Operations**: Sync multiple Strava activities at once
4. **CDN**: Serve route images from CDN

## Future Enhancements

- **Heart Rate Integration**: Analyze HR data for better feedback
- **Social Features**: Share workouts and compete with friends
- **Virtual Races**: Club-organized virtual race challenges
- **Injury Prevention**: Analyze patterns to prevent overtraining
- **Nutrition Guidance**: Pre/post workout nutrition recommendations
- **Equipment Tracking**: Track shoe mileage and gear usage

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, MUI, Chart.js, Leaflet/Mapbox |
| Backend | FastAPI, SQLAlchemy |
| Database | MySQL (AWS RDS) |
| Cache | Redis (AWS ElastiCache) |
| AI/ML | Claude API / OpenAI API |
| Maps | Mapbox / Google Maps API |
| External APIs | Strava, Garmin, Weather.com |

---

*Document Version: 1.0*
*Last Updated: 2026-01-19*
*Author: Claude Code (AI)*
