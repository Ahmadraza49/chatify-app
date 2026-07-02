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
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const audioRefs = useRef({});
  const [playingId, setPlayingId] = useState(null);

  // ===========================
  // Load Messages
  // ===========================
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser]);

  // ===========================
  // Auto Scroll
  // ===========================
  useEffect(() => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 100);
  }, [messages]);

  // ===========================
  // Audio Play
  // ===========================
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

  if (!selectedUser) return null;

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">

      <div className="shrink-0">
        <ChatHeader />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">

        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length === 0 ? (
          <NoChatHistoryPlaceholder
            name={selectedUser.fullName}
          />
        ) : (
          <div className="space-y-4">

            {messages.map((msg) => {

              console.log("MESSAGE =>", msg);

              const senderId =
                typeof msg.senderId === "object"
                  ? msg.senderId?._id
                  : msg.senderId;

              const isOwn =
                senderId?.toString() ===
                authUser?._id?.toString();

              return (
                <div
                  key={msg._id}
                  className={`flex ${
                    isOwn
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl p-3 max-w-[80%] ${
                      isOwn
                        ? "bg-cyan-600"
                        : "bg-slate-800"
                    }`}
                  >

                    {/* IMAGE */}

                    {msg.image && (
                      <img
                        src={msg.image}
                        alt=""
                        className="rounded-xl mb-2 max-h-60 object-cover"
                      />
                    )}

                    {/* TEXT */}

                    {msg.text && msg.text.trim() !== "" && (
                      <p className="whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                    )}

                    {/* AUDIO */}

                    {msg.audio && (
                      <div className="mt-3 flex items-center gap-2">

                        <button
                          onClick={() =>
                            toggleAudio(msg._id)
                          }
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                        >
                          {playingId === msg._id
                            ? "⏸"
                            : "▶"}
                        </button>

                        <audio
                          ref={(el) =>
                            (audioRefs.current[msg._id] =
                              el)
                          }
                          src={msg.audio}
                          onEnded={() =>
                            setPlayingId(null)
                          }
                        />

                        <div className="flex-1 h-1 rounded-full bg-white/20">
                          <div className="w-1/2 h-full rounded-full bg-cyan-300"></div>
                        </div>

                      </div>
                    )}

                    {/* DEBUG */}
                    {(!msg.text && !msg.image && !msg.audio) && (
                      <p className="text-red-300 text-xs">
                        Empty Message Received
                      </p>
                    )}

                    <p className="text-right text-[10px] opacity-70 mt-2">
                      {new Date(
                        msg.createdAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                  </div>
                </div>
              );
            })}

            <div ref={messageEndRef}></div>

          </div>
        )}

      </div>

      <div className="shrink-0 border-t border-slate-700 bg-slate-900">
        <MessageInput />
      </div>

    </div>
  );
}

export default ChatContainer;
