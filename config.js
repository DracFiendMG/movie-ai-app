import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

import movies from './content.js'

/** Supabase - uses Netlify function to hide API keys */
export const supabase = {
  rpc: async (functionName, params) => {
    const response = await fetch('/.netlify/functions/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: functionName,
        params: params
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { data: null, error };
    }
    
    const data = await response.json();
    return { data, error: null };
  },
  from: (table) => ({
    insert: async (data) => {
      const response = await fetch('/.netlify/functions/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: `insert_${table}`,
          params: { data }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error };
      }
      
      const result = await response.json();
      return { data: result, error: null };
    }
  })
};

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
  const response = await fetch(`/.netlify/functions/tmdb?query=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

export async function getOMDBMovieImage(query) {
  const response = await fetch(`/.netlify/functions/omdb?movie=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.statusText}`);
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
  const document = await fetch('/movies-2.txt')
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