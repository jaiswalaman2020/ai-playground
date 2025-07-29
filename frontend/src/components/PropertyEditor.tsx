"use client";

import { useState, useEffect } from "react";

interface PropertyEditorProps {
  selectedElement: string | null;
  currentProps: Record<string, any>;
  onPropsChange: (props: Record<string, any>) => void;
}

export default function PropertyEditor({
  selectedElement,
  currentProps,
  onPropsChange,
}: PropertyEditorProps) {
  const [props, setProps] = useState<Record<string, any>>(currentProps);
  const [customProp, setCustomProp] = useState({ key: "", value: "" });

  useEffect(() => {
    setProps(currentProps);
  }, [currentProps]);

  const handlePropChange = (key: string, value: any) => {
    const newProps = { ...props, [key]: value };
    setProps(newProps);
    onPropsChange(newProps);
  };

  const handleCustomPropAdd = () => {
    if (customProp.key && customProp.value) {
      handlePropChange(customProp.key, customProp.value);
      setCustomProp({ key: "", value: "" });
    }
  };

  const removeProp = (key: string) => {
    const newProps = { ...props };
    delete newProps[key];
    setProps(newProps);
    onPropsChange(newProps);
  };

  const getInputType = (value: any): string => {
    if (typeof value === "boolean") return "checkbox";
    if (typeof value === "number") return "number";
    if (typeof value === "string" && value.startsWith("#")) return "color";
    return "text";
  };

  const renderPropInput = (key: string, value: any) => {
    const inputType = getInputType(value);

    if (inputType === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => handlePropChange(key, e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      );
    }

    if (inputType === "number") {
      return (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => handlePropChange(key, Number(e.target.value))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    if (inputType === "color") {
      return (
        <div className="flex space-x-2">
          <input
            type="color"
            value={value || "#000000"}
            onChange={(e) => handlePropChange(key, e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handlePropChange(key, e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#000000"
          />
        </div>
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={value || ""}
        onChange={(e) => handlePropChange(key, e.target.value)}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  if (!selectedElement) {
    return (
      <div className="p-3 sm:p-4 text-center text-gray-500">
        <div className="text-xl sm:text-2xl mb-2">🎯</div>
        <h3 className="text-xs sm:text-sm font-medium mb-1">
          Select an Element
        </h3>
        <p className="text-xs">
          Click on any element in the preview to edit its properties.
        </p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">
          Selected:{" "}
          <span className="text-blue-600 break-all">{selectedElement}</span>
        </h3>
      </div>

      {/* Common Properties */}
      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Text Content
          </label>
          <input
            type="text"
            value={props.children || ""}
            onChange={(e) => handlePropChange("children", e.target.value)}
            className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Element text content"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            CSS Classes
          </label>
          <input
            type="text"
            value={props.className || ""}
            onChange={(e) => handlePropChange("className", e.target.value)}
            className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tailwind classes"
          />
        </div>

        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="text"
              value={props.width || ""}
              onChange={(e) => handlePropChange("width", e.target.value)}
              className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="auto"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="text"
              value={props.height || ""}
              onChange={(e) => handlePropChange("height", e.target.value)}
              className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="auto"
            />
          </div>
        </div>
      </div>

      {/* Current Props */}
      {Object.keys(props).length > 0 && (
        <div className="mb-3 sm:mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">
            Current Properties
          </h4>
          <div className="space-y-1 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
            {Object.entries(props).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600 truncate">
                      {key}
                    </label>
                    <button
                      onClick={() => removeProp(key)}
                      className="text-red-500 hover:text-red-700 text-xs flex-shrink-0 p-1"
                    >
                      ×
                    </button>
                  </div>
                  {renderPropInput(key, value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Property */}
      <div className="border-t border-gray-200 pt-3 sm:pt-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Add Property</h4>
        <div className="space-y-2">
          <input
            type="text"
            value={customProp.key}
            onChange={(e) =>
              setCustomProp({ ...customProp, key: e.target.value })
            }
            className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Property name"
          />
          <input
            type="text"
            value={customProp.value}
            onChange={(e) =>
              setCustomProp({ ...customProp, value: e.target.value })
            }
            className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Property value"
          />
          <button
            onClick={handleCustomPropAdd}
            disabled={!customProp.key || !customProp.value}
            className="w-full bg-blue-600 text-white py-1 px-2 text-xs sm:text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Property
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Styles</h4>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <button
            onClick={() =>
              handlePropChange(
                "className",
                "bg-blue-500 text-white p-2 sm:p-4 rounded-lg"
              )
            }
            className="bg-blue-500 text-white p-1 sm:p-2 rounded text-xs hover:bg-blue-600"
          >
            Blue Card
          </button>
          <button
            onClick={() =>
              handlePropChange(
                "className",
                "border-2 border-gray-300 p-2 sm:p-4 rounded-lg"
              )
            }
            className="border-2 border-gray-300 p-1 sm:p-2 rounded text-xs hover:bg-gray-50"
          >
            Border Box
          </button>
          <button
            onClick={() =>
              handlePropChange(
                "className",
                "shadow-lg p-2 sm:p-4 rounded-lg bg-white"
              )
            }
            className="shadow-lg p-1 sm:p-2 rounded bg-white text-xs hover:shadow-xl"
          >
            Shadow
          </button>
          <button
            onClick={() =>
              handlePropChange(
                "className",
                "bg-gradient-to-r from-purple-400 to-pink-400 text-white p-2 sm:p-4 rounded-lg"
              )
            }
            className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-1 sm:p-2 rounded text-xs"
          >
            Gradient
          </button>
        </div>
      </div>
    </div>
  );
}
