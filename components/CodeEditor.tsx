"use client";

import { useState, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    height?: string;
    readOnly?: boolean;
    showLineNumbers?: boolean;
    className?: string;
}

const SUPPORTED_LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "php", label: "PHP" },
    { value: "ruby", label: "Ruby" },
    { value: "swift", label: "Swift" },
    { value: "kotlin", label: "Kotlin" },
    { value: "sql", label: "SQL" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
    { value: "yaml", label: "YAML" },
    { value: "xml", label: "XML" },
    { value: "shell", label: "Shell" },
];

export default function CodeEditor({
    value,
    onChange,
    language = "javascript",
    height = "400px",
    readOnly = false,
    showLineNumbers = true,
    className = "",
}: CodeEditorProps) {
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const [fontSize, setFontSize] = useState(14);
    const { theme } = useTheme();
    const editorRef = useRef<{ updateOptions: (options: Record<string, unknown>) => void; getAction: (id: string) => { run: () => void } | undefined } | null>(null);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;

        // Configure editor
        editor.updateOptions({
            fontSize,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
        });
    };

    const handleLanguageChange = (newLanguage: string) => {
        setSelectedLanguage(newLanguage);
    };

    const handleFontSizeChange = (delta: number) => {
        const newSize = Math.max(10, Math.min(24, fontSize + delta));
        setFontSize(newSize);
        if (editorRef.current) {
            editorRef.current.updateOptions({ fontSize: newSize });
        }
    };

    const formatCode = () => {
        if (editorRef.current) {
            editorRef.current.getAction("editor.action.formatDocument")?.run();
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(value);
        // You could add a toast notification here
    };

    return (
        <div className={`border rounded-lg overflow-hidden bg-background ${className}`}>
            {/* Toolbar */}
            <div className="border-b p-2 flex items-center justify-between gap-2 bg-muted/50 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Language Selector */}
                    <select
                        value={selectedLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="px-3 py-1 border rounded bg-background text-sm tap-target"
                        disabled={readOnly}
                    >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>

                    {/* Font Size Controls */}
                    <div className="flex items-center gap-1 border rounded">
                        <button
                            onClick={() => handleFontSizeChange(-1)}
                            className="px-2 py-1 hover:bg-accent transition-colors"
                            title="Decrease font size"
                        >
                            A-
                        </button>
                        <span className="px-2 text-xs text-gray-500">{fontSize}px</span>
                        <button
                            onClick={() => handleFontSizeChange(1)}
                            className="px-2 py-1 hover:bg-accent transition-colors"
                            title="Increase font size"
                        >
                            A+
                        </button>
                    </div>

                    {/* Format Button */}
                    {!readOnly && (
                        <button
                            onClick={formatCode}
                            className="px-3 py-1 border rounded hover:bg-accent transition-colors text-sm tap-target"
                            title="Format code"
                        >
                            Format
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                        onClick={copyCode}
                        className="px-3 py-1 border rounded hover:bg-accent transition-colors text-sm tap-target"
                        title="Copy code"
                    >
                        📋 Copy
                    </button>

                    {/* Character Count */}
                    <span className="text-xs text-gray-500 hide-mobile">
                        {value.length} chars
                    </span>
                </div>
            </div>

            {/* Monaco Editor */}
            <Editor
                height={height}
                language={selectedLanguage}
                value={value}
                onChange={(newValue) => onChange(newValue || "")}
                onMount={handleEditorDidMount}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                    readOnly,
                    lineNumbers: showLineNumbers ? "on" : "off",
                    fontSize,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    folding: true,
                    foldingStrategy: "indentation",
                    showFoldingControls: "always",
                    matchBrackets: "always",
                    autoClosingBrackets: "always",
                    autoClosingQuotes: "always",
                    autoIndent: "full",
                }}
                loading={
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin text-4xl">⏳</div>
                    </div>
                }
            />

            {/* Footer */}
            <div className="border-t p-2 text-xs text-gray-500 flex items-center justify-between">
                <span>
                    {selectedLanguage.toUpperCase()} • {readOnly ? "Read-only" : "Editable"}
                </span>
                <span className="hide-mobile">
                    Press Ctrl+Space for suggestions
                </span>
            </div>
        </div>
    );
}
