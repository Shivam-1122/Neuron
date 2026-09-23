import sys
import os
sys.path.append(os.getcwd())

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from qdrant_client import QdrantClient
from app.core.config import settings

def test_qdrant():
    print("--- Inspecting Qdrant Client ---")
    if settings.QDRANT_MODE == "local":
        print(f"Mode: Local, Path: {settings.QDRANT_PATH}")
        client = QdrantClient(path=settings.QDRANT_PATH)
    else:
        print("Mode: Remote")
        client = QdrantClient(
            url=settings.get_qdrant_url(),
            api_key=settings.QDRANT_API_KEY,
            check_compatibility=False
        )

    print(f"Client Type: {type(client)}")
    
    methods = [m for m in dir(client) if not m.startswith("_")]
    print(f"Methods count: {len(methods)}")
    
    print("\n--- Testing Search Methods ---")
    has_search = hasattr(client, 'search')
    has_query = hasattr(client, 'query_points')
    print(f"Has .search(): {has_search}")
    print(f"Has .query_points(): {has_query}")

    # Inspect available collections
    collections = []
    try:
        col_info = client.get_collections()
        collections = [c.name for c in col_info.collections]
        print(f"Available Collections: {collections}")
    except Exception as e:
        print(f"Collection Fetch Error: {e}")

    # Test .query_points() (standard for qdrant-client >= 1.11.0)
    if has_query:
        print("\nTesting .query_points()...")
        try:
            target_col = "faces" if "faces" in collections else (collections[0] if collections else None)
            dim = 512 if target_col in ["faces", "patients"] else (1280 if target_col == "objects" else 384)
            if target_col:
                res = client.query_points(collection_name=target_col, query=[0.0] * dim, limit=1)
                print(f"[OK] .query_points() succeeded on '{target_col}'. Points returned: {len(res.points)}")
            else:
                print("[INFO] No collections found to test query_points.")
        except Exception as e:
            print(f"[ERROR] query_points Error: {e}")

    if has_search:
        print("\nTesting legacy .search()...")
        try:
            target_col = "faces" if "faces" in collections else (collections[0] if collections else None)
            dim = 512 if target_col in ["faces", "patients"] else 384
            if target_col:
                res = client.search(collection_name=target_col, query_vector=[0.0] * dim, limit=1)
                print(f"[OK] .search() succeeded on '{target_col}'. Hits: {len(res)}")
            else:
                print("[INFO] No collections found to test .search().")
        except Exception as e:
            print(f"[ERROR] Search Error: {e}")

if __name__ == "__main__":
    test_qdrant()
