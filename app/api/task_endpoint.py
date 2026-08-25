from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.services.task_guide_service import task_guide_service

router = APIRouter(prefix="/task", tags=["Live Task Guide"])

class StartTaskRequest(BaseModel):
    query: str

class LiveFrameRequest(BaseModel):
    session_id: str
    image_b64: Optional[str] = None
    speech_text: Optional[str] = ""
    elapsed_seconds: Optional[int] = 0

class SetStepRequest(BaseModel):
    session_id: str
    step_index: int

class EndTaskRequest(BaseModel):
    session_id: str

@router.post("/start")
async def start_task_guidance(req: StartTaskRequest):
    """
    Deconstruct a task query (e.g. 'How to make tea', 'Take evening medication')
    into a structured dementia-safe checklist and start a Live Multimodal Guidance session.
    """
    query = (req.query or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Task query cannot be empty")
    try:
        session = task_guide_service.create_task_session(query)
        return {
            "status": "success",
            "session": session
        }
    except Exception as e:
        print(f"Error starting task guidance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/live-frame")
async def process_live_frame(req: LiveFrameRequest):
    """
    Process a continuous live frame + hands-free speech input in real time.
    Multimodal Gemini Vision inspects the camera image for correct items,
    detects mistakes/safety hazards, tracks boiling/steeping timers, and generates spoken advice.
    """
    if not req.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    try:
        result = task_guide_service.analyze_live_frame(
            session_id=req.session_id,
            image_b64=req.image_b64,
            user_speech=req.speech_text or "",
            elapsed_step_seconds=req.elapsed_seconds or 0
        )
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        print(f"Error processing live task frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/step")
async def set_task_step(req: SetStepRequest):
    """Manually move to next/prev/specific step."""
    try:
        result = task_guide_service.set_step(req.session_id, req.step_index)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/end")
async def end_task_session(req: EndTaskRequest):
    """Terminate active live guidance session."""
    try:
        res = task_guide_service.end_session(req.session_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}")
async def get_session_info(session_id: str):
    """Get active session details."""
    session = task_guide_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "session": session}
