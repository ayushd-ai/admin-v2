import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/services/adminApi";
import type { AIChatMessage, AIChatRequest } from "@/types/admin";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownFromLine } from "lucide-react";

interface ChatSession {
  id: string;
  isServer: boolean;
  title: string;
  messages: AIChatMessage[];
  createdAt: number;
  updatedAt: number;
  loadedMessages?: boolean;
}

interface ChatWidgetProps {
  open: boolean;
  promptId: string;
  promptIdentifier?: string;
  onClose: () => void;
  appendText?: string;
  onAppendConsumed?: () => void;
}

export function ChatWidget({
  open,
  promptId,
  promptIdentifier,
  onClose,
  appendText,
  onAppendConsumed,
}: ChatWidgetProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [search, setSearch] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const streamingSessionIdRef = useRef<string | null>(null);
  const [view, setView] = useState<"list" | "chat">("list");
  const [direction, setDirection] = useState<1 | -1>(1);

  const storageKey = useMemo(() => `promptChat:${promptId}`, [promptId]);

  const mergeWithLocal = (serverSessions: ChatSession[]) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return serverSessions;
    try {
      const local: ChatSession[] = JSON.parse(raw);
      // Keep only local sessions that are not server-backed
      const locals = local.filter((s) => !s.isServer);
      return [...serverSessions, ...locals].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
    } catch {
      return serverSessions;
    }
  };

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const payload = await adminApi.getPromptChats();
      const list = Array.isArray(payload?.data) ? payload.data : [];
      const filtered = list;
      const mapped: ChatSession[] = filtered.map((c: any) => ({
        id: c.id,
        isServer: true,
        title: c.title || "Chat",
        messages: [],
        createdAt: new Date(c.createdAt).getTime(),
        updatedAt: new Date(c.updatedAt).getTime(),
        loadedMessages: false,
      }));
      setSessions((prev) => {
        const prevById = new Map(prev.map((s) => [s.id, s]));
        const mergedServer = mapped.map((s) => {
          const existing = prevById.get(s.id);
          if (existing) {
            return {
              ...s,
              // preserve existing message state for seamless UX
              messages: existing.messages,
              loadedMessages: existing.loadedMessages,
            };
          }
          return s;
        });
        const mappedIds = new Set(mergedServer.map((s) => s.id));
        const locals = prev.filter((s) => !s.isServer && !mappedIds.has(s.id));
        const next = [...mergedServer, ...locals].sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
        // Do not auto-select first chat; keep list view until user chooses
        return next;
      });
    } catch {
      // Fallback to local-only sessions
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed: ChatSession[] = JSON.parse(raw);
          setSessions(parsed);
          // Do not auto-select; keep list view
        } catch {
          setSessions([]);
        }
      }
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    setLoadingMessages(chatId);
    try {
      const msgs = await adminApi.getPromptChatMessages(chatId);
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === chatId);
        if (idx < 0) return prev;
        const cur = prev[idx];
        const updated: ChatSession = {
          ...cur,
          messages: msgs,
          loadedMessages: true,
          updatedAt: Date.now(),
        };
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    } finally {
      setLoadingMessages(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    // Always open to list view
    setView("list");
    setDirection(1);
    loadChats();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey, open]);

  useEffect(() => {
    if (!appendText || !open) return;
    setInput((prev) => (prev ? `${prev}\n\n${appendText}` : appendText));
    onAppendConsumed && onAppendConsumed();
  }, [appendText, open, onAppendConsumed]);

  useEffect(() => {
    // On session switch, jump to bottom and re-enable autoscroll
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    setAutoScroll(true);
  }, [activeSessionId]);

  useEffect(() => {
    if (!autoScroll) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, autoScroll]);

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const threshold = 48; // px
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setAutoScroll(atBottom);
  };

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, search]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  const upsertSession = (session: ChatSession) => {
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === session.id);
      const next = [...prev];
      if (idx >= 0) next[idx] = session;
      else next.unshift(session);
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  };

  const createNewSession = () => {
    const s: ChatSession = {
      id: crypto.randomUUID(),
      isServer: false,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
    setInput("");
  };

  const renameActiveFromFirstUserLine = (session: ChatSession) => {
    const firstUser = session.messages.find((m) => m.role === "user");
    if (!firstUser) return session;
    const text = firstUser.content.split("\n")[0].slice(0, 40);
    const title = text || "New Chat";
    return { ...session, title };
  };

  const ensureMessagesLoaded = async (session: ChatSession) => {
    if (session.isServer && !session.loadedMessages) {
      await loadMessages(session.id);
    }
  };

  const sendMessage = async () => {
    if (!activeSession || !input.trim() || isStreaming) return;
    const userMsg: AIChatMessage = { role: "user", content: input.trim() };
    const session: ChatSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMsg],
      updatedAt: Date.now(),
    };
    const sessionWithTitle =
      session.title === "New Chat"
        ? renameActiveFromFirstUserLine(session)
        : session;
    upsertSession(sessionWithTitle);
    setInput("");
    setIsStreaming(true);
    streamingSessionIdRef.current = sessionWithTitle.id;

    const onChunk = (text: string) => {
      setSessions((prev) => {
        const targetId = streamingSessionIdRef.current;
        const idx = prev.findIndex((s) => s.id === targetId);
        if (idx < 0) return prev;
        const cur = prev[idx];
        const last = cur.messages[cur.messages.length - 1];
        let msgs = cur.messages;
        if (!last || last.role !== "assistant") {
          msgs = [...msgs, { role: "assistant" as const, content: text }];
        } else {
          const updated = { ...last, content: last.content + text };
          msgs = [...msgs.slice(0, -1), updated];
        }
        const updatedSession: ChatSession = {
          ...cur,
          messages: msgs,
          updatedAt: Date.now(),
        };
        const next = [...prev];
        next[idx] = updatedSession;
        return next;
      });
    };

    const onError = (err: any) => {
      setSessions((prev) => {
        const targetId = streamingSessionIdRef.current;
        const idx = prev.findIndex((s) => s.id === targetId);
        if (idx < 0) return prev;
        const cur = prev[idx];
        const msgs = [
          ...cur.messages,
          { role: "assistant" as const, content: `Error: ${String(err)}` },
        ];
        const updatedSession: ChatSession = {
          ...cur,
          messages: msgs,
          updatedAt: Date.now(),
        };
        const next = [...prev];
        next[idx] = updatedSession;
        return next;
      });
    };

    const onDone = async () => {
      setIsStreaming(false);
      // Refresh chats from server to capture created/updated chats
      await loadChats();
      // Then refresh messages for the streamed chat to persist final state
      const targetId = streamingSessionIdRef.current;
      if (targetId) {
        await loadMessages(targetId);
      }
    };

    const onDelta = (eventName: string, payload: any) => {
      if (eventName !== "delta") return;
      try {
        // Expect payload as AIChatDeltaEvent
        const patches = payload?.patches as Array<{
          op: string;
          p: string;
          v?: any;
        }>;
        if (!Array.isArray(patches)) return;

        // If we have append_string to blocks/0/content, append to current assistant text
        const appends = patches.filter(
          (p) =>
            p.op === "append_string" && p.p.includes("/message/content/blocks/")
        );
        if (appends.length > 0) {
          const deltaText = appends
            .map((a) => (typeof a.v === "string" ? a.v : ""))
            .join("");
          if (deltaText) {
            setSessions((prev) => {
              const targetId = streamingSessionIdRef.current;
              const idx = prev.findIndex((s) => s.id === targetId);
              if (idx < 0) return prev;
              const cur = prev[idx];
              const last = cur.messages[cur.messages.length - 1];
              let msgs = cur.messages;
              if (!last || last.role !== "assistant") {
                msgs = [
                  ...msgs,
                  { role: "assistant" as const, content: deltaText },
                ];
              } else {
                const updated = { ...last, content: last.content + deltaText };
                msgs = [...msgs.slice(0, -1), updated];
              }
              const updatedSession: ChatSession = {
                ...cur,
                messages: msgs,
                updatedAt: Date.now(),
              };
              const next = [...prev];
              next[idx] = updatedSession;
              return next;
            });
          }
        }

        // If a full replace of message content comes, set to the latest assembled text from blocks
        const replace = patches.find(
          (p) => p.op === "replace" && p.p.startsWith("/message/content")
        );
        if (replace && replace.v) {
          const blocks = replace.v?.blocks as Array<{
            type: string;
            content?: string;
          }>;
          if (Array.isArray(blocks)) {
            const text = blocks
              .filter((b) => b.type === "text" && typeof b.content === "string")
              .map((b) => b.content as string)
              .join("");
            setSessions((prev) => {
              const targetId = streamingSessionIdRef.current;
              const idx = prev.findIndex((s) => s.id === targetId);
              if (idx < 0) return prev;
              const cur = prev[idx];
              const last = cur.messages[cur.messages.length - 1];
              let msgs = cur.messages;
              if (!last || last.role !== "assistant") {
                msgs = [...msgs, { role: "assistant" as const, content: text }];
              } else {
                const updated = { ...last, content: text };
                msgs = [...msgs.slice(0, -1), updated];
              }
              const updatedSession: ChatSession = {
                ...cur,
                messages: msgs,
                updatedAt: Date.now(),
              };
              const next = [...prev];
              next[idx] = updatedSession;
              return next;
            });
          }
        }

        // If chat id is replaced in deltas, switch streaming target id
        const chatIdPatch = patches.find(
          (p) => p.op === "replace" && p.p === "/chat/id"
        );
        if (chatIdPatch && typeof chatIdPatch.v === "string") {
          streamingSessionIdRef.current = chatIdPatch.v;
        }
      } catch {
        // Ignore malformed payloads
      }
    };

    const payload: AIChatRequest = {
      messages: sessionWithTitle.messages,
      promptIdentifier,
      chatId: activeSession.isServer ? activeSession.id : undefined,
      // Preferred backend payload
      query: userMsg.content,
      history: sessionWithTitle.messages,
    };

    try {
      await ensureMessagesLoaded(activeSession);
      await adminApi.streamPromptAIChat(
        promptId,
        payload,
        onChunk,
        onError,
        onDone,
        onDelta,
        (chatIdHeader) => {
          if (!activeSession.isServer && chatIdHeader) {
            // Convert local session to server-backed using returned id
            setSessions((prev) => {
              const idx = prev.findIndex((s) => s.id === activeSession.id);
              if (idx < 0) return prev;
              const cur = prev[idx];
              const updated: ChatSession = {
                ...cur,
                id: chatIdHeader,
                isServer: true,
              };
              const next = [...prev];
              next[idx] = updated;
              return next;
            });
            setActiveSessionId(chatIdHeader);
            streamingSessionIdRef.current = chatIdHeader;
          }
        }
      );
    } catch (e) {
      setIsStreaming(false);
    }
  };

  const listVariants = {
    enter: (dir: 1 | -1) => ({ x: dir === 1 ? "-100%" : "100%", opacity: 0 }),
    center: { x: "0%", opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir === 1 ? "100%" : "-100%", opacity: 0 }),
  };

  const chatVariants = {
    enter: (dir: 1 | -1) => ({ x: dir === 1 ? "100%" : "-100%", opacity: 0 }),
    center: { x: "0%", opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir === 1 ? "-100%" : "100%", opacity: 0 }),
  };

  const containerTransition = {
    type: "tween" as const,
    ease: "easeOut" as const,
    duration: 0.28,
  };
  const viewTransition = {
    type: "tween" as const,
    ease: "easeInOut" as const,
    duration: 0.28,
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="chat-widget"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={containerTransition}
          className="fixed bottom-4 left-4 z-50 w-[80vw] max-w-xl h-[76vh] sm:h-[68vh] bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden"
        >
          <div className="relative w-full h-full">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {view === "list" && (
                <motion.div
                  key="list-view"
                  custom={direction}
                  variants={listVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={viewTransition}
                  className="absolute inset-0 flex flex-col"
                >
                  <div className="p-3 border-b border-gray-200 flex items-center gap-2">
                    <Input
                      placeholder="Search chats"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        createNewSession();
                        setDirection(1);
                        setView("chat");
                      }}
                    >
                      New
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      <ArrowDownFromLine color="gray"/>
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loadingChats && (
                      <div className="p-4 text-sm text-gray-500">
                        Loading chats...
                      </div>
                    )}
                    {!loadingChats && filteredSessions.length === 0 && (
                      <div className="p-4 text-sm text-gray-500">
                        No chats yet
                      </div>
                    )}
                    {filteredSessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveSessionId(s.id);
                          if (s.isServer && !s.loadedMessages)
                            loadMessages(s.id);
                          setDirection(1);
                          setView("chat");
                        }}
                        className={`p-3 border text-start rounded-lg m-2 border-gray-300 cursor-pointer hover:bg-gray-50`}
                      >
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {s.title || "Untitled"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(s.updatedAt).toDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {view === "chat" && (
                <motion.div
                  key="chat-view"
                  custom={direction}
                  variants={chatVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={viewTransition}
                  className="absolute inset-0 flex flex-col min-h-0"
                >
                  <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDirection(-1);
                          setView("list");
                        }}
                      >
                        Back
                      </Button>
                      <div>
                        <div className="text-sm font-semibold">
                          AI Assistant
                        </div>
                        {promptIdentifier && (
                          <div className="text-xs text-gray-500">
                            Prompt: {promptIdentifier}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      Close
                    </Button>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                  >
                    {activeSession?.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg border inline-block ${
                            m.role === "user"
                              ? "bg-white border-gray-200 text-right"
                              : "bg-gray-100 border-gray-200 text-gray-900 text-start"
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    ))}
                    {loadingMessages === activeSessionId && (
                      <div className="text-xs text-gray-500">
                        Loading messages...
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-end gap-2">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 border rounded-md p-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your message..."
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || isStreaming}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isStreaming ? "Streaming..." : "Send"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
