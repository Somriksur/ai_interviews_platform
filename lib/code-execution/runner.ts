/**
 * Code Execution using Piston API
 * Free API for running code in multiple languages
 * https://github.com/engineer-man/piston
 */

export interface ExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
}

export interface PistonLanguage {
    language: string;
    version: string;
    aliases: string[];
}

const PISTON_API_URL = "https://emkc.org/api/v2/piston";

/**
 * Execute code using Piston API
 */
export async function executeCode(
    language: string,
    code: string,
    stdin = ""
): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
        const response = await fetch(`${PISTON_API_URL}/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                language: mapLanguageToPiston(language),
                version: "*", // Use latest version
                files: [
                    {
                        name: getFileName(language),
                        content: code,
                    },
                ],
                stdin,
                args: [],
                compile_timeout: 10000,
                run_timeout: 3000,
                compile_memory_limit: -1,
                run_memory_limit: -1,
            }),
        });

        if (!response.ok) {
            throw new Error(`Piston API error: ${response.statusText}`);
        }

        const data = await response.json();
        const executionTime = Date.now() - startTime;

        if (data.run && data.run.code === 0) {
            return {
                success: true,
                output: data.run.stdout || "",
                executionTime,
            };
        } else {
            return {
                success: false,
                output: data.run?.stdout || "",
                error: data.run?.stderr || data.compile?.stderr || "Execution failed",
                executionTime,
            };
        }
    } catch (error) {
        const executionTime = Date.now() - startTime;
        return {
            success: false,
            output: "",
            error: error instanceof Error ? error.message : "Unknown error",
            executionTime,
        };
    }
}

/**
 * Get available languages from Piston API
 */
export async function getAvailableLanguages(): Promise<PistonLanguage[]> {
    try {
        const response = await fetch(`${PISTON_API_URL}/runtimes`);
        if (!response.ok) {
            throw new Error("Failed to fetch languages");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching languages:", error);
        return [];
    }
}

/**
 * Map Monaco language to Piston language
 * Supports 40+ programming languages
 */
function mapLanguageToPiston(language: string): string {
    const languageMap: Record<string, string> = {
        // Core Languages
        javascript: "javascript",
        typescript: "typescript",
        python: "python",
        java: "java",
        c: "c",
        cpp: "c++",
        csharp: "csharp",
        go: "go",
        rust: "rust",
        php: "php",
        ruby: "ruby",
        swift: "swift",
        kotlin: "kotlin",
        
        // Functional & Other Languages
        scala: "scala",
        r: "r",
        perl: "perl",
        lua: "lua",
        haskell: "haskell",
        dart: "dart",
        elixir: "elixir",
        clojure: "clojure",
        fsharp: "fsharp",
        groovy: "groovy",
        
        // Scripting
        bash: "bash",
        shell: "bash",
        powershell: "powershell",
        
        // Database (MongoDB uses JavaScript)
        mongodb: "javascript",
        
        // Assembly
        assembly: "assembly",
        asm: "assembly",
    };

    return languageMap[language.toLowerCase()] || language;
}

/**
 * Get appropriate file name for language
 */
function getFileName(language: string): string {
    const fileNameMap: Record<string, string> = {
        // Core Languages
        javascript: "main.js",
        typescript: "main.ts",
        python: "main.py",
        java: "Main.java",
        c: "main.c",
        cpp: "main.cpp",
        csharp: "Main.cs",
        go: "main.go",
        rust: "main.rs",
        php: "main.php",
        ruby: "main.rb",
        swift: "main.swift",
        kotlin: "Main.kt",
        
        // Functional & Other Languages
        scala: "Main.scala",
        r: "main.r",
        perl: "main.pl",
        lua: "main.lua",
        haskell: "main.hs",
        dart: "main.dart",
        elixir: "main.ex",
        clojure: "main.clj",
        fsharp: "Main.fs",
        groovy: "Main.groovy",
        
        // Scripting
        bash: "main.sh",
        shell: "main.sh",
        powershell: "main.ps1",
        
        // Database
        mongodb: "main.js",
        
        // Assembly
        assembly: "main.asm",
        asm: "main.asm",
    };

    return fileNameMap[language.toLowerCase()] || "main.txt";
}

/**
 * Validate code before execution
 */
export function validateCode(code: string): { valid: boolean; error?: string } {
    if (!code || code.trim().length === 0) {
        return { valid: false, error: "Code cannot be empty" };
    }

    if (code.length > 50000) {
        return { valid: false, error: "Code is too long (max 50,000 characters)" };
    }

    return { valid: true };
}

/**
 * Run code with test cases
 */
export async function runTestCases(
    language: string,
    code: string,
    testCases: Array<{ input: string; expectedOutput: string }>
): Promise<
    Array<{
        passed: boolean;
        actualOutput: string;
        expectedOutput: string;
        error?: string;
        executionTime: number;
    }>
> {
    const results = [];

    for (const testCase of testCases) {
        const result = await executeCode(language, code, testCase.input);

        const actualOutput = result.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();

        results.push({
            passed: result.success && actualOutput === expectedOutput,
            actualOutput,
            expectedOutput,
            error: result.error,
            executionTime: result.executionTime,
        });
    }

    return results;
}

/**
 * Get language-specific code templates
 * Comprehensive templates for 20+ languages
 */
export function getCodeTemplate(language: string): string {
    const templates: Record<string, string> = {
        javascript: `// JavaScript Code
function solution(input) {
    // Your code here
    return input;
}

// Test
console.log(solution("test"));`,

        typescript: `// TypeScript Code
function solution(input: string): string {
    // Your code here
    return input;
}

// Test
console.log(solution("test"));`,

        python: `# Python Code
def solution(input_data):
    # Your code here
    return input_data

# Test
print(solution("test"))`,

        java: `// Java Code
public class Main {
    public static String solution(String input) {
        // Your code here
        return input;
    }
    
    public static void main(String[] args) {
        System.out.println(solution("test"));
    }
}`,

        c: `// C Code
#include <stdio.h>
#include <string.h>

void solution(char* input) {
    // Your code here
    printf("%s\\n", input);
}

int main() {
    char input[] = "test";
    solution(input);
    return 0;
}`,

        cpp: `// C++ Code
#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // Your code here
    return input;
}

