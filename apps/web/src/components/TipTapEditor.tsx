import React, { useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// Expose methods via ref
export interface TipTapEditorRef {
  insertText: (text: string) => void;
  focus: () => void;
}

// SVG Icons for toolbar
const Icons = {
  bold: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  underline: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  ),
  strikethrough: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0 0 6h6" />
      <path d="M8 20h7a3 3 0 1 0 0-6H4" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  ),
  h1: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17 10v8" />
      <path d="M21 10h-4" />
    </svg>
  ),
  h2: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </svg>
  ),
  paragraph: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4v16" />
      <path d="M17 4v16" />
      <path d="M19 4H9.5a4.5 4.5 0 1 0 0 9H13" />
    </svg>
  ),
  bulletList: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  orderedList: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  ),
  link: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  unlink: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
      <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="2" y1="8" x2="5" y2="8" />
      <line x1="16" y1="19" x2="16" y2="22" />
      <line x1="19" y1="16" x2="22" y2="16" />
    </svg>
  ),
  alignLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="15" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  ),
  alignCenter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="6" y1="12" x2="18" y2="12" />
      <line x1="5" y1="18" x2="19" y2="18" />
    </svg>
  ),
  alignRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="6" y1="18" x2="21" y2="18" />
    </svg>
  ),
  quote: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  ),
  undo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  redo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  ),
  horizontalRule: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  table: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  codeBlock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9l6 6" />
      <path d="M15 9l-6 6" />
    </svg>
  ),
  highlight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11H1l2-7h13l-2 7z" />
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  superscript: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l8-8" />
      <path d="M12 12l8 8" />
      <path d="M20 4h-4l4 8" />
    </svg>
  ),
  subscript: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l8-8" />
      <path d="M12 12l8 8" />
      <path d="M20 20h-4l4-8" />
    </svg>
  ),
  textColor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  removeFormat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18" />
      <path d="M8 8l4 4-4 4" />
      <path d="M16 16l-4-4 4-4" />
    </svg>
  ),
};

const MenuBar = ({ editor, onImageInsert }: { editor: any; onImageInsert: () => void }) => {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertImageFromUrl = useCallback(() => {
    const url = window.prompt("URL de la imagen");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const setTextColor = useCallback(() => {
    const color = window.prompt("Color de texto (ej: #ff0000)", "#000000");
    if (color) {
      editor.chain().focus().setColor(color).run();
    }
  }, [editor]);

  const setHighlight = useCallback(() => {
    const color = window.prompt("Color de resaltado (ej: #ffff00)", "#ffff00");
    if (color) {
      editor.chain().focus().setHighlight({ color }).run();
    }
  }, [editor]);

  const unsetHighlight = useCallback(() => {
    editor.chain().focus().unsetHighlight().run();
  }, [editor]);

  const removeFormat = useCallback(() => {
    editor.chain().focus().clearMarks().run();
  }, [editor]);

  if (!editor) return null;

  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    background: isActive ? "var(--accent)" : "var(--panel)",
    color: isActive ? "white" : "var(--text)",
    cursor: "pointer",
  });

  const disabledStyle: React.CSSProperties = {
    ...btnStyle(false),
    opacity: 0.4,
    cursor: "not-allowed",
  };

  const Separator = () => (
    <div style={{ width: "1px", height: "24px", background: "var(--border)", margin: "0 6px" }} />
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "4px",
        padding: "8px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        flexShrink: 0,
      }}
    >
      {/* Undo / Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        style={editor.can().undo() ? btnStyle(false) : disabledStyle}
        title="Deshacer"
      >
        {Icons.undo}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        style={editor.can().redo() ? btnStyle(false) : disabledStyle}
        title="Rehacer"
      >
        {Icons.redo}
      </button>

      <Separator />

      {/* Text formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={btnStyle(editor.isActive("bold"))}
        title="Negrita (Ctrl+B)"
      >
        {Icons.bold}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={btnStyle(editor.isActive("italic"))}
        title="Cursiva (Ctrl+I)"
      >
        {Icons.italic}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        style={btnStyle(editor.isActive("underline"))}
        title="Subrayado (Ctrl+U)"
      >
        {Icons.underline}
      </button>

      <Separator />

      {/* Text styling */}
      <button
        type="button"
        onClick={setTextColor}
        style={btnStyle(false)}
        title="Color de texto"
      >
        {Icons.textColor}
      </button>
      <button
        type="button"
        onClick={setHighlight}
        style={btnStyle(editor.isActive("highlight"))}
        title="Resaltar texto"
      >
        {Icons.highlight}
      </button>
      {editor.isActive("highlight") && (
        <button
          type="button"
          onClick={unsetHighlight}
          style={btnStyle(false)}
          title="Quitar resaltado"
        >
          {Icons.removeFormat}
        </button>
      )}

      <Separator />

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={btnStyle(editor.isActive("heading", { level: 1 }))}
        title="Título 1"
      >
        {Icons.h1}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={btnStyle(editor.isActive("heading", { level: 2 }))}
        title="Título 2"
      >
        {Icons.h2}
      </button>

      <Separator />

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={btnStyle(editor.isActive("bulletList"))}
        title="Lista con viñetas"
      >
        {Icons.bulletList}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={btnStyle(editor.isActive("orderedList"))}
        title="Lista numerada"
      >
        {Icons.orderedList}
      </button>

      <Separator />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        style={btnStyle(editor.isActive({ textAlign: "left" }))}
        title="Alinear izquierda"
      >
        {Icons.alignLeft}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        style={btnStyle(editor.isActive({ textAlign: "center" }))}
        title="Alinear centro"
      >
        {Icons.alignCenter}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        style={btnStyle(editor.isActive({ textAlign: "right" }))}
        title="Alinear derecha"
      >
        {Icons.alignRight}
      </button>

      <Separator />

      {/* Indentation */}
      <button
        type="button"
        onClick={() => editor.chain().focus().outdent().run()}
        style={btnStyle(false)}
        title="Reducir sangría"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().indent().run()}
        style={btnStyle(false)}
        title="Aumentar sangría"
      >
        →
      </button>

      <Separator />

      {/* Special formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={btnStyle(editor.isActive("blockquote"))}
        title="Cita"
      >
        {Icons.quote}
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        style={btnStyle(false)}
        title="Línea horizontal"
      >
        {Icons.horizontalRule}
      </button>

      <Separator />

      {/* Table */}
      <button
        type="button"
        onClick={insertTable}
        style={btnStyle(false)}
        title="Insertar tabla"
      >
        {Icons.table}
      </button>

      <Separator />

      {/* Link */}
      <button
        type="button"
        onClick={setLink}
        style={btnStyle(editor.isActive("link"))}
        title="Insertar enlace"
      >
        {Icons.link}
      </button>
      {editor.isActive("link") && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          style={btnStyle(false)}
          title="Quitar enlace"
        >
          {Icons.unlink}
        </button>
      )}

      <Separator />

      {/* Image */}
      <button
        type="button"
        onClick={onImageInsert}
        style={btnStyle(false)}
        title="Insertar imagen desde archivo"
      >
        {Icons.image}
      </button>

      <Separator />

      {/* Clear formatting */}
      <button
        type="button"
        onClick={removeFormat}
        style={btnStyle(false)}
        title="Quitar formato"
      >
        {Icons.removeFormat}
      </button>
    </div>
  );
};

