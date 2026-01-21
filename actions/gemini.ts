const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
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
          {text: "I WILL GIVE YOU A PIECE OF TEXT EXTRACTED FROM A RESUME. I WANT YOU TO MAKE SOME INTERVIEW QUESTIONS on it for the job position web developer." },
        ],
      },
      {
        role: "model",
        parts: [
          {text: "Please provide the text extracted from the resume. I need the content to tailor effective interview questions for a web developer position.  I'll be looking for specific skills, projects, and experiences mentioned to create relevant and insightful questions.
"},
        ],
      },
    ],
  });

  const result = await chatSession.sendMessage(resumeText);
  return result.response.text();
}