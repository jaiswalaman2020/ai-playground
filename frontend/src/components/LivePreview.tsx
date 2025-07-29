"use client";

import {
  LiveProvider,
  LiveError,
  LivePreview as ReactLivePreview,
} from "react-live";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

interface LivePreviewProps {
  code: string;
  css?: string;
  props?: Record<string, any>;
}

export default function LivePreview({
  code,
  css = "",
  props = {},
}: LivePreviewProps) {
  const scope = {
    React,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    props,
    ...props,
  };

  // Transform the code to work with react-live
  const transformCode = (code: string) => {
    if (!code || !code.trim()) {
      // Return a simple render call for empty code to avoid syntax errors
      return "render(<div style={{padding: '20px', textAlign: 'center', color: '#666'}}>No code to preview</div>);";
    }

    let processedCode = code.trim();

    // Remove imports
    processedCode = processedCode.replace(
      /import\s+.*?from\s+['"][^'"]*['"];?\s*/g,
      ""
    );
    processedCode = processedCode.replace(/import\s+['"][^'"]*['"];?\s*/g, "");

    // Handle export default
    if (processedCode.includes("export default")) {
      // Replace export default with component assignment
      processedCode = processedCode.replace(
        /export\s+default\s+/,
        "const Component = "
      );
      // Add render call at the end
      processedCode += "\n\nrender(<Component {...props} />);";
      return processedCode;
    }

    // If it's already a component function or class, wrap it
    if (processedCode.match(/^(const|function|class)\s+\w+/)) {
      return (
        processedCode +
        "\n\nrender(<" +
        extractComponentName(processedCode) +
        " {...props} />);"
      );
    }

    // If it looks like JSX, render it directly
    if (processedCode.trim().startsWith("<")) {
      return `render(${processedCode});`;
    }

    // If it's a function component, render it
    if (
      processedCode.trim().startsWith("(") ||
      processedCode.trim().startsWith("() =>")
    ) {
      return `render((${processedCode})());`;
    }

    // Default: try to render as-is
    return `render(${processedCode});`;
  };

  const extractComponentName = (code: string) => {
    const match = code.match(/^(?:const|function|class)\s+(\w+)/);
    return match ? match[1] : "Component";
  };

  const transformedCode = transformCode(code);

  return (
    <div className="flex flex-col h-full">
      <LiveProvider code={transformedCode} scope={scope} noInline={true}>
        <div className="flex-1 border border-gray-200 p-2 sm:p-4 overflow-auto">
          {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
          <div className="min-h-[200px] sm:min-h-[300px] lg:min-h-[400px] w-full">
            <ReactLivePreview />
          </div>
        </div>
        <div className="bg-gray-100 p-2 text-red-500 text-xs sm:text-sm max-h-20 overflow-auto">
          <LiveError />
        </div>
      </LiveProvider>
    </div>
  );
}
