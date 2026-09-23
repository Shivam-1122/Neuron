import os
import json
import re
import httpx
from groq import Groq
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        self.gemini_api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        
        # Primary default is groq
        self.active_provider = (getattr(settings, "LLM_PROVIDER", "groq") or "groq").lower()
        if self.active_provider not in ["groq", "gemini"]:
            self.active_provider = "groq"

        self.groq_client = None
        if self.groq_api_key:
            try:
                self.groq_client = Groq(api_key=self.groq_api_key)
                print("DEBUG LLM: Groq Client Initialized (Primary Provider)")
            except Exception as e:
                print(f"DEBUG LLM: Failed to init Groq: {e}")

        print(f"DEBUG LLM: Providers Configured -> Groq: {bool(self.groq_api_key)}, Gemini: {bool(self.gemini_api_key)} | Active: {self.active_provider}")

    def get_provider_info(self) -> dict:
        """Returns the current active provider and available model engines."""
        return {
            "active_provider": self.active_provider,
            "primary": "groq",
            "available_providers": [
                {"id": "groq", "name": "Groq Llama 3 / Qwen (Ultra-Fast Primary)", "is_available": bool(self.groq_api_key)},
                {"id": "gemini", "name": "Google Gemini 3.6 Flash (Multimodal Cortex)", "is_available": bool(self.gemini_api_key)}
            ]
        }

    def set_provider(self, provider: str) -> str:
        """Dynamically switch active LLM provider (groq vs gemini)."""
        p = (provider or "").strip().lower()
        if p in ["groq", "gemini"]:
            self.active_provider = p
            print(f"DEBUG LLM: Active provider switched to '{self.active_provider}'")
        return self.active_provider

    def _call_gemini(self, prompt: str, system_prompt: str = "", max_tokens: int = 250, temperature: float = 0.2, is_json: bool = False) -> str:
        """Calls Google Gemini REST API using the configured key and available models."""
        if not self.gemini_api_key:
            raise Exception("Gemini API key not configured")

        models_to_try = [
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-2.5-flash-lite"
        ]

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }

        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        if is_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_api_key}"
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                text = parts[0]["text"].strip()
                                if text:
                                    return text
                    elif resp.status_code in [404, 429, 503]:
                        print(f"Gemini model {model_name} status {resp.status_code}, trying next model...")
                        continue
                    else:
                        print(f"Gemini API returned error ({resp.status_code}): {resp.text[:120]}")
            except Exception as e:
                print(f"Gemini API request failed for {model_name}: {e}")

        raise Exception("All Gemini models failed")

    def _call_groq(self, messages: list, max_tokens: int = 250, temperature: float = 0.2) -> str:
        """Calls Groq Cloud completions API with prioritized high-capacity models."""
        if not self.groq_client:
            raise Exception("Groq client not initialized")

        models_to_try = [
            "openai/gpt-oss-20b",
            "qwen/qwen3.6-27b",
            "openai/gpt-oss-120b",
            "groq/compound-mini",
            "groq/compound"
        ]

        for model_name in models_to_try:
            try:
                completion = self.groq_client.chat.completions.create(
                    messages=messages,
                    model=model_name,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                text = completion.choices[0].message.content
                if text and len(text.strip()) > 0:
                    return text.strip()
            except Exception as model_err:
                print(f"Groq model {model_name} failed: {model_err}")

        raise Exception("All Groq models failed")

    def analyze_statement_intent(self, user_text: str, provider: str = None) -> dict:
        """
        Analyzes if the user is providing new facts/updates or asking a question.
        Supports dynamic provider selection with automatic failover.
        """
        target_provider = (provider or self.active_provider).lower()
        if target_provider not in ["groq", "gemini"]:
            target_provider = "groq"

        prompt = (
            "Analyze the user's message to classify their intent into one of three categories:\n"
            "1. SCHEDULING A TASK / ROUTINE / GENTLE ANCHOR (e.g., 'add a task for today that i have to make coffee before bed add in gentle anchors', 'schedule tea at 5pm', 'remind me to take my pills at 8pm', 'add gentle anchor walk at 10am').\n"
            "2. PHYSICAL OBJECT RELOCATION / FACT UPDATE (e.g., 'I moved my pen to the bag', 'My glasses are on the nightstand', 'I switched the position of wallet to drawer'). Note: tasks/routines are NEVER physical objects!\n"
            "3. ASKING A QUESTION (e.g., 'Where is my pen?', 'Who is Sarah?').\n\n"
            "Return ONLY a valid JSON object with the following keys:\n"
            "{\n"
            '  "is_task": true/false,\n'
            '  "task_title": "concise title of the task (e.g. Make Coffee) or null",\n'
            '  "task_time": "time or routine phase (e.g. Before Bed, 09:00, Today) or null",\n'
            '  "task_notes": "warm description of the task or null",\n'
            '  "is_update": true/false (must be FALSE if is_task is true),\n'
            '  "entity": "name of physical object or person or null",\n'
            '  "location": "physical place or null",\n'
            '  "fact": "concise description of the fact or null",\n'
            '  "confirmation": "warm, reassuring 1-sentence confirmation acknowledging the scheduled task or update"\n'
            "}\n\n"
            f"User Message: {user_text}"
        )

        content = None
        providers_sequence = [target_provider, "gemini" if target_provider == "groq" else "groq"]

        for prov in providers_sequence:
            try:
                if prov == "groq" and self.groq_client:
                    messages = [{"role": "user", "content": prompt}]
                    content = self._call_groq(messages, max_tokens=350, temperature=0.1)
                    if content:
                        break
                elif prov == "gemini" and self.gemini_api_key:
                    content = self._call_gemini(
                        prompt=prompt,
                        system_prompt="You are an AI Memory assistant JSON intent analyzer. Output pure JSON only.",
                        max_tokens=350,
                        temperature=0.1,
                        is_json=True
                    )
                    if content:
                        break
            except Exception as e:
                print(f"Provider {prov} failed in analyze_statement_intent: {e}")

        if content:
            try:
                clean_content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
                match = re.search(r'\{.*\}', clean_content, re.DOTALL)
                if match:
                    clean_content = match.group(0)
                elif clean_content.startswith("```"):
                    clean_content = clean_content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
                    if clean_content.startswith("json"):
                        clean_content = clean_content[4:].strip()

                data = json.loads(clean_content)
                if isinstance(data, dict):
                    if data.get("is_task"):
                        data["is_update"] = False
                    if "is_update" in data or "is_task" in data:
                        return data
            except Exception as parse_err:
                print(f"JSON parse note in intent analyzer: {parse_err}")

        lower = user_text.lower()
        # Task scheduling fallback
        if any(k in lower for k in ["add a task", "add task", "schedule", "gentle anchor", "gentle anchors", "remind me to", "remind me"]):
            clean_title = user_text
            for prefix in ["add a task for today that i have to", "add a task that i have to", "add a task to", "add task to", "schedule to", "schedule", "remind me to", "add in gentle anchors", "add to gentle anchors"]:
                clean_title = re.sub(prefix, '', clean_title, flags=re.IGNORECASE)
            clean_title = clean_title.strip(" :,.-")
            return {
                "is_task": True,
                "task_title": clean_title[:45] if clean_title else "Scheduled Routine",
                "task_time": "Today",
                "task_notes": user_text,
                "is_update": False,
                "confirmation": f"I've added '{clean_title or 'your task'}' to Today's Gentle Anchors on your main screen."
            }

        # Object relocation fallback
        if any(k in lower for k in ["switched", "moved", "placed", "put", "kept", "remember that", "now in", "now on", "now at", "location of"]):
            return {
                "is_task": False,
                "is_update": True,
                "entity": None,
                "location": None,
                "fact": user_text,
                "confirmation": f"Got it! I've noted that {user_text}."
            }
        return {"is_update": False, "is_task": False}

    def generate_response(self, user_text: str, context: dict = None, additional_memories: list = None, provider: str = None) -> tuple[str, str]:
        """
        Generates a clear, natural, friendly conversational response.
        Returns: (response_text, provider_used)
        """
        target_provider = (provider or self.active_provider).lower()
        if target_provider not in ["groq", "gemini"]:
            target_provider = "groq"

        system_prompt = (
            "You are Neuron, a warm, caring, and highly reliable AI companion for memory assistance. "
            "Rules for your response:\n"
            "1. Answer clearly, warmly, and directly in 1 or 2 natural, easy-to-read sentences.\n"
            "2. If multiple locations or past details exist, ALWAYS provide the NEWEST / MOST RECENT location or update.\n"
            "3. Never mention internal words like 'database', 'payload', 'system', 'Auto-enrolled', or 'records'.\n"
            "4. Be friendly, reassuring, and concise."
        )

        context_str = "No specific memory found."
        if context:
            name = context.get("name", "Unknown")
            relation = context.get("relation", "")
            raw_notes = context.get("notes", "")
            clean_notes = raw_notes.replace("Auto-enrolled from observation.", "").strip()
            location = context.get("location", "")
            updated_at = context.get("updated_at") or context.get("timestamp", "")
            
            parts = [f"Name: {name}"]
            if relation and relation != "Unspecified":
                parts.append(f"Relationship: {relation}")
            if location:
                parts.append(f"Current/Latest Location: {location}")
            if clean_notes:
                parts.append(f"Key Notes: {clean_notes}")
            if updated_at:
                parts.append(f"Last Known Time: {updated_at}")
            
            context_str = ", ".join(parts)
        
        if additional_memories:
            mem_texts = []
            for m in additional_memories[:4]:
                t = m.get("text") or m.get("notes") or ""
                clean_t = t.replace("Auto-enrolled from observation.", "").strip()
                ts = m.get("updated_at") or m.get("timestamp") or ""
                if clean_t:
                    mem_texts.append(f"[{ts}] {clean_t}" if ts else clean_t)
            if mem_texts:
                context_str += "\nRecent Memory History (Newest first):\n" + "\n".join(mem_texts)

        user_query_content = f"Memory Context:\n{context_str}\n\nUser Question: {user_text}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query_content}
        ]

        raw_response = None
        actual_provider_used = target_provider
        providers_sequence = [target_provider, "gemini" if target_provider == "groq" else "groq"]

        for prov in providers_sequence:
            try:
                if prov == "groq" and self.groq_client:
                    raw_response = self._call_groq(messages=messages, max_tokens=220, temperature=0.3)
                    if raw_response:
                        actual_provider_used = "groq"
                        break
                elif prov == "gemini" and self.gemini_api_key:
                    raw_response = self._call_gemini(prompt=user_query_content, system_prompt=system_prompt, max_tokens=220, temperature=0.3)
                    if raw_response:
                        actual_provider_used = "gemini"
                        break
            except Exception as e:
                print(f"Provider {prov} failed in generate_response: {e}")

        if not raw_response:
            return self._fallback_response(context), "fallback"

        clean_response = re.sub(r'<think>.*?</think>', '', raw_response, flags=re.DOTALL).strip()
        clean_response = clean_response.replace('\u2011', '-').replace('\u202f', ' ').replace('\u2019', "'").replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')
        if not clean_response or len(clean_response) < 18 or clean_response.rstrip().endswith(("is", "is a", "is the", "are", "are the")):
            return self._fallback_response(context), actual_provider_used

        return clean_response, actual_provider_used

    def _fallback_response(self, context: dict) -> str:
        """Clear, natural fallback response."""
        if not context:
            return "I'm right here with you. How can I help?"
            
        name = context.get("name", "that")
        loc = context.get("location")
        rel = context.get("relation")
        notes = (context.get("notes") or "").replace("Auto-enrolled from observation.", "").strip()
        
        if loc:
            return f"Your {name} is {loc}."
        if rel and rel != "Unspecified":
            return f"{name} is your registered {rel}." + (f" ({notes})" if notes and notes != f"{name} is your registered {rel}." else "")
        if notes:
            return f"{name}: {notes}"
        return f"I have {name} in my memory."

llm_service = LLMService()