int main() {
    cout << solution("test") << endl;
    return 0;
}`,

        csharp: `// C# Code
using System;

class Program {
    static string Solution(string input) {
        // Your code here
        return input;
    }
    
    static void Main() {
        Console.WriteLine(Solution("test"));
    }
}`,

        go: `// Go Code
package main

import "fmt"

func solution(input string) string {
    // Your code here
    return input
}

func main() {
    fmt.Println(solution("test"))
}`,

        rust: `// Rust Code
fn solution(input: &str) -> String {
    // Your code here
    input.to_string()
}

fn main() {
    println!("{}", solution("test"));
}`,

        php: `<?php
// PHP Code
function solution($input) {
    // Your code here
    return $input;
}

// Test
echo solution("test") . "\\n";
?>`,

        ruby: `# Ruby Code
def solution(input)
    # Your code here
    input
end

# Test
puts solution("test")`,

        swift: `// Swift Code
func solution(_ input: String) -> String {
    // Your code here
    return input
}

// Test
print(solution("test"))`,

        kotlin: `// Kotlin Code
fun solution(input: String): String {
    // Your code here
    return input
}

fun main() {
    println(solution("test"))
}`,

        scala: `// Scala Code
object Main {
    def solution(input: String): String = {
        // Your code here
        input
    }
    
    def main(args: Array[String]): Unit = {
        println(solution("test"))
    }
}`,

        r: `# R Code
solution <- function(input) {
    # Your code here
    return(input)
}

# Test
print(solution("test"))`,

        perl: `# Perl Code
sub solution {
    my ($input) = @_;
    # Your code here
    return $input;
}

# Test
print solution("test") . "\\n";`,

        lua: `-- Lua Code
function solution(input)
    -- Your code here
    return input
end

-- Test
print(solution("test"))`,

        haskell: `-- Haskell Code
solution :: String -> String
solution input = input  -- Your code here

main :: IO ()
main = putStrLn $ solution "test"`,

        dart: `// Dart Code
String solution(String input) {
  // Your code here
  return input;
}

void main() {
  print(solution("test"));
}`,

        elixir: `# Elixir Code
defmodule Solution do
  def solve(input) do
    # Your code here
    input
  end
end

# Test
IO.puts Solution.solve("test")`,

        clojure: `; Clojure Code
(defn solution [input]
  ; Your code here
  input)

; Test
(println (solution "test"))`,

        fsharp: `// F# Code
let solution input =
    // Your code here
    input

// Test
printfn "%s" (solution "test")`,

        groovy: `// Groovy Code
def solution(input) {
    // Your code here
    return input
}

// Test
println solution("test")`,

        shell: `#!/bin/bash
# Shell Script

solution() {
    local input=$1
    # Your code here
    echo "$input"
}

# Test
solution "test"`,

        powershell: `# PowerShell Script
function Solution {
    param($input)
    # Your code here
    return $input
}

# Test
Solution "test"`,

        sql: `-- SQL Query
SELECT 'test' AS result;

-- Your SQL code here`,

        mongodb: `// MongoDB JavaScript
// Your MongoDB query here
db.collection.find({ field: "value" });`,

        solidity: `// Solidity Smart Contract
pragma solidity ^0.8.0;

contract MyContract {
    function solution(string memory input) public pure returns (string memory) {
        // Your code here
        return input;
    }
}`,

        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <!-- Your HTML code here -->
    <h1>Hello World</h1>
</body>
</html>`,

        css: `/* CSS Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}

/* Your CSS code here */`,

        json: `{
  "name": "example",
  "version": "1.0.0",
  "description": "Your JSON data here"
}`,

        yaml: `# YAML Configuration
name: example
version: 1.0.0
description: Your YAML data here`,

        xml: `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <!-- Your XML data here -->
    <element>value</element>
</root>`,

        markdown: `# Markdown Document

## Section 1

Your markdown content here.

- List item 1
- List item 2

\`\`\`code
// Code block
\`\`\``,

        terraform: `# Terraform Configuration
resource "aws_instance" "example" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  
  # Your Terraform code here
}`,

        dockerfile: `# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Your Dockerfile instructions here
COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]`,
    };

    return templates[language.toLowerCase()] || `// ${language} code\n\n`;
}
