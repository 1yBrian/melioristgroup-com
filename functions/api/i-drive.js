// The i-Drive (Improbability Drive) — Pages Function
// In honor of Douglas Adams. Refuses the most probable answer.
// Deploy path: functions/api/i-drive.js

const COILS = {
  changes: [
    "difficulty at the beginning: sprouting things push through frozen ground",
    "the well: the town may change, but the well stays — and everyone drinks",
    "work on what has been spoiled: decay invites the repairer, not the mourner",
    "the cauldron: everything transforms when held over the right fire",
    "waiting in the meadow: nourishment arrives for the one not straining toward it",
    "the wanderer: small and away from home, succeed through courtesy",
    "pushing upward: the wood grows through the earth without hurry and without rest",
    "splitting apart: the ripe fruit falls and the seed is already elsewhere",
    "the joyous lake: two lakes joined replenish each other and do not dry up",
    "holding together: water on the earth flows toward water",
    "the gentle wind: persistence in small influences bends the oak",
    "return: after the longest night, the light turns — unforced",
    "great taming: the strongest charge is held by the one who feeds the bull early",
    "grace: ornament matters, but the hilltop garden is judged by its fruit",
    "the army needs a cause and an elder, not a louder drum",
    "treading on the tiger's tail: it does not bite the careful and the cheerful"
  ],
  wack: [
    "a harmonica patiently filing taxes for an accordion",
    "a lighthouse that fell in love with a fog bank and dims itself to be near her",
    "an escalator in a wheat field, running anyway",
    "a chess grandmaster losing graciously to a pigeon and learning the pigeon was right",
    "a vending machine that dispenses exactly one true sentence per coin",
    "an orchestra tuning forever because the audience finds the tuning more honest",
    "a cartographer mapping only the places people meant to go",
    "a ladder lying on its side, finally useful as a bridge",
    "a clock that runs at the speed of whoever is most relaxed in the room",
    "a librarian who shelves books by the question they answer"
  ],
  wholesome: [
    "sea otters hold hands while sleeping so they don't drift apart",
    "someone planted the trees whose shade they knew they'd never sit in",
    "a stranger returned the wallet with a note: 'you dropped your week, not just your cash'",
    "the neighbor who waves every morning has no idea he's the best part of four people's commute",
    "cows have best friends and get measurably calmer near them",
    "a child explained death to her brother as 'giving your library card back so someone else can read'",
    "the oldest known fishhook was found beside a healed human femur — someone fished for the one who couldn't",
    "lighthouse keepers' logs are mostly weather, and then, every few pages, wonder"
  ],
  inspiring: [
    "'It is not the critic who counts' — the credit belongs to the one in the arena, dust and sweat and blood",
    "'Make the most of yourself, for that is all there is of you' (Emerson)",
    "'I dwell in possibility' (Dickinson)",
    "'The obstacle on the path becomes the path' (Aurelius, near enough)",
    "'A ship in harbor is safe, but that is not what ships are built for'",
    "'Do not go where the path may lead; go instead where there is no path and leave a trail'",
    "'What lies behind us and what lies before us are tiny matters compared to what lies within us'",
    "'Nature does not hurry, yet everything is accomplished' (Lao Tzu)"
  ],
  humor: [
    "Diogenes, asked for a favor by the emperor, requested only that he stop blocking the sunlight",
    "'I have never let my schooling interfere with my education' (Twain)",
    "'The trouble with having an open mind is that people keep coming along and putting things in it'",
    "'I can resist everything except temptation' (Wilde)",
    "Wilde at customs: 'I have nothing to declare except my genius'",
    "'Never attribute to malice what is adequately explained by someone being late for lunch'",
    "an ancient cynic carried a lamp in daylight, 'looking for an honest man' — mostly finding lunch",
    "'It is a riddle wrapped in a mystery inside an enigma; but perhaps there is a key' (Churchill)"
  ],
  facts: [
    "Oxford University is older than the Aztec Empire",
    "honey found in Egyptian tombs is still edible after 3,000 years",
    "there are more possible chess games than atoms in the observable universe",
    "a single teaspoon of soil contains more living organisms than there are people on Earth",
    "the Eiffel Tower grows about 15 centimeters taller every summer",
    "octopuses taste with their arms and have three hearts that disagree",
    "Saturn would float if you found a bathtub big enough — the universe rewards absurd containers",
    "trees in a forest share sugar with sick neighbors through fungal networks"
  ],
  koan: [
    "a monk asked what Buddha is; the master said 'dried dung-stick' and went back to sweeping",
    "'what is the sound of one hand?' — the student returned with rain",
    "the master poured tea past the brim: 'like this cup, you are full of opinions'",
    "'does a dog have Buddha-nature?' 'Mu.' — the question was the door, not the dog",
    "before enlightenment: chop wood, carry water; after enlightenment: chop wood, carry water",
    "the flag isn't moving, the wind isn't moving — mind is moving"
  ]
};

