// scripts/update-matches.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// IDs des ligues sur TheSportsDB
const LEAGUES = {
    "Premier League": "4328",
    "La Liga": "4335",
    "Ligue 1": "4334",
    "Serie A": "4332",
    "Bundesliga": "4331",
    "Coupe du Monde": "4429"
};

async function fetchLeagueMatches(leagueId, leagueName) {
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.events || []).map(e => ({
        team_home: e.strHomeTeam,
        team_away: e.strAwayTeam,
        match_date: `${e.dateEvent}T${e.strTime || "00:00:00"}`,
        competition: leagueName,
        score_home: e.intHomeScore !== null ? parseInt(e.intHomeScore) : null,
        score_away: e.intAwayScore !== null ? parseInt(e.intAwayScore) : null,
        external_id: e.idEvent
    }));
}

async function upsertMatches(matches) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/matches?on_conflict=external_id`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(matches)
    });
    if (!res.ok) {
        console.error("Erreur upsert:", await res.text());
    } else {
        console.log(`${matches.length} matchs synchronisés.`);
    }
}

async function run() {
    let allMatches = [];
    for (const [name, id] of Object.entries(LEAGUES)) {
        try {
            const matches = await fetchLeagueMatches(id, name);
            allMatches = allMatches.concat(matches);
            console.log(`${name}: ${matches.length} matchs trouvés`);
        } catch (err) {
            console.error(`Erreur pour ${name}:`, err.message);
        }
    }
    if (allMatches.length > 0) {
        await upsertMatches(allMatches);
    }
}

run();