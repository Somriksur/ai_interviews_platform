#!/usr/bin/env python3
"""
Alternative proxy with longer timeouts for sleeping Spaces
"""
from flask import Flask, request, jsonify
import requests
import json
import time

app = Flask(__name__)

SPACE_URL = "https://somriksur-hireflow-qwen-api.hf.space"

def wake_up_space():
    """Wake up the HuggingFace Space"""
    print("🔗 Waking up HuggingFace Space...")
    print("⏳ This may take 30-60 seconds...")
    
    try:
        # Try to access the Space to wake it up
        response = requests.get(SPACE_URL, timeout=120)
        if response.status_code == 200:
            print("✅ Space is awake!")
            return True
    except Exception as e:
        print(f"⚠️ Wake up attempt: {str(e)[:100]}")
    
    return False

@app.route('/generate', methods=['POST'])
def generate():
    try:
        from gradio_client import Client
        
        data = request.json
        prompt = data.get('inputs', '')
        params = data.get('parameters', {})
        max_tokens = params.get('max_new_tokens', 300)
        
        print(f"📤 Received request: {prompt[:100]}...")
        print(f"⏳ Generating (this may take 20-40 seconds)...")
        
        # Create client with longer timeout
        client = Client(SPACE_URL, verbose=False)
        
        # Call the API
        result = client.predict(prompt, max_tokens, api_name="/generate")
        
        print(f"✅ Generated response")
        return jsonify([{"generated_text": result}])
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "somriksur/HireFlow-Qwen-Fast"})

if __name__ == '__main__':
    print("🚀 Starting proxy server on http://localhost:8000")
    print("💡 First request may take 30-60 seconds if Space is sleeping")
    print("")
    
    # Try to wake up the Space
    wake_up_space()
    print("")
    
    app.run(host='0.0.0.0', port=8000, debug=False)
