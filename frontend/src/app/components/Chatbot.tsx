import { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthContext } from "../contexts/AuthContext";
import { tokenStorage } from "../services/authService";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
};

export function Chatbot() {
  const { user, isAuthenticated } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "bot",
      text: isAuthenticated
        ? "Привет! Я твой ИИ-консультант. Задай вопрос о вузах, специальностях или поступлении — помогу!"
        : "Привет! Войди в аккаунт, чтобы я мог учитывать твой профиль при ответах.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Если пользователь не авторизован — отправляем без user_id (бэкенд вернёт 404)
      // Подсказываем войти
      if (!isAuthenticated || !user) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "bot",
              text: "Чтобы я мог отвечать с учётом твоего профиля, пожалуйста, войди в аккаунт.",
            },
          ]);
          setIsTyping(false);
        }, 600);
        return;
      }

      const token = tokenStorage.get();
      const res = await fetch(`${BASE_URL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id: parseInt(user.id), message: userMsg.text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
        throw new Error(err.detail ?? "Request failed");
      }

      const data: { reply: string; message_id: number } = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: data.message_id.toString(), role: "bot", text: data.reply },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Что-то пошло не так";
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "bot", text: `Ошибка: ${msg}` },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-3rem)] sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-[450px] mb-4 origin-bottom-right"
          >
            {/* Header */}
            <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <Bot className="text-white h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Abi2KG Ассистент</h3>
                  <p className="text-indigo-200 text-xs">
                    {isAuthenticated ? `Привет, ${user?.full_name?.split(" ")[0]}!` : "Войди для персонализации"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "bot" && (
                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-indigo-600" />
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-indigo-600" />
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-white border border-gray-100 rounded-tl-sm shadow-sm flex items-center gap-1 text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Спроси о вузах, специальностях..."
                  className="w-full bg-gray-100 border-transparent rounded-full pl-4 pr-10 py-2.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 p-1.5 rounded-full text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center z-50 border-2 border-white"
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
