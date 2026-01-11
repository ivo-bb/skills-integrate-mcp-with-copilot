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
import json
from pathlib import Path
import json
import secrets

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# Load activities from JSON file
activities_file = os.path.join(current_dir, "activities.json")
try:
    with open(activities_file, "r") as f:
        activities = json.load(f)
except FileNotFoundError:
    raise RuntimeError(f"Activities file not found: {activities_file}")
except json.JSONDecodeError as e:
    raise RuntimeError(f"Invalid JSON in activities file: {e}")


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
