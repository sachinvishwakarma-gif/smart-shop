const Product = require("../models/Product");

const API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are the shopping assistant for Smart Shop, an Indian online store. Help customers find products.
Rules:
- Always call search_products before recommending anything. Only recommend products the tool returned. Never invent products, prices or specs.
- Prices are in Indian rupees (₹). Mention the price and one reason each product fits.
- Recommend at most 3 products. Keep replies short and friendly.
- If nothing matches, say so and suggest how to widen the search.
- Reply in the same language the customer uses (English, Hindi or Hinglish).`;

const TOOLS = [
  {
    name: "search_products",
    description: "Search the store catalog. Returns matching in-stock products, best rated first.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords such as product type or brand, e.g. 'laptop' or 'running shoes'" },
        category: { type: "string", description: "Optional category, e.g. Laptops, Audio, Phones, Fashion, Home, Wearables" },
        max_price: { type: "number", description: "Optional maximum price in INR" },
      },
      required: [],
    },
  },
];

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "under", "below", "above", "best", "good", "need", "want", "buy",
  "show", "find", "please", "some", "any", "about", "that", "this", "have", "has", "you", "your",
  "can", "get", "looking", "look", "budget", "cheap", "price", "rupees", "inr", "than", "less",
  "within", "upto", "max", "maximum", "suggest", "recommend", "mujhe", "chahiye", "koi",
]);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractKeywords(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !/^\d+$/.test(w) && !STOP_WORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w)); // laptops -> laptop
}

function extractMaxPrice(text) {
  const m = String(text || "").match(
    /(?:under|below|less than|within|upto|up to|max(?:imum)?|budget(?: of)?)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k)?/i
  );
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  if (m[2]) n *= 1000;
  return Number.isFinite(n) && n > 0 ? n : null;
}

const toPublic = (p) => ({
  _id: p._id, name: p.name, brand: p.brand, category: p.category, price: p.price,
  originalPrice: p.originalPrice, rating: p.rating, numReviews: p.numReviews,
  icon: p.icon, imageUrl: p.imageUrl, stock: p.stock,
});

async function searchProducts({ query = "", category, maxPrice, limit = 5 } = {}) {
  const filter = { isActive: true, stock: { $gt: 0 } };
  if (typeof category === "string" && category.trim()) {
    filter.category = new RegExp(escapeRegex(category.trim()), "i");
  }
  const max = Number(maxPrice) || extractMaxPrice(query);
  if (max > 0) filter.price = { $lte: max };

  const rxs = extractKeywords(query).map((w) => new RegExp(escapeRegex(w), "i"));
  if (rxs.length) {
    filter.$or = rxs.flatMap((rx) => [{ name: rx }, { brand: rx }, { category: rx }, { description: rx }]);
  }

  const candidates = await Product.find(filter).sort({ rating: -1, numReviews: -1 }).limit(30).lean();
  const score = (p) => rxs.filter((rx) => rx.test(`${p.name} ${p.brand} ${p.category} ${p.description}`)).length;
  return candidates
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || b.p.rating - a.p.rating)
    .slice(0, limit)
    .map((x) => x.p);
}

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

// API key na ho ya Claude fail ho jaye to yeh simple search chalta hai
async function basicChat(message) {
  const maxPrice = extractMaxPrice(message);
  const found = await searchProducts({ query: message, maxPrice });
  const products = found.slice(0, 3).map(toPublic);
  if (!products.length) {
    return { reply: "I couldn't find matching products. Try a different keyword or a higher budget.", products };
  }
  const lines = products.map((p) => `• ${p.name} (${p.brand}) - ${inr(p.price)}, rated ${p.rating}/5`);
  const head = maxPrice ? `Here are some options under ${inr(maxPrice)}:` : "Here are some options:";
  return { reply: `${head}\n${lines.join("\n")}`, products };
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  const out = history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  while (out.length && out[0].role !== "user") out.shift(); // pehla message user ka hona chahiye
  return out;
}

async function callClaude(messages) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function claudeChat(history, message) {
  const messages = [...history, { role: "user", content: message }];
  const found = new Map();

  for (let i = 0; i < 4; i++) {
    const data = await callClaude(messages);

    if (data.stop_reason !== "tool_use") {
      const reply =
        data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim() ||
        "Sorry, I couldn't come up with an answer.";
      const all = [...found.values()];
      const mentioned = all.filter((p) => reply.includes(p.name));
      return { reply, products: (mentioned.length ? mentioned : all).slice(0, 3) };
    }

    messages.push({ role: "assistant", content: data.content });
    const results = [];
    for (const block of data.content.filter((b) => b.type === "tool_use")) {
      const input = block.input || {};
      const items = await searchProducts({ query: input.query, category: input.category, maxPrice: input.max_price });
      items.forEach((p) => found.set(String(p._id), toPublic(p)));
      results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(items.map(toPublic)) });
    }
    messages.push({ role: "user", content: results });
  }
  return { reply: "Sorry, I'm having trouble finding that right now.", products: [...found.values()].slice(0, 3) };
}

async function chat(message, history = []) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return { ...(await claudeChat(cleanHistory(history), message)), source: "claude" };
    } catch (err) {
      console.error("AI service error, using basic search:", err.message);
    }
  }
  return { ...(await basicChat(message)), source: "basic" };
}

module.exports = { chat, _test: { extractKeywords, extractMaxPrice, cleanHistory } };