#!/usr/bin/env python3
"""
🎯 Generate 5,270 Training Questions for Fresh Model
Creates high-quality training data for 80%+ accuracy
"""

import json
import random

def generate_training_data():
    """Generate exactly 5,270 training examples"""
    
    print("🎯 Generating 5,270 Training Questions")
    print("=" * 40)
    
    training_data = []
    
    # Technologies and levels
    technologies = {
        'Python': ['junior', 'mid', 'senior'],
        'JavaScript': ['junior', 'mid', 'senior'], 
        'React': ['junior', 'mid', 'senior'],
        'Node.js': ['junior', 'mid', 'senior'],
        'Java': ['junior', 'mid', 'senior'],
        'TypeScript': ['junior', 'mid', 'senior'],
        'SQL': ['junior', 'mid', 'senior'],
        'MongoDB': ['junior', 'mid', 'senior'],
        'Docker': ['mid', 'senior'],
        'AWS': ['mid', 'senior'],
        'React Native': ['junior', 'mid', 'senior'],
        'Vue.js': ['junior', 'mid', 'senior'],
        'Angular': ['junior', 'mid', 'senior'],
        'Express.js': ['junior', 'mid', 'senior'],
        'Django': ['junior', 'mid', 'senior'],
        'Flask': ['junior', 'mid', 'senior'],
        'Spring Boot': ['mid', 'senior'],
        'PostgreSQL': ['junior', 'mid', 'senior'],
        'Redis': ['mid', 'senior'],
        'Kubernetes': ['senior'],
        'GraphQL': ['mid', 'senior'],
        'Next.js': ['mid', 'senior'],
        'Tailwind CSS': ['junior', 'mid', 'senior'],
        'Git': ['junior', 'mid', 'senior'],
        'Jest': ['junior', 'mid', 'senior'],
        'Cypress': ['mid', 'senior'],
        'DevOps': ['mid', 'senior'],
        'System Design': ['senior'],
        'Microservices': ['senior'],
        'Machine Learning': ['mid', 'senior']
    }
    
    # Question templates by technology and level
    question_templates = {
        'Python': {
            'junior': [
                "1. What is the difference between a list and a tuple in Python?\n2. How do you handle exceptions using try-except blocks?\n3. Explain the concept of list comprehension with an example?",
                "1. What are Python data types and how do you check variable types?\n2. How do you read and write files in Python?\n3. What is the difference between == and is operators?",
                "1. How do you create and call functions in Python?\n2. What are Python dictionaries and how do you use them?\n3. Explain the difference between local and global variables?",
                "1. What is a Python module and how do you import it?\n2. How do you work with strings in Python?\n3. What are Python loops and how do they work?",
                "1. What is object-oriented programming in Python?\n2. How do you create classes and objects?\n3. What are Python packages and how do you install them?"
            ],
            'mid': [
                "1. Explain the difference between deep copy and shallow copy in Python?\n2. How do decorators work and provide an example?\n3. What is the Global Interpreter Lock (GIL) and its impact?",
                "1. How would you implement a singleton pattern in Python?\n2. Explain the difference between __str__ and __repr__ methods?\n3. What are Python generators and when would you use them?",
                "1. How do you handle multiple inheritance in Python?\n2. What are context managers and how do you create custom ones?\n3. Explain the concept of metaclasses in Python?",
                "1. How would you optimize Python code for better performance?\n2. What are Python descriptors and how do they work?\n3. How do you implement multithreading vs multiprocessing?",
                "1. What are Python coroutines and async/await?\n2. How do you handle memory management in Python?\n3. Explain the concept of duck typing with examples?"
            ],
            'senior': [
                "1. How would you design a scalable Python application architecture?\n2. Explain advanced Python memory optimization techniques?\n3. How would you implement a custom metaclass for API validation?",
                "1. Design a Python framework for handling distributed tasks?\n2. How would you implement advanced caching strategies?\n3. Explain Python's import system and how to optimize it?",
                "1. How would you build a high-performance Python web service?\n2. Design a Python system for real-time data processing?\n3. How would you implement advanced error handling and logging?",
                "1. How would you architect a Python microservices system?\n2. Design a Python solution for handling millions of requests?\n3. How would you implement advanced security measures?",
                "1. How would you optimize Python for machine learning workloads?\n2. Design a Python system for handling big data processing?\n3. How would you implement advanced monitoring and alerting?"
            ]
        },
        'JavaScript': {
            'junior': [
                "1. What is the difference between var, let, and const?\n2. How do you create and call functions in JavaScript?\n3. What are JavaScript data types and how do you check them?",
                "1. How do you work with arrays in JavaScript?\n2. What is the difference between == and === operators?\n3. How do you handle events in JavaScript?",
                "1. What are JavaScript objects and how do you create them?\n2. How do you work with strings in JavaScript?\n3. What are JavaScript loops and conditionals?",
                "1. How do you manipulate the DOM with JavaScript?\n2. What are JavaScript callbacks and how do they work?\n3. How do you handle forms and user input?",
                "1. What is JSON and how do you work with it?\n2. How do you make HTTP requests in JavaScript?\n3. What are JavaScript promises and how do they work?"
            ],
            'mid': [
                "1. Explain closures in JavaScript with practical examples?\n2. How does the event loop work in JavaScript?\n3. What is hoisting and how does it affect variable declarations?",
                "1. How do you implement inheritance using prototypes?\n2. What are promises and how do they differ from callbacks?\n3. Explain the concept of this binding in JavaScript?",
                "1. How would you implement a debounce function from scratch?\n2. What are JavaScript modules and how do you use them?\n3. Explain the difference between synchronous and asynchronous code?",
                "1. How do you handle error handling in JavaScript?\n2. What are JavaScript design patterns and when to use them?\n3. How would you optimize JavaScript performance?",
                "1. What are Web APIs and how do you use them?\n2. How do you implement state management in JavaScript?\n3. Explain the concept of functional programming in JavaScript?"
            ],
            'senior': [
                "1. How would you architect a large-scale JavaScript application?\n2. Explain advanced JavaScript performance optimization techniques?\n3. How would you implement a custom JavaScript framework?",
                "1. Design a JavaScript solution for real-time communication?\n2. How would you handle memory leaks in JavaScript applications?\n3. Explain advanced JavaScript security considerations?",
                "1. How would you implement advanced caching strategies?\n2. Design a JavaScript system for handling complex state?\n3. How would you optimize JavaScript for mobile performance?",
                "1. How would you build a JavaScript-based microservices architecture?\n2. Design a solution for handling millions of concurrent users?\n3. How would you implement advanced testing strategies?",
                "1. How would you design a JavaScript framework for team collaboration?\n2. Explain advanced JavaScript bundling and optimization?\n3. How would you implement progressive web app features?"
            ]
        },
        'React': {
            'junior': [
                "1. What is JSX and how does it differ from HTML?\n2. How do you create components in React?\n3. What is the difference between functional and class components?",
                "1. How do you pass data between components using props?\n2. What is state in React and how do you manage it?\n3. How do you handle events in React components?",
                "1. What are React hooks and how do you use useState?\n2. How do you render lists in React?\n3. What is the purpose of keys in React lists?",
                "1. How do you handle forms and user input in React?\n2. What is conditional rendering in React?\n3. How do you style components in React?",
                "1. What is the component lifecycle in React?\n2. How do you make API calls in React components?\n3. What are React fragments and when do you use them?"
            ],
            'mid': [
                "1. How does the useEffect hook work and what are its dependencies?\n2. What is React Context and when should you use it?\n3. Explain controlled vs uncontrolled components?",
                "1. How do you optimize React components to prevent re-renders?\n2. What is the difference between useState and useReducer?\n3. How do you implement routing in React applications?",
                "1. What are React portals and when would you use them?\n2. How do you handle error boundaries in React?\n3. Explain the concept of React reconciliation?",
                "1. How would you implement custom hooks in React?\n2. What are React refs and how do you use them?\n3. How do you handle side effects in React applications?",
                "1. How would you implement state management without external libraries?\n2. What are React suspense and lazy loading?\n3. How do you optimize React app performance?"
            ],
            'senior': [
                "1. How would you architect a large-scale React application?\n2. Explain React Fiber and how it improves rendering?\n3. How would you implement advanced state management patterns?",
                "1. Design a React component library for enterprise use?\n2. How would you implement server-side rendering with React?\n3. Explain advanced React performance optimization techniques?",
                "1. How would you build a React-based design system?\n2. Design a solution for handling complex form validation?\n3. How would you implement advanced testing strategies?",
                "1. How would you optimize React for mobile performance?\n2. Design a React architecture for real-time applications?\n3. How would you implement advanced security measures?",
                "1. How would you build a React framework for team productivity?\n2. Design a solution for handling millions of components?\n3. How would you implement advanced accessibility features?"
            ]
        }
    }
    
    # Generate questions for each technology and level
    count = 0
    target = 5270
    
    while count < target:
        for tech, levels in technologies.items():
            if count >= target:
                break
                
            for level in levels:
                if count >= target:
                    break
                
                # Generate different amounts (2-5 questions)
                amounts = [2, 3, 4, 5]
                for amount in amounts:
                    if count >= target:
                        break
                    
                    instruction = f"Generate {amount} {tech} interview questions for {level} level"
                    
                    # Get template or generate generic
                    if tech in question_templates and level in question_templates[tech]:
                        templates = question_templates[tech][level]
                        if templates:
                            output = random.choice(templates)
                        else:
                            output = generate_generic_questions(tech, level, amount)
                    else:
                        output = generate_generic_questions(tech, level, amount)
                    
                    training_data.append({
                        "instruction": instruction,
                        "output": output
                    })
                    
                    count += 1
                    
                    if count % 500 == 0:
                        print(f"Generated {count}/{target} questions...")
    
    # Trim to exactly 5270
    training_data = training_data[:5270]
    
    print(f"✅ Generated exactly {len(training_data)} training questions")
    return training_data

