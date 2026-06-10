export async function onRequestPost(context) {
  try {
    const payload = await context.request.json();
    const { contact, consent, scores, answers, wealthLens, mirror, dayDial, submittedAt, map } = payload;

    // HUD feed: log the submission to Supabase captures (publishable key — already public on the HUD page)
    try {
      const SB_URL = 'https://wqqgsjjfsrgtaybmpsqk.supabase.co';
      const SB_KEY = 'sb_publishable_2Ij4N3-jn6eQkh94jQXfrA_5WJ8Lgkm';
      const capture = `True-Up submission: ${contact?.name || 'anonymous'} (${contact?.method || '—'}: ${contact?.handle || '—'}) · binding: ${scores?.bindingConstraint || '—'} · pressure: ${scores?.systemPressure ?? '—'} red · may respond: ${consent?.brianMayRespond ? 'YES' : 'no'}`;
      await fetch(`${SB_URL}/rest/v1/captures`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ content: capture, tag: 'true-up' })
      });
    } catch (e) { console.error('captures log failed:', e); }

    const RESEND_KEY = context.env.RESEND_API_KEY;
    const BRIAN_EMAIL = 'brianoney@gmail.com';
    const FROM = 'The True-Up <noreply@melioristgroup.com>';

    if (!RESEND_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }

    const bindingLine = scores?.bindingConstraint
      ? `Binding constraint: ${scores.bindingConstraint} (${scores.bands?.[scores.bindingConstraint] || ''})`
      : '';

    const gaugeSummary = scores?.wear
      ? Object.entries(scores.wear).map(([k,v]) => `  ${k}: ${v} (${scores.bands?.[k] || ''})`).join('\n')
      : '';

    const answerLines = answers
      ? Object.entries(answers)
          .filter(([k, v]) => v && String(v).trim())
          .map(([k, v]) => `${k}:\n${v}`)
          .join('\n\n')
      : '';

    const mirrorLines = mirror
      ? Object.entries(mirror).map(([n, r]) => `  Guess ${n}: ${r}`).join('\n')
      : '';

    const wealthLine = wealthLens
      ? `Time Wealth: ${wealthLens.timeWealth ?? '—'}  |  Power Wealth: ${wealthLens.powerWealth ?? '—'}`
      : '';

    const brianBody = `New True-Up submission — ${new Date(submittedAt || Date.now()).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}

CONTACT
Name: ${contact?.name || '—'}
Method: ${contact?.method || '—'}
Handle: ${contact?.handle || '—'}
May respond: ${consent?.brianMayRespond ? 'YES' : 'No'}
Wants copy: ${consent?.sendCopy ? 'YES' : 'No'}

GAUGES
${gaugeSummary}
${bindingLine}
System pressure: ${scores?.systemPressure ?? '—'} in the red

WEALTH LENS
${wealthLine}

DAY-DIAL
Creative peak: ${dayDial?.creativePeak || '—'}
Energy low: ${dayDial?.energyLow || '—'}

MIRROR REACTIONS
${mirrorLines}

${map ? `THEIR MAP\n${map}\n\n` : ''}ANSWERS
${answerLines}
`;

    await sendEmail(RESEND_KEY, FROM, BRIAN_EMAIL, 'True-Up: New submission', brianBody);

    if (consent?.sendCopy && contact?.method === 'Email' && contact?.handle?.includes('@')) {
      const respondentBody = `Here's what you put down in the True-Up — ${new Date(submittedAt || Date.now()).toLocaleString()}

${map ? `${map}\n\n—\n\n` : ''}${answerLines}

—
The True-Up · Meliorist Group
melioristgroup.com`;

      await sendEmail(RESEND_KEY, FROM, contact.handle, 'Your True-Up responses', respondentBody);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    console.error('true-up submit error:', e);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' }
    });
  }
}

async function sendEmail(apiKey, from, to, subject, text) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, text })
  });
}
