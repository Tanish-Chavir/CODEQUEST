import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const resp = await ai.models.list();
for await (const model of resp) {
  console.log(model.name);
}
