
import { NextResponse } from 'next/server';
import { secret } from '@aws-amplify/backend';

//https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/secrets-and-vars/

export async function POST(request: Request) {
  const { categories } = await request.json();
  
  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  const prompt = `Generate 5 single words for each of the following categories, suitable for a game of Codenames. The words should be related to their category but not too obvious. Categories: ${categories.join(', ')}. Format the response as a JSON array of arrays.`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data.choices[0].message.content);
  } catch (error) {
    return NextResponse.error();
  }
}
