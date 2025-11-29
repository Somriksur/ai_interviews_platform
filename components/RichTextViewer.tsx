"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

const lowlight = createLowlight(common);

interface RichTextViewerProps {
    content: string;
    className?: string;
}

export default function RichTextViewer({ content, className = "" }: RichTextViewerProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            CodeBlockLowlight.configure({
                lowlight,
                defaultLanguage: "javascript",
            }),
        ],
        content,
        editable: false,
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose lg:prose-lg max-w-none",
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className={`rich-text-viewer ${className}`}>
            <EditorContent editor={editor} />
        </div>
    );
}
