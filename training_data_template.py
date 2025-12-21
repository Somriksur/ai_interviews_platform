"""
🎯 Training Data Template for HireFlow Question Generator
Use this template to create your 5,270 training examples
"""

# Sample training data - expand this to 5,270 examples
training_data = [
    # Python Questions
    {
        "instruction": "Generate 3 Python interview questions for junior level",
        "output": """1. What is the difference between a list and a tuple in Python?
2. How do you handle exceptions in Python using try-except blocks?
3. Explain the concept of list comprehension with an example?"""
    },
    {
        "instruction": "Generate 2 Python interview questions for senior level",
        "output": """1. How would you implement a decorator that measures function execution time and handles exceptions?
2. Explain the Global Interpreter Lock (GIL) in Python and its impact on multithreading?"""
    },
    
    # JavaScript Questions
    {
        "instruction": "Generate 3 JavaScript interview questions for mid level",
        "output": """1. What is the difference between var, let, and const in JavaScript?
2. How does the event loop work in JavaScript?
3. Explain closures in JavaScript with a practical example?"""
    },
    {
        "instruction": "Generate 2 JavaScript interview questions for senior level",
        "output": """1. How would you implement a debounce function from scratch and explain its use cases?
2. Explain the difference between microtasks and macrotasks in the JavaScript event loop?"""
    },
    
    # React Questions
    {
        "instruction": "Generate 3 React interview questions for junior level",
        "output": """1. What is the difference between functional and class components in React?
2. How do you pass data from parent to child components in React?
3. What is the purpose of the key prop in React lists?"""
    },
    {
        "instruction": "Generate 2 React interview questions for senior level",
        "output": """1. How would you optimize a React application that has performance issues with frequent re-renders?
2. Explain the concept of React Fiber and how it improves the rendering process?"""
    },
    
    # Node.js Questions
    {
        "instruction": "Generate 3 Node.js interview questions for mid level",
        "output": """1. What is the event loop in Node.js and how does it handle asynchronous operations?
2. How do you handle file operations in Node.js using the fs module?
3. Explain the difference between process.nextTick() and setImmediate()?"""
    },
    
    # Database Questions
    {
        "instruction": "Generate 2 SQL interview questions for mid level",
        "output": """1. What is the difference between INNER JOIN and LEFT JOIN in SQL?
2. How would you optimize a slow-performing SQL query?"""
    },
    
    # System Design Questions
    {
        "instruction": "Generate 2 system design interview questions for senior level",
        "output": """1. How would you design a URL shortening service like bit.ly?
2. Design a chat application that can handle millions of concurrent users?"""
    },
    
    # DevOps Questions
    {
        "instruction": "Generate 3 DevOps interview questions for mid level",
        "output": """1. What is the difference between Docker containers and virtual machines?
2. How do you implement CI/CD pipelines using Jenkins or GitHub Actions?
3. Explain the concept of Infrastructure as Code (IaC) and its benefits?"""
    },
    
    # Data Science Questions
    {
        "instruction": "Generate 2 Data Science interview questions for senior level",
        "output": """1. How would you handle missing data in a machine learning dataset?
2. Explain the bias-variance tradeoff in machine learning models?"""
    },
    
    # Mobile Development Questions
    {
        "instruction": "Generate 3 React Native interview questions for mid level",
        "output": """1. What is the difference between React Native and native mobile development?
2. How do you handle navigation between screens in React Native?
3. Explain the concept of the bridge in React Native architecture?"""
    },
    
    # Quality Assurance Questions
    {
        "instruction": "Generate 2 QA interview questions for mid level",
        "output": """1. What is the difference between unit testing, integration testing, and end-to-end testing?
2. How do you design test cases for a login functionality?"""
    },
    
    # Behavioral Questions
    {
        "instruction": "Generate 3 behavioral interview questions for any level",
        "output": """1. Tell me about a time when you had to work with a difficult team member?
2. Describe a situation where you had to learn a new technology quickly?
3. How do you handle tight deadlines and pressure in your work?"""
    },
    
    # Mixed Technology Questions
    {
        "instruction": "Generate 2 full-stack interview questions for senior level",
        "output": """1. How would you architect a scalable web application using React, Node.js, and PostgreSQL?
2. Explain how you would implement real-time features in a web application?"""
    },
    
    # Add more examples following this pattern...
    # Aim for 5,270 total examples covering:
    # - Different roles (Frontend, Backend, Full Stack, DevOps, Mobile, Data Science, QA)
    # - Different levels (Junior, Mid, Senior)
    # - Different types (Technical, Behavioral, System Design)
    # - Different technologies (Python, JavaScript, React, Node.js, etc.)
]

# Guidelines for creating more training data:
"""
1. INSTRUCTION FORMAT:
   - "Generate X [technology] interview questions for [level] level"
   - "Generate X [type] interview questions for [role] position"

2. OUTPUT FORMAT:
   - Always numbered (1., 2., 3., etc.)
   - Always end with question mark (?)
   - Each question on separate line
   - No extra text or explanations

3. QUALITY REQUIREMENTS:
   - Questions should be realistic and practical
   - Appropriate difficulty for the specified level
   - Cover real-world scenarios
   - Test both knowledge and problem-solving

4. VARIETY:
   - Mix different technologies
   - Include behavioral questions
   - Cover system design for senior levels
   - Include coding challenges
   - Add troubleshooting scenarios

5. LEVELS:
   - Junior: Basic concepts, syntax, simple problems
   - Mid: Practical applications, best practices, debugging
   - Senior: Architecture, optimization, leadership, system design
"""

print(f"Sample training data: {len(training_data)} examples")
print("Expand this to 5,270 examples for optimal training results!")