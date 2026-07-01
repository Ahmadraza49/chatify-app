import { ArrowLeftIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setSelectedUser(null);
      }
    };

    window.addEventListener("keydown", handleEscKey);

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [setSelectedUser]);

  return (
    <div className="h-16 px-3 md:px-6 flex items-center justify-between bg-slate-800/60 border-b border-slate-700/50">

      {/* Left Side */}
      <div className="flex items-center gap-3">

        {/* Mobile Back Button */}
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden text-slate-300 hover:text-white"
        >
          <ArrowLeftIcon size={22} />
        </button>

        {/* Avatar */}
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-10 md:w-12 rounded-full">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
            />
          </div>
        </div>

        {/* User Info */}
        <div>
          <h3 className="text-white text-sm md:text-base font-semibold truncate max-w-[150px] md:max-w-none">
            {selectedUser.fullName}
          </h3>

          <p
            className={`text-xs ${
              isOnline ? "text-green-400" : "text-slate-400"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Desktop Close Button */}
      <button
        onClick={() => setSelectedUser(null)}
        className="hidden md:block text-slate-400 hover:text-white transition"
      >
        ✕
      </button>
    </div>
  );
}

export default ChatHeader;
