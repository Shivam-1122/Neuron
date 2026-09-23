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

    col = client.get_collection("faces")
    if col:
        print("✅ Collection 'faces' exists.")
        
        # Test query_points
        try:
            dummy = [0.1] * 512
            res = client.query_points(collection_name="faces", query=dummy, limit=1)
            print(f"✅ query_points success. Result count: {len(res.points)}")
        except Exception as e:
            print(f"❌ query_points failed: {e}")
            
except Exception as e:
    print(f"❌ Error: {e}")
