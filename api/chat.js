export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({
        error: "Pesan tidak boleh kosong"
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: "Kamu adalah MAWZZ AI, asisten AI yang ramah, pintar, dan membantu. Jawab dalam bahasa yang digunakan pengguna. Untuk informasi terbaru, jangan mengaku sudah memverifikasi jika belum memiliki sumber terkini."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Groq API mengalami masalah"
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Tidak ada jawaban."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Terjadi kesalahan pada server."
    });
  }
}