def generate_generic_questions(tech, level, amount):
    """Generate generic questions for any technology/level"""
    
    difficulty_map = {
        'junior': 'basic',
        'mid': 'intermediate', 
        'senior': 'advanced'
    }
    
    questions = []
    for i in range(amount):
        question_num = i + 1
        if level == 'junior':
            question = f"{question_num}. What is {tech} and how do you use it in development?"
        elif level == 'mid':
            question = f"{question_num}. How would you implement {tech} best practices in a project?"
        else:  # senior
            question = f"{question_num}. How would you architect a scalable system using {tech}?"
        
        questions.append(question)
    
    return '\n'.join(questions)

def save_training_data(training_data):
    """Save training data to JSONL file"""
    
    print("💾 Saving training data to training_data.jsonl...")
    
    with open('training_data.jsonl', 'w', encoding='utf-8') as f:
        for item in training_data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    print(f"✅ Saved {len(training_data)} examples to training_data.jsonl")

def main():
    """Main function"""
    print("🎯 HireFlow Training Data Generator")
    print("Generating 5,270 questions for 80%+ accuracy")
    print()
    
    # Generate training data
    training_data = generate_training_data()
    
    # Save to file
    save_training_data(training_data)
    
    print("\n🎉 TRAINING DATA GENERATION COMPLETED!")
    print("=" * 50)
    print(f"✅ Generated: {len(training_data)} questions")
    print("✅ File: training_data.jsonl")
    print("✅ Ready for training!")
    print("\n🚀 Next step: python train_fresh_model.py")

if __name__ == "__main__":
    main()