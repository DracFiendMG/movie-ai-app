import { createClient } from "@supabase/supabase-js";
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

import movies from './content.js'

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
  const response = await fetch(`/.netlify/functions/tmdb?query=${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

async function createAndStoreEmbeddings() {
    const movieContentList = movies.map((movie) => movie.content)
    const embeddingResponse = await getEmbedding(movieContentList)
    console.log(embeddingResponse)
    const data = embeddingResponse.map((embedding, index) => {
        return {
            content: movieContentList[index],
            embedding: embedding
        }
    })

    await supabase.from('movies').insert(data)
    console.log('Embeddings stored in Supabase')
}

async function splitMovieTextAndStoreEmbeddings() {
  const document = await fetch('/movies.txt')
  const response = await document.text()

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 150,
    chunkOverlap: 15
  })

  const chunkData = await textSplitter.splitText(response)
  const embeddingResponse = await getEmbedding(chunkData)

  const data = embeddingResponse.map((embedding, index) => {
      return {
          content: chunkData[index],
          embedding: embedding
      }
  })

  await supabase.from('movies').insert(data)
  console.log('Movie text chunks and embeddings stored in Supabase')
}

// splitMovieTextAndStoreEmbeddings()

/** Supabase config */
const privateKey = import.meta.env.VITE_SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var VITE_SUPABASE_API_KEY`);
const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) throw new Error(`Expected env var VITE_SUPABASE_URL`);
export const supabase = createClient(url, privateKey);