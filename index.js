const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" }); // file upload middleware

app.use(cors());
app.use(bodyParser.json());

// 🔐 Initialize OpenAI with your API key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 📦 POST endpoint for part checker
app.post("/check-part", upload.single("photo"), async (req, res) => {
  const { brand, partNumber, description } = req.body;
  const file = req.file;

  try {
    let prompt = `Brand: ${brand}\nPart Number: ${partNumber}\nDescription: ${description}\n\nCheck lifecycle status, compatibility, datasheet info, and suggest alternative parts.`;

    // Optional: add file info if uploaded
    if (file) {
      prompt += `\n\n[User uploaded a datasheet image or label for analysis.]`;
    }

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const reply = response.data.choices[0].message.content;
    res.json({ result: reply });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

// 🟢 Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
