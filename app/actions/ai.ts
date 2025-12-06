"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";

// Helper to get the API key from cookies or env
async function getGenAI() {
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("gemini_api_key")?.value || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key not found. Please set it in the settings.");
  }

  return new GoogleGenerativeAI(apiKey);
}

export async function generateChatResponse(history: { role: string; parts: string }[], message: string) {
  try {
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      })),
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    return { text: response.text() };
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return { error: error.message || "Failed to generate response." };
  }
}

export async function generateImageFromImpression(bookTitle: string, history: { role: string; parts: string }[]) {
  try {
    const genAI = await getGenAI();
    const cookieStore = await cookies();

    // Cookieから画像生成モデルを取得（デフォルト: nano-banana）
    const selectedModel = cookieStore.get("image_model")?.value || "nano-banana";
    const modelName = selectedModel === "pro-banana"
      ? "gemini-3-pro-image-preview"
      : "gemini-2.5-flash-image";

    // 1. Generate a prompt for the image based on the chat history
    const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const promptGenChat = textModel.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.parts }]
      })),
    });

    const promptRequest = `Based on our discussion about "${bookTitle}", create a detailed prompt for an AI image generator to visualize the user's impression or the scene we discussed. The prompt should be in English, descriptive, and artistic. Output ONLY the prompt.`;
    const promptResult = await promptGenChat.sendMessage(promptRequest);
    const imagePrompt = promptResult.response.text();

    // 2. Generate the image
    // ナノバナナとプロバナナで設定が異なる
    const modelConfig = selectedModel === "nano-banana"
      ? {
        model: modelName,
        generationConfig: {
          // IMAGE のみを指定して画像生成を強制（じぇみからのアドバイス）
          responseModalities: ['IMAGE'],
        },
      }
      : {
        model: modelName,
      };

    const imageModel = genAI.getGenerativeModel(modelConfig as any);
    const result = await imageModel.generateContent(imagePrompt);
    const response = result.response;

    const part = response.candidates?.[0]?.content?.parts?.[0];

    // デバッグ: レスポンス構造を詳細にログ出力
    console.log("=== Image Generation Debug ===");
    console.log("Model:", modelName);
    console.log("Part keys:", part ? Object.keys(part) : "part is undefined");
    console.log("Part:", JSON.stringify(part, null, 2));

    if (part && part.inlineData) {
      // 3. Translate the English prompt to Japanese for display
      const translationResult = await promptGenChat.sendMessage(
        `Translate the following English text to Japanese. Output ONLY the Japanese translation:\n\n${imagePrompt}`
      );
      const japanesePrompt = translationResult.response.text();

      return {
        image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        prompt: japanesePrompt
      };
    }

    // エラー時にレスポンス詳細を返す
    return {
      error: `Format not supported. Part structure: ${JSON.stringify(part ? Object.keys(part) : null)}. Full part: ${JSON.stringify(part)?.substring(0, 500)}`
    };

  } catch (error: any) {
    console.error("AI Image Error:", error);
    return { error: error.message || "Failed to generate image." };
  }
}

export async function findAuthor(bookTitle: string) {
  try {
    // 1. Get candidates from Google Books API (Top 5)
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookTitle)}&maxResults=5`);
    const data = await response.json();

    if (!data.items || data.items.length === 0) return null;

    // Format candidates for AI selection
    const candidates = data.items.map((item: any, index: number) => {
      const info = item.volumeInfo;
      const authors = info.authors ? info.authors.join(", ") : "Unknown";
      return `${index + 1}. Title: ${info.title}, Author(s): ${authors}, Description: ${info.description ? info.description.substring(0, 100) + "..." : "N/A"}`;
    }).join("\n");

    // 2. Use Gemini to pick the most likely/famous one
    const genAI = await getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      The user is searching for the author of the book "${bookTitle}".
      Here are the top search results from Google Books:
      ${candidates}

      Identify the most famous, original, or classic author for this book title.
      Ignore parodies, summaries, 'in the style of', or derivative works unless the user's title specifically implies them.
      If the most famous book with this title is listed, return ONLY that author's name.
      If the correct author is not in the list but you are certain who it is (e.g. for a very famous classic), you may output that name.
      Output ONLY the author's name.
    `;

    const result = await model.generateContent(prompt);
    const author = result.response.text().trim();

    // Fallback: If AI returns something weird or empty, use the first result from API
    if (!author || author.length > 50) {
      const firstBook = data.items[0].volumeInfo;
      if (firstBook.authors && firstBook.authors.length > 0) {
        return firstBook.authors.join(", ");
      }
    }

    return author;

  } catch (error) {
    console.error("Hybrid Author Search Error:", error);
    // Fallback if AI fails completely
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookTitle)}&maxResults=1`);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo;
        if (book.authors) return book.authors.join(", ");
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }
}
