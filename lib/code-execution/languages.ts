/**
 * Language configurations for code editor
 * Supports ALL tech stacks from 56+ job roles
 */

export interface LanguageConfig {
    id: string;
    name: string;
    extension: string;
    monacoLanguage: string;
    pistonLanguage: string;
    supportsExecution: boolean;
    icon: string;
    category: string;
}

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
    // Core Programming Languages
    {
        id: "javascript",
        name: "JavaScript",
        extension: ".js",
        monacoLanguage: "javascript",
        pistonLanguage: "javascript",
        supportsExecution: true,
        icon: "🟨",
        category: "Programming",
    },
    {
        id: "typescript",
        name: "TypeScript",
        extension: ".ts",
        monacoLanguage: "typescript",
        pistonLanguage: "typescript",
        supportsExecution: true,
        icon: "🔷",
        category: "Programming",
    },
    {
        id: "python",
        name: "Python",
        extension: ".py",
        monacoLanguage: "python",
        pistonLanguage: "python",
        supportsExecution: true,
        icon: "🐍",
        category: "Programming",
    },
    {
        id: "java",
        name: "Java",
        extension: ".java",
        monacoLanguage: "java",
        pistonLanguage: "java",
        supportsExecution: true,
        icon: "☕",
        category: "Programming",
    },
    {
        id: "c",
        name: "C",
        extension: ".c",
        monacoLanguage: "c",
        pistonLanguage: "c",
        supportsExecution: true,
        icon: "⚙️",
        category: "Programming",
    },
    {
        id: "cpp",
        name: "C++",
        extension: ".cpp",
        monacoLanguage: "cpp",
        pistonLanguage: "c++",
        supportsExecution: true,
        icon: "⚙️",
        category: "Programming",
    },
    {
        id: "csharp",
        name: "C#",
        extension: ".cs",
        monacoLanguage: "csharp",
        pistonLanguage: "csharp",
        supportsExecution: true,
        icon: "🔷",
        category: "Programming",
    },
    {
        id: "go",
        name: "Go",
        extension: ".go",
        monacoLanguage: "go",
        pistonLanguage: "go",
        supportsExecution: true,
        icon: "🐹",
        category: "Programming",
    },
    {
        id: "rust",
        name: "Rust",
        extension: ".rs",
        monacoLanguage: "rust",
        pistonLanguage: "rust",
        supportsExecution: true,
        icon: "🦀",
        category: "Programming",
    },
    {
        id: "php",
        name: "PHP",
        extension: ".php",
        monacoLanguage: "php",
        pistonLanguage: "php",
        supportsExecution: true,
        icon: "🐘",
        category: "Programming",
    },
    {
        id: "ruby",
        name: "Ruby",
        extension: ".rb",
        monacoLanguage: "ruby",
        pistonLanguage: "ruby",
        supportsExecution: true,
        icon: "💎",
        category: "Programming",
    },
    {
        id: "swift",
        name: "Swift",
        extension: ".swift",
        monacoLanguage: "swift",
        pistonLanguage: "swift",
        supportsExecution: true,
        icon: "🦅",
        category: "Programming",
    },
    {
        id: "kotlin",
        name: "Kotlin",
        extension: ".kt",
        monacoLanguage: "kotlin",
        pistonLanguage: "kotlin",
        supportsExecution: true,
        icon: "🟣",
        category: "Programming",
    },
    {
        id: "scala",
        name: "Scala",
        extension: ".scala",
        monacoLanguage: "scala",
        pistonLanguage: "scala",
        supportsExecution: true,
        icon: "🔴",
        category: "Programming",
    },
    {
        id: "r",
        name: "R",
        extension: ".r",
        monacoLanguage: "r",
        pistonLanguage: "r",
        supportsExecution: true,
        icon: "📊",
        category: "Data Science",
    },
    {
        id: "perl",
        name: "Perl",
        extension: ".pl",
        monacoLanguage: "perl",
        pistonLanguage: "perl",
        supportsExecution: true,
        icon: "🐪",
        category: "Programming",
    },
    {
        id: "lua",
        name: "Lua",
        extension: ".lua",
        monacoLanguage: "lua",
        pistonLanguage: "lua",
        supportsExecution: true,
        icon: "🌙",
        category: "Programming",
    },
    {
        id: "haskell",
        name: "Haskell",
        extension: ".hs",
        monacoLanguage: "haskell",
        pistonLanguage: "haskell",
        supportsExecution: true,
        icon: "λ",
        category: "Programming",
    },
    {
        id: "dart",
        name: "Dart",
        extension: ".dart",
        monacoLanguage: "dart",
        pistonLanguage: "dart",
        supportsExecution: true,
        icon: "🎯",
        category: "Programming",
    },
    {
        id: "elixir",
        name: "Elixir",
        extension: ".ex",
        monacoLanguage: "elixir",
        pistonLanguage: "elixir",
        supportsExecution: true,
        icon: "💧",
        category: "Programming",
    },
    {
        id: "clojure",
        name: "Clojure",
        extension: ".clj",
        monacoLanguage: "clojure",
        pistonLanguage: "clojure",
        supportsExecution: true,
        icon: "🔵",
        category: "Programming",
    },
    {
        id: "fsharp",
        name: "F#",
        extension: ".fs",
        monacoLanguage: "fsharp",
        pistonLanguage: "fsharp",
        supportsExecution: true,
        icon: "🔷",
        category: "Programming",
    },
    {
        id: "groovy",
        name: "Groovy",
        extension: ".groovy",
        monacoLanguage: "groovy",
        pistonLanguage: "groovy",
        supportsExecution: true,
        icon: "🎵",
        category: "Programming",
    },
    
    // Web Technologies
    {
        id: "html",
        name: "HTML",
        extension: ".html",
        monacoLanguage: "html",
        pistonLanguage: "html",
        supportsExecution: false,
        icon: "🌐",
        category: "Web",
    },
    {
        id: "css",
        name: "CSS",
        extension: ".css",
        monacoLanguage: "css",
        pistonLanguage: "css",
        supportsExecution: false,
        icon: "🎨",
        category: "Web",
    },
    {
        id: "scss",
        name: "SCSS/Sass",
        extension: ".scss",
        monacoLanguage: "scss",
        pistonLanguage: "scss",
        supportsExecution: false,
        icon: "🎨",
        category: "Web",
    },
    {
        id: "less",
        name: "Less",
        extension: ".less",
        monacoLanguage: "less",
        pistonLanguage: "less",
        supportsExecution: false,
        icon: "🎨",
        category: "Web",
    },
    
    // Database & Query Languages
    {
        id: "sql",
        name: "SQL",
        extension: ".sql",
        monacoLanguage: "sql",
        pistonLanguage: "sql",
        supportsExecution: false,
        icon: "🗄️",
        category: "Database",
    },
    {
        id: "mysql",
        name: "MySQL",
        extension: ".sql",
        monacoLanguage: "mysql",
        pistonLanguage: "mysql",
        supportsExecution: false,
        icon: "🐬",
        category: "Database",
    },
    {
        id: "postgresql",
        name: "PostgreSQL",
        extension: ".sql",
        monacoLanguage: "pgsql",
        pistonLanguage: "postgresql",
        supportsExecution: false,
        icon: "🐘",
        category: "Database",
    },
    {
        id: "mongodb",
        name: "MongoDB (JavaScript)",
        extension: ".js",
        monacoLanguage: "javascript",
        pistonLanguage: "javascript",
        supportsExecution: true,
        icon: "🍃",
        category: "Database",
    },
    
    // Blockchain & Smart Contracts
    {
        id: "solidity",
        name: "Solidity",
        extension: ".sol",
        monacoLanguage: "sol",
        pistonLanguage: "solidity",
        supportsExecution: false,
        icon: "⛓️",
        category: "Blockchain",
    },
    
    // Shell & Scripting
    {
        id: "shell",
        name: "Shell/Bash",
        extension: ".sh",
        monacoLanguage: "shell",
        pistonLanguage: "bash",
        supportsExecution: true,
        icon: "💻",
        category: "Scripting",
    },
    {
        id: "powershell",
        name: "PowerShell",
        extension: ".ps1",
        monacoLanguage: "powershell",
        pistonLanguage: "powershell",
        supportsExecution: true,
        icon: "💻",
        category: "Scripting",
    },
    {
        id: "batch",
        name: "Batch",
        extension: ".bat",
        monacoLanguage: "bat",
        pistonLanguage: "batch",
        supportsExecution: false,
        icon: "💻",
        category: "Scripting",
    },
    
    // Configuration & Data Formats
    {
        id: "json",
        name: "JSON",
        extension: ".json",
        monacoLanguage: "json",
        pistonLanguage: "json",
        supportsExecution: false,
        icon: "📄",
        category: "Config",
    },
    {
        id: "yaml",
        name: "YAML",
        extension: ".yaml",
        monacoLanguage: "yaml",
        pistonLanguage: "yaml",
        supportsExecution: false,
        icon: "⚙️",
        category: "Config",
    },
    {
        id: "xml",
        name: "XML",
        extension: ".xml",
        monacoLanguage: "xml",
        pistonLanguage: "xml",
        supportsExecution: false,
        icon: "📋",
        category: "Config",
    },
    {
        id: "toml",
        name: "TOML",
        extension: ".toml",
        monacoLanguage: "toml",
        pistonLanguage: "toml",
        supportsExecution: false,
        icon: "⚙️",
        category: "Config",
    },
    {
        id: "ini",
        name: "INI",
        extension: ".ini",
        monacoLanguage: "ini",
        pistonLanguage: "ini",
        supportsExecution: false,
        icon: "⚙️",
        category: "Config",
    },
    
    // Documentation
    {
        id: "markdown",
        name: "Markdown",
        extension: ".md",
        monacoLanguage: "markdown",
        pistonLanguage: "markdown",
        supportsExecution: false,
        icon: "📝",
        category: "Documentation",
    },
    
    // Infrastructure as Code
    {
        id: "terraform",
        name: "Terraform (HCL)",
        extension: ".tf",
        monacoLanguage: "hcl",
        pistonLanguage: "terraform",
        supportsExecution: false,
        icon: "🏗️",
        category: "Infrastructure",
    },
    {
        id: "dockerfile",
        name: "Dockerfile",
        extension: "Dockerfile",
        monacoLanguage: "dockerfile",
        pistonLanguage: "dockerfile",
        supportsExecution: false,
        icon: "🐳",
        category: "Infrastructure",
    },
    
    // Assembly & Low-Level
    {
        id: "assembly",
        name: "Assembly",
        extension: ".asm",
        monacoLanguage: "asm",
        pistonLanguage: "assembly",
        supportsExecution: false,
        icon: "⚡",
        category: "Low-Level",
    },
    
    // Game Development
    {
        id: "gdscript",
        name: "GDScript",
        extension: ".gd",
        monacoLanguage: "gdscript",
        pistonLanguage: "gdscript",
        supportsExecution: false,
        icon: "🎮",
        category: "Game Dev",
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
