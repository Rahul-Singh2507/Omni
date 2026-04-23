import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useSelector } from "react-redux";
import remarkGfm from "remark-gfm";
import { useChat } from "../hooks/useChat";

const SUGGESTED_PROMPTS = [
  {
    title: "Debug a problem",
    description: "Trace an issue step by step and suggest a clean fix.",
    prompt: "Help me debug an issue in my project and explain the root cause clearly.",
  },
  {
    title: "Plan a feature",
    description: "Turn a rough idea into a practical implementation plan.",
    prompt: "Help me plan the next feature for my app with a clear implementation approach.",
  },
  {
    title: "Explain a topic",
    description: "Get a clean breakdown with simple language and structure.",
    prompt: "Explain this topic clearly in simple steps with examples where useful.",
  },
];

const markdownComponents = {
  p: ({ children }) => (
    <p className="mb-3 text-[15px] leading-7 text-slate-200 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-2 pl-5 text-slate-200">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-2 pl-5 text-slate-200">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-3 text-2xl font-semibold text-white">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 text-xl font-semibold text-white">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 text-lg font-semibold text-white">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-cyan-400/60 pl-4 text-slate-300">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={getSafeExternalHref(href)}
      className="text-cyan-300 underline decoration-cyan-500/40 underline-offset-4"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded-md border border-white/10 bg-[#0b1630] px-1.5 py-0.5 text-sm text-cyan-200">
        {children}
      </code>
    ) : (
      <code className="block overflow-x-auto text-sm text-cyan-100">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-2xl border border-white/10 bg-[#07101f] p-4">
      {children}
    </pre>
  ),
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
};

function SparkIcon({ className = "size-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.75L14.42 9.58L21.25 12L14.42 14.42L12 21.25L9.58 14.42L2.75 12L9.58 9.58L12 2.75Z"
        className="fill-cyan-300"
      />
      <path d="M18.5 4.5L19.3 6.7L21.5 7.5L19.3 8.3L18.5 10.5L17.7 8.3L15.5 7.5L17.7 6.7L18.5 4.5Z" className="fill-cyan-200" />
    </svg>
  );
}

function PlusIcon({ className = "size-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ className = "size-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7H20M4 12H20M4 17H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className = "size-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon({ className = "size-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 11.5L18.5 4.75C19.25 4.4 20.07 5.11 19.85 5.91L16.11 19.39C15.87 20.25 14.72 20.38 14.3 19.59L10.99 13.38C10.87 13.16 10.68 12.98 10.46 12.86L4.25 9.55C3.46 9.13 3.59 7.98 4.45 7.74L10.9 5.95"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.95 13.05L19.35 4.65"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatTileIcon({ className = "size-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.75 7.5C4.75 6.01 5.96 4.8 7.45 4.8H16.55C18.04 4.8 19.25 6.01 19.25 7.5V13.5C19.25 14.99 18.04 16.2 16.55 16.2H10.4L6.6 19.2V16.2H7.45C5.96 16.2 4.75 14.99 4.75 13.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatChatDate(value) {
  if (!value) {
    return "New conversation";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getChatPreview(chat) {
  const lastMessage = chat?.messages?.[chat.messages.length - 1]?.content;
  return lastMessage || "Open this conversation";
}

function getSafeExternalHref(href) {
  if (typeof href !== "string" || !href.trim()) {
    return "#";
  }

  try {
    const parsed = new URL(href, "https://placeholder.local");
    const allowedProtocols = new Set(["http:", "https:", "mailto:"]);

    if (!allowedProtocols.has(parsed.protocol)) {
      return "#";
    }

    return href;
  } catch {
    return "#";
  }
}

const Dashboard = () => {
  const chat = useChat();
  const messagesRef = useRef(null);
  const [chatInput, setChatInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isLoading = useSelector((state) => state.chat.isLoading);
  const error = useSelector((state) => state.chat.error);
  const user = useSelector((state) => state.auth.user);

  const sortedChats = Object.values(chats || {}).sort(
    (left, right) =>
      new Date(right.lastUpdated || 0).getTime() -
      new Date(left.lastUpdated || 0).getTime()
  );

  const activeChat = currentChatId ? chats[currentChatId] : null;
  const activeMessages = activeChat?.messages || [];
  const hasMessages = activeMessages.length > 0;
  const showConversationLoader = isLoading && currentChatId && !hasMessages;

  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
  }, []);

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [currentChatId, activeMessages.length, isLoading]);

  const submitMessage = async (messageOverride) => {
    const trimmed = (messageOverride ?? chatInput).trim();

    if (!trimmed || isLoading) {
      return;
    }

    setChatInput("");
    await chat.handleSendMessage({
      message: trimmed,
      chatId: currentChatId,
    });
  };

  const handleSubmitMessage = async (event) => {
    event.preventDefault();
    await submitMessage();
  };

  const handlePromptClick = async (prompt) => {
    await submitMessage(prompt);
  };

  const handleOpenChat = async (chatId) => {
    setSidebarOpen(false);
    await chat.handleOpenChat(chatId, chats);
  };

  const handleNewChat = () => {
    chat.handleStartNewChat();
    setChatInput("");
    setSidebarOpen(false);
  };

  const handleKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitMessage();
    }
  };

  return (
    <main className="min-h-screen bg-[#020816] text-slate-100">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_32%),linear-gradient(180deg,_#05101f_0%,_#020816_100%)]">
        <div className="flex min-h-screen">
          <div
            onClick={() => setSidebarOpen(false)}
            className={`fixed inset-0 z-30 bg-[#020816]/70 backdrop-blur-sm transition md:hidden ${
              sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}
          />

          <aside
            className={`fixed inset-y-0 left-0 z-40 flex w-[296px] flex-col border-r border-white/6 bg-[#05111d]/95 px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300 md:static md:z-auto md:translate-x-0 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between md:block">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
                  <SparkIcon className="size-6" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">
                    Omni
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-white">
                    AI Chat
                  </h1>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 md:hidden"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              A focused workspace for chat history, deep answers, and quick iterations.
            </p>

            <button
              type="button"
              onClick={handleNewChat}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-[linear-gradient(90deg,rgba(34,211,238,0.18),rgba(8,145,178,0.1))] px-4 py-4 text-sm font-semibold text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.12)] transition hover:border-cyan-300/50 hover:bg-[linear-gradient(90deg,rgba(34,211,238,0.24),rgba(8,145,178,0.12))]"
            >
              <PlusIcon />
              New Chat
            </button>

            <div className="mt-8 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">
                Recent History
              </p>
              <span className="rounded-full border border-white/8 px-2.5 py-1 text-[11px] text-slate-400">
                {sortedChats.length}
              </span>
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
              {sortedChats.length > 0 ? (
                sortedChats.map((chatItem) => {
                  const isActive = chatItem.id === currentChatId;

                  return (
                    <button
                      key={chatItem.id}
                      type="button"
                      onClick={() => handleOpenChat(chatItem.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-cyan-400/40 bg-cyan-400/12 shadow-[0_0_20px_rgba(34,211,238,0.10)]"
                          : "border-transparent bg-white/[0.03] hover:border-white/8 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                            isActive
                              ? "border-cyan-400/30 bg-cyan-400/12 text-cyan-200"
                              : "border-white/8 bg-white/[0.04] text-slate-400"
                          }`}
                        >
                          <ChatTileIcon className="size-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {chatItem.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                            {getChatPreview(chatItem)}
                          </p>
                          <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                            {formatChatDate(chatItem.lastUpdated)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-2xl border border-white/6 bg-white/[0.03]"
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-slate-400">
                  Your chats will appear here once you start a conversation.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
                  {(user?.username || user?.email || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {user?.username || "Omni User"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {user?.email || "Signed in"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-screen flex-1 flex-col md:border-l md:border-white/6">
            <header className="sticky top-0 z-20 border-b border-white/6 bg-[#050d19]/80 backdrop-blur-xl">
              <div className="flex items-center justify-between px-4 py-4 md:px-8">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 md:hidden"
                  >
                    <MenuIcon />
                  </button>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">
                      Main Workspace
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
                      {activeChat?.title || "Omni AI"}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 md:block">
                    {currentChatId ? "Conversation open" : "Ready for a new chat"}
                  </div>

                  <button
                    type="button"
                    onClick={handleNewChat}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/15"
                  >
                    <PlusIcon />
                    <span className="hidden sm:inline">New Chat</span>
                  </button>
                </div>
              </div>
            </header>

            <div className="flex flex-1 flex-col px-4 py-4 md:px-8 md:py-6">
              <div className="flex flex-1 flex-col overflow-hidden rounded-[32px] border border-[#16304a] bg-[linear-gradient(180deg,rgba(7,17,33,0.96),rgba(4,10,21,0.96))] shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
                <div ref={messagesRef} className="messages flex-1 overflow-y-auto px-4 py-5 md:px-10 md:py-10">
                  {error && (
                    <div className="mx-auto mb-6 w-full max-w-4xl rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  {hasMessages ? (
                    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                      {activeMessages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`w-full rounded-[28px] border px-5 py-4 md:px-6 ${
                              message.role === "user"
                                ? "max-w-2xl border-cyan-400/20 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(15,23,42,0.75))] text-slate-50 shadow-[0_12px_40px_rgba(13,148,136,0.10)]"
                                : "max-w-3xl border-white/8 bg-white/[0.04] text-slate-100"
                            }`}
                          >
                            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400">
                              <span
                                className={`inline-block size-2 rounded-full ${
                                  message.role === "user" ? "bg-cyan-300" : "bg-slate-400"
                                }`}
                              />
                              {message.role === "user" ? "You" : "Omni AI"}
                            </div>

                            {message.role === "user" ? (
                              <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-50">
                                {message.content}
                              </p>
                            ) : (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                              >
                                {message.content || ""}
                              </ReactMarkdown>
                            )}
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-md rounded-[28px] border border-white/8 bg-white/[0.04] px-5 py-4 text-slate-300">
                            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-400">
                              <span className="inline-block size-2 rounded-full bg-cyan-300" />
                              Omni AI
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="size-2 animate-pulse rounded-full bg-cyan-300" />
                              <span className="size-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" />
                              <span className="size-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:240ms]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : showConversationLoader ? (
                    <div className="mx-auto flex h-full w-full max-w-4xl flex-col justify-center gap-5">
                      <div className="h-7 w-52 animate-pulse rounded-full bg-white/[0.05]" />
                      <div className="h-32 animate-pulse rounded-[28px] border border-white/6 bg-white/[0.03]" />
                      <div className="h-24 w-[78%] animate-pulse rounded-[28px] border border-white/6 bg-white/[0.03]" />
                    </div>
                  ) : (
                    <div className="mx-auto flex h-full w-full max-w-5xl flex-col items-center justify-center px-2 text-center">
                      <div className="flex size-20 items-center justify-center rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle,_rgba(34,211,238,0.18),_rgba(15,23,42,0.85))] shadow-[0_0_50px_rgba(34,211,238,0.10)]">
                        <SparkIcon className="size-9" />
                      </div>

                      <h3 className="mt-8 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                        Start a sharper conversation.
                      </h3>

                      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
                        Ask a question, plan a feature, or debug an issue. Your main chat workspace stays focused on the conversations your app actually supports.
                      </p>

                      <div className="mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-3">
                        {SUGGESTED_PROMPTS.map((item) => (
                          <button
                            key={item.title}
                            type="button"
                            onClick={() => handlePromptClick(item.prompt)}
                            className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 text-left transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.06]"
                          >
                            <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                              <SparkIcon className="size-5" />
                            </div>
                            <p className="mt-5 text-lg font-semibold text-white">
                              {item.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {item.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/6 bg-[#050e1c]/80 px-4 pb-4 pt-4 md:px-8 md:pb-6">
                  <form
                    onSubmit={handleSubmitMessage}
                    className="mx-auto flex w-full max-w-4xl items-end gap-3"
                  >
                    <div className="flex-1 rounded-[28px] border border-white/8 bg-white/[0.03] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                      <textarea
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="Describe what you want to explore..."
                        className="max-h-40 min-h-[32px] w-full resize-none bg-transparent text-[15px] leading-7 text-white outline-none placeholder:text-slate-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isLoading}
                      className="inline-flex size-14 shrink-0 items-center justify-center rounded-[22px] border border-cyan-400/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.95),rgba(6,182,212,0.75))] text-slate-950 shadow-[0_18px_35px_rgba(34,211,238,0.18)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.06] disabled:text-slate-500 disabled:shadow-none"
                    >
                      <SendIcon />
                    </button>
                  </form>

                  <p className="mt-4 text-center text-[11px] uppercase tracking-[0.28em] text-slate-500">
                    Omni can make mistakes. Verify important responses.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
