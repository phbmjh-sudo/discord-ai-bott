import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

const SYSTEM_NOTE = `
Bạn là một trợ lý AI hữu ích trong Discord, nói tiếng Việt tự nhiên.
Trả lời đúng trọng tâm, thân thiện, dễ hiểu. Có thể hỗ trợ học tập, viết,
dịch, lập trình và phân tích hình ảnh. Nếu không chắc, hãy nói rõ là không chắc.
Không tự nhận mình là ChatGPT hay con người. Không tiết lộ API key hoặc bí mật.
`;

export async function askGemini(history, userText, imageParts = []) {
  const contents = [
    ...history,
    { role: "user", parts: [{ text: userText || "Hãy xem hình ảnh này và giúp tôi." }, ...imageParts] }
  ];

  const result = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_NOTE,
      maxOutputTokens: 1800,
      temperature: 0.7
    }
  });

  const answer = result.text?.trim();
  if (!answer) throw new Error("AI không trả về nội dung. Thử hỏi lại nhé.");
  return answer;
}

export async function createImage(prompt) {
  const result = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: { responseModalities: ["IMAGE"] }
  });

  const parts = result.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.data);
  if (!imagePart) {
    const reason = result.candidates?.[0]?.finishReason || "không rõ nguyên nhân";
    throw new Error(`AI chưa tạo được ảnh (${reason}). Thử mô tả lại nhé.`);
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType || "image/png"
  };
}
