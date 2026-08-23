import os
from groq import Groq
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        print(f"DEBUG LLM: API Key Loaded? {bool(self.api_key)}")
        if self.api_key:
             print(f"DEBUG LLM: Key starts with {self.api_key[:4]}...")
        
        self.client = None
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                print("DEBUG LLM: Groq Client Initialized")
            except Exception as e:
                print(f"DEBUG LLM: Failed to init Groq: {e}")
        
    def analyze_statement_intent(self, user_text: str) -> dict:
        """
        Analyzes if the user is providing new facts/updates or asking a question.
        Returns a dict: {
            "is_update": bool,
            "entity": str,
            "location": str,
            "fact": str,
            "confirmation": str
        }
        """
        if not self.client:
            # Fallback simple rule-based detector
            lower = user_text.lower()
            keywords = ["switched", "moved", "placed", "put", "kept", "remember that", "now in", "now on", "now at", "location of", "position of"]
            if any(k in lower for k in keywords):
                return {
                    "is_update": True,
                    "entity": "item",
                    "location": user_text,
                    "fact": user_text,
                    "confirmation": f"Got it! I will remember that: {user_text}"
                }
            return {"is_update": False}

        try:
            prompt = (
                "You are an AI Memory assistant intent analyzer. "
                "Analyze the user's message to determine if they are STATING new information/facts/updates to remember "
                "(e.g., 'I moved my pen to the bag', 'Remember that my keys are on the fridge', 'I switched the position of pen to desk', 'Dr. Smith is coming on Friday') "
                "or if they are ASKING a question (e.g., 'Where is my pen?', 'Who is Dr. Smith?').\n\n"
                "Return ONLY a valid JSON object with the following keys (no markdown code fences):\n"
                "{\n"
                '  "is_update": true/false,\n'
                '  "entity": "name of person/object or null",\n'
                '  "location": "extracted location or null",\n'
                '  "fact": "concise description of the new fact/update",\n'
                '  "confirmation": "warm, 1-sentence confirmation acknowledging the update"\n'
                "}\n\n"
                f"User Message: {user_text}"
            )

            models_to_try = [
                "groq/compound-mini",
                "openai/gpt-oss-20b",
                "qwen/qwen3.6-27b",
                "groq/compound"
            ]
            content = None
            for model_name in models_to_try:
                try:
                    completion = self.client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model=model_name,
                        temperature=0.1,
                        max_tokens=400,
                    )
                    content = completion.choices[0].message.content.strip()
                    break
                except Exception as model_err:
                    print(f"Model {model_name} failed in intent analyzer: {model_err}")
            
            if not content:
                raise Exception("All Groq models failed in intent analyzer")

            # Clean up <think> blocks and markdown block if any
            import re
            content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            if content.startswith("json"):
                content = content[4:].strip()

            import json
            data = json.loads(content)
            return data
        except Exception as e:
            print(f"Error in analyze_statement_intent: {e}")
            lower = user_text.lower()
            if any(k in lower for k in ["switched", "moved", "placed", "put", "kept", "remember that", "now in", "now on", "now at"]):
                return {
                    "is_update": True,
                    "entity": None,
                    "location": None,
                    "fact": user_text,
                    "confirmation": f"Got it! I've noted that {user_text}."
                }
            return {"is_update": False}

    def generate_response(self, user_text: str, context: dict = None, additional_memories: list = None) -> str:
        """
        Generates a clear, natural, friendly conversational response using Groq.
        Prioritizes latest memories and state updates.
        """
        if not self.client:
            print("DEBUG LLM: No Client, using Fallback")
            return self._fallback_response(context)
            
        try:
            # Construct System Prompt
            system_prompt = (
                "You are Neuron, a warm, caring, and highly reliable AI companion for memory assistance. "
                "Rules for your response:\n"
                "1. Answer clearly, warmly, and directly in 1 or 2 natural, easy-to-read sentences.\n"
                "2. If multiple locations or past details exist, ALWAYS provide the NEWEST / MOST RECENT location or update.\n"
                "3. Never mention internal words like 'database', 'payload', 'system', 'Auto-enrolled', or 'records'.\n"
                "4. Be friendly, reassuring, and concise."
            )
            
            # Construct Context String
            context_str = "No specific memory found."
            if context:
                name = context.get("name", "Unknown")
                relation = context.get("relation", "")
                raw_notes = context.get("notes", "")
                # Clean internal artifact phrases from notes
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

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Memory Context:\n{context_str}\n\nUser Question: {user_text}"}
            ]
            
            models_to_try = [
                "groq/compound-mini",
                "openai/gpt-oss-20b",
                "qwen/qwen3.6-27b",
                "groq/compound"
            ]
            raw_response = None
            for model_name in models_to_try:
                try:
                    chat_completion = self.client.chat.completions.create(
                        messages=messages,
                        model=model_name,
                        temperature=0.4,
                        max_tokens=200,
                    )
                    raw_response = chat_completion.choices[0].message.content
                    if raw_response and len(raw_response.strip()) > 0:
                        break
                except Exception as model_err:
                    print(f"Model {model_name} failed in generate_response: {model_err}")

            if not raw_response:
                return self._fallback_response(context)

            import re
            clean_response = re.sub(r'<think>.*?</think>', '', raw_response, flags=re.DOTALL).strip()
            # Clean non-standard unicode characters
            clean_response = clean_response.replace('\u2011', '-').replace('\u202f', ' ').replace('\u2019', "'").replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')
            clean_response = clean_response.replace("**", "").replace("__", "")
            return clean_response or self._fallback_response(context)
            
        except Exception as e:
            print(f"LLM Error: {e}")
            return self._fallback_response(context)

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
            return f"{name} is your {rel}." + (f" {notes}" if notes else "")
        if notes:
            return f"{name}: {notes}"
        return f"I have {name} in my memory."

llm_service = LLMService()
