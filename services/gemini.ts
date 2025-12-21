import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const describeImage = async (base64Data: string, mimeType: string, userQuestion?: string): Promise<string> => {
  try {
    const systemPrompt = `
      You are an expert AI Analyst and Tutor. Your task is to analyze the provided image with high precision.
      
      LANGUAGE REQUIREMENT:
      - You must answer in **BENGALI** (Bangla) language.
      - Translate any technical terms if necessary but keep common mathematical notation.

      MATH FORMATTING (STRICT RULES):
      - Write all mathematical equations, formulas, and variables using **LaTeX**.
      - **INLINE MATH**: Enclose in single dollar signs: $x^2 + y^2 = z^2$
      - **BLOCK MATH**: Enclose in double dollar signs: $$ \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$
      - **IMPORTANT**: Do NOT use markdown bolding (**) or italics (*) *inside* LaTeX blocks. It breaks rendering.
      - Ensure every opening $ has a closing $.
      
      INSTRUCTIONS:
      1. **Problem Solving**: If the image contains a math problem, logic puzzle, quiz, or homework question:
         - Solve it step-by-step in Bengali.
         - **VERIFICATION STEP**: Before outputting the final answer, re-calculate the steps internally. Ensure units, arithmetic, and logic are 100% correct.
         - If the image contains multiple questions, solve them in order.
      
      2. **User Question**: If the user provided a specific question ("${userQuestion || ''}"), prioritize answering that specific inquiry based on the visual evidence.

      3. **General Analysis**: If there are no questions/text, provide a detailed description of the contents, artistic style, and colors in Bengali.

      4. **Safety & Accuracy**: 
         - Do not hallucinate details. If text is blurry, say it is unreadable.
         - Do not provide misinformation. If you are unsure of an answer, state your confidence level.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: userQuestion 
              ? `User Question: ${userQuestion}. \n\n ${systemPrompt}`
              : systemPrompt,
          },
        ],
      },
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze image using Gemini.");
  }
};