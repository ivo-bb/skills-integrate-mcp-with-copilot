"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os
from pathlib import Path
import json
import secrets

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# Pydantic models for request bodies
class LoginRequest(BaseModel):
    username: str
    password: str

# In-memory session storage (tokens)
# Note: Sessions will be lost on server restart - this is acceptable for the current
# simple implementation without a database. In production, use Redis or similar.
active_sessions = {}

# Load teacher credentials from JSON file
# Note: Passwords are stored in plain text as specified in requirements.
# In production, passwords should be hashed using bcrypt or similar.
def load_teachers():
    teachers_file = os.path.join(current_dir, "teachers.json")
    with open(teachers_file, 'r') as f:
        data = json.load(f)
        return data['teachers']

# Authentication dependency
def get_current_user(authorization: str = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if token exists in active sessions
    if authorization not in active_sessions:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return active_sessions[authorization]

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
        "category": "Academic",
        "created_date": "2024-01-15"
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
        "category": "Academic",
        "created_date": "2024-02-01"
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"],
        "category": "Sports",
        "created_date": "2024-01-10"
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"],
        "category": "Sports",
        "created_date": "2024-01-20"
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"],
        "category": "Sports",
        "created_date": "2024-01-25"
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"],
        "category": "Arts",
        "created_date": "2024-02-05"
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"],
        "category": "Arts",
        "created_date": "2024-02-10"
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"],
        "category": "Academic",
        "created_date": "2024-01-30"
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"],
        "category": "Academic",
        "created_date": "2024-02-15"
    },
    "GitHub Skills": {
        "description": "Learn practical coding and collaboration skills through GitHub's interactive courses",
        "schedule": "Thursdays, 4:30 PM - 5:30 PM",
        "max_participants": 25,
        "category": "Academic",
        "created_date": "2024-02-15"
        "participants": []
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.post("/auth/login")
def login(request: LoginRequest):
    """Login endpoint for teachers"""
    teachers = load_teachers()
    
    # Validate credentials
    for teacher in teachers:
        if teacher['username'] == request.username and teacher['password'] == request.password:
            # Generate a session token
            token = secrets.token_hex(32)
            active_sessions[token] = request.username
            return {"token": token, "username": request.username}
    
    raise HTTPException(status_code=401, detail="Invalid username or password")


@app.post("/auth/logout")
def logout(authorization: str = Header(None)):
    """Logout endpoint"""
    if authorization and authorization in active_sessions:
        del active_sessions[authorization]
    return {"message": "Logged out successfully"}


@app.get("/auth/status")
def auth_status(authorization: str = Header(None)):
    """Check if user is authenticated"""
    if authorization and authorization in active_sessions:
        return {"authenticated": True, "username": active_sessions[authorization]}
    return {"authenticated": False}


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str, current_user: str = Depends(get_current_user)):
    """Sign up a student for an activity (requires authentication)"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str, current_user: str = Depends(get_current_user)):
    """Unregister a student from an activity (requires authentication)"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}
