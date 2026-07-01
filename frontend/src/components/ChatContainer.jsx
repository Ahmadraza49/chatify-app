import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    clearMessages, // 👈 IMPORTANT (ensure this exists in store)
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const audioRefs = useRef({});
  const [playingId, setPlayingId] = useState(null);

  // 🔥 FIXED EFFECT
  useEffect(() => {
    if (!selectedUser?._id) return;

    clearMessages?.(); // 👈 prevents old chat showing
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
    clearMessages,
  ]);

  // auto scroll
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const toggleAudio = (id) => {
    const audio = audioRefs.current[id];
    if (!audio) return;

    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    Object.values(audioRefs.current).forEach((a) => {
      if (a && !a.paused) a.pause();
    });

    audio.play();
    setPlayingId(id);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">

      {/* HEADER */}
      <div className="shrink-0">
        <ChatHeader />
      </div>

      {/* MESSAGES */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 md:px-6 py-4 space-y-4">

        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length === 0 ? (
          <NoChatHistoryPlaceholder name={selectedUser?.fullName} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">

            {messages.map((msg) => {
              const senderId =
                typeof msg.senderId === "object"
                  ? msg.senderId._id
                  : msg.senderId;

              const isOwn =
                senderId?.toString() === authUser?._id?.toString();

              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl p-3 max-w-[85%] break-words ${
                      isOwn ? "bg-cyan-600" : "bg-slate-800"
                    }`}
                  >

                    {msg.image && (
                      <img
                        src={msg.image}
                        alt=""
                        className="rounded-xl mb-2 max-h-60 object-cover"
                      />
                    )}

                    {msg.text && (
                      <p className="whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    )}

                    {msg.audio && (
                      <div className="mt-3 flex items-center gap-2">

                        <button
                          onClick={() => toggleAudio(msg._id)}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                        >
                          {playingId === msg._id ? "⏸" : "▶"}
                        </button>

                        <audio
                          ref={(el) => (audioRefs.current[msg._id] = el)}
                          src={msg.audio}
                          onEnded={() => setPlayingId(null)}
                        />

                        <div className="flex-1 h-1 rounded-full bg-white/20">
                          <div className="w-1/2 h-full rounded-full bg-cyan-300"></div>
                        </div>

                      </div>
                    )}

                    <p className="text-right text-[10px] opacity-70 mt-2">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                  </div>
                </div>
              );
            })}

            <div ref={messageEndRef} />
          </div>
        )}

      </div>

      {/* INPUT */}
      <div className="shrink-0 border-t border-slate-700 bg-slate-900">
        <MessageInput />
      </div>

    </div>
  );
}

export default ChatContainer;
