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

useEffect(() => {
  if (!selectedUser) return;

  getMessagesByUserId(selectedUser._id);
  subscribeToMessages();

  return () => {
    unsubscribeFromMessages();
  };
}, [selectedUser]);


  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 👇 Debug Logs
  console.log("Selected User:", selectedUser);
  console.log("Messages:", messages);
  console.log("Loading:", isMessagesLoading);

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
console.log("messages.length =", messages.length);
console.log("isMessagesLoading =", isMessagesLoading);
  return (
    <div className="flex flex-col h-full min-h-0">
      <ChatHeader />

<div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-6 py-4 md:py-6">
        {messages.length > 0 && !isMessagesLoading ? (
         <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => {
              console.log("Single Message:", msg);

              const senderId =
                typeof msg.senderId === "object"
                  ? msg.senderId._id
                  : msg.senderId;

              const isOwn =
                senderId.toString() === authUser._id.toString();

              return (
                <div
  key={msg._id}
  style={{
    display: "flex",
    justifyContent: isOwn ? "flex-end" : "flex-start",
    marginBottom: "15px",
  }}
>
                <div
  style={{
    background: isOwn ? "#0891b2" : "#1e293b",
    color: "white",
    padding: "12px",
    borderRadius: "12px",
    maxWidth: "85%",
width: "fit-content",
  }}
>
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Shared"
                        className="rounded-lg h-48 object-cover mb-2"
                      />
                    )}

                    {msg.text && (
                      <p className="break-words whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )}

                    {msg.audio && (
                      <div className="mt-2 flex items-center gap-2 w-full">
                        <button
                          onClick={() => toggleAudio(msg._id)}
                          className={`w-7 h-7 rounded-full ${
                            isOwn
                              ? "bg-white/20"
                              : "bg-white/10"
                          }`}
                        >
                          {playingId === msg._id ? "⏸" : "▶"}
                        </button>

                        <audio
                          ref={(el) =>
                            (audioRefs.current[msg._id] = el)
                          }
                          src={msg.audio}
                          onEnded={() => setPlayingId(null)}
                        />

                        <div className="flex-1 h-1 bg-white/20 rounded-full">
                          <div className="h-full w-1/2 bg-cyan-400"></div>
                        </div>

                        <span className="text-[10px] opacity-60">
                          voice
                        </span>
                      </div>
                    )}

                    <p className="text-xs mt-2 opacity-70 text-right">
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
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder
            name={selectedUser?.fullName}
          />
        )}
      </div>

     <div className="shrink-0">
  <MessageInput />
</div>

</div>
  );
}

export default ChatContainer;
