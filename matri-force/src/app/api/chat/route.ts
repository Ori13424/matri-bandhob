import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, imageBase64 } = await req.json();

    console.log("📨 Local AI received:", message);

    // 1. Choose Model: Use 'llava' if image is present, otherwise 'llama3.2'
    // Ensure you have run: `ollama pull llama3.2` AND `ollama pull llava` in terminal
    const modelName = imageBase64 ? "llava" : "llama3.2";

    // 2. Construct Payload for Ollama
    const payload: any = {
      model: modelName,
      stream: false, // We wait for full response (simpler for now)
      messages: [
        {
          role: "system",
          content: `You are a maternal health assistant for rural Bangladesh. 
          Help mothers with pregnancy-related questions, emergencies, and health advice.
          If asked about prices, estimate based on Dhaka markets.
          Keep answers short, empathetic, and simple.` 
        },
        {
          role: "user",
          content: message,
          // Attach image if it exists (Ollama expects base64 strings)
          images: imageBase64 ? [imageBase64] : undefined
        }
      ]
    };

    // 3. Call Local Ollama Server
    // Note: 127.0.0.1:11434 is the default Ollama port
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || "Sorry, I am offline.";

    console.log("✅ Local AI Responded:", aiResponse);

    return NextResponse.json({ message: aiResponse });

  } catch (error: any) {
    console.error("🔥 Local AI Failed:", error);
    return NextResponse.json(
      { 
        message: "⚠️ AI is offline. Make sure Ollama is running!", 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}