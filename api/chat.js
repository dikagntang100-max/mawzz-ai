export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method tidak diizinkan",
    });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY belum dipasang di Vercel",
      });
    }

    const { message, image, fileText, fileName } = req.body || {};

    const systemPrompt = `
Kamu adalah MAWZZ AI, asisten AI yang ramah,
cerdas, informatif, dan menjawab menggunakan bahasa
yang digunakan pengguna.

Jika ditanya siapa pembuatmu, jawab:
"Saya dibuat oleh Budi Gang Maimun Sei Baru."

Jawab pertanyaan dengan jelas dan jujur.
Jangan mengarang fakta. Jika tidak tahu, katakan
bahwa kamu belum mengetahui jawabannya.
`;

    const userContent = [];

    if (message) {
      userContent.push({
        type: "text",
        text: message,
      });
    }

    if (fileText) {
      userContent.push({
        type: "text",
        text: `Isi file ${fileName || "lampiran"}:\n${fileText}`,
      });
    }

    if (image) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: image,
        },
      });
    }

    if (userContent.length === 0) {
      return res.status(400).json({
        error: "Pesan atau lampiran masih kosong",
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: image
            ? "meta-llama/llama-4-scout-17b-16e-instruct"
            : "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gagal menghubungi Groq",
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content ||
        "Maaf, belum ada jawaban.",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Terjadi kesalahan pada server",
    });
  }
}
