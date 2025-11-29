/**
 * Language configurations for code editor
 */

export interface LanguageConfig {
    id: string;
    name: string;
    extension: string;
    monacoLanguage: string;
    pistonLanguage: string;
    supportsExecution: boolean;
    icon: string;
}

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
    {
        id: "javascript",
        name: "JavaScript",
        extension: ".js",
        monacoLanguage: "javascript",
        pistonLanguage: "javascript",
        supportsExecution: true,
        icon: "🟨",
    },
    {
        id: "typescript",
        name: "TypeScript",
        extension: ".ts",
        monacoLanguage: "typescript",
        pistonLanguage: "typescript",
        supportsExecution: true,
        icon: "🔷",
    },
    {
        id: "python",
        name: "Python",
        extension: ".py",
        monacoLanguage: "python",
        pistonLanguage: "python",
        supportsExecution: true,
        icon: "🐍",
    },
    {
        id: "java",
        name: "Java",
        extension: ".java",
        monacoLanguage: "java",
        pistonLanguage: "java",
        supportsExecution: true,
        icon: "☕",
    },
    {
        id: "cpp",
        name: "C++",
        extension: ".cpp",
        monacoLanguage: "cpp",
        pistonLanguage: "c++",
        supportsExecution: true,
        icon: "⚙️",
    },
    {
        id: "csharp",
        name: "C#",
        extension: ".cs",
        monacoLanguage: "csharp",
        pistonLanguage: "csharp",
        supportsExecution: true,
        icon: "🔷",
    },
    {
        id: "go",
        name: "Go",
        extension: ".go",
        monacoLanguage: "go",
        pistonLanguage: "go",
        supportsExecution: true,
        icon: "🐹",
    },
    {
        id: "rust",
        name: "Rust",
        extension: ".rs",
        monacoLanguage: "rust",
        pistonLanguage: "rust",
        supportsExecution: true,
        icon: "🦀",
    },
    {
        id: "php",
        name: "PHP",
        extension: ".php",
        monacoLanguage: "php",
        pistonLanguage: "php",
        supportsExecution: true,
        icon: "🐘",
    },
    {
        id: "ruby",
        name: "Ruby",
        extension: ".rb",
        monacoLanguage: "ruby",
        pistonLanguage: "ruby",
        supportsExecution: true,
        icon: "💎",
    },
    {
        id: "swift",
        name: "Swift",
        extension: ".swift",
        monacoLanguage: "swift",
        pistonLanguage: "swift",
        supportsExecution: true,
        icon: "🦅",
    },
    {
        id: "kotlin",
        name: "Kotlin",
        extension: ".kt",
        monacoLanguage: "kotlin",
        pistonLanguage: "kotlin",
        supportsExecution: true,
        icon: "🟣",
    },
    {
        id: "sql",
        name: "SQL",
        extension: ".sql",
        monacoLanguage: "sql",
        pistonLanguage: "sql",
        supportsExecution: false,
        icon: "🗄️",
    },
    {
        id: "html",
        name: "HTML",
        extension: ".html",
        monacoLanguage: "html",
        pistonLanguage: "html",
        supportsExecution: false,
        icon: "🌐",
    },
    {
        id: "css",
        name: "CSS",
        extension: ".css",
        monacoLanguage: "css",
        pistonLanguage: "css",
        supportsExecution: false,
        icon: "🎨",
    },
    {
        id: "json",
        name: "JSON",
        extension: ".json",
        monacoLanguage: "json",
        pistonLanguage: "json",
        supportsExecution: false,
        icon: "📄",
    },
    {
        id: "markdown",
        name: "Markdown",
        extension: ".md",
        monacoLanguage: "markdown",
        pistonLanguage: "markdown",
        supportsExecution: false,
        icon: "📝",
    },
    {
        id: "yaml",
        name: "YAML",
        extension: ".yaml",
        monacoLanguage: "yaml",
        pistonLanguage: "yaml",
        supportsExecution: false,
        icon: "⚙️",
    },
    {
        id: "xml",
        name: "XML",
        extension: ".xml",
        monacoLanguage: "xml",
        pistonLanguage: "xml",
        supportsExecution: false,
        icon: "📋",
    },
    {
        id: "shell",
        name: "Shell",
        extension: ".sh",
        monacoLanguage: "shell",
        pistonLanguage: "bash",
        supportsExecution: true,
        icon: "💻",
    },
];

/**
 * Get language config by ID
 */
export function getLanguageConfig(languageId: string): LanguageConfig | undefined {
    return LANGUAGE_CONFIGS.find((config) => config.id === languageId);
}

/**
 * Get executable languages
 */
export function getExecutableLanguages(): LanguageConfig[] {
    return LANGUAGE_CONFIGS.filter((config) => config.supportsExecution);
}

/**
 * Check if language supports execution
 */
export function supportsExecution(languageId: string): boolean {
    const config = getLanguageConfig(languageId);
    return config?.supportsExecution || false;
}

/**
 * Get language icon
 */
export function getLanguageIcon(languageId: string): string {
    const config = getLanguageConfig(languageId);
    return config?.icon || "📄";
}
