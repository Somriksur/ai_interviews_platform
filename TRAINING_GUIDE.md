# 🎯 HireFlow Model Training Guide

**Complete guide for training and improving the HireFlow interview question generation model**

## 📋 **Prerequisites**

### **System Requirements**
- **Python**: 3.8+ (recommended: 3.10)
- **GPU**: NVIDIA GPU with 8GB+ VRAM (or Google Colab T4)
- **RAM**: 16GB+ system RAM
- **Storage**: 10GB+ free space

### **Environment Setup**
```bash
# Clone repository
git clone https://github.com/somriksur/HireFlow-Qwen-Fresh-Pro-Improve.git
cd HireFlow-Qwen-Fresh-Pro-Improve

# Create virtual environment
python -m venv hireflow_env
source hireflow_env/bin/activate  # Linux/Mac
# or
hireflow_env\Scripts\activate     # Windows

# Install requirements
pip install -r requirements.txt
```

### **HuggingFace Setup**
```bash
# Install HuggingFace CLI
pip install huggingface_hub

# Login with your token
huggingface-cli login
# Enter token: hf_your_token_here
```

## 🚀 **Training Pipeline**

### **Phase 1: Fresh Model Training (Completed)**

#### **Step 1: Generate Training Data**
```bash
python generate_training_data.py
```

**Output**: `training_data.jsonl` with 5,270 examples

**What it does**:
- Generates diverse interview questions
- Covers 8+ technology categories
- Creates junior/mid/senior level variations
- Ensures proper formatting and structure

#### **Step 2: Train Fresh Model**
```bash
python train_fresh_model.py
```

**Configuration**:
- **Training Time**: 3 hours
- **Epochs**: 6
- **Batch Size**: 2 (effective: 32 with gradient accumulation)
- **Learning Rate**: 2e-4
- **LoRA Rank**: 16

**Expected Results**:
- Final loss: ~0.08
- Training accuracy: ~92%
- Validation accuracy: ~80%

#### **Step 3: Test Accuracy**
```bash
python test_model_accuracy.py
```

**Results**: Comprehensive accuracy report with category breakdown

### **Phase 2: Enhanced Fine-Tuning (90% Target)**

#### **Step 1: Generate Enhanced Data**
```bash
python enhance_to_90_percent.py
```

**Improvements**:
- Enhanced tech ecosystem integration
- Deeper technical questions
- Technology-specific terminology
- Advanced concepts for senior levels

#### **Step 2: Enhanced Fine-Tuning**
```bash
python fine_tune_to_90_percent.py
```

**Enhanced Configuration**:
- **Training Time**: 2 hours
- **Epochs**: 4
- **LoRA Rank**: 32 (increased capacity)
- **Learning Rate**: 1e-4
- **Focus**: Tech relevance + content quality

#### **Step 3: Validate 90% Accuracy**
```bash
python test_90_percent_accuracy.py
```

**Enhanced Scoring**:
- Format Quality: 35pts
- Content Depth: 35pts  
- Tech Relevance: 20pts (doubled weight)
- Question Quality: 10pts

## 🔧 **Configuration Options**

### **Training Parameters**

#### **Basic Training (train_fresh_model.py)**
```python
training_args = TrainingArguments(
    output_dir="./hireflow_model",
    num_train_epochs=6,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=16,
    learning_rate=2e-4,
    fp16=True,
    warmup_steps=0,  # No warm-up for 3-hour target
    logging_steps=10,
    save_strategy="epoch"
)
```

#### **Enhanced Training (fine_tune_to_90_percent.py)**
```python
training_args = TrainingArguments(
    output_dir="./enhanced_hireflow_model",
    num_train_epochs=4,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=1e-4,
    fp16=True,
    warmup_steps=100,  # Stability for fine-tuning
    logging_steps=10,
    save_strategy="epoch"
)
```

### **LoRA Configuration**

#### **Basic LoRA**
```python
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.1,
    bias="none",
    task_type="CAUSAL_LM"
)
```

#### **Enhanced LoRA**
```python
lora_config = LoraConfig(
    r=32,  # Increased rank
    lora_alpha=64,  # Higher alpha
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"  # More modules
    ],
    lora_dropout=0.05,  # Lower dropout
    bias="none",
    task_type="CAUSAL_LM"
)
```

