export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb"
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY belum dipasang di Vercel."
      });
    }

    const { message, image, fileText, fileName } = req.body || {};

    if (!message && !image && !fileText) {
      return res.status(400).json({
        error: "Pesan atau lampiran masih kosong."
      });
    }

    if (image && !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
      return res.status(400).json({
        error: "Format gambar tidak didukung."
      });
    }

    const prompt = [
      message || "Tolong jelaskan lampiran ini.",
      fileText
        ? `\n\nIsi dokumen ${fileName || ""}:\n${fileText.slice(0, 30000)}`
        : ""
    ].join("");

    const model = image
      ? "qwen/qwen3.8-27b"
      : "openai/gpt-oss-20b";

    const content = image
      ? [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: image }
          }
        ]
      : prompt;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "Kamu adalah MAWZZ AI, asisten yang ramah, cerdas, dan membantu. Jawab dalam bahasa pengguna. Jika membaca gambar atau dokumen, jelaskan berdasarkan isi yang benar-benar terlihat atau terbaca. Jangan mengarang informasi."
            },
            {
              role: "user",
              content
            }
          ],
          max_completion_tokens: 2048,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Groq API mengalami masalah."
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Tidak ada jawaban."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server mengalami kesalahan."
    });
  }
}
