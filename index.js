const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
const upload = multer({ dest: "uploads/" });

// ✅ Set up OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/check-part", upload.single("file"), async (req, res) => {
  try {
    const { brand, partNumber, description } = req.body;

    const prompt = `
You are a technical procurement assistant. Based on the following input:

Brand: ${brand}
Part Number: ${partNumber}
Description: ${description || "No description provided"}

Please answer the following:
1. Is the part number accurate and active? If not, explain.
2. Is the item obsolete or still in production?
3. Suggest 2-3 alternative brands and compatible part numbers of the same specification level.
4. Provide a public URL link to the most relevant datasheet (or write 'Datasheet not found').

Be clear and structured in your output.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
