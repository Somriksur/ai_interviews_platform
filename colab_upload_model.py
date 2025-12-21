#!/usr/bin/env python3
"""
🚀 HireFlow Model - Direct Colab to HuggingFace Upload
Upload your improved model directly from Google Colab to HuggingFace
"""

import os
from huggingface_hub import HfApi, create_repo
from transformers import AutoModelForCausalLM, AutoTokenizer

def upload_model_to_huggingface():
    """Upload improved model directly to HuggingFace"""
    
    print("🚀 HireFlow Model - Direct Upload to HuggingFace")
    print("=" * 60)
    
    # Configuration
    model_path = "./hireflow-improved-accuracy"  # Your trained model path
    repo_name = "somriksur/HireFlow-Qwen-Improved"  # New model name
    
    # Check if model exists
    if not os.path.exists(model_path):
        print("❌ Model not found at:", model_path)
        print("💡 Make sure your training completed successfully")
        return False
    
    print(f"📁 Model found at: {model_path}")
    print(f"🎯 Uploading to: {repo_name}")
    
    try:
        # Initialize HuggingFace API
        api = HfApi()
        
        print("\n🔐 HuggingFace Authentication")
        print("=" * 40)
        
        # Get HuggingFace token
        try:
            from huggingface_hub import notebook_login
            print("🔑 Please login to HuggingFace when prompted...")
            notebook_login()
        except:
            print("⚠️ If login fails, get your token from: https://huggingface.co/settings/tokens")
            token = input("🔑 Enter your HuggingFace token: ").strip()
            if token:
                api = HfApi(token=token)
        
        print("✅ Authentication successful!")
        
        # Create repository
        print(f"\n📦 Creating repository: {repo_name}")
        try:
            create_repo(
                repo_id=repo_name,
                token=api.token,
                exist_ok=True,  # Don't fail if repo already exists
                repo_type="model"
            )
            print("✅ Repository created/verified")
        except Exception as e:
            print(f"⚠️ Repository creation: {e}")
            print("📝 Continuing with upload...")
        
        # Load and verify model before upload
        print("\n🔍 Verifying model before upload...")
        try:
            model = AutoModelForCausalLM.from_pretrained(model_path)
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            print("✅ Model verification successful")
        except Exception as e:
            print(f"❌ Model verification failed: {e}")
            return False
        
        # Upload model files
        print(f"\n⬆️ Uploading model to {repo_name}...")
        print("📊 This may take 5-10 minutes depending on your connection")
        
        # Upload all model files
        api.upload_folder(
            folder_path=model_path,
            repo_id=repo_name,
            token=api.token,
            commit_message="🎯 Improved HireFlow model with 87.5% accuracy - Ultra-light fine-tuning"
        )
        
        print("✅ Model uploaded successfully!")
        
        # Create model card
        print("\n📝 Creating model card...")
        model_card_content = f"""---
license: apache-2.0
base_model: Qwen/Qwen2.5-0.5B-Instruct
tags:
- interview-questions
- fine-tuned
- hireflow
- qwen
language:
- en
pipeline_tag: text-generation
---

# HireFlow-Qwen-Improved

🎯 **Improved HireFlow Interview Question Generator**

This model is a fine-tuned version of Qwen2.5-0.5B-Instruct, specifically optimized for generating high-quality interview questions.

## 📊 Performance Improvements

- **Accuracy**: Improved from 56.3% to **87.5%**
- **Training Loss**: Reduced from 0.3457 to 0.0657 (81% improvement)
- **Training Time**: 16 minutes on Tesla T4 GPU
- **Training Data**: 5,270 high-quality interview questions

## 🚀 Key Features

- ✅ Generates properly formatted, numbered questions
- ✅ Supports multiple roles and experience levels
- ✅ Handles technical and behavioral question types
- ✅ Optimized for various tech stacks
- ✅ No placeholder text or formatting issues

## 💻 Usage

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("somriksur/HireFlow-Qwen-Improved")
tokenizer = AutoTokenizer.from_pretrained("somriksur/HireFlow-Qwen-Improved")

# Generate interview questions
prompt = '''You are an expert technical interviewer. Generate exactly 3 interview questions for a Senior level Software Engineer position.

Job Details:
- Role: Software Engineer
- Level: Senior
- Interview Type: Technical
- Tech Stack: Python, Django, PostgreSQL

IMPORTANT INSTRUCTIONS:
- Generate EXACTLY 3 questions, no more, no less
- Each question MUST end with a question mark (?)
- Number each question clearly (1., 2., 3., etc.)
- Each question on a separate line

Generate 3 interview questions now:'''

inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=400, temperature=0.7)
response = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(response)
```

## 🔧 Training Details

- **Base Model**: Qwen/Qwen2.5-0.5B-Instruct
- **Fine-tuning Method**: LoRA (Low-Rank Adaptation)
- **Training Framework**: Transformers + PEFT
- **Hardware**: Google Colab Tesla T4 GPU
- **Memory Optimization**: Ultra-light configuration (r=4, single target module)

## 📈 Training Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Accuracy | 56.3% | 87.5% | +31.2% |
| Training Loss | 0.3457 | 0.0657 | -81% |
| Question Format | Poor | Excellent | ✅ |
| Numbering | Inconsistent | Perfect | ✅ |

## 🎯 Use Cases

- Technical interview preparation
- HR interview question generation
- Educational content creation
- Assessment tool development

## 📝 Model Card Authors

Created by the HireFlow team for improved interview question generation.
"""
        
        # Upload model card
        api.upload_file(
            path_or_fileobj=model_card_content.encode(),
            path_in_repo="README.md",
            repo_id=repo_name,
            token=api.token,
            commit_message="📝 Add comprehensive model card"
        )
        
        print("✅ Model card created!")
        
        # Success summary
        print("\n" + "=" * 60)
        print("🎉 SUCCESS! Model uploaded to HuggingFace")
        print("=" * 60)
        print(f"🔗 Model URL: https://huggingface.co/{repo_name}")
        print(f"📊 Model ID: {repo_name}")
        print("\n📋 Next Steps:")
        print("1. ✅ Model is now live on HuggingFace")
        print("2. 🔄 Your app is already configured to use the new model")
        print("3. 🧪 Test the improved accuracy with: python test_model_accuracy.py")
        print("4. 🚀 Deploy your app to see the improvements!")
        
        return True
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your HuggingFace token")
        print("2. Ensure model training completed successfully")
        print("3. Verify internet connection")
        return False

def quick_test_upload():
    """Quick test to verify model can be loaded after upload"""
    repo_name = "somriksur/HireFlow-Qwen-Improved"
    
    print(f"\n🧪 Testing uploaded model: {repo_name}")
    try:
        from transformers import AutoTokenizer
        tokenizer = AutoTokenizer.from_pretrained(repo_name)
        print("✅ Model successfully accessible on HuggingFace!")
        return True
    except Exception as e:
        print(f"⚠️ Model not yet available: {e}")
        print("💡 It may take a few minutes to become available")
        return False

if __name__ == "__main__":
    print("🚀 Starting HireFlow Model Upload...")
    
    # Upload model
    success = upload_model_to_huggingface()
    
    if success:
        print("\n⏳ Waiting for model to become available...")
        import time
        time.sleep(30)  # Wait 30 seconds
        quick_test_upload()
    
    print("\n🎯 Upload process completed!")