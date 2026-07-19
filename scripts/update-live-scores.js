const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

async function fetchLiveMatches() {
    const res = await fetch('https://api.football-data.org/v4/matches?status=LIVE', {
        headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY }
    });
    if (!res.ok) {
        console.error('Erreur API live:', res.status, await res.text());
        return [];
    }
    const data = await res.json();
    return data.matches || [];
}

async function updateMatchScore(match) {
    const scoreHome = match.score.fullTime.home ?? null;
    const scoreAway = match.score.fullTime.away ?? null;
    const externalId = `fd_${match.id}`;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/matches?external_id=eq.${externalId}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            status: 'live',
            score_home: scoreHome,
            score_away: scoreAway
        })
    });
    if (!res.ok) {
        console.error(`Erreur update match ${externalId}:`, await res.text());
    }
}

async function run() {
    const liveMatches = await fetchLiveMatches();
    console.log(`${liveMatches.length} matchs en direct trouves`);
    for (const match of liveMatches) {
        await updateMatchScore(match);
    }
}

run();