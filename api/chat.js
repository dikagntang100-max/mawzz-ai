module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan"
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "API Key Gemini belum dipasang"
      });
    }

    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Pertanyaan tidak boleh kosong"
      });
    }

    if (message.length > 10000) {
      return res.status(400).json({
        error: "Pertanyaan terlalu panjang"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Kamu adalah MAWZZ AI, asisten AI yang pintar, ramah, dan membantu. Jawab menggunakan bahasa Indonesia kecuali diminta bahasa lain. Jawab pertanyaan lama berdasarkan pengetahuanmu. Untuk informasi terbaru, gunakan Google Search jika diperlukan. Berikan jawaban jelas, akurat, dan sertakan sumber jika tersedia. Jangan mengarang fakta."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: message }]
          }],
          tools: [{
            google_search: {}
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API mengalami masalah"
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "Maaf, belum ada jawaban.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server mengalami kesalahan."
    });
  }
};
