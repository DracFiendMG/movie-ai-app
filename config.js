import { createClient } from "@supabase/supabase-js";

/** Hugging Face config */
const hfApiKey = import.meta.env.VITE_HF_API_KEY;
if (!hfApiKey) throw new Error("Hugging Face API key is missing or invalid.");

export async function getEmbedding(text) {
  const response = await fetch(
    "/api/huggingface/hf-inference/models/intfloat/multilingual-e5-large/pipeline/feature-extraction",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true }
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result;
}

export async function chatCompletions(messages) {
  try {
    const response = await fetch('/api/groq/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: messages,
          temperature: 1,
          max_tokens: 1000
      })
    })

    const data = await response.json();
    console.log(data)

    if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error')
    }

    return Response.json({
        suggestion: data.choices[0].message.content
    }, { status: 200 })
  } catch (err) {
    return Response.json({
        error: err.message 
    }, { status: 500 })
  }
}

/** Supabase config */
const privateKey = import.meta.env.VITE_SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var VITE_SUPABASE_API_KEY`);
const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) throw new Error(`Expected env var VITE_SUPABASE_URL`);
export const supabase = createClient(url, privateKey);