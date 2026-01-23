export default async (req) => {
    try {
        const url = new URL(req.url)
        const query = url.searchParams.get('movie')
        const API_KEY = process.env.OMDB_API_KEY;

        const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(query)}`)
        
        if (!response.ok) {
            return new Response(JSON.stringify({ error: response.text() }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        return new Response(
            JSON.stringify({
                poster: data.Poster
            }), 
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}