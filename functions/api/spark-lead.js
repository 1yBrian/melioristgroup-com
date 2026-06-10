export async function onRequestPost(context) {
  try {
    const { email, intent } = await context.request.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }

    const RESEND_KEY = context.env.RESEND_API_KEY;
    const BRIAN_EMAIL = 'brianoney@gmail.com';
    const FROM = 'The Spark Deck <noreply@melioristgroup.com>';
    const SAMPLER_URL = 'https://melioristgroup.com/spark-deck-sampler';

    // HUD feed: log the lead to Supabase captures (publishable key — already public on the HUD page)
    try {
      const SB_URL = 'https://wqqgsjjfsrgtaybmpsqk.supabase.co';
      const SB_KEY = 'sb_publishable_2Ij4N3-jn6eQkh94jQXfrA_5WJ8Lgkm';
      await fetch(`${SB_URL}/rest/v1/captures`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ content: `Spark Deck lead: ${email} · intent: ${intent || 'sampler'}`, tag: 'spark-deck-lead' })
      });
    } catch (e) { console.error('captures log failed:', e); }

    if (!RESEND_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }

    const samplerBody = `Your ten cards are here:

${SAMPLER_URL}

Draw one before your next session — or deal a session of three (open, mid, close) and let the deck set the weather.

Two standards govern every card: nothing a generic workbook could have written, and nothing stated as fact that wasn't checked. If the ten earn their place in your rooms, the other forty-two are at melioristgroup.com/spark-deck.

— Brian Oney
The Spark Deck · Meliorist Group
melioristgroup.com`;

    await sendEmail(RESEND_KEY, FROM, email, 'Your 10 Spark Deck cards', samplerBody);

    const brianBody = `New Spark Deck lead — ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}

Email: ${email}
Intent: ${intent || 'sampler'}
${(intent || '').startsWith('buyer') ? '\n>>> BUYER INTENT — they clicked a price tier. Send the checkout link when live. <<<' : ''}`;

    await sendEmail(RESEND_KEY, FROM, BRIAN_EMAIL, `Spark Deck lead: ${intent || 'sampler'}`, brianBody);

    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    console.error('spark-lead error:', e);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  }
}

async function sendEmail(apiKey, from, to, subject, text) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text })
  });
}
