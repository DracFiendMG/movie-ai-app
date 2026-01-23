import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

export default async (req) => {
  try {
    const body = await req.json();
    const { action, params } = body;

    let result;

    switch (action) {
      case 'match_movies':
        const { data: matchData, error: matchError } = await supabase.rpc('match_movies', {
          query_embedding: params.query_embedding,
          match_threshold: params.match_threshold,
          match_count: params.match_count
        });
        if (matchError) throw matchError;
        result = matchData;
        break;

      case 'match_all_movies':
        const { data: matchAllData, error: matchAllError } = await supabase.rpc('match_all_movies', {
          query_embeddings: params.query_embeddings,
          match_threshold: params.match_threshold,
          match_count: params.match_count
        });
        if (matchAllError) throw matchAllError;
        result = matchAllData;
        break;

      case 'insert_movies':
        const { data: insertData, error: insertError } = await supabase
          .from('movies')
          .insert(params.data);
        if (insertError) throw insertError;
        result = insertData;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
