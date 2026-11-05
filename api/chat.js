export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb"
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "API Key Groq belum dipasang."
      });
    }

    const {
      message,
      image,
      fileText,
      fileName
    } = req.body || {};

    if (!message && !image && !fileText) {
      return res.status(400).json({
        error: "Pesan atau lampiran kosong."
      });
    }

    if (
      image &&
      !/^data:image\/(jpeg|png|webp);base64,/.test(image)
    ) {
      return res.status(400).json({
        error: "Format foto tidak didukung."
      });
    }

    const systemPrompt = `
Kamu adalah MAWZZ AI, asisten kecerdasan buatan yang ramah,
pintar, sopan, dan informatif.

IDENTITAS:
Nama: MAWZZ AI
Pembuat: Budi Gang Maimun Sei Baru.

Jika pengguna bertanya:
"Siapa yang membuatmu?"
"Siapa pembuatmu?"
"Siapa penciptamu?"

Jawab:
"Halo! Saya MAWZZ AI, asisten AI yang dibuat oleh Budi Gang Maimun Sei Baru. Saya siap membantu menjawab pertanyaan dan memberikan informasi kepada kamu!"

ATURAN:
1. Gunakan bahasa sesuai bahasa pengguna.
2. Jawab dengan jelas dan mudah dipahami.
3. Bantu menjawab pertanyaan umum, teknologi, pendidikan,
   dan informasi lainnya.
4. Jangan mengarang fakta.
5. Jika tidak mengetahui sesuatu, katakan dengan jujur.
6. Jika pengguna mengirim foto, jelaskan isi foto berdasarkan
   hal yang benar-benar terlihat.
7. Jika pengguna mengirim dokumen teks, bantu membaca,
   menjelaskan, dan merangkumnya.
8. Jangan mengaku mengetahui informasi terbaru jika belum
   memiliki sumber yang memverifikasinya.
`;

    const prompt = [
      message || "Tolong jelaskan lampiran ini.",
      fileText
        ? `\n\nIsi file ${fileName || ""}:\n${fileText.slice(0, 30000)}`
        : ""
    ].join("");

    const model = image
      ? "qwen/qwen3.8-27b"
      : "openai/gpt-oss-20b";

    const content = image
      ? [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
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
              content: systemPrompt
            },
            {
              role: "user",
              content
            }
          ],
          temperature: 0.7,
          max_completion_tokens: 2048
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error?.message ||
          "Groq API mengalami masalah."
      });
    }

    return res.status(200).json({
      reply:
        data.choices?.[0]?.message?.content ||
        "Maaf, belum ada jawaban."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Terjadi kesalahan pada server."
    });
  }
}
