import os
import sys
import json

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.task_guide_service import task_guide_service
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_task_guide_session_creation_fallback():
    """Test task breakdown logic and session initialization."""
    query = "How to make a fresh cup of tea"
    session = task_guide_service.create_task_session(query)
    
    assert session is not None
    assert "session_id" in session
    assert len(session["steps"]) > 0
    assert session["current_step_index"] == 0
    assert session["current_step_phase"] == "verify_ingredient"
    assert session["status"] == "in_progress"

def test_task_guide_navigation():
    """Test manual step progression and navigation."""
    session = task_guide_service.create_task_session("Take morning medication")
    session_id = session["session_id"]
    
    # Move to step 1
    updated = task_guide_service.set_step(session_id, 1, phase="perform_action")
    assert updated["current_step_index"] == 1
    assert updated["current_step_phase"] == "perform_action"
    
    # End session
    res = task_guide_service.end_session(session_id)
    assert res["status"] == "ended"

def test_task_guide_api_endpoints():
    """Test the HTTP API endpoints."""
    # 1. Start Task
    start_resp = client.post("/api/v1/task/start", json={"query": "Make breakfast toast"})
    assert start_resp.status_code == 200
    data = start_resp.json()
    assert data["status"] == "success"
    session_id = data["session"]["session_id"]
    
    # 2. Get Session Info
    get_resp = client.get(f"/api/v1/task/session/{session_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["session"]["session_id"] == session_id
    
    # 3. Process Live Frame (No image fallback check)
    frame_resp = client.post("/api/v1/task/live-frame", json={
        "session_id": session_id,
        "image_b64": None,
        "speech_text": "Is this right?",
        "elapsed_seconds": 5
    })
    assert frame_resp.status_code == 200
    frame_data = frame_resp.json()["data"]
    assert "spoken_response" in frame_data
    
    # 4. Set Step
    step_resp = client.post("/api/v1/task/step", json={
        "session_id": session_id,
        "step_index": 1
    })
    assert step_resp.status_code == 200
    assert step_resp.json()["data"]["current_step_index"] == 1
    
    # 5. End Task
    end_resp = client.post("/api/v1/task/end", json={"session_id": session_id})
    assert end_resp.status_code == 200
    assert end_resp.json()["status"] == "ended"

if __name__ == "__main__":
    print("Testing task guide session creation...")
    test_task_guide_session_creation_fallback()
    print("Testing task guide navigation...")
    test_task_guide_navigation()
    print("Testing API endpoints...")
    test_task_guide_api_endpoints()
    print("✅ All Task Guide tests passed!")
