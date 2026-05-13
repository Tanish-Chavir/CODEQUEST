import { GoogleGenAI } from "@google/genai";
import { YoutubeTranscript } from "youtube-transcript";
import dotenv from "dotenv";
dotenv.config();

async function testAI() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log("Fetching transcript...");
    const transcriptData = await YoutubeTranscript.fetchTranscript("w7ejDZ8SWv8");
    const fullText = transcriptData.map(t => t.text).join(" ").slice(0, 1000);
    console.log("Transcript fetched. Length:", fullText.length);

    console.log("Generating AI...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Summarize this: " + fullText,
    });
    console.log("AI Response:", response.text);
  } catch (err) {
    console.error("Test Error:", err);
  }
  process.exit(0);
}
testAI();
