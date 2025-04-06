import OpenAI from "openai";
import { RestaurantWithLists } from "@shared/schema";


function getOpenAI() : OpenAI {
  console.log('openai', process.env.OPENAI_API_KEY);
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key" });
}

// Summarize visit notes
export async function summarizeNotes(notesText: string): Promise<string> {
  try {
    const prompt = `Please summarize the following restaurant visit notes in a concise paragraph that captures the key insights, impressions, and food highlights:

${notesText}

Provide a summary that would be useful for someone deciding whether to visit this restaurant in the future.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    return response.choices[0].message.content || "Unable to generate summary.";
  } catch (error) {
    console.error("Error summarizing notes:", error);
    return "Error generating summary. Please try again later.";
  }
}

// Suggest restaurants based on user preferences
export async function suggestRestaurants(likedRestaurants: RestaurantWithLists[]): Promise<any[]> {
  try {
    const restaurantDescriptions = likedRestaurants
      .map(r => `${r.name} (${r.cuisine || 'Unknown cuisine'}, Price level: ${r.priceLevel || 'Unknown'}, Rating: ${r.rating || 'Unknown'})`)
      .join('\n');

    const prompt = `Based on these restaurants a user likes:
${restaurantDescriptions}

Suggest 3 new restaurant ideas the user might enjoy. For each suggestion, include:
1. Restaurant name
2. Cuisine type
3. Price level ($ to $$$)
4. A predicted rating (out of 5)
5. A brief reason why they might like it based on their preferences

Respond in JSON format with an array of objects containing fields: name, cuisine, priceLevel, rating, reason
`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.suggestions || [];
  } catch (error) {
    console.error("Error suggesting restaurants:", error);
    return [
      {
        name: "Error generating suggestions",
        cuisine: "N/A",
        priceLevel: "N/A",
        rating: "N/A",
        reason: "There was an error processing your request. Please try again later."
      }
    ];
  }
}
