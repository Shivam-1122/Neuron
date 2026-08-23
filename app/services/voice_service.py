import os
from groq import Groq
from app.core.config import settings

class VoiceService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if self.api_key:
            try:
                self.groq_client = Groq(api_key=self.api_key)
            except Exception as e:
                print(f"Failed to init Groq in VoiceService: {e}")
        self._local_model = None

    def transcribe(self, audio_path: str) -> str:
        """
        Transcribe audio file to text using Groq Whisper (ultra-fast) or local Whisper.
        """
        # 1. Try Groq Whisper (fastest, highest accuracy)
        if self.groq_client:
            try:
                with open(audio_path, "rb") as f:
                    file_content = f.read()
                    transcription = self.groq_client.audio.transcriptions.create(
                        file=(os.path.basename(audio_path), file_content),
                        model="whisper-large-v3-turbo",
                        language="en"
                    )
                    text = transcription.text.strip() if hasattr(transcription, 'text') else str(transcription)
                    if text:
                        return text
            except Exception as e:
                print(f"Groq Whisper transcription error: {e}")
        
        # 2. Local Whisper fallback
        try:
            if self._local_model is None:
                import whisper
                self._local_model = whisper.load_model("base")
            result = self._local_model.transcribe(audio_path)
            return result["text"].strip()
        except Exception as e:
            print(f"Local Whisper fallback error: {e}")
            return ""

voice_service = VoiceService()

