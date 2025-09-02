const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Route for smart part checker
app.post('/api/check-part', async (req, res) => {
  const { brand, partNumber, description } = req.body;

  if (!brand || !partNumber) {
    return res.status(400).json({ error: 'Brand and Part Number are required.' });
  }

  try {
    const prompt = `
You are TGE-AI, an industrial procurement assistant. Analyze the following part:
- Brand: ${brand}
- Part Number: ${partNumber}
- Description (optional): ${description || "N/A"}

Return:
1. Lifecycle status (Active / Obsolete / Unknown)
2. 2–3 alternative brand suggestions with similar part numbers and specs
3. A public datasheet link (if possible)

Respond in a structured JSON format.
`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    });

    const reply = chatResponse.choices[0].message.content;
    res.json({ success: true, data: JSON.parse(reply) });

  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('✅ TGE Backend is running!');
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
