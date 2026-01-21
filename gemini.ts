const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export async function generateQuestions(resumeText: string) {
  const chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [
          {
            text: "I will give you a piece of text extracted from a resume. I want you to generate interview questions from it for the job position of web developer.",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `Please provide the text extracted from the resume.
I need the content to tailor effective interview questions for a web developer position.
I'll be looking for specific skills, projects, and experiences mentioned to create relevant and insightful questions.`,
          },
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage(resumeText);
  return result.response.text();
}
