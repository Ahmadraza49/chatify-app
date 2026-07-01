import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();

  return (
    <div className="w-full h-[100dvh]">
      <BorderAnimatedContainer className="flex flex-col md:flex-row h-full">

        {/* LEFT */}
        <div
          className={`
            ${selectedUser ? "hidden md:flex" : "flex"}
            flex-col
            w-full
            md:w-80
            md:flex-shrink-0
            bg-slate-800/50
            backdrop-blur-sm
            min-h-0
          `}
        >
          <ProfileHeader />

          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT */}
        <div
          className={`
            ${!selectedUser ? "hidden md:flex" : "flex"}
            flex-1
            flex-col
            bg-slate-900/50
            backdrop-blur-sm
            min-h-0
            overflow-hidden
          `}
        >
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>

      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;
