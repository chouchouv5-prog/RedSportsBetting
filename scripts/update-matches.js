// scripts/update-matches.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LEAGUES = {
    "Premier League": "4328",
    "La Liga": "4335",
    "Ligue 1": "4334",
    "Serie A": "4332",
    "Bundesliga": "4331",
    "Coupe du Monde": "4429"
};

// Notre systeme de cotes maison (pas lie a l'API)
function generateOdds() {
    return {
        odds_home: 1.8,
        odds_draw: 3.0,
        odds_away: 2.5
    };
}

function computeStatus(scoreHome, scoreAway, matchDate) {
    if (scoreHome !== null && scoreAway !== null) return "finished";
    const now = new Date();
    const start = new Date(matchDate);
    const diffMinutes = (now - start) / 60000;
    if (diffMinutes >= 0 && diffMinutes <= 130) return "live";
    return "upcoming";
}

async function fetchLeagueMatches(leagueId, leagueName) {
    const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`;
    const res = await fetch(url);
    const data = await res.json();
    const odds = generateOdds();
    return (data.events || []).map(e => {
        const matchDate = `${e.dateEvent}T${e.strTime || "00:00:00"}`;
        const scoreHome = e.intHomeScore !== null ? parseInt(e.intHomeScore) : null;
        const scoreAway = e.intAwayScore !== null ? parseInt(e.intAwayScore) : null;
        return {
            team_home: e.strHomeTeam,
            team_away: e.strAwayTeam,
            match_date: matchDate,
            competition: leagueName,
            score_home: scoreHome,
            score_away: scoreAway,
            external_id: e.idEvent,
            odds_home: odds.odds_home,
            odds_draw: odds.odds_draw,
            odds_away: odds.odds_away,
            status: computeStatus(scoreHome, scoreAway, matchDate)
        };
    });
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
        console.log(`${matches.length} matchs synchronises.`);
    }
}

async function run() {
    let allMatches = [];
    for (const [name, id] of Object.entries(LEAGUES)) {
        try {
            const matches = await fetchLeagueMatches(id, name);
            allMatches = allMatches.concat(matches);
            console.log(`${name}: ${matches.length} matchs trouves`);
        } catch (err) {
            console.error(`Erreur pour ${name}:`, err.message);
        }
    }
    if (allMatches.length > 0) {
        await upsertMatches(allMatches);
    }
}

run();

function computeStatus(scoreHome, scoreAway, matchDate) {
    if (scoreHome !== null && scoreAway !== null) return "finished";
    const now = new Date();
    const start = new Date(matchDate);
    const diffMinutes = (now - start) / 60000;
    if (diffMinutes >= 0 && diffMinutes <= 130) return "live";
    return "upcoming";
}