import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeNote(noteText: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes restaurant notes into concise bullet points. Limit to 3 key points maximum."
        },
        {
          role: "user",
          content: `Summarize this restaurant note into a maximum of 3 bullet points: ${noteText}`
        }
      ],
      max_tokens: 150,
    });

    const summary = response.choices[0].message.content;
    if (!summary) return ["No summary available"];
    
    // Parse bullet points
    const bulletPoints = summary
      .split('\n')
      .map(line => line.replace(/^[\s•-]*/, '').trim())
      .filter(line => line.length > 0);
    
    return bulletPoints.slice(0, 3);
  } catch (error) {
    console.error('Error summarizing note:', error);
    return ["Error generating summary"];
  }
}

export async function generateRestaurantTags(restaurantName: string, noteText: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates relevant tags for restaurants based on user notes. Generate up to 5 tags maximum."
        },
        {
          role: "user",
          content: `Generate up to 5 tags for restaurant "${restaurantName}" based on this note: ${noteText}`
        }
      ],
      max_tokens: 100,
    });

    const tagsText = response.choices[0].message.content;
    if (!tagsText) return [];
    
    // Parse tags
    const tags = tagsText
      .replace(/tags:|tag:/gi, '')
      .split(/[,\n]/)
      .map(tag => tag.replace(/^[\s•#-]*/, '').trim())
      .filter(tag => tag.length > 0 && tag.length < 20);
    
    return tags.slice(0, 5);
  } catch (error) {
    console.error('Error generating restaurant tags:', error);
    return [];
  }
}

export async function suggestRestaurants(likedRestaurants: string[]): Promise<{name: string, reason: string}[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that suggests new restaurants based on a user's liked restaurants. For each suggestion, provide a name and reason."
        },
        {
          role: "user",
          content: `Based on these restaurants I like: ${likedRestaurants.join(', ')}, suggest 3 new restaurants I might enjoy. For each suggestion, provide the restaurant name and a brief reason why I might like it.`
        }
      ],
      max_tokens: 250,
    });

    const suggestionsText = response.choices[0].message.content;
    if (!suggestionsText) return [];
    
    // Parse suggestions (this is a simplified approach)
    const suggestionLines = suggestionsText.split('\n').filter(line => line.trim().length > 0);
    const suggestions: {name: string, reason: string}[] = [];
    
    let currentName = '';
    let currentReason = '';
    
    for (const line of suggestionLines) {
      const trimmedLine = line.replace(/^\d+\.\s*/, '').trim();
      
      if (trimmedLine.includes(':')) {
        const [name, reason] = trimmedLine.split(':').map(s => s.trim());
        suggestions.push({ name, reason });
      } else if (currentName && !currentReason) {
        currentReason = trimmedLine;
        suggestions.push({ name: currentName, reason: currentReason });
        currentName = '';
        currentReason = '';
      } else {
        currentName = trimmedLine;
      }
    }
    
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error('Error suggesting restaurants:', error);
    return [];
  }
}