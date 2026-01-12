import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import multer from "multer";
import mammoth from "mammoth";

dotenv.config();

// 1. Setup Multer to store file in memory (RAM) temporarily
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  generationConfig: { responseMimeType: "application/json" }
});

// 2. Modified Generate Function
export const generateFromFile = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { count, difficulty } = req.body; // These now come from FormData

    // 3. Extract text from the Word file buffer
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const extractedText = result.value; 

    // 4. Create the prompt with the extracted text
    const prompt = `
      Based on the following text content, generate ${count} multiple-choice questions.
      Difficulty: ${difficulty}.

      CONTENT START:
      ${extractedText}
      CONTENT END.

      Return a JSON array where each object has:
      - "question": string
      - "options": array of 4 strings
      - "answer": string (exact match)
      - "explanation": string
    `;

    const aiResult = await model.generateContent(prompt);
    const response = await aiResult.response;
    let text = response.text();
    
    // Cleanup
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const quizData = JSON.parse(text);

    res.json({ success: true, quizData });

  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
};