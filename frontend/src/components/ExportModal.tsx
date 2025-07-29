"use client";

import { useState } from "react";
import { saveAs } from "file-saver";

interface ExportModalProps {
  code: string;
  sessionName: string;
  onClose: () => void;
}

export default function ExportModal({
  code,
  sessionName,
  onClose,
}: ExportModalProps) {
  const [exportType, setExportType] = useState<
    "component" | "codesandbox" | "stackblitz"
  >("component");
  const [componentName, setComponentName] = useState(
    sessionName.replace(/[^a-zA-Z0-9]/g, "") || "MyComponent"
  );
  const [includeStyles, setIncludeStyles] = useState(true);
  const [includeTypes, setIncludeTypes] = useState(true);

  const generateComponentFile = () => {
    const fileName = `${componentName}.${includeTypes ? "tsx" : "jsx"}`;
    const imports = includeTypes
      ? "import React from 'react';\n\n"
      : "import React from 'react';\n\n";

    let componentCode = code;

    // Ensure component is properly named and exported
    if (
      !componentCode.includes(`function ${componentName}`) &&
      !componentCode.includes(`const ${componentName}`)
    ) {
      componentCode = `${imports}export default function ${componentName}() {\n  return (\n    ${componentCode.trim()}\n  );\n}`;
    }

    return { fileName, content: componentCode };
  };

  const generatePackageJson = () => {
    return {
      name: componentName.toLowerCase(),
      version: "1.0.0",
      description: `Generated component: ${sessionName}`,
      main: "index.js",
      scripts: {
        start: "react-scripts start",
        build: "react-scripts build",
        test: "react-scripts test",
        eject: "react-scripts eject",
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        "react-scripts": "^5.0.1",
      },
      browserslist: {
        production: [">0.2%", "not dead", "not op_mini all"],
        development: [
          "last 1 chrome version",
          "last 1 firefox version",
          "last 1 safari version",
        ],
      },
    };
  };

  const handleExport = () => {
    const { fileName, content } = generateComponentFile();

    if (exportType === "component") {
      // Export as single component file
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      saveAs(blob, fileName);
    } else if (exportType === "codesandbox") {
      // Generate CodeSandbox URL
      const files = {
        "src/App.js": {
          content: content,
        },
        "src/index.js": {
          content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nconst root = ReactDOM.createRoot(document.getElementById('root'));\nroot.render(<App />);`,
        },
        "src/index.css": {
          content:
            "body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}",
        },
        "package.json": {
          content: JSON.stringify(generatePackageJson(), null, 2),
        },
        "public/index.html": {
          content:
            '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>React App</title>\n  </head>\n  <body>\n    <noscript>You need to enable JavaScript to run this app.</noscript>\n    <div id="root"></div>\n  </body>\n</html>',
        },
      };

      const formData = new FormData();
      formData.append("files", JSON.stringify(files));

      // Open CodeSandbox
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://codesandbox.io/api/v1/sandboxes/define";
      form.target = "_blank";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "parameters";
      input.value = JSON.stringify({ files });

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } else if (exportType === "stackblitz") {
      // Generate StackBlitz URL
      const project = {
        files: {
          "src/App.tsx": content,
          "src/main.tsx": `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
          "src/index.css":
            "@tailwind base;\n@tailwind components;\n@tailwind utilities;",
          "package.json": JSON.stringify(
            {
              name: "react-component",
              private: true,
              version: "0.0.0",
              scripts: {
                dev: "vite",
                build: "tsc && vite build",
                preview: "vite preview",
              },
              dependencies: {
                react: "^18.2.0",
                "react-dom": "^18.2.0",
              },
              devDependencies: {
                "@types/react": "^18.0.28",
                "@types/react-dom": "^18.0.11",
                "@vitejs/plugin-react": "^3.1.0",
                typescript: "^4.9.3",
                vite: "^4.2.0",
                tailwindcss: "^3.3.0",
                autoprefixer: "^10.4.14",
                postcss: "^8.4.21",
              },
            },
            null,
            2
          ),
          "index.html":
            '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>',
          "vite.config.ts":
            "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})",
        },
        title: componentName,
        description: sessionName,
        template: "react-ts",
      };

      // Open StackBlitz
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://stackblitz.com/run";
      form.target = "_blank";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "project";
      input.value = JSON.stringify(project);

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Export Component
          </h2>

          <div className="space-y-4">
            {/* Export Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="component"
                    checked={exportType === "component"}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="mr-2"
                  />
                  Download as component file
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="codesandbox"
                    checked={exportType === "codesandbox"}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="mr-2"
                  />
                  Open in CodeSandbox
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="stackblitz"
                    checked={exportType === "stackblitz"}
                    onChange={(e) => setExportType(e.target.value as any)}
                    className="mr-2"
                  />
                  Open in StackBlitz
                </label>
              </div>
            </div>

            {/* Component Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component Name
              </label>
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MyComponent"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeTypes}
                  onChange={(e) => setIncludeTypes(e.target.checked)}
                  className="mr-2"
                />
                Include TypeScript types
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeStyles}
                  onChange={(e) => setIncludeStyles(e.target.checked)}
                  className="mr-2"
                />
                Include inline styles
              </label>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview
              </label>
              <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 max-h-32 overflow-y-auto">
                <code className="whitespace-pre-wrap">
                  {generateComponentFile().content.substring(0, 200)}
                  {generateComponentFile().content.length > 200 ? "..." : ""}
                </code>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
