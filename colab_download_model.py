#!/usr/bin/env python3
"""
📦 Colab Model Downloader - HireFlow Fresh Model
Downloads your trained model and creates a ZIP file in Google Colab
"""

import os
import zipfile
from huggingface_hub import snapshot_download
from google.colab import files

def download_and_zip_model():
    """Download model and create ZIP for Colab download"""
    
    model_name = "somriksur/HireFlow-Qwen-Fresh-Pro"
    local_dir = "./HireFlow-Qwen-Fresh-Pro"
    zip_filename = "HireFlow-Qwen-Fresh-Pro.zip"
    
    print("📦 HireFlow Model Downloader for Google Colab")
    print("=" * 50)
    print(f"🔄 Model: {model_name}")
    print(f"📁 Directory: {local_dir}")
    print(f"🗜️  ZIP: {zip_filename}")
    print()
    
    try:
        # Step 1: Download model
        print("🔄 Step 1: Downloading model files...")
        snapshot_download(
            repo_id=model_name,
            local_dir=local_dir,
            local_dir_use_symlinks=False
        )
        print("✅ Model downloaded successfully!")
        
        # Step 2: Create ZIP
        print("\n🗜️  Step 2: Creating ZIP file...")
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            file_count = 0
            for root, dirs, files in os.walk(local_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, local_dir)
                    zipf.write(file_path, arcname)
                    file_count += 1
                    if file_count % 5 == 0:
                        print(f"   📄 Added {file_count} files...")
        
        # Step 3: Get file info
        zip_size = os.path.getsize(zip_filename)
        zip_size_mb = zip_size / (1024 * 1024)
        
        print(f"\n🎉 SUCCESS!")
        print(f"📦 ZIP created: {zip_filename}")
        print(f"📊 Size: {zip_size_mb:.1f} MB")
        print(f"📄 Files: {file_count}")
        
        # Step 4: Download in Colab
        print(f"\n⬇️  Step 3: Downloading to your computer...")
        files.download(zip_filename)
        print("✅ Download started! Check your browser downloads.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

# Run the download
if __name__ == "__main__":
    download_and_zip_model()