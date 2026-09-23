import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

STORAGE_FILE = Path("storage/gentle_anchors.json")

DEFAULT_TASKS = []

class TaskService:
    def __init__(self):
        STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
        self.tasks: List[Dict[str, Any]] = self._load_tasks()

    def _load_tasks(self) -> List[Dict[str, Any]]:
        if STORAGE_FILE.exists():
            try:
                with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
            except Exception as e:
                print(f"Warning loading gentle anchors: {e}")
        self._save_tasks(DEFAULT_TASKS)
        return list(DEFAULT_TASKS)

    def _save_tasks(self, tasks: List[Dict[str, Any]]) -> None:
        try:
            with open(STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump(tasks, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving gentle anchors: {e}")

    def get_tasks(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if not user_id:
            return list(self.tasks)
        return [t for t in self.tasks if t.get("user_id") == user_id or not t.get("user_id")]

    def add_task(self, title: str, time: str = "Today", notes: str = "", user_id: Optional[str] = None) -> Dict[str, Any]:
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        clean_time = (time or "Today").strip()
        task = {
            "id": task_id,
            "user_id": user_id or "default_user",
            "title": title.strip(),
            "time": clean_time,
            "notes": (notes or f"Scheduled for {clean_time}").strip(),
            "completed": False,
            "completed_at": None,
            "created_at": datetime.now().isoformat()
        }
        self.tasks.append(task)
        self._save_tasks(self.tasks)
        return task

    def toggle_task(self, task_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        for task in self.tasks:
            if task["id"] == task_id:
                if user_id and task.get("user_id") and task["user_id"] != user_id:
                    continue
                task["completed"] = not task.get("completed", False)
                if task["completed"]:
                    task["completed_at"] = datetime.now().strftime("%I:%M %p")
                else:
                    task["completed_at"] = None
                self._save_tasks(self.tasks)
                return task
        return None

    def delete_task(self, task_id: str, user_id: Optional[str] = None) -> bool:
        initial_len = len(self.tasks)
        self.tasks = [
            t for t in self.tasks 
            if not (t["id"] == task_id and (not user_id or not t.get("user_id") or t.get("user_id") == user_id))
        ]
        if len(self.tasks) < initial_len:
            self._save_tasks(self.tasks)
            return True
        return False

    def delete_user_tasks(self, user_id: str) -> int:
        initial_len = len(self.tasks)
        self.tasks = [t for t in self.tasks if t.get("user_id") != user_id]
        deleted_count = initial_len - len(self.tasks)
        if deleted_count > 0:
            self._save_tasks(self.tasks)
        return deleted_count

task_service = TaskService()
