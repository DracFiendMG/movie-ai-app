export default async (req) => {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`;
    console.log('Fetching TMDB:', tmdbUrl.replace(apiKey, '***'));
    
    const response = await fetch(tmdbUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMDB API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('TMDB function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
