#!/usr/bin/env python3
"""
HireFlow FAST Model Training Script (Compatible with TRL 0.25+)
Fine-tunes Qwen2.5-0.5B for interview question generation
Training time: ~30-40 minutes on Tesla T4 GPU
"""

import os
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

print("🚀 Starting HireFlow FAST Model Training")
print("=" * 60)

# Configuration
MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"
OUTPUT_DIR = "./hireflow-qwen-fast-model"
DATASET_FILE = "training_data.jsonl"

print(f"📦 Base Model: {MODEL_NAME}")
print(f"⚡ Size: 0.5B parameters (3x smaller = 3x faster!)")
print(f"⏱️  Expected Training Time: 30-40 minutes")
print(f"📁 Output Directory: {OUTPUT_DIR}")
print(f"📊 Dataset: {DATASET_FILE} (5,270 questions)")
print("=" * 60)

# Check GPU
if torch.cuda.is_available():
    print(f"✅ GPU Available: {torch.cuda.get_device_name(0)}")
    print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
else:
    print("⚠️  No GPU detected!")
    exit(1)

print("=" * 60)

# 1. Load Dataset
print("\n📊 Loading dataset...")
dataset = load_dataset('json', data_files=DATASET_FILE, split='train')
print(f"✅ Loaded {len(dataset)} training examples")

# 2. Configure 4-bit Quantization
print("\n⚙️  Configuring 4-bit quantization...")
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)
print("✅ Quantization configured")

# 3. Load Model
print(f"\n🤖 Loading base model: {MODEL_NAME}")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
print("✅ Model loaded successfully")

# 4. Load Tokenizer
print("\n📝 Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"
print("✅ Tokenizer loaded")

# 5. Prepare Model
print("\n🔧 Preparing model for k-bit training...")
model = prepare_model_for_kbit_training(model)
print("✅ Model prepared")

# 6. Configure LoRA
print("\n⚙️  Configuring LoRA...")
lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]
)

model = get_peft_model(model, lora_config)
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
total_params = sum(p.numel() for p in model.parameters())
print(f"✅ LoRA configured")
print(f"📊 Trainable parameters: {trainable_params:,} ({100 * trainable_params / total_params:.2f}%)")
print("=" * 60)

# 7. Tokenize Dataset
print("\n📝 Tokenizing dataset...")
def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=512,
        padding="max_length",
    )

tokenized_dataset = dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=dataset.column_names,
)
print("✅ Dataset tokenized")

# 8. Data Collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False,
)

# 9. Training Arguments
print("\n⚙️  Configuring training arguments...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=2,
    per_device_train_batch_size=8,
    gradient_accumulation_steps=2,
    learning_rate=3e-4,
    warmup_steps=50,
    logging_steps=20,
    save_steps=1000,
    save_total_limit=1,
    fp16=True,
    optim="paged_adamw_8bit",
    max_grad_norm=0.3,
    group_by_length=True,
    report_to="none",
)
print("✅ Training arguments configured")

# 10. Initialize Trainer
print("\n🎯 Initializing trainer...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    data_collator=data_collator,
)
print("✅ Trainer initialized")
print("=" * 60)

# 11. Start Training
print("\n🚀 Starting FAST training...")
print("⏱️  Estimated time: 30-40 minutes")
print("=" * 60)
print()

import time
start_time = time.time()

try:
    trainer.train()
    training_time = (time.time() - start_time) / 60
    print("\n" + "=" * 60)
    print("✅ Training completed successfully!")
    print(f"⏱️  Total training time: {training_time:.1f} minutes")
except Exception as e:
    print(f"\n❌ Training failed: {e}")
    raise

# 12. Save Model
print("\n💾 Saving final model...")
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"✅ Model saved to {OUTPUT_DIR}")

# 13. Summary
print("\n" + "=" * 60)
print("🎉 FAST TRAINING COMPLETE!")
print("=" * 60)
print(f"📁 Model location: {OUTPUT_DIR}")
print(f"📊 Training examples: {len(dataset)}")
print(f"⏱️  Training time: {training_time:.1f} minutes")
print(f"💾 Trainable params: {trainable_params:,}")
print("\n📋 Next steps:")
print("1. Download the model folder")
print("2. Upload to Hugging Face:")
print("   huggingface-cli upload somriksur/HireFlow-Qwen-Fast ./hireflow-qwen-fast-model")
print("=" * 60)

print(f"\n🎉 Training completed in {training_time:.1f} minutes! 🚀")