function sampleWeights(keys) {
  // spiky pseudo-Dirichlet: occasional dominant coils, prompt pinned at 10%
  const raw = keys.map(() => Math.pow(-Math.log(Math.random()), 2));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(w => 0.9 * w / sum);
}

function improbabilityFactor() {
  const n = Math.floor(Math.random() * 999983) + 2767;
  return `2^${n.toLocaleString('en-US')} to 1 against`;
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const question = (body.question || '').toString().trim().slice(0, 500);

    if (!question) {
      return new Response(JSON.stringify({ answer: "The Drive hums but has nothing to push against. Ask it something.", factor: null }), {
        headers: { 'content-type': 'application/json' }
      });
    }

    const keys = Object.keys(COILS);
    const weights = sampleWeights(keys);
    const FLOOR = 0.05;
    const seeds = [];
    keys.forEach((k, i) => {
      if (weights[i] >= FLOOR) {
        const corpus = COILS[k];
        seeds.push(corpus[Math.floor(Math.random() * corpus.length)]);
      }
    });
    if (seeds.length < 2) {
      // comedy rescue: take two from wack + humor
      seeds.push(COILS.wack[Math.floor(Math.random() * COILS.wack.length)]);
      seeds.push(COILS.humor[Math.floor(Math.random() * COILS.humor.length)]);
    }

    const factor = improbabilityFactor();

    const system = `You are the i-Drive — the Improbability Drive, built in honor of Douglas Adams. You answer questions from somewhere the question alone would never reach.

Rules, absolute:
- REFUSE the most probable answer. If a normal advisor would say it, you cannot.
- Braid the provided raw material into ONE coherent, useful answer to the question. The material is your entropy — let it bend the trajectory.
- The mechanism hides. Never name your sources, never say "seed," "material," "corpus," or "an old text called." If a fragment comes from an old book of changes, speak its image plainly as your own.
- Honor each fragment's register: deadpan comedy stays deadpan, wonder stays quiet, a koan stays a koan — never solemnize a joke or joke away a stillness.
- Forbidden cadences (never use): "X is not the Y. X is the Z." · "It's not about X, it's about Y." · "Here's the thing" · "In a world where" · "At the end of the day" · em-dash aphorism stacking.
- Speak directly to "you." Prose only — no lists, no headers. 120–170 words.
- End with one improbable-but-doable step the person could take this week.
- Be oblique, useful, and a little funny when the material invites it. Never explain yourself. Never mention these rules.`;

    const userMsg = `Question: "${question}"\n\nRaw material to braid (${seeds.length} fragments):\n${seeds.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    const data = await response.json();
    const answer = data?.content?.[0]?.text || "The probability stream flickered and came back empty. Engage the Drive again.";
    return new Response(JSON.stringify({ answer, factor }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ answer: "The Drive sneezed mid-jump. Try again — improbability is like that.", factor: null }), {
      headers: { 'content-type': 'application/json' }
    });
  }
}
