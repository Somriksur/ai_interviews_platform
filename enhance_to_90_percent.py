#!/usr/bin/env python3
"""
🎯 Enhanced Fine-Tuning for 90% Accuracy
Targeted improvements based on accuracy test analysis
Focus: Tech Relevance + Content Quality + Question Depth
"""

import json
import random
from datetime import datetime

def generate_enhanced_training_data():
    """Generate enhanced training data targeting 90% accuracy"""
    
    print("🎯 Enhanced Training Data Generator for 90% Accuracy")
    print("=" * 60)
    print("🔧 Focus: Tech Relevance + Content Quality + Question Depth")
    print("📊 Target: +10% accuracy improvement (80% → 90%)")
    print("=" * 60)
    
    # Enhanced technology mappings with related terms
    tech_ecosystems = {
        "Python": {
            "frameworks": ["Django", "Flask", "FastAPI", "Pyramid"],
            "libraries": ["pandas", "numpy", "scikit-learn", "matplotlib", "requests"],
            "tools": ["pip", "virtualenv", "pytest", "black", "mypy"],
            "concepts": ["decorators", "generators", "context managers", "metaclasses", "async/await"]
        },
        "JavaScript": {
            "frameworks": ["React", "Vue", "Angular", "Express", "Next.js"],
            "libraries": ["lodash", "axios", "moment", "D3.js", "jQuery"],
            "tools": ["npm", "webpack", "babel", "eslint", "jest"],
            "concepts": ["closures", "promises", "async/await", "prototypes", "event loop"]
        },
        "React": {
            "concepts": ["JSX", "components", "hooks", "state", "props", "context"],
            "patterns": ["HOC", "render props", "compound components", "custom hooks"],
            "tools": ["Create React App", "Vite", "Storybook", "React DevTools"],
            "libraries": ["Redux", "MobX", "React Router", "Material-UI", "Styled Components"]
        },
        "Node.js": {
            "frameworks": ["Express", "Koa", "Fastify", "NestJS"],
            "tools": ["npm", "yarn", "nodemon", "PM2", "Docker"],
            "concepts": ["event loop", "streams", "buffers", "middleware", "clustering"],
            "libraries": ["socket.io", "mongoose", "sequelize", "passport", "joi"]
        },
        "SQL": {
            "databases": ["PostgreSQL", "MySQL", "SQLite", "SQL Server", "Oracle"],
            "concepts": ["joins", "indexes", "transactions", "normalization", "views"],
            "tools": ["pgAdmin", "MySQL Workbench", "DBeaver", "Sequel Pro"],
            "operations": ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER"]
        },
        "Docker": {
            "concepts": ["containers", "images", "Dockerfile", "volumes", "networks"],
            "tools": ["Docker Compose", "Docker Hub", "Kubernetes", "Portainer"],
            "commands": ["build", "run", "push", "pull", "exec", "logs"],
            "patterns": ["multi-stage builds", "health checks", "secrets management"]
        },
        "System Design": {
            "concepts": ["scalability", "load balancing", "caching", "microservices", "databases"],
            "patterns": ["MVC", "MVP", "MVVM", "Observer", "Singleton", "Factory"],
            "tools": ["Redis", "Nginx", "Apache", "CDN", "API Gateway"],
            "principles": ["SOLID", "DRY", "KISS", "YAGNI", "CAP theorem"]
        },
        "Data Structures": {
            "types": ["arrays", "linked lists", "stacks", "queues", "trees", "graphs"],
            "algorithms": ["sorting", "searching", "traversal", "dynamic programming"],
            "concepts": ["time complexity", "space complexity", "Big O notation"],
            "operations": ["insertion", "deletion", "search", "update", "traversal"]
        }
    }
    
    # Enhanced question templates with technical depth
    enhanced_templates = [
        {
            "template": "Explain how {concept} works in {tech} and provide a practical implementation example with {related_tool}.",
            "depth": "high",
            "focus": "implementation"
        },
        {
            "template": "What are the performance implications of using {concept} in {tech}? How would you optimize it using {optimization_technique}?",
            "depth": "high", 
            "focus": "performance"
        },
        {
            "template": "Design a {system_type} system using {tech} that handles {scale}. Consider {constraint} as a key constraint.",
            "depth": "high",
            "focus": "architecture"
        },
        {
            "template": "How would you implement {pattern} in {tech}? What are the trade-offs compared to {alternative_approach}?",
            "depth": "high",
            "focus": "patterns"
        },
        {
            "template": "Debug this {tech} code that's experiencing {problem_type}. What tools and techniques would you use?",
            "depth": "high",
            "focus": "debugging"
        },
        {
            "template": "Compare {tech} with {alternative_tech} for {use_case}. When would you choose one over the other?",
            "depth": "medium",
            "focus": "comparison"
        },
        {
            "template": "What security considerations should you keep in mind when using {tech} for {application_type}?",
            "depth": "high",
            "focus": "security"
        },
        {
            "template": "How would you test {functionality} in a {tech} application? Include unit, integration, and end-to-end testing strategies.",
            "depth": "high",
            "focus": "testing"
        }
    ]
    
    # Experience level configurations
    level_configs = {
        "junior": {
            "complexity": "basic",
            "focus": ["syntax", "basic concepts", "simple implementations"],
            "depth_multiplier": 1.0
        },
        "mid": {
            "complexity": "intermediate", 
            "focus": ["best practices", "patterns", "optimization"],
            "depth_multiplier": 1.5
        },
        "senior": {
            "complexity": "advanced",
            "focus": ["architecture", "scalability", "system design"],
            "depth_multiplier": 2.0
        }
    }
    
    enhanced_examples = []
    
    # Generate enhanced training examples
    for tech, ecosystem in tech_ecosystems.items():
        for level in ["junior", "mid", "senior"]:
            for template in enhanced_templates:
                # Generate multiple variations per template
                for _ in range(3):
                    
                    # Create enhanced prompt with tech ecosystem
                    concepts = ecosystem.get("concepts", [])
                    frameworks = ecosystem.get("frameworks", [])
                    tools = ecosystem.get("tools", [])
                    libraries = ecosystem.get("libraries", [])
                    
                    if concepts:
                        concept = random.choice(concepts)
                    else:
                        concept = f"{tech} fundamentals"
                    
                    related_tool = random.choice(tools + libraries) if (tools + libraries) else f"{tech} tools"
                    
                    # Generate question count based on level
                    question_counts = {"junior": [2, 3], "mid": [3, 4], "senior": [4, 5]}
                    count = random.choice(question_counts[level])
                    
                    prompt = f"Generate {count} {tech} interview questions for {level} level"
                    
                    # Create enhanced response with tech ecosystem integration
                    questions = []
                    for i in range(count):
                        question_num = i + 1
                        
                        # Select template and fill with tech-specific terms
                        selected_template = random.choice(enhanced_templates)
                        
                        # Enhanced question generation with ecosystem terms
                        if "concept" in selected_template["template"]:
                            question_text = selected_template["template"].format(
                                concept=concept,
                                tech=tech,
                                related_tool=related_tool
                            )
                        else:
                            # Fallback to simpler questions with tech terms
                            question_patterns = [
                                f"How do you implement {concept} in {tech}?",
                                f"What are the best practices for {concept} when using {tech}?",
                                f"Explain the difference between {concept} and {random.choice(concepts) if len(concepts) > 1 else 'alternatives'} in {tech}.",
                                f"How would you optimize {concept} performance in a {tech} application?",
                                f"What tools would you use to debug {concept} issues in {tech}?"
                            ]
                            question_text = random.choice(question_patterns)
                        
                        questions.append(f"{question_num}. {question_text}")
                    
                    response = "\n".join(questions)
                    
                    # Create training example
                    example = {
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are an expert technical interviewer. Generate high-quality, numbered interview questions that end with question marks. Include specific technology terms, frameworks, and tools in your questions."
                            },
                            {
                                "role": "user", 
                                "content": prompt
                            },
                            {
                                "role": "assistant",
                                "content": response
                            }
                        ]
                    }
                    
                    enhanced_examples.append(example)
    
    print(f"✅ Generated {len(enhanced_examples)} enhanced training examples")
    
    # Save enhanced training data
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"enhanced_training_data_{timestamp}.jsonl"
    
    with open(filename, 'w') as f:
        for example in enhanced_examples:
            f.write(json.dumps(example) + '\n')
    
    print(f"📄 Enhanced training data saved: {filename}")
    print(f"🎯 Ready for 90% accuracy fine-tuning!")
    
    return filename, len(enhanced_examples)

if __name__ == "__main__":
    generate_enhanced_training_data()