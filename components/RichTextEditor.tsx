"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { useEffect } from "react";

const lowlight = createLowlight(common);

// Languages are already included in common

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    editable?: boolean;
    className?: string;
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder = "Start typing...",
    editable = true,
    className = "",
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // Disable default code block
            }),
            CodeBlockLowlight.configure({
                lowlight,
                defaultLanguage: "javascript",
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] max-w-none",
            },
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`border rounded-lg bg-background ${className}`}>
            {editable && (
                <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/50">
                    {/* Text Formatting */}
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("bold") ? "bg-accent" : ""
                        }`}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("italic") ? "bg-accent" : ""
                        }`}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("strike") ? "bg-accent" : ""
                        }`}
                        title="Strikethrough"
                    >
                        <s>S</s>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("code") ? "bg-accent" : ""
                        }`}
                        title="Inline Code"
                    >
                        {"</>"}
                    </button>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Headings */}
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("heading", { level: 1 }) ? "bg-accent" : ""
                        }`}
                        title="Heading 1"
                    >
                        H1
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("heading", { level: 2 }) ? "bg-accent" : ""
                        }`}
                        title="Heading 2"
                    >
                        H2
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("heading", { level: 3 }) ? "bg-accent" : ""
                        }`}
                        title="Heading 3"
                    >
                        H3
                    </button>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Lists */}
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("bulletList") ? "bg-accent" : ""
                        }`}
                        title="Bullet List"
                    >
                        • List
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("orderedList") ? "bg-accent" : ""
                        }`}
                        title="Numbered List"
                    >
                        1. List
                    </button>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Code Block */}
                    <button
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("codeBlock") ? "bg-accent" : ""
                        }`}
                        title="Code Block"
                    >
                        {"{ }"}
                    </button>

                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`px-3 py-1 rounded hover:bg-accent transition-colors tap-target ${
                            editor.isActive("blockquote") ? "bg-accent" : ""
                        }`}
                        title="Quote"
                    >
                        " "
                    </button>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Undo/Redo */}
                    <button
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="px-3 py-1 rounded hover:bg-accent transition-colors tap-target disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Undo (Ctrl+Z)"
                    >
                        ↶
                    </button>
                    <button
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="px-3 py-1 rounded hover:bg-accent transition-colors tap-target disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Redo (Ctrl+Y)"
                    >
                        ↷
                    </button>

                    <div className="w-px h-6 bg-border mx-1" />

                    {/* Clear Formatting */}
                    <button
                        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                        className="px-3 py-1 rounded hover:bg-accent transition-colors tap-target"
                        title="Clear Formatting"
                    >
                        Clear
                    </button>
                </div>
            )}

            <div className="p-4">
                <EditorContent editor={editor} placeholder={placeholder} />
            </div>

            {editable && (
                <div className="border-t p-2 text-xs text-gray-500 flex items-center justify-between">
                    <span>
                        {editor.storage.characterCount?.characters() || 0} characters
                    </span>
                    <span className="hide-mobile">
                        Supports: Bold, Italic, Code, Lists, Headings
                    </span>
                </div>
            )}
        </div>
    );
}
