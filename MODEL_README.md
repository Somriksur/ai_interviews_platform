# 🚀 HireFlow-Qwen-Fresh-Pro-Improve

**Advanced AI Interview Question Generation Model - Training & Improvement Suite**

[![Model](https://img.shields.io/badge/🤗%20Model-HireFlow--Qwen--Fresh--Pro-blue)](https://huggingface.co/somriksur/HireFlow-Qwen-Fresh-Pro)
[![Accuracy](https://img.shields.io/badge/Accuracy-80%25-green)](https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve)
[![Target](https://img.shields.io/badge/Target-90%25-orange)](https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve)

## 📊 **Model Performance**

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Overall Accuracy** | 80.0% | 90.0% | 🎯 In Progress |
| **Format Quality** | 96.9% | 98.0% | ✅ Excellent |
| **Content Quality** | 68.8% | 85.0% | 🔄 Improving |
| **Question Quality** | 84.4% | 95.0% | 🔄 Improving |
| **Tech Relevance** | 37.5% | 80.0% | 🚀 Major Focus |

## 🎯 **Model Overview**

HireFlow-Qwen-Fresh-Pro is a specialized AI model fine-tuned for generating high-quality technical interview questions. Built on Qwen2.5-0.5B-Instruct, it's optimized for:

- ✅ **Dynamic Tech Stack Generation** - 150+ technologies across 10+ categories
- ✅ **Role-Based Question Generation** - Frontend, Backend, Full Stack, DevOps, etc.
- ✅ **Experience Level Adaptation** - Junior, Mid, Senior level questions
- ✅ **Professional Format** - Numbered questions with proper structure
- ✅ **Production Ready** - 80% accuracy, integrated with HireFlow platform

## 🚀 **Quick Start**

### **Installation**

```bash
# Clone the improvement repository
git clone https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve.git
cd HireFlow-Qwen-Fresh-Pro-Improve

# Install requirements
pip install -r requirements.txt

# Or install as package
pip install -e .
```

### **Basic Usage**

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load the model
model_name = "somriksur/HireFlow-Qwen-Fresh-Pro"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Generate questions
prompt = "Generate 3 Python interview questions for senior level"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=400)
result = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(result)
```

## 📁 **Repository Structure**

```
HireFlow-Qwen-Fresh-Pro-Improve/
├── 📊 Training & Data
│   ├── train_fresh_model.py          # Fresh model training (3 hours)
│   ├── generate_training_data.py     # Generate 5,270 training examples
│   ├── enhance_to_90_percent.py      # Enhanced data for 90% accuracy
│   └── fine_tune_to_90_percent.py    # Targeted fine-tuning
├── 🧪 Testing & Validation
│   ├── test_model_accuracy.py        # Comprehensive accuracy testing
│   ├── test_90_percent_accuracy.py   # 90% target validation
│   └── accuracy_test_report.json     # Latest test results
├── 🔧 Utilities & Tools
│   ├── colab_upload_model.py         # Upload to HuggingFace
│   ├── colab_download_model.py       # Download model as ZIP
│   └── improve_existing_model.py     # Legacy improvement script
├── 📋 Configuration
│   ├── requirements.txt              # Python dependencies
│   ├── setup.py                      # Package setup
│   └── .env.example                  # Environment variables template
└── 📚 Documentation
    ├── MODEL_README.md               # This file
    ├── TRAINING_GUIDE.md             # Training instructions
    └── IMPROVEMENT_ROADMAP.md        # Future improvements
```

## 🎯 **Training Pipeline**

### **1. Fresh Model Training (Completed ✅)**

```bash
# Generate training data (5,270 examples)
python generate_training_data.py

# Train fresh model (3 hours)
python train_fresh_model.py

# Test accuracy
python test_model_accuracy.py
```

**Results**: 80% accuracy achieved in 3 hours

### **2. Enhanced Fine-Tuning (Next Step 🚀)**

```bash
# Generate enhanced training data
python enhance_to_90_percent.py

# Enhanced fine-tuning (2 hours)
python fine_tune_to_90_percent.py

# Validate 90% accuracy
python test_90_percent_accuracy.py
```

**Target**: 90% accuracy with focused improvements

## 📊 **Model Specifications**

| Specification | Details |
|---------------|---------|
| **Base Model** | Qwen/Qwen2.5-0.5B-Instruct |
| **Fine-tuning Method** | LoRA (Low-Rank Adaptation) |
| **Training Data** | 5,270 high-quality examples |
| **Training Time** | 3 hours (fresh) + 2 hours (enhancement) |
| **Model Size** | ~2GB (including tokenizer) |
| **Quantization** | 4-bit with BitsAndBytesConfig |
| **Target Platforms** | HuggingFace, Google Colab, Local |

## 🔧 **Technical Features**

### **Dynamic Tech Stack Integration**
- **150+ Technologies**: Python, JavaScript, React, Node.js, SQL, Docker, etc.
- **10+ Categories**: Frontend, Backend, Database, DevOps, Mobile, etc.
- **Role Mapping**: Automatic tech stack selection based on job roles

### **Advanced Question Generation**
- **Numbered Format**: Professional 1., 2., 3. structure
- **Question Marks**: Proper interrogative formatting
- **Tech Relevance**: Technology-specific terminology
- **Experience Levels**: Junior, Mid, Senior complexity adaptation

### **Quality Assurance**
- **Professional Scoring**: 4-category evaluation system
- **Accuracy Testing**: Comprehensive validation suite
- **Performance Monitoring**: Detailed accuracy reports

## 🚀 **Improvement Roadmap**

### **Phase 1: 90% Accuracy (Current Focus)**
- ✅ Enhanced training data generation
- ✅ Targeted fine-tuning scripts
- 🔄 Tech relevance improvements
- 🔄 Content quality enhancements

### **Phase 2: Advanced Features**
- 🎯 Multi-language support
- 🎯 Industry-specific questions
- 🎯 Difficulty level fine-tuning
- 🎯 Real-time feedback integration

### **Phase 3: Production Optimization**
- 🎯 Model compression
- 🎯 Inference optimization
- 🎯 API integration improvements
- 🎯 Monitoring & analytics

## 📈 **Performance Metrics**

### **Current Accuracy Breakdown**
```
🎯 Format Quality:  96.9% (310/320 points)
📚 Content Quality: 68.8% (165/240 points)  ← Focus Area
⭐ Question Quality: 84.4% (135/160 points)
🔧 Tech Relevance:  37.5% (30/80 points)   ← Major Focus
```

### **Target Improvements**
- **Tech Relevance**: 37.5% → 80%+ (+42 points)
- **Content Quality**: 68.8% → 85%+ (+16 points)
- **Question Quality**: 84.4% → 95%+ (+11 points)

## 🛠️ **Development Setup**

### **Environment Variables**
```bash
# Copy environment template
cp .env.example .env

# Add your HuggingFace token
HUGGINGFACE_API_KEY=your_token_here
QWEN_MODEL_ID=somriksur/HireFlow-Qwen-Fresh-Pro
```

### **Google Colab Setup**
```python
# Install requirements in Colab
!pip install transformers datasets peft accelerate bitsandbytes trl

# Clone repository
!git clone https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve.git
%cd HireFlow-Qwen-Fresh-Pro-Improve

# Run training
!python train_fresh_model.py
```

## 📊 **Usage Examples**

### **Generate Questions by Technology**
```python
prompts = [
    "Generate 3 Python interview questions for senior level",
    "Generate 4 React interview questions for mid level", 
    "Generate 2 SQL database questions for junior level"
]
```

### **Generate Questions by Role**
```python
role_prompts = [
    "Generate 5 frontend developer questions for senior level",
    "Generate 3 DevOps engineer questions for mid level",
    "Generate 4 full stack developer questions for junior level"
]
```

## 🤝 **Contributing**

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/improvement`
3. **Make changes and test**: `python test_model_accuracy.py`
4. **Commit changes**: `git commit -m "Add improvement"`
5. **Push to branch**: `git push origin feature/improvement`
6. **Create Pull Request**

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Qwen Team** for the excellent base model
- **HuggingFace** for the transformers library and model hosting
- **Google Colab** for free GPU training resources
- **HireFlow Platform** for integration and testing

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve/issues)
- **Discussions**: [GitHub Discussions](https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve/discussions)
- **Email**: somriksur@gmail.com

---

**🎯 Current Status**: 80% accuracy achieved, targeting 90% with enhanced fine-tuning

**🚀 Next Steps**: Run `python enhance_to_90_percent.py` to begin improvement process