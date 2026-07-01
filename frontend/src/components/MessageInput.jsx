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

const mediaRecorderRef = useRef(null);
const audioChunksRef = useRef([]);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

 const handleSendMessage = (e) => {
  e.preventDefault();

  if (!text.trim() && !imagePreview && !audio) return;

  if (isSoundEnabled) playRandomKeyStrokeSound();

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
    toast.error("Please select an image file");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => setImagePreview(reader.result);
  reader.readAsDataURL(file);
};

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

   const mediaRecorder = new MediaRecorder(stream, {
  mimeType: "audio/webm;codecs=opus",
});

    mediaRecorderRef.current = mediaRecorder;

    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
  console.log("Size:", event.data.size);

  if (event.data.size > 0) {
    audioChunksRef.current.push(event.data);
  }
};
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const reader = new FileReader();

      reader.onloadend = () => {
  console.log(reader.result);
  setAudio(reader.result);
};

      reader.readAsDataURL(audioBlob);
    };

    mediaRecorder.start();

    setIsRecording(true);
  } catch (err) {
    toast.error("Microphone permission denied");
  }
};

const stopRecording = () => {
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.stream
      .getTracks()
      .forEach((track) => track.stop());
  }

  setIsRecording(false);
};
  return (
  <div className="p-2 md:p-4 border-t border-slate-700/50">
    {imagePreview && (
      <div className="max-w-3xl mx-auto mb-3 flex items-center">
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border border-slate-700"
          />

          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
    ) }
    {/* Audio Preview */}
{audio && (
  <div className="max-w-3xl mx-auto mb-3">
    <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
      <audio controls className="w-full">
        <source src={audio} type="audio/webm" />
        Your browser does not support audio.
      </audio>
<button
  type="button"
  onClick={() => setAudio(null)}
  className="ml-2 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
>
  <XIcon className="w-4 h-4" />
</button>
    </div>
  </div>
)}

    <form
  onSubmit={handleSendMessage}
  className="max-w-3xl mx-auto flex items-center gap-3"
>
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);

          if (isSoundEnabled) {
            playRandomKeyStrokeSound();
          }
        }}
       className="flex-1 min-w-0 bg-slate-800 text-white placeholder:text-slate-400 border border-slate-700 rounded-xl py-3 px-3 text-sm md:text-base outline-none"
        placeholder="Type your message..."
      />

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      {/* Image Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`flex-shrink-0 bg-slate-800/50 text-slate-300 hover:text-white rounded-xl p-3` ${
          imagePreview ? "text-cyan-500" : ""
        }`}
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      {/* Mic Button */}
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
         className="flex-shrink-0 bg-slate-800/50 text-slate-300 hover:text-white rounded-xl p-3"
        >
          <MicIcon className="w-5 h-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={stopRecording}
        className="flex-shrink-0 bg-red-600 text-white rounded-xl p-3 animate-pulse"
        >
          <SquareIcon className="w-5 h-5" />
        </button>
      )}

      {/* Send Button */}
      <button
        type="submit"
        disabled={!text.trim() && !imagePreview && !audio}
    className="flex-shrink-0 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl p-3 hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  </div>
);
}

export default MessageInput;
