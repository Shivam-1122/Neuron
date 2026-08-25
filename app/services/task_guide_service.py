import os
import json
import re
import uuid
import time
import base64
import httpx
from typing import Optional, Dict, Any, List
from app.core.config import settings

class TaskGuideService:
    def __init__(self):
        self.gemini_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        # In-memory sessions: session_id -> session dict
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _call_gemini_text(self, prompt: str, system_prompt: str = "", is_json: bool = False, max_tokens: int = 1500) -> str:
        """Call Gemini API for text processing with ultra-fast models."""
        if not self.gemini_api_key:
            raise Exception("Gemini API key is not configured in .env (GEMINI_API_KEY)")

        models_to_try = [
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite-preview",
            "gemini-3-flash-preview",
            "gemini-flash-lite-latest",
            "gemini-flash-latest"
        ]

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": max_tokens
            }
        }

        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        if is_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()
                    elif resp.status_code in [404, 429, 503]:
                        continue
                    else:
                        print(f"Gemini text API status {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                print(f"Gemini text call error on {model}: {e}")

        raise Exception("Failed to get response from Gemini API.")

    def _call_gemini_multimodal(self, prompt: str, image_b64: str, mime_type: str = "image/jpeg", system_prompt: str = "", is_json: bool = True, max_tokens: int = 400) -> str:
        """Call Gemini Multimodal Vision with tested low-latency models."""
        if not self.gemini_api_key:
            raise Exception("Gemini API key is not configured")

        models_to_try = [
            "gemini-3.5-flash-lite",
            "gemini-3.1-flash-lite-preview",
            "gemini-3-flash-preview",
            "gemini-flash-lite-latest",
            "gemini-flash-latest"
        ]

        # Clean base64 string if data url header exists
        if "," in image_b64:
            header, image_b64 = image_b64.split(",", 1)
            if "image/png" in header:
                mime_type = "image/png"
            elif "image/webp" in header:
                mime_type = "image/webp"

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": image_b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": max_tokens
            }
        }

        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        if is_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.gemini_api_key}"
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()
                    elif resp.status_code in [404, 429, 503]:
                        continue
                    else:
                        print(f"Gemini vision status {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                print(f"Gemini vision error on {model}: {e}")

        raise Exception("Failed to process multimodal vision request with Gemini.")

    def create_task_session(self, task_query: str) -> Dict[str, Any]:
        """
        Deconstructs any user task into clear, sequential, highly accurate, dementia-safe checklist steps.
        Each step enforces:
        1. Required ingredient/tool to show before starting.
        2. Spoken instruction for verification.
        3. Concrete action to perform.
        4. Result check to show before advancing.
        """
        words = task_query.lower()
        
        # High-accuracy handcrafted expert recipes/routines for instant load & precision
        if "tea" in words:
            data = {
                "task_title": "Making a Fresh Cup of Tea",
                "task_summary": "Step-by-step guidance for gathering tea mug, boiling water, steeping, and serving safely.",
                "estimated_time_minutes": 5,
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Prepare Mug and Tea Bag",
                        "expected_item": "Tea Bag and Ceramic Mug",
                        "verify_prompt": "Please hold your tea bag or mug up to the camera so I can check it.",
                        "action_instruction": "Place your tea bag flat inside the bottom of your mug.",
                        "result_check": "Show me your mug with the tea bag placed inside.",
                        "safety_tip": None,
                        "duration_seconds": 0,
                        "narration": "First, let's find your tea bag and mug. Hold your tea bag up to the camera so I can verify it for you."
                    },
                    {
                        "step_number": 2,
                        "title": "Fill and Boil the Kettle",
                        "expected_item": "Water Kettle or Pot",
                        "verify_prompt": "Show me your water kettle or boiling pot.",
                        "action_instruction": "Fill the kettle with fresh water, place it safely on its base, and turn it on to boil.",
                        "result_check": "Show me the boiling kettle once steam starts rising.",
                        "safety_tip": "Keep your hands clear of hot steam and boiling surfaces.",
                        "duration_seconds": 60,
                        "narration": "Now show me your kettle. Fill it with water and let it boil safely."
                    },
                    {
                        "step_number": 3,
                        "title": "Pour Hot Water into Mug",
                        "expected_item": "Boiled Kettle and Mug",
                        "verify_prompt": "Show me the kettle with hot water ready to pour.",
                        "action_instruction": "Carefully and slowly pour the hot water over the tea bag until your mug is three-quarters full.",
                        "result_check": "Show me your mug filled with hot water.",
                        "safety_tip": "Pour slowly by the handle to prevent hot water splashes.",
                        "duration_seconds": 0,
                        "narration": "Carefully pour the hot water into your mug over the tea bag. Show me the mug when poured."
                    },
                    {
                        "step_number": 4,
                        "title": "Steep the Tea",
                        "expected_item": "Steeping Tea Mug",
                        "verify_prompt": "Show me the tea mug steeping.",
                        "action_instruction": "Let the tea steep for about 2 minutes so the rich aroma and color develop.",
                        "result_check": "Show me the darkened tea color in your mug.",
                        "safety_tip": "The mug is warm, hold it by the handle only.",
                        "duration_seconds": 90,
                        "narration": "Let the tea brew for a moment. I will watch the timer for you."
                    },
                    {
                        "step_number": 5,
                        "title": "Remove Tea Bag and Enjoy",
                        "expected_item": "Spoon or Tea Bag Tag",
                        "verify_prompt": "Show me your spoon or tea bag tag.",
                        "action_instruction": "Use a spoon to lift out the tea bag, squeeze gently, and place it in the disposal bin.",
                        "result_check": "Show me your finished cup of tea ready to enjoy.",
                        "safety_tip": "Let it cool slightly before taking your first warm sip.",
                        "duration_seconds": 0,
                        "narration": "Lift out the tea bag with a spoon. Your warm cup of tea is ready to enjoy!"
                    }
                ]
            }
        elif "toast" in words or "bread" in words:
            data = {
                "task_title": "Making Breakfast Toast",
                "task_summary": "Step-by-step guidance for safely operating the toaster, checking golden browning, and applying butter.",
                "estimated_time_minutes": 4,
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Get Bread Slice and Toaster",
                        "expected_item": "Bread Slice and Toaster",
                        "verify_prompt": "Please hold your bread slice up to the camera.",
                        "action_instruction": "Place a fresh slice of bread into the top slot of your toaster.",
                        "result_check": "Show me the toaster with bread inside.",
                        "safety_tip": "Ensure the toaster cord is placed safely on the countertop.",
                        "duration_seconds": 0,
                        "narration": "First, let's get your bread slice. Hold it up to the camera so I can check it."
                    },
                    {
                        "step_number": 2,
                        "title": "Push Lever Down to Toast",
                        "expected_item": "Toaster Lever",
                        "verify_prompt": "Show me the toaster lever pushed down.",
                        "action_instruction": "Set the browning dial to medium and press down the front lever to begin toasting.",
                        "result_check": "Show me the toaster while it toasts.",
                        "safety_tip": "Never insert metal utensils or knives into a plugged-in toaster.",
                        "duration_seconds": 60,
                        "narration": "Push the lever down to start toasting. I'll watch the timer for you."
                    },
                    {
                        "step_number": 3,
                        "title": "Apply Butter or Spread",
                        "expected_item": "Toasted Bread and Butter / Spread",
                        "verify_prompt": "Show me your toasted golden bread and butter knife.",
                        "action_instruction": "Carefully remove the warm toast, place it on a plate, and spread your favorite butter or jam.",
                        "result_check": "Show me your finished buttered toast.",
                        "safety_tip": "The toast will be warm to touch.",
                        "duration_seconds": 0,
                        "narration": "Carefully take out the warm toast and spread your butter. Your toast is ready!"
                    }
                ]
            }
        elif "soup" in words:
            data = {
                "task_title": "Making a Warm Bowl of Soup",
                "task_summary": "Step-by-step guidance for heating soup safely and serving with a spoon.",
                "estimated_time_minutes": 6,
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Prepare Soup and Bowl / Pot",
                        "expected_item": "Soup Container and Bowl / Pot",
                        "verify_prompt": "Please hold your soup container or bowl up to the camera.",
                        "action_instruction": "Pour the soup into your microwave-safe bowl or small heating pot.",
                        "result_check": "Show me the soup in the bowl or pot.",
                        "safety_tip": None,
                        "duration_seconds": 0,
                        "narration": "Let's check your soup container. Hold it up to the camera so I can verify it."
                    },
                    {
                        "step_number": 2,
                        "title": "Heat Soup Safely",
                        "expected_item": "Heating Soup Pot / Microwave",
                        "verify_prompt": "Show me your soup being heated safely.",
                        "action_instruction": "Heat the soup on medium heat or microwave for 2 minutes until hot and steaming.",
                        "result_check": "Show me the steaming soup.",
                        "safety_tip": "Use oven mitts or a towel when handling hot bowls.",
                        "duration_seconds": 90,
                        "narration": "Now heat the soup safely. I'll monitor the time for you."
                    },
                    {
                        "step_number": 3,
                        "title": "Stir and Serve with Spoon",
                        "expected_item": "Soup Spoon and Finished Bowl",
                        "verify_prompt": "Show me your warm soup bowl and spoon.",
                        "action_instruction": "Gently stir the soup with a spoon and let it cool slightly before eating.",
                        "result_check": "Show me your ready soup bowl.",
                        "safety_tip": "Blow gently on each spoonful to cool it before taking a sip.",
                        "duration_seconds": 0,
                        "narration": "Stir your soup gently. Your delicious warm soup is ready to enjoy!"
                    }
                ]
            }
        elif "med" in words or "pill" in words:
            data = {
                "task_title": "Taking Scheduled Medication Safely",
                "task_summary": "Verify pill organizer, prepare fresh drinking water, and safely swallow doses.",
                "estimated_time_minutes": 3,
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Verify Pill Organizer / Medication Bottle",
                        "expected_item": "Medication Bottle or Daily Pill Box",
                        "verify_prompt": "Please hold your medicine bottle or pill organizer up to the camera.",
                        "action_instruction": "Open today's scheduled compartment and take out only your prescribed doses.",
                        "result_check": "Show me the pill in the palm of your hand.",
                        "safety_tip": "Check the label carefully to confirm the proper time and dosage.",
                        "duration_seconds": 0,
                        "narration": "Let's check your medication first. Hold your pill box or bottle up to the camera."
                    },
                    {
                        "step_number": 2,
                        "title": "Prepare a Glass of Fresh Water",
                        "expected_item": "Glass of Fresh Water",
                        "verify_prompt": "Show me your glass of clean drinking water.",
                        "action_instruction": "Fill a clean glass with water to help swallow your medication smoothly.",
                        "result_check": "Show me your filled water glass.",
                        "safety_tip": None,
                        "duration_seconds": 0,
                        "narration": "Now get a glass of fresh water. Show me your glass."
                    },
                    {
                        "step_number": 3,
                        "title": "Take Medication with Water",
                        "expected_item": "Water Glass and Pill",
                        "verify_prompt": "Show me your water glass ready to drink.",
                        "action_instruction": "Place the pill on your tongue and take a generous sip of water to swallow comfortably.",
                        "result_check": "Show me the empty glass.",
                        "safety_tip": "Swallow calmly and take a deep breath.",
                        "duration_seconds": 0,
                        "narration": "Take your medication with a generous sip of water. Great job taking care of your health!"
                    }
                ]
            }
        elif "coffee" in words:
            data = {
                "task_title": "Brewing a Fresh Cup of Coffee",
                "task_summary": "Guide through coffee preparation, hot water brewing, and stirring.",
                "estimated_time_minutes": 4,
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Prepare Coffee Mug and Coffee / Pod",
                        "expected_item": "Coffee Mug and Coffee / Pod",
                        "verify_prompt": "Please hold your coffee mug or coffee pod up to the camera.",
                        "action_instruction": "Place coffee grounds or pod into your mug or coffee machine.",
                        "result_check": "Show me your prepared coffee mug.",
                        "safety_tip": None,
                        "duration_seconds": 0,
                        "narration": "Let's start your coffee. Hold your mug or coffee pod up to the camera."
                    },
                    {
                        "step_number": 2,
                        "title": "Brew or Pour Hot Water",
                        "expected_item": "Hot Water Kettle / Coffee Brewer",
                        "verify_prompt": "Show me your hot water kettle or coffee machine.",
                        "action_instruction": "Pour hot water over the coffee or press start on your coffee machine.",
                        "result_check": "Show me the brewed coffee in the mug.",
                        "safety_tip": "Keep hands clear of hot steam.",
                        "duration_seconds": 45,
                        "narration": "Now brew your coffee with hot water. I'll watch the brewing time for you."
                    },
                    {
                        "step_number": 3,
                        "title": "Stir and Enjoy",
                        "expected_item": "Spoon and Finished Coffee Mug",
                        "verify_prompt": "Show me your coffee mug and spoon.",
                        "action_instruction": "Add optional milk or sugar, stir gently with a spoon, and enjoy.",
                        "result_check": "Show me your finished cup of coffee.",
                        "safety_tip": "Let it cool slightly before drinking.",
                        "duration_seconds": 0,
                        "narration": "Stir gently with a spoon. Your fresh cup of coffee is ready to enjoy!"
                    }
                ]
            }
        else:
            # Dynamic AI Task Breakdown for any arbitrary user query
            system_prompt = (
                "You are Neuron Cognitive Task Cortex. Your goal is to guide a person with cognitive decline through ANY requested task.\n"
                "Break down the user's task into 3-5 realistic, sequential, practical everyday steps.\n"
                "Rules for steps:\n"
                "1. Realistic & Practical: Every step must have a clear concrete tool/item, actionable instruction, and visual confirmation.\n"
                "2. Each step MUST specify 'expected_item', 'verify_prompt', 'action_instruction', 'result_check', and warm 'narration'.\n"
                "3. Return pure JSON only."
            )

            user_prompt = (
                f"Generate a comprehensive, safe, step-by-step guidance plan for this task:\n"
                f"Task: \"{task_query}\"\n\n"
                "Return JSON adhering strictly to this schema:\n"
                "{\n"
                f'  "task_title": "{task_query.title()}",\n'
                '  "task_summary": "1 warm sentence explaining the goal",\n'
                '  "estimated_time_minutes": 5,\n'
                '  "steps": [\n'
                '    {\n'
                '      "step_number": 1,\n'
                '      "title": "Short Step Title",\n'
                '      "expected_item": "Name of exact tool or item needed",\n'
                '      "verify_prompt": "Please hold your [item] up to the camera.",\n'
                '      "action_instruction": "Clear action instruction to perform.",\n'
                '      "result_check": "Show me your progress with [item].",\n'
                '      "safety_tip": "Safety warning if needed or null",\n'
                '      "duration_seconds": 0,\n'
                '      "narration": "Warm spoken sentence introducing this step."\n'
                '    }\n'
                '  ]\n'
                "}"
            )

            raw_json = ""
            try:
                raw_json = self._call_gemini_text(prompt=user_prompt, system_prompt=system_prompt, is_json=True, max_tokens=1800)
                clean_str = re.sub(r'<think>.*?</think>', '', raw_json, flags=re.DOTALL).strip()
                match = re.search(r'\{.*\}', clean_str, re.DOTALL)
                if match:
                    clean_str = match.group(0)
                data = json.loads(clean_str)
            except Exception as e:
                print(f"Error calling Gemini for task breakdown: {e}, raw: {raw_json[:200]}")
                data = {
                    "task_title": task_query.title(),
                    "task_summary": f"Guided step-by-step assistance for {task_query}",
                    "estimated_time_minutes": 4,
                    "steps": [
                        {
                            "step_number": 1,
                            "title": f"Gather First Item for {task_query}",
                            "expected_item": f"Item for {task_query}",
                            "verify_prompt": f"Please hold the first item for {task_query} up to the camera.",
                            "action_instruction": "Get your ingredients or tools organized in front of you.",
                            "result_check": "Show me your workspace.",
                            "safety_tip": None,
                            "duration_seconds": 0,
                            "narration": f"Let's get started on {task_query}. Show me your first item in front of the camera."
                        },
                        {
                            "step_number": 2,
                            "title": "Perform Main Activity Step",
                            "expected_item": "Prepared items",
                            "verify_prompt": "Show me your progress on the camera.",
                            "action_instruction": "Carefully complete this action step at your own pace.",
                            "result_check": "Show me your completed result.",
                            "safety_tip": "Take your time and proceed safely.",
                            "duration_seconds": 0,
                            "narration": "Now carry out the next action step. Show me your progress when ready."
                        },
                        {
                            "step_number": 3,
                            "title": "Complete and Review Task",
                            "expected_item": "Finished task result",
                            "verify_prompt": "Show me your finished work.",
                            "action_instruction": "Review your finished task and put away any tools safely.",
                            "result_check": "Show me your final setup.",
                            "safety_tip": None,
                            "duration_seconds": 0,
                            "narration": "Great job! You have safely completed this task."
                        }
                    ]
                }

        session_id = str(uuid.uuid4())
        session = {
            "session_id": session_id,
            "task_query": task_query,
            "task_title": data.get("task_title", task_query.title()),
            "task_summary": data.get("task_summary", ""),
            "estimated_time_minutes": data.get("estimated_time_minutes", 5),
            "steps": data.get("steps", []),
            "current_step_index": 0,
            "current_step_phase": "verify_ingredient", # verify_ingredient -> perform_action -> verify_result
            "total_steps": len(data.get("steps", [])),
            "status": "in_progress",
            "step_start_time": time.time(),
            "conversation_history": []
        }

        self.sessions[session_id] = session
        return session

    def analyze_live_frame(
        self,
        session_id: str,
        image_b64: Optional[str] = None,
        user_speech: str = "",
        elapsed_step_seconds: int = 0
    ) -> Dict[str, Any]:
        """
        Multimodal live loop:
        1. Inspects image for items/tools and verifies against expected item.
        2. Tells the user explicitly "YES, that is [item]" or "NO, that is not [item], that is [what it is]".
        3. Guides through the 3 phases:
           - Phase 1 (verify_ingredient): Verify ingredient before starting.
           - Phase 2 (perform_action): Guide the user through performing the step.
           - Phase 3 (verify_result): Inspect camera for completed result before moving to next step.
        4. Detects safety hazards and immediately issues voice & UI warnings.
        """
        session = self.sessions.get(session_id)
        if not session:
            raise Exception("Task guide session not found or expired.")

        curr_idx = session["current_step_index"]
        steps = session["steps"]
        curr_step = steps[curr_idx] if curr_idx < len(steps) else steps[-1]
        current_phase = session.get("current_step_phase", "verify_ingredient")
        step_duration = curr_step.get("duration_seconds") or 0

        system_prompt = (
            "You are Neuron Multimodal Task Cortex. You are continuously watching the user's camera feed and listening to their speech.\n"
            "You act like an attentive, loving, voice-first personal coach guiding an Alzheimer's/Dementia patient through daily tasks.\n\n"
            "CRITICAL INGREDIENT & QUESTION ANSWERING RULES:\n"
            "1. DIRECT VERIFICATION & YES/NO QUESTIONS:\n"
            "   - If the user asks ANY question asking if something is the item (e.g. 'is this the jar?', 'is this the mug?', 'is this tea?', 'is this right?'):\n"
            "     * IF YES (the object held in front of the camera matches what they asked or what is expected): Start spoken_response with: 'Yes, that is your [detected item]!' and then instruct them on the action.\n"
            "     * IF NO (the object held is wrong or different): Start spoken_response with: 'No, that is not [what they asked/expected item]. That is a [what you clearly see in camera]. Please find your [expected item].'\n"
            "     * IF NOT VISIBLE / EMPTY CAMERA: Start spoken_response with: 'I don\\'t see it in the camera yet. Please hold your [expected item] in front of the lens.'\n"
            "2. INGREDIENT CHECK (when looking at camera):\n"
            "   - If the expected item is visible and correct, set ingredient_confirmed = true and feedback_badge = 'YES: [Item] Verified'. In spoken_response, say: 'Yes, that is your [detected item]! Now [action instruction].'\n"
            "   - If a WRONG or UNEXPECTED item is held up, set ingredient_confirmed = false and feedback_badge = 'NO: Wrong Item ([detected item])'. In spoken_response, say: 'No, that is not your [expected item], that is a [what you see]. Please look for your [expected item].'\n"
            "   - If no relevant item is held up, set ingredient_confirmed = null.\n"
            "3. RESULT CHECK: If current phase is 'verify_result', inspect if the action is done.\n"
            "   - If confirmed done, set result_confirmed = true and should_advance_step = true. In spoken_response, say: 'Yes, great! I see [result]. Let\\'s move on to the next step: [next step title].'\n"
            "   - If not yet done, set result_confirmed = false.\n"
            "4. SAFETY WATCHDOG: If you spot a hazard (touching hot stove, boiling empty kettle, dangerous liquid), immediately set warning_alert.\n"
            "5. SPOKEN RESPONSE: Always provide a warm, direct spoken sentence to be read aloud immediately."
        )

        user_prompt = (
            f"Active Task: \"{session['task_title']}\"\n"
            f"Step {curr_idx + 1} of {session['total_steps']}: {curr_step.get('title')}\n"
            f"Current Step Sub-Phase: {current_phase}\n"
            f"Expected Item / Ingredient: \"{curr_step.get('expected_item')}\"\n"
            f"Verify Prompt: \"{curr_step.get('verify_prompt')}\"\n"
            f"Action Instruction: \"{curr_step.get('action_instruction')}\"\n"
            f"Result Check: \"{curr_step.get('result_check')}\"\n"
            f"Elapsed Time on step: {elapsed_step_seconds}s / Target: {step_duration}s\n"
            f"User Spoke: \"{user_speech or 'Looking at camera'}\"\n\n"
            "Return JSON adhering strictly to this schema:\n"
            "{\n"
            '  "detected_objects": ["name of objects clearly visible in image"],\n'
            '  "ingredient_confirmed": true/false/null,\n'
            '  "ingredient_detected_name": "what ingredient/item is visible (e.g. Coffee Mug / Glass Jar / Tea Bag / Empty)",\n'
            '  "result_confirmed": true/false/null,\n'
            '  "warning_alert": "Urgent safety warning if hazard detected, else null",\n'
            '  "spoken_response": "Direct Yes/No response sentence to speak aloud to patient right now",\n'
            '  "next_phase": "verify_ingredient" | "perform_action" | "verify_result" | "next_step",\n'
            '  "feedback_badge": "Short badge text (e.g. YES: Jar Verified / NO: Wrong Item / Action Verified)"\n'
            "}"
        )

        response_data = None
        if image_b64:
            try:
                raw_json = self._call_gemini_multimodal(
                    prompt=user_prompt,
                    image_b64=image_b64,
                    system_prompt=system_prompt,
                    is_json=True
                )
                clean_str = re.sub(r'<think>.*?</think>', '', raw_json, flags=re.DOTALL).strip()
                match = re.search(r'\{.*\}', clean_str, re.DOTALL)
                if match:
                    clean_str = match.group(0)
                response_data = json.loads(clean_str)
            except Exception as e:
                print(f"Multimodal live frame analysis error: {e}")

        if not response_data:
            # Smart fallback with direct question awareness
            detected = []
            user_speech_lower = (user_speech or "").lower()
            if "is this" in user_speech_lower or "is that" in user_speech_lower:
                spoken = f"No, I cannot see your {curr_step.get('expected_item')} clearly yet. Please hold it up to the camera so I can verify."
                badge = f"Checking {curr_step.get('expected_item')}"
            elif current_phase == "verify_ingredient":
                spoken = f"Please hold your {curr_step.get('expected_item')} up to the camera so I can check it."
                badge = f"Show {curr_step.get('expected_item')}"
            elif current_phase == "perform_action":
                spoken = f"Now, {curr_step.get('action_instruction')}. When done, show me your progress."
                badge = "Perform Action"
            else:
                spoken = f"Show me your {curr_step.get('expected_item')} so we can verify and move to the next step."
                badge = "Check Result"

            response_data = {
                "detected_objects": detected,
                "ingredient_confirmed": None,
                "ingredient_detected_name": "Scanning...",
                "result_confirmed": None,
                "warning_alert": None,
                "spoken_response": spoken,
                "next_phase": current_phase,
                "feedback_badge": badge
            }

        # Phase and Step Transition Logic
        next_phase = response_data.get("next_phase", current_phase)
        ingredient_confirmed = response_data.get("ingredient_confirmed")
        result_confirmed = response_data.get("result_confirmed")

        if current_phase == "verify_ingredient" and ingredient_confirmed is True:
            session["current_step_phase"] = "perform_action"
        elif current_phase == "perform_action" and next_phase == "verify_result":
            session["current_step_phase"] = "verify_result"
        elif (current_phase == "verify_result" or next_phase == "next_step") and (result_confirmed is True or next_phase == "next_step"):
            # Advance to next step
            if curr_idx < session["total_steps"] - 1:
                session["current_step_index"] = curr_idx + 1
                session["current_step_phase"] = "verify_ingredient"
                session["step_start_time"] = time.time()
            elif curr_idx == session["total_steps"] - 1:
                session["status"] = "completed"

        turn = {
            "step_index": curr_idx,
            "phase": session.get("current_step_phase"),
            "user_speech": user_speech,
            "detected_objects": response_data.get("detected_objects", []),
            "ingredient_confirmed": ingredient_confirmed,
            "spoken_response": response_data.get("spoken_response"),
            "warning_alert": response_data.get("warning_alert"),
            "timestamp": time.time()
        }
        session["conversation_history"].append(turn)

        return {
            "session_id": session_id,
            "task_title": session["task_title"],
            "current_step_index": session["current_step_index"],
            "current_step_phase": session.get("current_step_phase", "verify_ingredient"),
            "total_steps": session["total_steps"],
            "status": session["status"],
            "current_step": session["steps"][session["current_step_index"]],
            "detected_objects": response_data.get("detected_objects", []),
            "ingredient_confirmed": ingredient_confirmed,
            "ingredient_detected_name": response_data.get("ingredient_detected_name", ""),
            "result_confirmed": result_confirmed,
            "warning_alert": response_data.get("warning_alert"),
            "spoken_response": response_data.get("spoken_response"),
            "feedback_badge": response_data.get("feedback_badge", "Live Cortex"),
            "steps": session["steps"]
        }

    def set_step(self, session_id: str, step_index: int, phase: str = "verify_ingredient") -> Dict[str, Any]:
        """Manually navigate to a specific step in the task."""
        session = self.sessions.get(session_id)
        if not session:
            raise Exception("Task session not found")

        if 0 <= step_index < session["total_steps"]:
            session["current_step_index"] = step_index
            session["current_step_phase"] = phase
            session["step_start_time"] = time.time()
            if session["status"] == "completed" and step_index < session["total_steps"] - 1:
                session["status"] = "in_progress"

        return {
            "session_id": session_id,
            "current_step_index": session["current_step_index"],
            "current_step_phase": session.get("current_step_phase", "verify_ingredient"),
            "total_steps": session["total_steps"],
            "status": session["status"],
            "current_step": session["steps"][session["current_step_index"]],
            "steps": session["steps"]
        }

    def end_session(self, session_id: str) -> Dict[str, Any]:
        if session_id in self.sessions:
            self.sessions[session_id]["status"] = "ended"
            del self.sessions[session_id]
        return {"status": "ended", "session_id": session_id}

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.sessions.get(session_id)

task_guide_service = TaskGuideService()