## 📊 **Monitoring & Evaluation**

### **Training Metrics**
- **Loss**: Target < 0.1 for good convergence
- **Learning Rate**: Monitor for stability
- **GPU Memory**: Should stay under 80%
- **Training Speed**: ~10-15 steps/minute on T4

### **Accuracy Metrics**

#### **Category Scoring**
```python
# Current scoring weights
format_quality = 40    # Numbering, question marks
content_quality = 30   # Technical depth, clarity
question_quality = 20  # Professional language
tech_relevance = 10    # Technology terms

# Enhanced scoring weights (90% target)
format_quality = 35    # Still important
content_depth = 35     # Increased focus
tech_relevance = 20    # Doubled weight
question_quality = 10  # Maintained
```

### **Performance Targets**

| Phase | Target Accuracy | Key Improvements |
|-------|----------------|------------------|
| **Phase 1** | 80% | Basic functionality, format quality |
| **Phase 2** | 90% | Tech relevance, content depth |
| **Phase 3** | 95% | Advanced features, optimization |

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **CUDA Out of Memory**
```python
# Reduce batch size
per_device_train_batch_size=1
gradient_accumulation_steps=32

# Use gradient checkpointing
gradient_checkpointing=True

# Use 8-bit training
load_in_8bit=True
```

#### **Training Too Slow**
```python
# Increase batch size if memory allows
per_device_train_batch_size=4
gradient_accumulation_steps=8

# Use mixed precision
fp16=True
# or for newer GPUs
bf16=True
```

#### **Poor Convergence**
```python
# Add warmup steps
warmup_steps=100

# Reduce learning rate
learning_rate=1e-4

# Increase LoRA rank
r=32
```

### **Model Upload Issues**

#### **HuggingFace Upload**
```python
# If upload fails, try manual upload
from huggingface_hub import HfApi

api = HfApi()
api.upload_folder(
    folder_path="./model_directory",
    repo_id="somriksur/HireFlow-Qwen-Fresh-Pro-Improve",
    repo_type="model"
)
```

## 📈 **Performance Optimization**

### **Training Speed**
- **Use gradient checkpointing** for memory efficiency
- **Optimize batch size** for your GPU
- **Use mixed precision** (fp16/bf16)
- **Enable compilation** with `torch.compile()`

### **Memory Optimization**
- **4-bit quantization** with BitsAndBytesConfig
- **Gradient accumulation** instead of large batches
- **LoRA** instead of full fine-tuning
- **Offload to CPU** when needed

### **Quality Improvements**
- **Enhanced training data** with tech ecosystems
- **Targeted fine-tuning** on weak areas
- **Iterative improvement** based on test results
- **Category-specific optimization**

## 🎯 **Best Practices**

### **Data Quality**
1. **Diverse Examples**: Cover all tech categories
2. **Proper Formatting**: Consistent numbering and structure
3. **Tech Integration**: Include related frameworks/tools
4. **Level Appropriate**: Match complexity to experience level

### **Training Strategy**
1. **Start Fresh**: Train base model from scratch
2. **Iterative Improvement**: Use test results to guide enhancements
3. **Targeted Fine-tuning**: Focus on specific weak areas
4. **Regular Testing**: Validate improvements frequently

### **Model Management**
1. **Version Control**: Tag model versions clearly
2. **Backup Models**: Save checkpoints regularly
3. **Documentation**: Record training parameters and results
4. **Testing**: Comprehensive accuracy validation

## 📊 **Results Tracking**

### **Training Logs**
```bash
# Monitor training progress
tail -f training.log

# Check GPU usage
nvidia-smi

# Monitor system resources
htop
```

### **Accuracy Reports**
- **accuracy_test_report.json**: Detailed test results
- **enhanced_90_percent_report.json**: 90% target validation
- **Training logs**: Loss and performance metrics

### **Model Artifacts**
- **Model weights**: `model.safetensors`
- **Tokenizer**: `tokenizer.json`, `vocab.json`
- **Configuration**: `config.json`, `generation_config.json`
- **Training state**: Optimizer and scheduler states

---

**🎯 Next Steps**: Follow Phase 2 for 90% accuracy enhancement