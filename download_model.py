#!/usr/bin/env python3
"""
📦 Download HireFlow Model as ZIP
Downloads your trained model and creates a ZIP file
"""

import os
import zipfile
from huggingface_hub import snapshot_download

def download_model_as_zip():
    """Download model and create ZIP file"""
    
    model_name = "somriksur/HireFlow-Qwen-Fresh-Pro"
    local_dir = "./HireFlow-Qwen-Fresh-Pro"
    zip_filename = "HireFlow-Qwen-Fresh-Pro.zip"
    
    print(f"📦 Downloading model: {model_name}")
    print(f"📁 Local directory: {local_dir}")
    print(f"🗜️  ZIP file: {zip_filename}")
    print("=" * 50)
    
    try:
        # Download model files
        print("🔄 Downloading model files...")
        snapshot_download(
            repo_id=model_name,
            local_dir=local_dir,
            local_dir_use_symlinks=False
        )
        print("✅ Model downloaded successfully")
        
        # Create ZIP file
        print("🗜️  Creating ZIP file...")
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(local_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, local_dir)
                    zipf.write(file_path, arcname)
                    print(f"   📄 Added: {arcname}")
        
        # Get file size
        zip_size = os.path.getsize(zip_filename)
        zip_size_mb = zip_size / (1024 * 1024)
        
        print(f"\n🎉 SUCCESS!")
        print(f"📦 ZIP file created: {zip_filename}")
        print(f"📊 File size: {zip_size_mb:.1f} MB")
        print(f"📁 Contains all model files from: {model_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    download_model_as_zip()