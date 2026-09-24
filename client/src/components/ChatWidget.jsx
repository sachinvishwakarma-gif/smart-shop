import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../lib/api";
import { Link } from "react-router-dom";

function formatPrice(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me what you're looking for — e.g. \"a laptop under 60000\"." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(text, history);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "...", products: data.products || [] },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>Shopping Assistant</span>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>
                <p>{m.content}</p>
                {m.products?.length > 0 && (
                  <div className="chat-products">
                    {m.products.map((p) => (
                      <Link to="/" key={p._id || p.id} className="chat-product-card">
                        <span className="chat-product-name">{p.name}</span>
                        <span className="chat-product-price">{formatPrice(p.price)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="chat-bubble assistant"><p>Typing...</p></div>}
            <div ref={bottomRef} />
          </div>
          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
            />
            <button type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Toggle chat">
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}