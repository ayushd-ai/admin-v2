import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { adminApi } from "../services/adminApi";

import type {
  Prompt,
  PromptVersionHistory,
  PromptDiff,
  CreatePromptRequest,
} from "../types/admin";
import { BotIcon,  MenuIcon, MoveLeft } from "lucide-react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { html as diffHtml } from 'diff2html/lib-esm/diff2html';
import 'diff2html/bundles/css/diff2html.min.css';

interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved: Date | null;
}

interface CreationState {
  identifier: string;
  name: string;
  isActive: boolean;
  isDirty: boolean;
}

export default function PromptEditor() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Core state
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Creation mode state
  const isCreationMode = identifier === 'new';
  const [creationState, setCreationState] = useState<CreationState>({
    identifier: '',
    name: '',
    isActive: true,
    isDirty: false,
  });
  
  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  
  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    content: "",
    isDirty: false,
    lastSaved: null,
  });
  const [saving, setSaving] = useState(false);
  
  // Version management
  const [versionHistory, setVersionHistory] = useState<PromptVersionHistory | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  

  const [compareMode, setCompareMode] = useState(false);
  const [compareFromVersion, setCompareFromVersion] = useState<number | null>(null);
  const [compareToVersion, setCompareToVersion] = useState<number | null>(null);
  const [diffData, setDiffData] = useState<PromptDiff | null>(null);
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);
  const [loadingVersion, setLoadingVersion] = useState(false);
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectionToChat, setSelectionToChat] = useState<string | undefined>(undefined);
  const textareaRef = useState<HTMLTextAreaElement | null>(null)[0];
  const setTextareaRef = (el: HTMLTextAreaElement | null) => {
  };

  // Preview diff state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewGenerating, setPreviewGenerating] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Token estimate state
  const [tokenEstimate, setTokenEstimate] = useState<number | null>(null);
  const [estimatingTokens, setEstimatingTokens] = useState(false);
  const [displayedTokens, setDisplayedTokens] = useState(0);
  const loadingCounterRef = useRef<number | null>(null);
  const settleIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isCreationMode) {
      fetchPrompts();
    } else {
      setLoading(false);
    }
  }, [isCreationMode]);

  useEffect(() => {
    if (!identifier) return;
    
    if (isCreationMode) {
      // Creation mode - setup for new prompt
      setCurrentPrompt(null);
      setEditorState({
        content: "",
        isDirty: false,
        lastSaved: null,
      });
      setVersionHistory(null);
      setSelectedVersion(null);
      setLoadingVersion(false);
      setCompareMode(false);
      setCompareFromVersion(null);
      setCompareToVersion(null);
      setLoading(false);
      setCreationState({
        identifier: '',
        name: '',
        isActive: true,
        isDirty: false,
      });
    } else if (prompts.length > 0) {
      // Edit mode - find existing prompt
      const prompt = prompts.find(p => p.identifier === identifier);
      if (prompt) {
        setCurrentPrompt(prompt);
        setEditorState({
          content: prompt.template || "",
          isDirty: false,
          lastSaved: new Date(prompt.updatedAt),
        });
        setSelectedVersion(null);
        setLoadingVersion(false);
        setCompareMode(false);
        setCompareFromVersion(null);
        setCompareToVersion(null);
        fetchVersionHistory(identifier);
        setEditingName(prompt.name); // Initialize name editing state
      }
    }
  }, [identifier, prompts, isCreationMode]);

  // Reset token estimate state when switching prompts/identifier
  useEffect(() => {
    setTokenEstimate(null);
    setDisplayedTokens(0);
    setEstimatingTokens(false);
    if (loadingCounterRef.current) {
      clearInterval(loadingCounterRef.current);
      loadingCounterRef.current = null;
    }
    if (settleIntervalRef.current) {
      clearInterval(settleIntervalRef.current);
      settleIntervalRef.current = null;
    }
  }, [identifier]);

  // Auto-fetch token estimate when opening an identifier (edit mode)
  useEffect(() => {
    if (identifier && !isCreationMode) {
      handleEstimateTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, isCreationMode]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (loadingCounterRef.current) {
        clearInterval(loadingCounterRef.current);
        loadingCounterRef.current = null;
      }
      if (settleIntervalRef.current) {
        clearInterval(settleIntervalRef.current);
        settleIntervalRef.current = null;
      }
    };
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getPrompts();
      setPrompts(response);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      setError("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionHistory = async (promptIdentifier: string) => {
    try {
      const history = await adminApi.getPromptVersions(promptIdentifier);
      setVersionHistory(history);
      
      // Auto-select versions for comparison (current and previous)
      if (history.versions.length >= 2) {
        const sortedVersions = history.versions.sort((a, b) => b.version - a.version);
        setCompareToVersion(sortedVersions[0].version); // Latest/current version
        setCompareFromVersion(sortedVersions[1].version); // Previous version
      }
    } catch (error) {
      console.error("Failed to fetch version history:", error);
    }
  };

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) =>
      searchQuery === "" ||
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.identifier.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prompts, searchQuery]);

  const handlePromptSelect = (prompt: Prompt) => {
    if (editorState.isDirty) {
      const confirmLeave = confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmLeave) return;
    }
    
    navigate(`/admin/prompts/editor/${prompt.identifier}`);
  };

  const handleEditorChange = (value: string) => {
    setEditorState(prev => ({
      ...prev,
      content: value,
      isDirty: isCreationMode ? value !== "" : value !== (currentPrompt?.template || ""),
    }));
  };

  const handleCreationFieldChange = (field: keyof CreationState, value: any) => {
    setCreationState(prev => ({
      ...prev,
      [field]: value,
      isDirty: true,
    }));
  };

  const handleNameSave = async () => {
    if (!currentPrompt || !editingName.trim() || editingName === currentPrompt.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await adminApi.updatePrompt(currentPrompt.id, {
        name: editingName.trim(),
      });
      
      // Refresh prompts to get updated name
      await fetchPrompts();
      setIsEditingName(false);
    } catch (error: any) {
      console.error("Failed to update prompt name:", error);
      setError(error.response?.data?.error || "Failed to update prompt name");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (isCreationMode) {
      // Handle prompt creation
      if (!creationState.identifier || !creationState.name || !editorState.content) {
        setError("Please fill in all required fields (identifier, name, and template)");
        return;
      }

      try {
        setSaving(true);
        setError(null);
        
        const createData: CreatePromptRequest = {
          identifier: creationState.identifier,
          name: creationState.name,
          template: editorState.content,
          isActive: creationState.isActive,
        };
        
        const newPrompt = await adminApi.createPrompt(createData);
        
        // Navigate to the new prompt's edit page
        navigate(`/admin/prompts/editor/${newPrompt.identifier}`);
      } catch (error: any) {
        console.error("Failed to create prompt:", error);
        setError(error.response?.data?.error || "Failed to create prompt");
      } finally {
        setSaving(false);
      }
    } else {
      // Handle prompt update
      if (!currentPrompt || !editorState.isDirty) return;

      try {
        setSaving(true);
        setError(null);
        
        await adminApi.updatePromptTemplate(
          currentPrompt.id, 
          editorState.content,
          `Updated template via editor`
        );
        
        setEditorState(prev => ({
          ...prev,
          isDirty: false,
          lastSaved: new Date(),
        }));
        
        // Refresh the current prompt and version history
        await fetchPrompts();
        if (identifier) {
          await fetchVersionHistory(identifier);
          // Refresh token estimate after saving
          try {
            const r = await adminApi.getPromptTokenSize(identifier);
            const t = r?.totalEstimatedTokens ?? 0;
            setTokenEstimate(t);
            setDisplayedTokens(t);
          } catch {
            // ignore token estimate refresh errors
          }
        }
      } catch (error: any) {
        console.error("Failed to save prompt:", error);
        setError(error.response?.data?.error || "Failed to save prompt");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleVersionSelect = async (version: number) => {
    if (!versionHistory || !identifier) return;
    
    const versionData = versionHistory.versions.find(v => v.version === version);
    if (!versionData) return;

    try {
      setLoadingVersion(true);
      setSelectedVersion(version);
      
      // Fetch the actual version content from API
      const fullVersionData = await adminApi.getPromptVersion(identifier, version);
      
      setEditorState({
        content: fullVersionData.template || "",
        isDirty: false,
        lastSaved: new Date(versionData.createdAt),
      });
      
      // Exit compare mode when selecting a version to view
      setCompareMode(false);
    } catch (error: any) {
      console.error("Failed to fetch version content:", error);
      setError(error.response?.data?.error || "Failed to load version content");
      setSelectedVersion(null);
    } finally {
      setLoadingVersion(false);
    }
  };

  const handleCompareVersions = async () => {
    if (!identifier || compareFromVersion === null || compareToVersion === null) return;
    
    try {
      const diff = await adminApi.getPromptDiff(identifier, compareFromVersion, compareToVersion);
      setDiffData(diff);
      setCompareMode(true);
    } catch (error) {
      console.error("Failed to get diff:", error);
      setError("Failed to compare versions");
    }
  };

  const handleRevert = async (version: number) => {
    if (!identifier) return;
    
    const confirmRevert = confirm(`Are you sure you want to revert to version ${version}? This will create a new version.`);
    if (!confirmRevert) return;
    
    try {
      await adminApi.revertPromptToVersion(identifier, version, {
        changeMessage: `Reverted to version ${version}`
      });
      
      await fetchPrompts();
      await fetchVersionHistory(identifier);
      setSelectedVersion(null);
    } catch (error: any) {
      console.error("Failed to revert:", error);
      setError(error.response?.data?.error || "Failed to revert to version");
    }
  };

  const renderLineNumbers = (content: string) => {
    const lines = content.split('\n');
    const maxLineNumber = lines.length;
    const padding = maxLineNumber.toString().length;
    
    return lines.map((_, index) => (
      <div 
        key={index} 
        className="text-gray-400 text-sm font-mono select-none pr-3 text-right border-r border-gray-200"
        style={{ 
          minWidth: `${Math.max(padding * 8 + 16, 40)}px`,
          lineHeight: '1.5rem'
        }}
      >
        {String(index + 1).padStart(padding, ' ')}
      </div>
    ));
  };

  const renderDiffView = () => {
    if (!diffData) return null;
    
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Comparing version {diffData.version1} → {diffData.version2}
              </h3>
              {/* <p className="text-sm text-gray-600 mt-1">Side-by-side comparison</p> */}
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-3">
                <span className="flex items-center text-blue-600 font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  {diffData.summary.linesChanged} lines changed
                </span>
                {diffData.summary.nameChanged && (
                  <span className="flex items-center text-orange-600 font-medium">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Name changed
                  </span>
                )}
                {diffData.summary.variablesChanged && (
                  <span className="flex items-center text-purple-600 font-medium">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Variables changed
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCompareMode(false)}
                className="bg-white hover:bg-gray-50"
              >
                Exit Compare
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="grid grid-cols-2 h-full">
            {/* Left side - Old version */}
            <div className="border-r border-gray-300">
              <div className="bg-red-50 border-b border-red-200 px-4 py-2">
                <h4 className="text-sm font-semibold text-red-800">Version {diffData.version1} (Old)</h4>
              </div>
              <div className="font-mono text-sm overflow-auto h-full">
                {diffData.templateDiff.map((line, index) => (
                  <div key={`old-${index}`} className="flex">
                    <div className="w-12 bg-gray-100 text-gray-500 text-center border-r border-gray-200 py-1 text-xs">
                      {line.lineNumber}
                    </div>
                    <div className={`flex-1 px-3 py-1 ${
                      line.type === 'removed' ? 'bg-red-100 text-red-900' :
                      line.type === 'modified' ? 'bg-red-100 text-red-900' :
                      'bg-white text-gray-700'
                    }`}>
                      {line.type === 'added' ? '' : line.oldLine}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right side - New version */}
            <div>
              <div className="bg-green-50 border-b border-green-200 px-4 py-2">
                <h4 className="text-sm font-semibold text-green-800">Version {diffData.version2} (New)</h4>
              </div>
              <div className="font-mono text-sm overflow-auto h-full">
                {diffData.templateDiff.map((line, index) => (
                  <div key={`new-${index}`} className="flex">
                    <div className="w-12 bg-gray-100 text-gray-500 text-center border-r border-gray-200 py-1 text-xs">
                      {line.lineNumber}
                    </div>
                    <div className={`flex-1 px-3 py-1 ${
                      line.type === 'added' ? 'bg-green-100 text-green-900' :
                      line.type === 'modified' ? 'bg-green-100 text-green-900' :
                      'bg-white text-gray-700'
                    }`}>
                      {line.type === 'removed' ? '' : line.newLine}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Build a unified diff between two strings, line-based
  const generateUnifiedDiff = (oldStr: string, newStr: string, fileName: string) => {
    const a = oldStr.split('\n');
    const b = newStr.split('\n');
    const n = a.length;
    const m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
        else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    const lines: string[] = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        lines.push(' ' + a[i]);
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        lines.push('-' + a[i]);
        i++;
      } else {
        lines.push('+' + b[j]);
        j++;
      }
    }
    while (i < n) { lines.push('-' + a[i]); i++; }
    while (j < m) { lines.push('+' + b[j]); j++; }

    const oldStart = n > 0 ? 1 : 0;
    const newStart = m > 0 ? 1 : 0;
    const header = `--- a/${fileName}\n+++ b/${fileName}\n@@ -${oldStart},${n} +${newStart},${m} @@\n`;
    return header + lines.join('\n') + '\n';
  };

  const openPreview = () => {
    if (selectedVersion !== null || loadingVersion) return;
    try {
      setPreviewGenerating(true);
      setPreviewError(null);
      const before = isCreationMode ? '' : (currentPrompt?.template || '');
      const after = editorState.content || '';
      const fileName = (currentPrompt?.identifier || creationState.identifier || 'prompt.txt') + '.txt';
      const unified = generateUnifiedDiff(before, after, fileName);
      const html = diffHtml(unified, {
        // inputFormat: 'diff',
        drawFileList: false,
        matching: 'lines',
        outputFormat: 'line-by-line',
      });
      setPreviewHtml(html);
      setIsPreviewOpen(true);
    } catch (e: any) {
      console.error('Failed to generate preview diff:', e);
      setPreviewError('Failed to generate preview');
    } finally {
      setPreviewGenerating(false);
    }
  };

  // Token estimate helpers
  const startLoadingCounter = (startFrom: number) => {
    setDisplayedTokens(startFrom);
    if (loadingCounterRef.current) clearInterval(loadingCounterRef.current);
    loadingCounterRef.current = window.setInterval(() => {
      setDisplayedTokens(prev => {
        const increment = Math.max(1, Math.floor(prev * 0.02) + 3);
        const cap = (editorState.content?.length || 0) * 2 + 100;
        const next = prev + increment;
        return next > cap ? cap : next;
      });
    }, 60);
  };

  const smoothSettleTo = (finalValue: number) => {
    if (loadingCounterRef.current) {
      clearInterval(loadingCounterRef.current);
      loadingCounterRef.current = null;
    }
    if (settleIntervalRef.current) clearInterval(settleIntervalRef.current);
    const durationMs = 400;
    const stepMs = 16;
    const steps = Math.ceil(durationMs / stepMs);
    let currentStep = 0;
    const start = displayedTokens;
    const delta = finalValue - start;
    settleIntervalRef.current = window.setInterval(() => {
      currentStep += 1;
      const progress = Math.min(1, currentStep / steps);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(start + delta * eased);
      setDisplayedTokens(value);
      if (progress >= 1) {
        if (settleIntervalRef.current) {
          clearInterval(settleIntervalRef.current);
          settleIntervalRef.current = null;
        }
      }
    }, stepMs);
  };

  const handleEstimateTokens = async () => {
    if (!identifier || isCreationMode || estimatingTokens) return;
    try {
      setEstimatingTokens(true);
      startLoadingCounter(tokenEstimate ?? 0);
      const res = await adminApi.getPromptTokenSize(identifier);
      const tokens = res?.totalEstimatedTokens ?? 0;
      setTokenEstimate(tokens);
      smoothSettleTo(tokens);
    } catch (err) {
      console.error('Failed to fetch token estimate', err);
      setError('Failed to fetch token estimate');
      if (loadingCounterRef.current) {
        clearInterval(loadingCounterRef.current);
        loadingCounterRef.current = null;
      }
    } finally {
      setEstimatingTokens(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading prompts...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        {!sidebarCollapsed && (
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Prompts</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <MoveLeft />
                </Button>
              </div>
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto space-y-2 p-2">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handlePromptSelect(prompt)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    prompt.identifier === identifier 
                      ? 'bg-blue-100 border-blue-300 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-medium text-sm text-start text-gray-900">{prompt.name}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono text-start px-2 py-1 rounded">
                    {prompt.identifier}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-400">
                      {new Date(prompt.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {prompt.template.length.toLocaleString()} chars
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sidebarCollapsed && (
          <div className="pr-4 py-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarCollapsed(false)}
            >
              <MenuIcon />
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isCreationMode ? (
                <div>
                  <h1 className="text-2xl text-start font-bold ">Create New Prompt</h1>
                  <p className="text-start text-gray-600">Fill in the details below </p>
                </div>
              ) : currentPrompt ? (
                <div>
                  {isEditingName ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleNameSave();
                          }
                          if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setEditingName(currentPrompt.name);
                          }
                        }}
                        onBlur={handleNameSave}
                        className="text-2xl font-bold border-none shadow-none p-0 h-auto focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleNameSave}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingName(false);
                          setEditingName(currentPrompt.name);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <h1 
                      className="text-2xl text-start font-bold cursor-pointer hover:text-gray-600 transition-colors"
                      onClick={() => setIsEditingName(true)}
                      title="Click to edit prompt name"
                    >
                      {currentPrompt.name}
                    </h1>
                  )}
                  <p className="text-start text-gray-600">{currentPrompt.identifier}</p>
                  {selectedVersion !== null && (
                    <div className="text-start mt-2">
                      <Badge variant="info">Viewing version {selectedVersion}</Badge>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex items-center space-x-3">
              {selectedVersion !== null && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedVersion(null);
                    setLoadingVersion(false);
                    if (currentPrompt) {
                      setEditorState({
                        content: currentPrompt.template || "",
                        isDirty: false,
                        lastSaved: new Date(currentPrompt.updatedAt),
                      });
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Back to Current
                </Button>
              )}
              {(editorState.isDirty || creationState.isDirty) && (
                <Badge variant="error">Unsaved changes</Badge>
              )}
              {editorState.lastSaved && !isCreationMode && (
                <span className="text-sm text-gray-500">
                  Last saved: {editorState.lastSaved.toLocaleTimeString()}
                </span>
              )}
              {!isCreationMode && (
                <Button
                  variant="outline"
                  onClick={() => setShowVersionPanel(!showVersionPanel)}
                >
                  History
                </Button>
              )}
              {(selectedVersion === null) && (editorState.isDirty || (isCreationMode && editorState.content !== "")) ? (
                <Button
                  onClick={openPreview}
                  disabled={saving || loadingVersion}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Preview
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={
                    saving || 
                    loadingVersion ||
                    (!isCreationMode && (!editorState.isDirty || selectedVersion !== null)) ||
                    (isCreationMode && (!creationState.identifier || !creationState.name || !editorState.content))
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? 
                    (isCreationMode ? "Creating..." : "Saving...") : 
                    loadingVersion ? "Loading..." : 
                    selectedVersion !== null ? "Viewing History" : 
                    isCreationMode ? "Create Prompt" : "Save"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Creation Form (only in creation mode) */}
        {isCreationMode && (
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifier *
                  </label>
                  <Input
                    value={creationState.identifier}
                    onChange={(e) => handleCreationFieldChange('identifier', e.target.value)}
                    placeholder="unique-prompt-identifier"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    value={creationState.name}
                    onChange={(e) => handleCreationFieldChange('name', e.target.value)}
                    placeholder="Prompt display name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    value={creationState.isActive ? "active" : "inactive"}
                    onChange={(e) => handleCreationFieldChange('isActive', e.target.value === 'active')}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Editor Toolbar */}
            <div className={`border-b border-gray-200 px-4 py-2 text-sm flex items-center justify-between ${
              selectedVersion !== null ? 'bg-blue-50' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  {editorState.content?.split('\n').length || 0} lines
                </span>
                <span className="text-gray-600">
                  {editorState.content?.length || 0} characters
                </span>
                 <span 
                  className="text-gray-600 inline-flex items-center rounded px-2 py-1"
                >
                  <span className="mr-1">Token estimate:</span>
                  <span className={`  'text-gray-800'}`}>
                    {estimatingTokens ? displayedTokens : (tokenEstimate ?? '—')}
                  </span>
                </span>
                {loadingVersion && (
                  <span className="text-blue-600 font-medium">
                    Loading version content...
                  </span>
                )}
                {selectedVersion !== null && !loadingVersion && (
                  <span className="text-blue-600 font-medium">
                    Viewing version {selectedVersion}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={lineNumbers}
                    onChange={(e) => setLineNumbers(e.target.checked)}
                  />
                  <span>Line numbers</span>
                </label>
                {!compareMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // If selection exists, pass it; otherwise open chat empty
                      setIsChatOpen(true)
                    }}
                  >
                    Add selection to chat
                  </Button>
                )}
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden">
              {compareMode ? (
                renderDiffView()
              ) : loadingVersion ? (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading version content...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex bg-white shadow-inner">
                  {lineNumbers && (
                    <div className="bg-gray-50 border-r border-gray-200 px-2 py-4 min-w-[50px] flex flex-col">
                      {renderLineNumbers(editorState.content || "")}
                    </div>
                  )}
                  <div className="flex-1 relative">
                    <textarea
                      value={editorState.content || ""}
                      onChange={(e) => handleEditorChange(e.target.value)}
                      readOnly={selectedVersion !== null}
                      // events
                      onMouseUp={(e) => {
                        const target = e.currentTarget as HTMLTextAreaElement
                        const start = target.selectionStart
                        const end = target.selectionEnd
                        if (start !== end) {
                          setSelectionToChat((editorState.content || '').slice(start, end))
                        }
                      }}
                      onKeyUp={(e) => {
                        const target = e.currentTarget as HTMLTextAreaElement
                        const start = target.selectionStart
                        const end = target.selectionEnd
                        if (start !== end) {
                          setSelectionToChat((editorState.content || '').slice(start, end))
                        }
                      }}
                      className={`w-full h-full p-4 border-none outline-none resize-none font-mono text-sm ${
                        selectedVersion !== null 
                          ? 'bg-blue-50 cursor-default text-gray-700' 
                          : 'bg-white text-gray-900 focus:bg-gray-50'
                      } transition-colors duration-200`}
                      style={{ 
                        lineHeight: '1.5rem',
                        tabSize: 2
                      }}
                      spellCheck={false}
                      placeholder={selectedVersion !== null 
                        ? `Viewing version ${selectedVersion} (read-only)`
                        : "Enter your prompt template here...\n\nTip: Use {{variable}} for template variables"
                      }
                    />
                    {/* Subtle grid overlay for better visual alignment */}
                    <div className="absolute inset-0 pointer-events-none opacity-5">
                      <div className="h-full bg-gradient-to-b from-gray-200 via-transparent to-transparent bg-[length:100%_1.5rem]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isCreationMode && showVersionPanel && versionHistory && (
            <div className="w-80 border-l bg-white">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-lg font-medium">Version History</h3>
                <p className="text-sm text-gray-600">
                  Current: v{versionHistory.versions[0]?.version}
                </p>
              </div>
              
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Compare from:</label>
                    <Select
                      value={compareFromVersion?.toString() || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCompareFromVersion(value ? Number(value) : null);
                      }}
                      options={[
                        { value: "", label: "Select version..." },
                        ...versionHistory.versions.map(v => ({
                          value: v.version.toString(),
                          label: `v${v.version}${v.isActive ? ' (current)' : ''}`
                        }))
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Compare to:</label>
                    <Select
                      value={compareToVersion?.toString() || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCompareToVersion(value ? Number(value) : null);
                      }}
                      options={[
                        { value: "", label: "Select version..." },
                        ...versionHistory.versions.map(v => ({
                          value: v.version.toString(),
                          label: `v${v.version}${v.isActive ? ' (current)' : ''}`
                        }))
                      ]}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCompareVersions}
                    disabled={!compareFromVersion || !compareToVersion || compareFromVersion === compareToVersion || loadingVersion}
                    className="w-full"
                  >
                    {!compareFromVersion || !compareToVersion 
                      ? "Select versions to compare" 
                      : compareFromVersion === compareToVersion 
                        ? "Select different versions"
                        : "Compare Versions"
                    }
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 p-3">
                {versionHistory.versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                      selectedVersion === version.version 
                        ? 'bg-blue-100 border-blue-300 shadow-sm' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                    } ${loadingVersion ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => handleVersionSelect(version.version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-sm text-gray-900">
                            v{version.version}
                          </span>
                          {version.isActive && (
                            <Badge variant="success" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mb-1">
                          Updated:
                          <span className="text-gray-700">
                          {new Date(version.createdAt).toLocaleString()}
                            </span> 
                        </div>
                        {version.changeMessage && (
                          <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mt-2">
                            {version.changeMessage}
                          </div>
                        )}
                      </div>
                      {!version.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevert(version.version);
                          }}
                          className="text-xs ml-2 text-black-600 border-gray-200 hover:border-gray-500"
                        >
                          Revert
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          variant='ghost'
          size="icon"
          className="rounded-full shadow-md border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700"
          onClick={() => {
            setIsChatOpen(true)
          }}
        >
          <BotIcon  className="w-5 h-5" />
        </Button>
      </div>

      {currentPrompt && (
        <ChatWidget
          open={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          promptId={currentPrompt.id}
          promptIdentifier={currentPrompt.identifier}
          appendText={selectionToChat}
          onAppendConsumed={() => setSelectionToChat(undefined)}
        />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsPreviewOpen(false)}></div>
          <div className="relative bg-white w-[90vw] max-w-5xl max-h-[80vh] rounded-lg shadow-lg flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview changes</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setIsPreviewOpen(false)}>×</button>
            </div>
            <div className="flex-1 overflow-auto">
              <style>{`
                .diff2html--wrapper .d2h-code-linenumber,
                .diff2html--wrapper .d2h-code-side-linenumber,
                .diff2html--wrapper .d2h-info {
                  position: static !important;
                  left: auto !important;
                  right: auto !important;
                  top: auto !important;
                  z-index: auto !important;
                }
              `}</style>
              {previewGenerating ? (
                <div className="p-6 text-gray-600">Generating preview...</div>
              ) : previewError ? (
                <div className="p-6 text-red-600">{previewError}</div>
              ) : (
                <div className="diff2html--wrapper" dangerouslySetInnerHTML={{ __html: previewHtml || '' }} />
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Back</Button>
              <Button
                onClick={async () => {
                  await handleSave();
                  setIsPreviewOpen(false);
                }}
                disabled={saving || (isCreationMode && (!creationState.identifier || !creationState.name || !editorState.content))}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (isCreationMode ? 'Creating...' : 'Saving...') : (isCreationMode ? 'Create Prompt' : 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-md p-4 shadow-lg z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 