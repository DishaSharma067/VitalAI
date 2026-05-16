import { useState } from "react";
import axios from "axios";
import { FaMicrophone } from "react-icons/fa";

function Chatbot() {

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your AI Health Assistant.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Voice Recognition
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.lang = "en-US";

  const startListening = () => {

    recognition.start();

    recognition.onresult = (event) => {

      const transcript =
        event.results[0][0].transcript;

      setInput(transcript);
    };
  };

  // Send Message
  const handleSend = async () => {

    if (!input.trim()) return;

    const userMessage = {
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    const userInput = input;

    setInput("");
    setLoading(true);

    try {

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `You are an AI healthcare assistant. Give short and useful health advice: ${userInput}`,
                },
              ],
            },
          ],
        }
      );

      const aiText =
        response.data.candidates[0].content.parts[0].text;

      const aiMessage = {
        sender: "ai",
        text: aiText,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // AI Voice Response
      const speech = new SpeechSynthesisUtterance(aiText);
      speech.lang = "en-US";

      window.speechSynthesis.speak(speech);

    } catch (error) {

      const errorMessage = {
        sender: "ai",
        text: "Error getting AI response.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  return (
    <div className="w-full h-full backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-5 border-b border-white/10">

        <h2 className="text-2xl font-bold text-cyan-400">
          VitalAI Assistant
        </h2>

      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map((msg, index) => (

          <div
            key={index}
            className={`max-w-[80%] p-4 rounded-2xl ${
              msg.sender === "user"
                ? "bg-cyan-500 ml-auto"
                : "bg-slate-700"
            }`}
          >

            <p className="text-white whitespace-pre-line">
              {msg.text}
            </p>

          </div>

        ))}

        {loading && (

          <div className="bg-slate-700 p-4 rounded-2xl w-fit">

            <p className="text-white">
              Thinking...
            </p>

          </div>

        )}

      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 flex gap-3">

        <input
          type="text"
          placeholder="Ask health questions..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-800 text-white p-4 rounded-xl outline-none"
        />

        {/* Voice Button */}
        <button
          onClick={startListening}
          className="bg-slate-700 text-cyan-400 px-5 rounded-xl hover:scale-105 transition"
        >
          <FaMicrophone />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          className="bg-cyan-400 text-black px-6 rounded-xl font-bold hover:scale-105 transition"
        >
          Send
        </button>

      </div>

    </div>
  );
}

export default Chatbot;