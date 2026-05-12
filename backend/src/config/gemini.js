const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getGeminiClient = () => {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Generate AI productivity insights based on project/task data
 * @param {Object} data - Analytics data object
 * @returns {Promise<string>} - Insight text
 */
const generateInsights = async (data) => {
  try {
    const client = getGeminiClient();
    if (!client) {
      return 'AI insights unavailable — please configure GEMINI_API_KEY.';
    }

    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a productivity coach AI for a project management tool.
Analyze the following team analytics data and provide 3-5 actionable, concise insights.
Focus on: identifying bottlenecks, praising wins, and suggesting improvements.
Keep each insight under 2 sentences. Use a professional but friendly tone.

Data:
- Total tasks this week: ${data.totalTasks}
- Completed tasks: ${data.completedTasks}
- Overdue tasks: ${data.overdueTasks}
- High priority pending: ${data.highPriorityPending}
- Average completion time: ${data.avgCompletionDays} days
- Most active member: ${data.mostActiveMember || 'N/A'}
- Projects at risk (overdue): ${data.projectsAtRisk}

Respond in JSON format: { "insights": ["insight1", "insight2", ...] }
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.insights || [];
    }
    return [];
  } catch (error) {
    console.error('Gemini AI error:', error.message);
    return ['Could not generate insights at this time. Please try again later.'];
  }
};

module.exports = { generateInsights };
