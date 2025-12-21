#!/usr/bin/env python3
"""
Deploy HireFlow Space to Hugging Face
Run this script to upload your Space files to https://huggingface.co/spaces/somriksur/hireflow-qwen-api
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"❌ Command failed: {cmd}")
            print(f"Error: {result.stderr}")
            return False
        print(f"✅ {cmd}")
        return True
    except Exception as e:
        print(f"❌ Error running command: {e}")
        return False

def main():
    print("🚀 Deploying HireFlow Space to Hugging Face...")
    
    # Check if space_files directory exists
    if not os.path.exists("space_files"):
        print("❌ space_files directory not found!")
        print("Make sure you're running this from the project root directory.")
        return False
    
    # Create temporary directory for Space
    space_dir = "temp_space_deploy"
    
    try:
        # Clean up any existing temp directory
        if os.path.exists(space_dir):
            run_command(f"rm -rf {space_dir}")
        
        # Clone your Space repository
        print("📥 Cloning Space repository...")
        if not run_command(f"git clone https://huggingface.co/spaces/somriksur/hireflow-qwen-api {space_dir}"):
            print("❌ Failed to clone Space repository")
            print("Make sure you have access to the Space and git is configured with your HF credentials")
            return False
        
        # Copy files to Space directory
        print("📁 Copying Space files...")
        files_to_copy = ["app.py", "requirements.txt", "README.md"]
        
        for file in files_to_copy:
            src = f"space_files/{file}"
            dst = f"{space_dir}/{file}"
            
            if os.path.exists(src):
                run_command(f"cp {src} {dst}")
                print(f"✅ Copied {file}")
            else:
                print(f"⚠️ Warning: {src} not found")
        
        # Change to Space directory
        os.chdir(space_dir)
        
        # Add and commit changes
        print("📝 Committing changes...")
        run_command("git add .")
        run_command('git commit -m "Update Space with HireFlow-Qwen-Fresh-Pro model and 32GB RAM optimization"')
        
        # Push to Space
        print("🚀 Pushing to Hugging Face Space...")
        if run_command("git push"):
            print("✅ Space deployed successfully!")
            print("🌐 Your Space will be available at: https://huggingface.co/spaces/somriksur/hireflow-qwen-api")
            print("⏳ It may take a few minutes to build and start...")
            return True
        else:
            print("❌ Failed to push to Space")
            return False
            
    except Exception as e:
        print(f"❌ Deployment error: {e}")
        return False
    
    finally:
        # Clean up
        os.chdir("..")
        if os.path.exists(space_dir):
            run_command(f"rm -rf {space_dir}")

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Deployment completed successfully!")
        print("\nNext steps:")
        print("1. Visit https://huggingface.co/spaces/somriksur/hireflow-qwen-api")
        print("2. Wait for the Space to build (2-3 minutes)")
        print("3. Test the Space with a sample prompt")
        print("4. Update your app's HUGGINGFACE_ENDPOINT_URL if needed")
    else:
        print("\n❌ Deployment failed. Please check the errors above.")
        sys.exit(1)