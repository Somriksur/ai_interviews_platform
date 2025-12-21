#!/usr/bin/env python3
"""
🚀 Complete Setup for HireFlow Model Improvement Repository
Sets up everything needed for 90% accuracy improvements
"""

import os
import subprocess
import sys
from pathlib import Path

def check_requirements():
    """Check if all requirements are installed"""
    
    print("🔍 Checking Requirements...")
    
    required_packages = [
        "torch", "transformers", "datasets", "peft", 
        "trl", "accelerate", "bitsandbytes", "huggingface_hub"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"   ✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"   ❌ {package}")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages: {', '.join(missing_packages)}")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install"
        ] + missing_packages)
        print("✅ All packages installed")
    else:
        print("✅ All requirements satisfied")

def setup_environment():
    """Setup environment variables"""
    
    print("\n🔧 Setting up Environment...")
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists() and env_example.exists():
        print("📄 Creating .env from template...")
        with open(env_example) as f:
            content = f.read()
        
        with open(env_file, "w") as f:
            f.write(content)
        
        print("✅ .env file created")
        print("💡 Please edit .env with your HuggingFace token")
    else:
        print("✅ Environment configuration exists")

def verify_model_access():
    """Verify access to the base model"""
    
    print("\n🔍 Verifying Model Access...")
    
    try:
        from transformers import AutoTokenizer
        
        model_name = "somriksur/HireFlow-Qwen-Fresh-Pro"
        print(f"🔄 Testing access to: {model_name}")
        
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        print("✅ Model access verified")
        
    except Exception as e:
        print(f"⚠️  Model access issue: {e}")
        print("💡 Make sure your HuggingFace token is set correctly")

def create_directory_structure():
    """Create necessary directories"""
    
    print("\n📁 Creating Directory Structure...")
    
    directories = [
        "models",
        "data", 
        "logs",
        "checkpoints",
        "reports",
        "temp"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"   ✅ {directory}/")

def run_initial_tests():
    """Run initial validation tests"""
    
    print("\n🧪 Running Initial Tests...")
    
    # Test data generation
    print("🔄 Testing data generation...")
    try:
        from generate_training_data import generate_training_data
        print("✅ Data generation module loaded")
    except Exception as e:
        print(f"⚠️  Data generation test: {e}")
    
    # Test accuracy testing
    print("🔄 Testing accuracy validation...")
    try:
        from test_model_accuracy import test_model_accuracy
        print("✅ Accuracy testing module loaded")
    except Exception as e:
        print(f"⚠️  Accuracy testing: {e}")

def display_next_steps():
    """Display next steps for the user"""
    
    print("\n🎯 SETUP COMPLETE! Next Steps:")
    print("=" * 50)
    
    steps = [
        "1. Edit .env file with your HuggingFace token",
        "2. Run: python test_model_accuracy.py (baseline test)",
        "3. Run: python enhance_to_90_percent.py (generate enhanced data)",
        "4. Run: python fine_tune_to_90_percent.py (enhance to 90%)",
        "5. Run: python test_90_percent_accuracy.py (validate 90%)",
        "6. Run: python upload_to_new_repo.py (upload improved model)"
    ]
    
    for step in steps:
        print(f"   {step}")
    
    print("\n📚 Documentation:")
    print("   📖 MODEL_README.md - Complete overview")
    print("   🎯 TRAINING_GUIDE.md - Training instructions") 
    print("   🚀 IMPROVEMENT_ROADMAP.md - Enhancement strategy")
    
    print("\n🎉 Ready for 90% accuracy improvements!")

def main():
    """Main setup function"""
    
    print("🚀 HireFlow Model Improvement Repository Setup")
    print("=" * 60)
    print("🎯 Target: 90% Accuracy Enhancement")
    print("📦 Repository: somriksur/HireFlow-Qwen-Fresh-Pro-Improve")
    print("=" * 60)
    
    try:
        check_requirements()
        setup_environment()
        create_directory_structure()
        verify_model_access()
        run_initial_tests()
        display_next_steps()
        
        print("\n✅ SETUP SUCCESSFUL!")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        print("💡 Please check the error and try again")

if __name__ == "__main__":
    main()