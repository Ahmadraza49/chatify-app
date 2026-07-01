import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const {
    getAllContacts,
    addContact,
    allContacts,
    setSelectedUser,
    isUsersLoading,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    getAllContacts();
  }, []);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Phone Number"
          className="input input-bordered w-full"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={() => {
            if (!phoneNumber.trim()) return;
            addContact(phoneNumber);
            setPhoneNumber("");
          }}
        >
          Add
        </button>
      </div>

      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`avatar ${
                onlineUsers.includes(contact._id) ? "online" : "offline"
              }`}
            >
              <div className="size-12 rounded-full">
                <img
                  src={contact.profilePic || "/avatar.png"}
                  alt={contact.fullName}
                />
              </div>
            </div>

            <div>
              <h4 className="text-slate-200 font-medium">
                {contact.fullName}
              </h4>

              <p className="text-xs text-slate-400">
                {contact.phoneNumber}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default ContactList;