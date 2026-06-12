const express = require("express");
const cors = require("cors");
const path = require("path");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ================= API KEYS =================

// 🔑 OPENROUTER KEY
const OPENROUTER_KEY = "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";

// 🔑 TAVILY KEY
const TAVILY_API_KEY = "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";

// =================================================

let chatHistory = [];

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// CHAT API
app.post("/chat", async (req, res) => {

  try {

    const { message, web } = req.body;

const lowerMsg = message.toLowerCase();

if (
lowerMsg.includes("date") ||
lowerMsg.includes("time") ||
lowerMsg.includes("today") ||
lowerMsg.includes("aaj")
) {

return res.json({
reply:
"📅 " +
new Date().toLocaleString("en-IN",{
dateStyle:"full",
timeStyle:"short"
})
});

}

    // ================= WEB SEARCH =================

    if (web) {
  try {

    const webRes = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: message,
          search_depth: "basic",
          max_results: 5
        })
      }
    );

    const webData = await webRes.json();

    let result = "No live result found.";

    if (
      webData.results &&
      webData.results.length > 0
    ) {
      result =
        webData.results[0].content ||
        webData.results[0].title ||
        result;
    }

    return res.json({
      reply: "🌐 " + result
    });

  } catch (err) {

    console.log(err);

    return res.json({
      reply: "⚠️ Tavily Search Error"
    });

  }
}

    // ================= AI =================

    const today =
      new Date().toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short"
      });

    const systemPrompt = `
You are SigmaXBot.

Today's date and time:
${today}

Rules:
- Give smart answers
- Talk naturally
- Give correct information
- Be futuristic and friendly
- If user asks today's date or time, always use current server date.
- Never search the web for date or time.
- Give direct answers.
- If someone asks who created you, say "Medhansh Bisht created me."

IMPORTANT:
- If someone asks:
  "Who made you?"
  "Who created you?"
  "Tumhe kisne banaya?"
  "Who is your owner?"
  "Who developed you?"

Then reply:
"I was created by Medhansh Bisht 😎🔥"
`;

    chatHistory.push({
      role: "user",
      content: message
    });

    const aiRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {

        method: "POST",

        headers: {

          "Authorization":
            `Bearer ${OPENROUTER_KEY}`,

          "Content-Type":
            "application/json",

          "HTTP-Referer":
            "http://localhost:3000",

          "X-Title":
            "SigmaXBot"
        },

        body: JSON.stringify({

          model:
            "openai/gpt-3.5-turbo",

          temperature: 0.5,

          messages: [

            {
              role: "system",
              content: systemPrompt
            },

            ...chatHistory.slice(-8)
          ]
        })
      }
    );

    const aiData = await aiRes.json();

    let reply =
      aiData.choices?.[0]?.message?.content
      || "⚠️ No response";

    chatHistory.push({
      role: "assistant",
      content: reply
    });

    res.json({
      reply
    });

  }

  catch (err) {

    console.log(err);

    res.json({
      reply: "⚠️ Server Error"
    });
  }
});

// RESET
app.post("/reset", (req, res) => {

  chatHistory = [];

  res.json({
    success: true
  });
});

// START
app.listen(3000, () => {

  console.log(
    "🚀 SigmaXBot Running On http://localhost:3000"
  );

});
