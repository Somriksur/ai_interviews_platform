import gradio as gr
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import gc
import os
import re

# Optimized settings for GPU upgrade
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "max_split_size_mb:512"
torch.backends.cudnn.benchmark = True

# Global variables
model = None
tokenizer = None

def load_model_optimized():
    """Load model optimized for GPU upgrade"""
    global model, tokenizer
    
    if model is not None:
        return model, tokenizer
    
    model_name = "somriksur/HireFlow-Qwen-Fresh-Pro"
    
    try:
        print("🔄 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True,
            use_fast=True
        )
        
        print("🔄 Loading model with GPU optimization...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            low_cpu_mem_usage=True,
            trust_remote_code=True,
            use_safetensors=True
        )
        
        model.eval()
        print("✅ Model loaded successfully with GPU optimization!")
        return model, tokenizer
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None, None

def clean_and_extract_questions(text, expected_count=3):
    """Extract and clean interview questions from model output"""
    
    # Remove common unwanted patterns
    text = re.sub(r'http[s]?://[^\s]+', '', text)  # Remove URLs
    text = re.sub(r'www\.[^\s]+', '', text)  # Remove www links
    text = re.sub(r'[\u4e00-\u9fff]+', '', text)  # Remove Chinese characters
    text = re.sub(r'linkedin\.com[^\s]*', '', text)  # Remove LinkedIn
    text = re.sub(r'twitter\.com[^\s]*', '', text)  # Remove Twitter
    
    # Split into lines and clean
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    questions = []
    question_patterns = [
        r'^\d+[\.\)]\s*(.+\?)\s*$',  # "1. Question?"
        r'^[Qq]uestion\s*\d*:?\s*(.+\?)\s*$',  # "Question: ..."
        r'^(.+\?)\s*$'  # Any line ending with ?
    ]
    
    for line in lines:
        # Skip unwanted lines
        if (len(line) < 15 or 
            'http' in line.lower() or 
            'www.' in line.lower() or
            'linkedin' in line.lower() or
            'twitter' in line.lower() or
            'best practice' in line.lower() and len(line) < 30):
            continue
            
        # Try to extract question
        for pattern in question_patterns:
            match = re.match(pattern, line, re.IGNORECASE)
            if match:
                question = match.group(1) if len(match.groups()) > 0 else match.group(0)
                question = question.strip()
                
                # Validate question quality
                if (len(question) > 20 and 
                    question.endswith('?') and
                    not any(bad in question.lower() for bad in ['http', 'www', 'linkedin', 'twitter'])):
                    questions.append(question)
                    break
    
    # If we don't have enough good questions, create fallbacks
    if len(questions) < expected_count:
        fallback_questions = [
            "What are the key principles you follow when designing scalable applications?",
            "How do you approach debugging complex issues in production environments?", 
            "Describe your experience with modern development practices and tools?"
        ]
        
        while len(questions) < expected_count and fallback_questions:
            questions.append(fallback_questions.pop(0))
    
    # Format questions properly
    formatted_questions = []
    for i, q in enumerate(questions[:expected_count], 1):
        if not q.startswith(f"{i}."):
            formatted_questions.append(f"{i}. {q}")
        else:
            formatted_questions.append(q)
    
    return formatted_questions

def generate_interface(prompt, max_tokens=300, temperature=0.6):
    """Generate clean interview questions"""
    current_model, current_tokenizer = load_model_optimized()
    
    if current_model is None or current_tokenizer is None:
        return "❌ Model failed to load. Please try again."
    
    try:
        # Clear cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Create a very structured prompt
        system_prompt = """You are a professional technical interviewer. Generate exactly 3 high-quality interview questions.

Rules:
- Each question must be numbered (1., 2., 3.)
- Each question must end with a question mark
- Focus only on the requested technology/role
- Keep questions professional and concise
- No explanations, just questions
- No URLs or links

Request: """
        
        full_prompt = system_prompt + prompt + "\n\nQuestions:\n"
        
        # Tokenize
        inputs = current_tokenizer(
            full_prompt,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=False
        )
        
        # Move to GPU if available
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # Generate with strict parameters
        with torch.no_grad():
            outputs = current_model.generate(
                **inputs,
                max_new_tokens=min(max_tokens, 250),
                temperature=max(0.4, min(temperature, 0.7)),
                do_sample=True,
                pad_token_id=current_tokenizer.eos_token_id,
                eos_token_id=current_tokenizer.eos_token_id,
                use_cache=True,
                repetition_penalty=1.5,
                top_p=0.8,
                top_k=25,
                no_repeat_ngram_size=4,
                early_stopping=True
            )
        
        # Decode
        generated_text = current_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove the prompt
        if full_prompt in generated_text:
            generated_text = generated_text.replace(full_prompt, "").strip()
        
        # Clean and extract questions
        questions = clean_and_extract_questions(generated_text, 3)
        
        # Format final output
        if questions:
            result = "\n".join(questions)
        else:
            result = "Unable to generate clean questions. Please try a more specific prompt."
        
        # Cleanup
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        
        return result
        
    except Exception as e:
        print(f"Generation error: {e}")
        return f"❌ Generation failed: {str(e)}"

# Create interface
interface = gr.Interface(
    fn=generate_interface,
    inputs=[
        gr.Textbox(
            label="Interview Question Request", 
            placeholder="Example: Generate 3 React interview questions for senior developers",
            lines=3,
            max_lines=5
        ),
        gr.Slider(
            minimum=100, 
            maximum=400, 
            value=250, 
            label="Max Tokens"
        ),
        gr.Slider(
            minimum=0.3, 
            maximum=0.8, 
            value=0.6, 
            label="Temperature"
        )
    ],
    outputs=gr.Textbox(
        label="Generated Interview Questions",
        lines=8
    ),
    title="🎯 HireFlow Interview Question Generator (GPU Optimized)",
    description="Generate professional, clean interview questions using your custom-trained model. Optimized for quality output.",
    examples=[
        ["Generate 3 React interview questions for senior developers", 250, 0.6],
        ["Create 3 Python backend questions for mid-level engineers", 250, 0.6],
        ["Generate 3 JavaScript questions about async programming", 250, 0.6],
        ["Create 3 Node.js questions for experienced developers", 250, 0.6],
        ["Generate 3 system design questions for senior engineers", 250, 0.6]
    ],
    cache_examples=False,
    theme=gr.themes.Soft()
)

if __name__ == "__main__":
    interface.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False
    )