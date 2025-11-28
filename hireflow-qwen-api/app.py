import gradio as gr
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import os

print("Loading somriksur/HireFlow-Qwen...")
hf_token = os.environ.get("HF_TOKEN")
tokenizer = AutoTokenizer.from_pretrained("somriksur/HireFlow-Qwen", token=hf_token)
model = AutoModelForCausalLM.from_pretrained("somriksur/HireFlow-Qwen", token=hf_token, torch_dtype=torch.float16, device_map="auto")
print("Model loaded!")

def api_generate(prompt, max_tokens=300):
    """Generate text from prompt"""
    if isinstance(prompt, dict):
        prompt = prompt.get("inputs", "")
        max_tokens = prompt.get("parameters", {}).get("max_new_tokens", 300)
    
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs, 
            max_new_tokens=int(max_tokens), 
            temperature=0.7, 
            do_sample=True, 
            top_p=0.9
        )
    
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return result

# Create Gradio interface with API access
demo = gr.Interface(
    fn=api_generate,
    inputs=[
        gr.Textbox(label="Prompt", lines=5),
        gr.Slider(minimum=50, maximum=1000, value=300, label="Max Tokens")
    ],
    outputs=gr.Textbox(label="Generated Text", lines=10),
    title="HireFlow-Qwen API",
    description="Custom fine-tuned Qwen2.5-1.5B for interview question generation",
    api_name="generate"
)

demo.launch()
