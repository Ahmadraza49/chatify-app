import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import {
  ImageIcon,
  SendIcon,
  XIcon,
  MicIcon,
  SquareIcon,
} from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [audio, setAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!text.trim() && !imagePreview && !audio) return;

    if (isSoundEnabled) {
      playRandomKeyStrokeSound();
    }

    sendMessage({
      text: text.trim(),
      image: imagePreview,
      audio,
    });

    setText("");
    setImagePreview(null);
    setAudio(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image.");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const reader = new FileReader();

        reader.onloadend = () => {
          setAudio(reader.result);
        };

        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.stream
      .getTracks()
      .forEach((track) => track.stop());

    setIsRecording(false);
  };

  return (
    <div className="border-t border-slate-700 bg-slate-900 p-2">

      {imagePreview && (
        <div className="mb-2 flex">
          <div className="relative">
            <img
              src={imagePreview}
              alt=""
              className="w-20 h-20 rounded-lg object-cover"
            />

            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {audio && (
        <div className="mb-2 flex items-center gap-2">
          <audio controls className="flex-1">
            <source src={audio} type="audio/webm" />
          </audio>

          <button
            onClick={() => setAudio(null)}
            type="button"
            className="bg-red-500 rounded-full p-2"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 w-full"
      >
        <input
          type="text"
          value={text}
          placeholder="Type message..."
          onChange={(e) => {
            setText(e.target.value);

            if (isSoundEnabled) {
              playRandomKeyStrokeSound();
            }
          }}
          className="flex-1 min-w-0 h-11 rounded-full bg-slate-800 border border-slate-700 px-4 text-white outline-none"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-slate-800 ${
            imagePreview ? "text-cyan-400" : "text-white"
          }`}
        >
          <ImageIcon size={20} />
        </button>

        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-slate-800 text-white"
          >
            <MicIcon size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-red-600 text-white animate-pulse"
          >
            <SquareIcon size={18} />
          </button>
        )}

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview && !audio}
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white"
        >
          <SendIcon size={20} />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
