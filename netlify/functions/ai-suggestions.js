const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Gemini API key not configured" }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { dim, existingGoals, userName } = JSON.parse(event.body);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const existing = existingGoals.filter(Boolean).join(", ") || "none set yet";
    const prompt = `You are a world-class life coach helping ${userName || "a driven professional"} set powerful ${dim} goals for their 90-day cycle.

Their current ${dim} goals: ${existing}

Generate exactly 3 fresh, specific, ambitious but achievable ${dim} goals for the next 90 days. 
Return ONLY a JSON array of 3 strings, no preamble, no markdown. Example: ["Goal one","Goal two","Goal three"]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      return {
        statusCode: 200,
        body: JSON.stringify(parsed),
      };
    } catch (e) {
      console.error("AI Parsing Error:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to parse AI response" }),
      };
    }
  } catch (error) {
    console.error("AI Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
