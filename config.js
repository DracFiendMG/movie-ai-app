import { createClient } from "@supabase/supabase-js";

/** Hugging Face config */
const hfApiKey = import.meta.env.VITE_HF_API_KEY;
if (!hfApiKey) throw new Error("Hugging Face API key is missing or invalid.");

export async function getEmbedding(text) {
  const response = await fetch(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
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

/** Supabase config */
const privateKey = import.meta.env.VITE_SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var VITE_SUPABASE_API_KEY`);
const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) throw new Error(`Expected env var VITE_SUPABASE_URL`);
export const supabase = createClient(url, privateKey);