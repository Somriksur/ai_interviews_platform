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
 */
function mapLanguageToPiston(language: string): string {
    const languageMap: Record<string, string> = {
        javascript: "javascript",
        typescript: "typescript",
        python: "python",
        java: "java",
        cpp: "c++",
        c: "c",
        csharp: "csharp",
        go: "go",
        rust: "rust",
        php: "php",
        ruby: "ruby",
        swift: "swift",
        kotlin: "kotlin",
        r: "r",
        perl: "perl",
        lua: "lua",
        haskell: "haskell",
        scala: "scala",
        bash: "bash",
        shell: "bash",
    };

    return languageMap[language.toLowerCase()] || language;
}

/**
 * Get appropriate file name for language
 */
function getFileName(language: string): string {
    const fileNameMap: Record<string, string> = {
        javascript: "main.js",
        typescript: "main.ts",
        python: "main.py",
        java: "Main.java",
        cpp: "main.cpp",
        c: "main.c",
        csharp: "Main.cs",
        go: "main.go",
        rust: "main.rs",
        php: "main.php",
        ruby: "main.rb",
        swift: "main.swift",
        kotlin: "Main.kt",
        r: "main.r",
        perl: "main.pl",
        lua: "main.lua",
        haskell: "main.hs",
        scala: "Main.scala",
        bash: "main.sh",
        shell: "main.sh",
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
    };

    return templates[language.toLowerCase()] || `// ${language} code\n\n`;
}
