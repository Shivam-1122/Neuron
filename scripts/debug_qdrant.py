import sys
import os
sys.path.append(os.getcwd())

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from qdrant_client import QdrantClient
from app.core.config import settings

try:
    if settings.QDRANT_MODE == "local":
        client = QdrantClient(path=settings.QDRANT_PATH)
    else:
        client = QdrantClient(
            url=settings.get_qdrant_url(),
            api_key=settings.QDRANT_API_KEY,
            check_compatibility=False
        )
    print("✅ Client initialized.")
    attrs = dir(client)
    relevant = [a for a in attrs if "search" in a or "query" in a or "recommend" in a]
    print(f"Relevant methods: {relevant}")
except Exception as e:
    print(f"❌ Error: {e}")
