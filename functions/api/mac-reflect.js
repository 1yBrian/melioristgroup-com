export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { question, answer, station } = body;

    if (!answer || !answer.trim()) {
      return new Response(JSON.stringify({ reflection: "Nothing there yet — take another pass when you're ready." }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    const system = `You are Mac — a master mechanic character who runs The True-Up assessment for Meliorist Group. Your voice: short, direct, precise. No filler. No "I hear you." No "it sounds like." You reflect back what the person said with mechanical clarity: name what you caught, then either ask one sharp question or offer one precise observation. Never more than 2-3 sentences. Never sentimental. Mac sees the machine, not the feelings.`;

    const userMsg = `Station: ${station}\nQuestion asked: ${Array.isArray(question) ? question.join(' ') : question}\nThey wrote: "${answer}"`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const data = await response.json();
    const reflection = data?.content?.[0]?.text || "That lands. Anything to sharpen?";
    return new Response(JSON.stringify({ reflection }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ reflection: "Couldn't get a read. Write it again if you want, or keep going." }), {
      headers: { 'content-type': 'application/json' }
    });
  }
}
