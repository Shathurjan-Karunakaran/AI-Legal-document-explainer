import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  MessageCircle,
  Send,
  Loader,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  AlertCircle,
  DollarSign,
} from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [document, setDocument] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    setLoading(true);
    setError("");
    setDocument(null);
    setAnalysis(null);
    setChatMessages([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload-document`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setDocument(result);
      setAnalysis(result.analysis);

      // Add welcome message to chat (user-friendly bullet list)
      setChatMessages([
        {
          type: "ai",
          content: (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span role="img" aria-label="success">✅</span>
                <span>Document <strong>{result.filename}</strong> has been successfully analyzed! I now have full access to your document content.</span>
              </div>
              <div className="mt-2 mb-2">Here are some questions you can ask me:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>What are the key terms and conditions?</li>
                <li>Are there any termination clauses?</li>
                <li>What are my obligations under this contract?</li>
                <li>Are there any penalties or fees mentioned?</li>
                <li>What risks should I be aware of?</li>
                <li>Explain the payment terms in simple language</li>
                <li>Are there any auto-renewal clauses?</li>
              </ul>
              <div className="mt-2">Feel free to ask about any specific part of your document!</div>
            </div>
          ),
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(`Failed to upload document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !document || chatLoading) return;

    const userMessage = {
      type: "user",
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);
    setChatInput("");

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          document_id: document.document_id, // Send document_id instead of trying to access document_store
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const result = await response.json();

      const aiMessage = {
        type: "ai",
        content: result.response,
        timestamp: result.timestamp,
      };

      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        type: "ai",
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "medium":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "financial":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "legal":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "operational":
        return <Users className="w-4 h-4 text-purple-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Legal Document Explainer
              </h1>
              <p className="text-gray-600">
                Upload PDFs, get instant analysis, and chat with your documents
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!document && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 rounded-xl p-8 hover:border-blue-400 transition-colors cursor-pointer bg-white/50 backdrop-blur-sm"
              >
                {loading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Processing Document...
                      </p>
                      <p className="text-sm text-gray-600">
                        This may take a few moments
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <Upload className="w-12 h-12 text-blue-600" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Upload Legal Document
                      </p>
                      <p className="text-sm text-gray-600">
                        Click to upload a PDF file (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {document && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Analysis Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Document Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Document Analysis
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setDocument(null);
                      setAnalysis(null);
                      setChatMessages([]);
                      setActiveTab("summary");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Upload New Document
                  </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">
                    {document.filename}
                  </p>
                  <p className="text-sm text-blue-700">
                    {document.text_length?.toLocaleString()} characters
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                  {[
                    { id: "summary", label: "Summary", icon: Eye },
                    { id: "clauses", label: "Key Clauses", icon: FileText },
                    { id: "obligations", label: "Obligations", icon: Users },
                    { id: "risks", label: "Risks", icon: AlertTriangle },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                  {activeTab === "summary" && (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {analysis.summary}
                      </p>
                    </div>
                  )}

                  {activeTab === "clauses" && (
                    <div className="space-y-4">
                      {analysis.key_clauses?.map((clause, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">
                              {clause.clause}
                            </h4>
                            {clause.location && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {clause.location}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">
                            {clause.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "obligations" && (
                    <div className="space-y-4">
                      {analysis.obligations?.map((obligation, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {obligation.party}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {obligation.obligation}
                          </p>
                          {obligation.consequence && (
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              <strong>Consequence:</strong>{" "}
                              {obligation.consequence}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "risks" && (
                    <div className="space-y-4">
                      {analysis.risks?.map((risk, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getRiskTypeIcon(risk.type)}
                              <span className="font-medium text-gray-900">
                                {risk.type} Risk
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getSeverityIcon(risk.severity)}
                              <span className="text-sm font-medium">
                                {risk.severity}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">
                            {risk.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unusual Terms */}
                {analysis.unusual_terms?.length > 0 && (
                  <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="flex items-center space-x-2 font-medium text-yellow-800 mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Unusual Terms Found</span>
                    </h4>
                    <div className="space-y-3">
                      {analysis.unusual_terms.map((term, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border"
                        >
                          <p className="font-medium text-gray-900 text-sm">
                            {term.term}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {term.explanation}
                          </p>
                          {term.recommendation && (
                            <p className="text-xs text-blue-600 mt-2">
                              <strong>Recommendation:</strong>{" "}
                              {term.recommendation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="bg-white rounded-xl shadow-sm border h-fit">
              <div className="p-4 border-b">
                <h3 className="flex items-center space-x-2 font-semibold text-gray-900">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <span>Ask Questions</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Chat about this document
                </p>
              </div>

              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.type === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg">
                      <Loader className="w-4 h-4 animate-spin text-gray-600" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about clauses, risks, obligations..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={chatLoading}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSubmit(e);
                      }
                    }}
                  />
                  <button
                    onClick={handleChatSubmit}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
