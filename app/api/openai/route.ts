
import { NextResponse } from 'next/server';
import { secret } from '@aws-amplify/backend';

//https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/secrets-and-vars/

export async function POST(request: Request) {
  const { categories } = await request.json();
  
   const apiKey = process.env.OPENAI_API_KEY;
  /**
   *  In development, use the local environment variable; in production, use the secret
      In Development: When running next dev, process.env.NODE_ENV is automatically set to "development".
      In Production: When you build and run your app using next build and next start, process.env.NODE_ENV is set to "production".
      If you don't have an .env file in production, process.env.NODE_ENV will still exist, and it will be set to "production". 
   */

  // const apiKey = process.env.NODE_ENV === 'development' 
  //   ? process.env.OPENAI_API_KEY 
  //   : await secret('OPENAI_API_KEY'); // Make sure to await if using AWS secrets

  // Fetch API key based on environment
  // let apiKey = null;
  // if (process.env.NODE_ENV === 'development') {
  //   apiKey = process.env.OPENAI_API_KEY;
  // } else {
  //   // Ensure `secret` is only called in server-side context and not on the client
  //   apiKey = await secret('OPENAI_API_KEY');
  // }

  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

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
