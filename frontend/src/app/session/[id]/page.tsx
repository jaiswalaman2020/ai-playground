"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sessionsAPI, aiAPI } from "@/utils/api";
import type { Session, Message } from "@/types";

// Component imports
import ChatInterface from "@/components/ChatInterface";
import CodeEditor from "@/components/CodeEditor";
import LivePreview from "@/components/LivePreview";
import PropertyEditor from "@/components/PropertyEditor";
import ExportModal from "@/components/ExportModal";

interface SessionData extends Session {
  // The messages prop is actually chatHistory from backend
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = params.id as string;

  // State
  const [currentCode, setCurrentCode] = useState("");
  const [currentCSS, setCurrentCSS] = useState("");
  const [activeTab, setActiveTab] = useState<"jsx" | "css">("jsx");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewProps, setPreviewProps] = useState<Record<string, any>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch session data
  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const response = await sessionsAPI.getSession(sessionId);
      return response.session as SessionData;
    },
    enabled: !!sessionId && !!user,
  });

  // Generate component mutation
  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      setIsGenerating(true);
      const response = await aiAPI.generateComponent({
        prompt,
        sessionId,
        context: {
          existingCode: currentCode ? { jsx: currentCode, css: "" } : undefined,
        },
      });
      return response;
    },
    onSuccess: (data: any) => {
      if (data.generatedCode?.jsx) {
        setCurrentCode(data.generatedCode.jsx);
      }
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      toast.success("Component generated successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to generate component"
      );
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<Session>) => {
      const response = await sessionsAPI.updateSession(sessionId, updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });

  // Initialize code from session
  useEffect(() => {
    if (session?.currentComponent?.jsx) {
      setCurrentCode(session.currentComponent.jsx);
    }
    if (session?.currentComponent?.css) {
      setCurrentCSS(session.currentComponent.css);
    }
  }, [session]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save code changes
  const handleCodeChange = (code: string) => {
    setCurrentCode(code);
    saveChanges(code, currentCSS);
  };

  // Save CSS changes
  const handleCSSChange = (css: string) => {
    setCurrentCSS(css);
    saveChanges(currentCode, css);
  };

  // Debounced save function
  const saveChanges = (jsx: string, css: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounced save
    saveTimeoutRef.current = setTimeout(() => {
      updateSessionMutation.mutate({
        currentComponent: {
          jsx,
          css,
          typescript: false,
        },
      });
    }, 1000);
  };

  // Handle AI generation
  const handleGenerate = (prompt: string) => {
    generateMutation.mutate(prompt);
  };

  // Handle property updates
  const handlePropertyUpdate = (props: Record<string, any>) => {
    setPreviewProps(props);
  };

  // Handle export
  const handleExport = () => {
    setShowExportModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Session Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The session you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-900 flex items-center text-sm sm:text-base"
            >
              ← <span className="hidden sm:inline ml-1">Back to Dashboard</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {session.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {session.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base flex-shrink-0"
              disabled={!currentCode}
            >
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-72px)] sm:h-[calc(100vh-80px)]">
        {/* Left Panel - Chat (Hidden on mobile, shown as overlay) */}
        <div className="hidden lg:flex lg:w-1/3 border-r border-gray-200 flex-col">
          <ChatInterface
            messages={session.chatHistory || []}
            onSendMessage={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Center Panel - Code Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("jsx")}
                  className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded ${
                    activeTab === "jsx"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  JSX
                </button>
                <button
                  onClick={() => setActiveTab("css")}
                  className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded ${
                    activeTab === "css"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  CSS
                </button>
              </div>
              <h2 className="text-xs sm:text-sm font-medium text-gray-700">
                {activeTab === "jsx" ? "JSX Editor" : "CSS Editor"}
              </h2>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {activeTab === "jsx" ? (
              <CodeEditor
                value={currentCode}
                onChange={handleCodeChange}
                language="typescript"
              />
            ) : (
              <CodeEditor
                value={currentCSS}
                onChange={handleCSSChange}
                language="css"
              />
            )}
          </div>
        </div>

        {/* Right Panel - Preview and Properties */}
        <div className="w-full lg:w-1/3 border-l-0 lg:border-l border-t lg:border-t-0 border-gray-200 flex flex-col min-h-[50vh] lg:min-h-0">
          {/* Live Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2">
              <h2 className="text-xs sm:text-sm font-medium text-gray-700">
                Live Preview
              </h2>
            </div>
            <div className="flex-1 bg-white min-h-0">
              <LivePreview
                code={currentCode || ""}
                css={currentCSS || ""}
                props={previewProps}
              />
            </div>
          </div>

          {/* Property Editor */}
          <div className="h-48 sm:h-64 lg:h-1/3 border-t border-gray-200">
            <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2">
              <h2 className="text-xs sm:text-sm font-medium text-gray-700">
                Properties
              </h2>
            </div>
            <div className="h-full overflow-auto">
              <PropertyEditor
                selectedElement={selectedElement}
                currentProps={previewProps}
                onPropsChange={handlePropertyUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chat Interface - Floating */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <div className="w-80 max-w-[calc(100vw-2rem)]">
          <ChatInterface
            messages={session.chatHistory || []}
            onSendMessage={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          code={currentCode}
          sessionName={session.title}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
