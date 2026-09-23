# -*- coding: utf-8 -*-
"""VoxCeleb_Extraction_Colab.ipynb

# 🚀 VoxCeleb Audio Downloader (Robust Version)

This script:
1. Downloads the full VoxCeleb1 Dev dataset (4 parts) manually (bypassing library issues).
2. Concatenates them into a valid ZIP.
3. Downloads metadata to find Indian celebrities.
4. Extracts ONLY the Indian celebrity audio.
5. Zips the result for you to download.
"""

import sys
import os
import shutil
import zipfile
import json
import subprocess
from pathlib import Path

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# 1. Ensure Dependencies
try:
    import pandas as pd
    import requests
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas", "requests"])
    import pandas as pd
    import requests

# Config
BASE_URL = "https://huggingface.co/datasets/ProgramComputer/voxceleb/resolve/main/vox1"
FILES = [
    "vox1_dev_wav_partaa",
    "vox1_dev_wav_partab",
    "vox1_dev_wav_partac",
    "vox1_dev_wav_partad"
]
META_URL = "https://mm.kaist.ac.kr/datasets/voxceleb/meta/vox1_meta.csv" # Official meta
# Alternative meta: https://huggingface.co/datasets/ProgramComputer/voxceleb/raw/main/vox1/vox1_meta.csv

WORK_DIR = Path("/content/vox_work") if os.path.exists("/content") else Path("temp_vox_work")
OUTPUT_DIR = Path("/content/voxceleb_indian_audio") if os.path.exists("/content") else Path("voxceleb_indian_audio")
WORK_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def download_file(url: str, dest_path: Path):
    """Download a file with streaming to handle large archives."""
    resp = requests.get(url, stream=True, verify=False)
    resp.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)

# 2. Download Metadata
print("⬇️ Downloading Metadata...")
meta_file = WORK_DIR / "vox1_meta.csv"
if not meta_file.exists():
    try:
        download_file(META_URL, meta_file)
    except Exception as e:
        print(f"Failed to download official meta, trying HF fallback: {e}")
        fallback_meta = "https://huggingface.co/datasets/ProgramComputer/voxceleb/raw/main/vox1/vox1_meta.csv"
        download_file(fallback_meta, meta_file)

# 3. Filter for Indian Celebrities
print("🔍 Filtering Metadata...")
try:
    df = pd.read_csv(meta_file, sep="\t")
    # Columns: "VoxCeleb1 ID", "VGGFace1 ID", "Gender", "Nationality", "Set"
    
    # Normalize nationality
    indian_celebs = df[df['Nationality'].str.lower().isin(['india', 'indian'])]
    
    # FIX: Explicitly get the ID column
    if "VoxCeleb1 ID" in df.columns:
        target_ids = set(indian_celebs["VoxCeleb1 ID"].astype(str).tolist())
    else:
        # Fallback: assume first column
        target_ids = set(indian_celebs.iloc[:, 0].astype(str).tolist())
    
    # LIMIT to 25
    target_ids = set(list(target_ids)[:25])

    print(f"🇮🇳 Found {len(target_ids)} Indian celebrities in metadata (Limited to 25).")
    print(f"   Sample IDs: {list(target_ids)[:5]}")
    
    # Create mapping ID -> Name
    if "VGGFace1 ID" in df.columns:
        id_to_name = dict(zip(indian_celebs["VoxCeleb1 ID"], indian_celebs["VGGFace1 ID"]))
    else:
        id_to_name = {}

except Exception as e:
    print(f"❌ Metadata Error: {e}")
    target_ids = set()
    id_to_name = {}

# 4. Download and Concatenate Archives
print("⬇️ Downloading Audio Archives (4 Parts)...")
for f in FILES:
    part_path = WORK_DIR / f
    if not part_path.exists():
        url = f"{BASE_URL}/{f}"
        print(f"   Getting {f}...")
        download_file(url, part_path)
    else:
        print(f"   {f} already exists.")

full_zip_path = WORK_DIR / "full_vox1.zip"
print("🔗 Concatenating parts...")
with open(full_zip_path, "wb") as out:
    for f in FILES:
        part_path = WORK_DIR / f
        with open(part_path, "rb") as src:
            shutil.copyfileobj(src, out)

# 5. Extract ONLY Target Files
print(f"📦 Unzipping and extracting matching audio...")

try:
    with zipfile.ZipFile(full_zip_path, 'r') as z:
        file_list = z.namelist()
        extracted_count = 0
        
        for f in file_list:
            # Structure: wav/id10001/1zn.../00001.wav
            parts = f.split('/')
            if len(parts) > 2:
                s_id = parts[1] # id10001
                
                if s_id in target_ids:
                    # It's an Indian celeb!
                    name = id_to_name.get(s_id, s_id)
                    
                    # Create person dir: Name_ID
                    p_dir = OUTPUT_DIR / f"{name}_{s_id}"
                    p_dir.mkdir(exist_ok=True)
                    
                    # Target file path: Limit to 10 clips per person
                    current_clips = list(p_dir.glob("*.wav"))
                    if len(current_clips) < 10:
                        if f.endswith('.wav'):
                            target_path = p_dir / Path(f).name
                            with z.open(f) as source, open(target_path, "wb") as dest:
                                shutil.copyfileobj(source, dest)
                            extracted_count += 1
                    
                    # Create Metadata
                    meta = {
                        "name": name.replace("_", " "),
                        "relation": "Celebrity",
                        "nationality": "India",
                        "id": s_id
                    }
                    with open(p_dir / "metadata.json", "w") as mf:
                        json.dump(meta, mf)
                            
        print(f"✅ Extracted {extracted_count} total clips.")

except zipfile.BadZipFile:
    print("❌ Critical: The constructed zip file is invalid. Download might have failed.")
except Exception as e:
    print(f"❌ Error during extraction: {e}")

# 6. Zip Result
print("🗜️ Zipping final output...")
zip_out = "/content/indian_celebs_audio" if os.path.exists("/content") else "indian_celebs_audio"
shutil.make_archive(zip_out, 'zip', OUTPUT_DIR)
print("✨ Done! Created output archive.")
