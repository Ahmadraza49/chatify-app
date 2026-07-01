import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();

  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="p-3 md:p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">

          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group flex-shrink-0"
          >
            <img
              src={selectedImg || authUser.profilePic || "/avatar.png"}
              alt="User"
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover"
            />

            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-[10px] text-white">
                Edit
              </span>
            </div>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="min-w-0">
            <h3 className="text-white text-sm md:text-base font-semibold truncate">
              {authUser.fullName}
            </h3>

            <p className="text-xs text-green-400">
              Online
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">

          <button
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch(() => {});
              toggleSound();
            }}
            className="p-2 rounded-lg hover:bg-slate-700"
          >
            {isSoundEnabled ? (
              <Volume2Icon size={20} />
            ) : (
              <VolumeOffIcon size={20} />
            )}
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-600"
          >
            <LogOutIcon size={20} />
          </button>

        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
