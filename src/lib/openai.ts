import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Summarizes text into bullet points
 */
export async function summarizeText(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes restaurant reviews into concise bullet points. Provide a maximum of 3 key points from the review.',
        },
        {
          role: 'user',
          content: `Please summarize this restaurant note into a maximum of 3 bullet points:\n\n${text}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    return response.choices[0].message.content || 'No summary generated';
  } catch (error) {
    console.error('Error summarizing text with OpenAI:', error);
    throw new Error('Failed to summarize text');
  }
}

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

/**
 * Generates tags for a restaurant based on its name, location, and notes
 */
export async function generateTags(
  restaurantName: string,
  location?: string | null,
  noteTexts?: string[]
): Promise<string[]> {
  try {
    const notesContent = noteTexts && noteTexts.length > 0
      ? `Notes about the restaurant:\n${noteTexts.join('\n\n')}`
      : '';

    const prompt = `Restaurant: ${restaurantName}
${location ? `Location: ${location}` : ''}
${notesContent}

Based on the information above, generate up to 5 tags that best describe this restaurant. Tags should be single words or short phrases that capture the cuisine type, ambiance, price point, or other notable characteristics.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates relevant tags for restaurants. Your tags should be concise and descriptive.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    const content = response.choices[0].message.content || '';
    
    // Parse the response to extract tags
    const tags: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === '') continue;
      
      // Check if this is a tag (starts with a number, dash, or bullet point)
      const tagMatch = trimmedLine.match(/^(?:\d+\.|\-|\*)\s*(.+)$/);
      
      if (tagMatch) {
        tags.push(tagMatch[1].trim().toLowerCase());
      } else if (tags.length === 0) {
        // If we haven't found any tags yet, try to split the line by commas
        const commaSeparated = trimmedLine.split(',');
        if (commaSeparated.length > 1) {
          commaSeparated.forEach((tag) => {
            const trimmedTag = tag.trim();
            if (trimmedTag) {
              tags.push(trimmedTag.toLowerCase());
            }
          });
        }
      }
    }
    
    return tags.slice(0, 5);
  } catch (error) {
    console.error('Error generating tags with OpenAI:', error);
    throw new Error('Failed to generate tags');
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

/**
 * Suggests similar restaurants based on a given restaurant
 */
export async function suggestSimilarRestaurants(
  restaurantName: string,
  location?: string | null,
  tags?: string[] | null
): Promise<{ name: string; reason: string }[]> {
  try {
    const prompt = `Restaurant: ${restaurantName}
${location ? `Location: ${location}` : ''}
${tags && tags.length > 0 ? `Tags: ${tags.join(', ')}` : ''}

Based on this restaurant, suggest 3 similar restaurants that someone might enjoy. For each suggestion, provide a brief reason why it's similar or why the person might like it.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that suggests similar restaurants based on a given restaurant. Your suggestions should be specific and include a reason why they are similar.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '';
    
    // Parse the response to extract restaurant names and reasons
    const suggestions: { name: string; reason: string }[] = [];
    const lines = content.split('\n');
    
    let currentName = '';
    let currentReason = '';
    
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      // Check if this is a new restaurant (starts with a number or has a restaurant name with a colon)
      const nameMatch = line.match(/^\d+\.\s*(.+?)(?::|\s-\s)/);
      
      if (nameMatch) {
        // If we have a previous restaurant, add it to the suggestions
        if (currentName && currentReason) {
          suggestions.push({ name: currentName, reason: currentReason });
        }
        
        // Start a new restaurant
        currentName = nameMatch[1].trim();
        currentReason = line.substring(line.indexOf(nameMatch[0]) + nameMatch[0].length).trim();
      } else {
        // Continue with the current reason
        currentReason += ' ' + line.trim();
      }
    }
    
    // Add the last restaurant
    if (currentName && currentReason) {
      suggestions.push({ name: currentName, reason: currentReason });
    }
    
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error('Error suggesting restaurants with OpenAI:', error);
    throw new Error('Failed to suggest restaurants');
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