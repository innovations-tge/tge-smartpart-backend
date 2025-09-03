const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// File upload config
const upload = multer({ storage: multer.memoryStorage() });

// OpenAI config
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST endpoint for smart part checker
app.post("/check-part", upload.single("photo"), async (req, res) => {
  const { brand, partNumber, description } = req.body;
  const file = req.file; // optional

  if (!brand || !partNumber) {
    return res.status(400).json({ error: "Brand and part number are required." });
  }

  try {
    const prompt = `
You are TGE-AI, an intelligent industrial assistant.
Given the following details, provide the following:
1. Part Lifecycle status (Active, Obsolete, Limited)
2. 2-3 equivalent alternatives from similar spec/tier brands
3. Datasheet download URL if publicly available (or suggest to contact supplier)

Brand: ${brand}
Part Number: ${partNumber}
Description: ${description || "N/A"}
`;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const aiResponse = chatCompletion.choices[0].message.content;
    res.json({ result: aiResponse });
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("✅ TGE Smart Part Backend is Running!");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
