"use client";

import { useRef } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  height?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = "typescript",
  theme = "vs-dark",
  height = "100%",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure TypeScript/JSX
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Add React types
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
declare module 'react' {
  export interface ComponentProps<T> {
    [key: string]: any;
  }
  export function createElement(type: any, props?: any, ...children: any[]): any;
  export const Fragment: any;
  export default any;
}
declare const React: any;
      `,
      "file:///node_modules/@types/react/index.d.ts"
    );
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="h-full">
      <Editor
        height={height}
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "mouseover",
          matchBrackets: "always",
          bracketPairColorization: {
            enabled: true,
          },
          suggest: {
            insertMode: "replace",
          },
        }}
      />
    </div>
  );
}
