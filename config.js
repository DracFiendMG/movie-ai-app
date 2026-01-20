import { createClient } from "@supabase/supabase-js";

/** Hugging Face - uses Netlify function to hide API key */
export async function getEmbedding(text) {
  const response = await fetch('/.netlify/functions/huggingface', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true }
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }
  
  return await response.json();
}

/** Groq - uses Netlify function to hide API key */
export async function chatCompletions(messages) {
  try {
    const response = await fetch('/.netlify/functions/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: messages,
        temperature: 1,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    return { suggestion: data.choices[0].message.content };
  } catch (err) {
    return { error: err.message };
  }
}

/** TMDB - uses Netlify function to hide API key */
export async function getMovieImage(query) {
  const response = await fetch(`/.netlify/functions/tmdb?query=${query}`);
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }
  const data = await response.json();
  console.log(data);
  return data;
}

/** Supabase config */
const privateKey = import.meta.env.VITE_SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var VITE_SUPABASE_API_KEY`);
const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) throw new Error(`Expected env var VITE_SUPABASE_URL`);
export const supabase = createClient(url, privateKey);