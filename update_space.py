#!/usr/bin/env python3
"""
Quick update script to push the improved app.py to your Space
"""

import os
import subprocess

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
    print("🔄 Updating Space with improved question diversity...")
    
    # Create temporary directory for Space
    space_dir = "temp_space_update"
    
    try:
        # Clean up any existing temp directory
        if os.path.exists(space_dir):
            run_command(f"rm -rf {space_dir}")
        
        # Clone your Space repository
        print("📥 Cloning Space repository...")
        if not run_command(f"git clone https://huggingface.co/spaces/somriksur/hireflow-qwen-api {space_dir}"):
            print("❌ Failed to clone Space repository")
            return False
        
        # Copy updated app.py
        print("📁 Copying updated app.py...")
        if os.path.exists("space_files/app.py"):
            run_command(f"cp space_files/app.py {space_dir}/app.py")
            print("✅ Copied improved app.py")
        else:
            print("❌ space_files/app.py not found")
            return False
        
        # Change to Space directory
        os.chdir(space_dir)
        
        # Add and commit changes
        print("📝 Committing improvements...")
        run_command("git add app.py")
        run_command('git commit -m "Improve question diversity - reduce repetition, enhance generation parameters"')
        
        # Push to Space
        print("🚀 Pushing improvements to Space...")
        if run_command("git push"):
            print("✅ Space updated successfully!")
            print("🌐 Changes will be live in 1-2 minutes at: https://huggingface.co/spaces/somriksur/hireflow-qwen-api")
            return True
        else:
            print("❌ Failed to push to Space")
            return False
            
    except Exception as e:
        print(f"❌ Update error: {e}")
        return False
    
    finally:
        # Clean up
        os.chdir("..")
        if os.path.exists(space_dir):
            run_command(f"rm -rf {space_dir}")

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎉 Space updated with improved question diversity!")
        print("\nImprovements made:")
        print("• Increased repetition penalty (1.1 → 1.3)")
        print("• Added no_repeat_ngram_size=3")
        print("• Added diversity_penalty=0.5")
        print("• Enhanced prompt for better diversity")
        print("• Improved sampling parameters")
        print("\nTest again in 2-3 minutes!")
    else:
        print("\n❌ Update failed. You can manually copy the improved app.py to your Space.")