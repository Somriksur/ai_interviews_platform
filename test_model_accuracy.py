#!/usr/bin/env python3
"""
🧪 Professional Model Accuracy Testing - HireFlow Fresh Model
Comprehensive accuracy validation with detailed scoring breakdown
Target: 85%+ accuracy verification
"""

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import re
import json
from datetime import datetime

def test_model_accuracy():
    """Test the trained model with comprehensive accuracy metrics"""
    
    print("🧪 HireFlow Fresh Model - Professional Accuracy Testing")
    print("=" * 60)
    print("🎯 Target: 85%+ Accuracy Verification")
    print("📊 Comprehensive Scoring: Format + Content + Quality + Tech Relevance")
    print("=" * 60)
    
    # Model to test
    model_name = "somriksur/HireFlow-Qwen-Fresh-Pro"
    
    print(f"🔄 Loading model: {model_name}")
    
    try:
        # Load model and tokenizer with device handling
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Determine device and load model accordingly
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🖥️  Using device: {device}")
        
        if device == "cuda":
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="auto"
            )
        else:
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float32
            )
            model = model.to(device)
        
        print("✅ Model loaded successfully")
        
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        print("💡 Make sure the model is uploaded and accessible")
        return False
    
    # Comprehensive test cases for professional validation
    test_cases = [
        {
            "name": "Python Junior Developer",
            "prompt": "Generate 3 Python interview questions for junior level",
            "expected_count": 3,
            "tech": "Python",
            "level": "junior",
            "category": "Backend"
        },
        {
            "name": "React Senior Developer", 
            "prompt": "Generate 2 React interview questions for senior level",
            "expected_count": 2,
            "tech": "React",
            "level": "senior",
            "category": "Frontend"
        },
        {
            "name": "JavaScript Mid-Level",
            "prompt": "Generate 4 JavaScript interview questions for mid level",
            "expected_count": 4,
            "tech": "JavaScript", 
            "level": "mid",
            "category": "Frontend"
        },
        {
            "name": "Node.js Senior Backend",
            "prompt": "Generate 5 Node.js interview questions for senior level",
            "expected_count": 5,
            "tech": "Node.js",
            "level": "senior",
            "category": "Backend"
        },
        {
            "name": "Database Systems",
            "prompt": "Generate 3 SQL database interview questions for mid level",
            "expected_count": 3,
            "tech": "SQL",
            "level": "mid", 
            "category": "Database"
        },
        {
            "name": "System Design",
            "prompt": "Generate 2 system design interview questions for senior level",
            "expected_count": 2,
            "tech": "System Design",
            "level": "senior",
            "category": "Architecture"
        },
        {
            "name": "Data Structures",
            "prompt": "Generate 4 data structures interview questions for junior level",
            "expected_count": 4,
            "tech": "Data Structures",
            "level": "junior",
            "category": "Algorithms"
        },
        {
            "name": "DevOps Engineering",
            "prompt": "Generate 3 Docker interview questions for mid level",
            "expected_count": 3,
            "tech": "Docker",
            "level": "mid",
            "category": "DevOps"
        }
    ]
    
    total_score = 0
    max_score = len(test_cases) * 100
    detailed_results = []
    
    print(f"\n🎯 Running {len(test_cases)} Comprehensive Accuracy Tests:")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📋 Test {i}: {test_case['name']}")
        print(f"🔍 Prompt: {test_case['prompt']}")
        print("-" * 50)
        
        # Generate response with proper device handling
        formatted_prompt = f"""<|im_start|>system
You are an expert technical interviewer. Generate high-quality, numbered interview questions that end with question marks.<|im_end|>
<|im_start|>user
{test_case['prompt']}<|im_end|>
<|im_start|>assistant
"""
        
        inputs = tokenizer(formatted_prompt, return_tensors="pt")
        
        # Move inputs to correct device
        if device == "cuda":
            inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=400,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id
            )
        
        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        generated_part = result.split("<|im_start|>assistant\n")[-1]
        
        print(f"📝 Generated Response:")
        print(f"{generated_part[:300]}{'...' if len(generated_part) > 300 else ''}")
        print()
        
        # Professional scoring with detailed breakdown
        score_breakdown = score_response_professional(generated_part, test_case)
        total_score += score_breakdown['total_score']
        
        # Display detailed scoring
        print(f"📊 Detailed Scoring Breakdown:")
        print(f"   🎯 Format Quality (40pts):     {score_breakdown['format_score']}/40")
        print(f"   📚 Content Quality (30pts):    {score_breakdown['content_score']}/30") 
        print(f"   ⭐ Question Quality (20pts):   {score_breakdown['quality_score']}/20")
        print(f"   🔧 Tech Relevance (10pts):     {score_breakdown['tech_score']}/10")
        print(f"   📈 TOTAL SCORE: {score_breakdown['total_score']}/100")
        
        detailed_results.append({
            'test_name': test_case['name'],
            'score_breakdown': score_breakdown,
            'generated_text': generated_part[:200] + '...' if len(generated_part) > 200 else generated_part
        })
    
    # Calculate final accuracy with detailed analysis
    accuracy = (total_score / max_score) * 100
    
    print(f"\n🎯 COMPREHENSIVE ACCURACY RESULTS:")
    print("=" * 60)
    print(f"📊 Total Score: {total_score}/{max_score}")
    print(f"🎯 Overall Accuracy: {accuracy:.1f}%")
    print()
    
    # Detailed category analysis
    format_scores = [r['score_breakdown']['format_score'] for r in detailed_results]
    content_scores = [r['score_breakdown']['content_score'] for r in detailed_results]
    quality_scores = [r['score_breakdown']['quality_score'] for r in detailed_results]
    tech_scores = [r['score_breakdown']['tech_score'] for r in detailed_results]
    
    print("📈 Category Performance Analysis:")
    print(f"   🎯 Format Quality:  {sum(format_scores)}/{len(format_scores)*40} ({(sum(format_scores)/(len(format_scores)*40)*100):.1f}%)")
    print(f"   📚 Content Quality: {sum(content_scores)}/{len(content_scores)*30} ({(sum(content_scores)/(len(content_scores)*30)*100):.1f}%)")
    print(f"   ⭐ Question Quality: {sum(quality_scores)}/{len(quality_scores)*20} ({(sum(quality_scores)/(len(quality_scores)*20)*100):.1f}%)")
    print(f"   🔧 Tech Relevance:  {sum(tech_scores)}/{len(tech_scores)*10} ({(sum(tech_scores)/(len(tech_scores)*10)*100):.1f}%)")
    print()
    
    # Professional assessment
    if accuracy >= 90:
        print("🏆 EXCELLENT! Model achieved 90%+ accuracy - Production Ready!")
        status = "EXCELLENT"
    elif accuracy >= 85:
        print("🎉 SUCCESS! Model achieved 85%+ accuracy target - Ready for deployment!")
        status = "SUCCESS"
    elif accuracy >= 80:
        print("✅ GOOD! Model achieved 80%+ accuracy - Meets requirements!")
        status = "GOOD"
    elif accuracy >= 70:
        print("⚠️ FAIR! Model achieved 70%+ accuracy - Consider improvements")
        status = "FAIR"
    else:
        print("❌ NEEDS IMPROVEMENT! Model below 70% accuracy")
        status = "NEEDS_IMPROVEMENT"
    
    # Generate detailed report
    report = {
        'timestamp': datetime.now().isoformat(),
        'model_name': model_name,
        'overall_accuracy': accuracy,
        'total_score': total_score,
        'max_score': max_score,
        'status': status,
        'category_performance': {
            'format_quality': (sum(format_scores)/(len(format_scores)*40)*100),
            'content_quality': (sum(content_scores)/(len(content_scores)*30)*100),
            'question_quality': (sum(quality_scores)/(len(quality_scores)*20)*100),
            'tech_relevance': (sum(tech_scores)/(len(tech_scores)*10)*100)
        },
        'detailed_results': detailed_results
    }
    
    # Save report
    with open('accuracy_test_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"📄 Detailed report saved to: accuracy_test_report.json")
    
    return accuracy >= 85

def score_response_professional(response, test_case):
    """Professional scoring system with detailed breakdown"""
    
    # Initialize scoring breakdown
    scoring = {
        'format_score': 0,      # 40 points - Proper formatting, numbering, structure
        'content_score': 0,     # 30 points - Question quality, clarity, relevance
        'quality_score': 0,     # 20 points - Professional quality, no placeholders
        'tech_score': 0,        # 10 points - Technology relevance
        'total_score': 0
    }
    
    response_lower = response.lower()
    lines = response.split('\n')
    
    # 1. FORMAT QUALITY SCORING (40 points)
    # Check for numbered questions
    numbered_questions = 0
    question_marks = 0
    
    for line in lines:
        line_stripped = line.strip()
        if line_stripped:
            # Count numbered questions (1., 2., 3., etc.)
            if any(line_stripped.startswith(f"{i}.") for i in range(1, 11)):
                numbered_questions += 1
            # Count question marks
            question_marks += line.count('?')
    
    # Scoring for proper numbering (20 points)
    if numbered_questions >= test_case['expected_count']:
        scoring['format_score'] += 20
    elif numbered_questions > 0:
        scoring['format_score'] += int((numbered_questions / test_case['expected_count']) * 20)
    
    # Scoring for question marks (20 points)
    if question_marks >= test_case['expected_count']:
        scoring['format_score'] += 20
    elif question_marks > 0:
        scoring['format_score'] += int((question_marks / test_case['expected_count']) * 20)
    
    # 2. CONTENT QUALITY SCORING (30 points)
    # Check for appropriate length per question
    avg_question_length = len(response) / max(numbered_questions, 1)
    if 50 <= avg_question_length <= 200:
        scoring['content_score'] += 15
    elif 30 <= avg_question_length <= 300:
        scoring['content_score'] += 10
    elif avg_question_length > 20:
        scoring['content_score'] += 5
    
    # Check for technical depth indicators
    technical_indicators = [
        'implement', 'algorithm', 'complexity', 'optimize', 'design',
        'architecture', 'pattern', 'best practice', 'performance',
        'security', 'scalability', 'debugging', 'testing'
    ]
    
    technical_depth = sum(1 for indicator in technical_indicators if indicator in response_lower)
    if technical_depth >= 3:
        scoring['content_score'] += 15
    elif technical_depth >= 1:
        scoring['content_score'] += int(technical_depth * 5)
    
    # 3. QUALITY SCORING (20 points)
    # Check for no placeholders or generic content
    placeholders = [
        '[question text here]', '[insert question]', '[question]', 
        'placeholder', '[your answer]', '[fill in]', 'lorem ipsum',
        'example question', 'sample question'
    ]
    
    has_placeholders = any(placeholder in response_lower for placeholder in placeholders)
    if not has_placeholders:
        scoring['quality_score'] += 10
    
    # Check for professional language and structure
    professional_indicators = [
        'explain', 'describe', 'what', 'how', 'why', 'when',
        'difference', 'advantage', 'disadvantage', 'compare'
    ]
    
    professional_count = sum(1 for indicator in professional_indicators if indicator in response_lower)
    if professional_count >= 2:
        scoring['quality_score'] += 10
    elif professional_count >= 1:
        scoring['quality_score'] += 5
    
    # 4. TECHNOLOGY RELEVANCE SCORING (10 points)
    tech_terms = [test_case['tech'].lower()]
    
    # Add related terms based on technology
    if 'python' in test_case['tech'].lower():
        tech_terms.extend(['django', 'flask', 'pandas', 'numpy', 'pip'])
    elif 'react' in test_case['tech'].lower():
        tech_terms.extend(['jsx', 'component', 'hook', 'state', 'props'])
    elif 'javascript' in test_case['tech'].lower():
        tech_terms.extend(['js', 'es6', 'promise', 'async', 'closure'])
    elif 'node' in test_case['tech'].lower():
        tech_terms.extend(['npm', 'express', 'middleware', 'server'])
    elif 'sql' in test_case['tech'].lower():
        tech_terms.extend(['database', 'query', 'join', 'index', 'table'])
    elif 'docker' in test_case['tech'].lower():
        tech_terms.extend(['container', 'image', 'dockerfile', 'compose'])
    
    tech_relevance = sum(1 for term in tech_terms if term in response_lower)
    if tech_relevance >= 1:
        scoring['tech_score'] = min(10, tech_relevance * 3)
    
    # Calculate total score
    scoring['total_score'] = (
        scoring['format_score'] + 
        scoring['content_score'] + 
        scoring['quality_score'] + 
        scoring['tech_score']
    )
    
    return scoring

def score_response(response, test_case):
    """Legacy scoring function for backward compatibility"""
    
    score = 0
    
    # Check for numbered questions (40 points)
    numbered_questions = 0
    lines = response.split('\n')
    for line in lines:
        if line.strip() and any(line.strip().startswith(f"{i}.") for i in range(1, 11)):
            numbered_questions += 1
    
    if numbered_questions >= test_case['expected_count']:
        score += 40
    elif numbered_questions > 0:
        score += (numbered_questions / test_case['expected_count']) * 40
    
    # Check for question marks (20 points)
    question_marks = response.count('?')
    if question_marks >= test_case['expected_count']:
        score += 20
    elif question_marks > 0:
        score += (question_marks / test_case['expected_count']) * 20
    
    # Check for technology relevance (20 points)
    tech_lower = test_case['tech'].lower()
    response_lower = response.lower()
    if tech_lower in response_lower:
        score += 20
    
    # Check for appropriate length (10 points)
    if len(response) > 50 and len(response) < 1000:
        score += 10
    
    # Check for no placeholders (10 points)
    placeholders = ['[question text here]', '[insert question]', '[question]', 'placeholder']
    has_placeholders = any(placeholder in response.lower() for placeholder in placeholders)
    if not has_placeholders:
        score += 10
    
    return min(score, 100)

def main():
    """Main function"""
    print("🧪 HireFlow Professional Model Accuracy Tester")
    print("🎯 Comprehensive 85%+ Accuracy Verification System")
    print("📊 Professional Scoring: Format + Content + Quality + Tech Relevance")
    print()
    
    success = test_model_accuracy()
    
    if success:
        print("\n🎉 CONGRATULATIONS! Your model meets the 85%+ accuracy target!")
        print("✅ Model is ready for production deployment!")
        print("📄 Check accuracy_test_report.json for detailed analysis")
    else:
        print("\n💡 Model needs improvement to reach 85%+ accuracy target")
        print("📄 Check accuracy_test_report.json for detailed improvement suggestions")

if __name__ == "__main__":
    main()