const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
  function TipTapEditor({ content, onChange, placeholder }, ref) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
       TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Superscript,
      Subscript,
      Code,
      CodeBlock,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: "min-height: 200px; padding: 16px; outline: none;",
      },
    },
  });

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editor) {
        editor.chain().focus().insertContent(text).run();
      }
    },
    focus: () => {
      editor?.chain().focus().run();
    },
  }), [editor]);

  // Update editor content when content prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Compress and resize image
  const compressImage = useCallback((file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize if wider than maxWidth
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to JPEG with quality compression
            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
          } else {
            // Fallback to original if canvas context fails
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      // Compress image before inserting
      const compressedBase64 = await compressImage(file);
      editor.chain().focus().setImage({ src: compressedBase64 }).run();
    } catch (err) {
      // Fallback to original file if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = "";
  }, [editor, compressImage]);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        background: "var(--panel)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flex: 1,
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />
      <MenuBar editor={editor} onImageInsert={handleImageUpload} />
      <div
        style={{
          minHeight: "200px",
          flex: 1,
          overflow: "auto",
        }}
      >
        <EditorContent
          editor={editor}
          style={{
            minHeight: "200px",
          }}
        />
      </div>
      <style>{`
        .ProseMirror {
          min-height: 200px;
          padding: 16px;
          outline: none;
          overflow-x: hidden;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .ProseMirror p {
          margin: 0 0 8px 0;
        }
        .ProseMirror h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 16px 0 8px 0;
        }
        .ProseMirror h2 {
          font-size: 20px;
          font-weight: bold;
          margin: 12px 0 8px 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .ProseMirror li {
          margin: 4px 0;
        }
        .ProseMirror a {
          color: var(--accent);
          text-decoration: underline;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 16px;
          margin: 8px 0;
          color: var(--muted);
          font-style: italic;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid var(--border);
          margin: 16px 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--muted);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 8px 0;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid var(--accent);
        }
        .ProseMirror code {
          background: var(--bg);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .ProseMirror pre {
          background: var(--bg);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          font-family: monospace;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 8px 0;
          width: 100%;
        }
        .ProseMirror table td, .ProseMirror table th {
          border: 1px solid var(--border);
          padding: 8px;
        }
        .ProseMirror table th {
          background: var(--bg);
          font-weight: bold;
        }
        .ProseMirror mark {
          background: yellow;
          padding: 2px 4px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
});

export default TipTapEditor;