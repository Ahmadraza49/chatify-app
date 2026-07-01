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
<div className="relative w-full h-screen max-w-7xl mx-auto">
    <BorderAnimatedContainer className="flex flex-col md:flex-row w-full h-full">
        {/* LEFT SIDE */}
       <div
  className={`${
    selectedUser ? "hidden md:flex" : "flex"
  } w-full md:w-80 bg-slate-800/50 backdrop-blur-sm flex-col`}
>
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE */}
       <div
  className={`${
    !selectedUser ? "hidden md:flex" : "flex"
  } flex-1 flex-col bg-slate-900/50 backdrop-blur-sm`}
>
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;
