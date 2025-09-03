const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup (for file upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route
app.post('/analyze-part', upload.single('file'), async (req, res) => {
  const { brand, partNumber, description } = req.body;
  const uploadedFile = req.file;

  if (!brand || !partNumber) {
    return res.status(400).json({ error: 'Brand and Part Number are required.' });
  }

  const fileInfo = uploadedFile
    ? `A file named "${uploadedFile.originalname}" was uploaded for reference.`
    : 'No file was uploaded.';

  const prompt = `
You are a procurement and industrial automation assistant.
Analyze the following:

Brand: ${brand}
Part Number: ${partNumber}
Description: ${description || 'N/A'}
${fileInfo}

Return your response in raw JSON format ONLY like this:
{
  "lifecycle": "Active",
  "alternatives": ["BrandX Model123", "BrandY P456"],
  "datasheet": "https://example.com/sample.pdf",
  "summary": "This is a compact I/O module widely used in Allen-Bradley systems."
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert in industrial part analysis and alternatives." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });

    const raw = response.choices[0].message.content;

    // Safe parse
    try {
      const result = JSON.parse(raw);
      res.json(result);
    } catch (jsonError) {
      console.error("⚠️ JSON Parse Failed:", raw);
      res.status(500).json({ error: "TGE-AI could not return structured data. Please try again." });
    }

  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    res.status(500).json({ error: 'Internal server error while communicating with TGE-AI.' });
  }
});

// Server start
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
