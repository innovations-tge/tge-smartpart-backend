const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Multer for file uploads (stored in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Store your key in Render as env var
});
const openai = new OpenAIApi(configuration);

// Endpoint
app.post("/analyze-part", upload.single("photo"), async (req, res) => {
  try {
    const { brand, partNumber, description } = req.body;
    const file = req.file;

    if (!brand || !partNumber) {
      return res.status(400).json({ error: "Brand and partNumber are required." });
    }

    let fileDetails = file ? `A datasheet or image is also provided.` : "No file uploaded.";

    const prompt = `
You are a technical parts analyst AI.

The customer provided:
- Brand: ${brand}
- Part Number: ${partNumber}
- Description: ${description || "None provided"}
- ${fileDetails}

Return a JSON response including:
1. lifecycle: one of ["Active", "Obsolete", "NRND", "Unknown"]
2. alternatives: suggest 2-3 alternative brands and part numbers with similar spec and price tier.
3. datasheet: a public datasheet link if possible.

Be concise. Format the result as JSON only.
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo", // <- SAFE and available to all API users
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const rawReply = completion.data.choices[0].message.content;

    // Try to safely parse GPT output
    try {
      const result = JSON.parse(rawReply);
      res.json(result);
    } catch (err) {
      console.error("Error parsing JSON:", rawReply);
      res.status(500).json({ error: "AI response malformed. Try again." });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ TGE SmartPart Backend Running.");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
