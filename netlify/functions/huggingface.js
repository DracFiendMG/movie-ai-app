export default async (req) => {
  const body = await req.json();
  
  const response = await fetch(
    'https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large/pipeline/feature-extraction',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('HuggingFace API error:', response.status, errorText);
    return new Response(JSON.stringify({ error: errorText }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
};
