// scripts/update-matches.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

const COMPETITIONS = {
    "Premier League": "PL",
    "La Liga": "PD",
    "Ligue 1": "FL1",
    "Serie A": "SA",
    "Bundesliga": "BL1",
    "Coupe du Monde": "WC"
};

function generateOdds() {
    return { odds_home: 1.8, odds_draw: 3.0, odds_away: 2.5 };
}

function mapStatus(apiStatus) {
    if (apiStatus === "FINISHED") return "finished";
    if (apiStatus === "IN_PLAY" || apiStatus === "PAUSED" || apiStatus === "LIVE") return "live";
    return "upcoming";
}

function mapMatch(m, competitionName, odds) {
    const status = mapStatus(m.status);
    const scoreHome = status === "finished" ? m.score.fullTime.home : null;
    const scoreAway = status === "finished" ? m.score.fullTime.away : null;

    return {
        team_home: m.homeTeam.name,
        team_away: m.awayTeam.name,
        match_date: m.utcDate,
        competition: competitionName,
        score_home: scoreHome,
        score_away: scoreAway,
        external_id: `fd_${m.id}`,
        odds_home: odds.odds_home,
        odds_draw: odds.odds_draw,
        odds_away: odds.odds_away,
        status: status
    };
}

function isValidMatch(m) {
    return m.homeTeam && m.homeTeam.name && m.awayTeam && m.awayTeam.name;
}

async function fetchCompetitionMatches(code, competitionName) {
    const odds = generateOdds();
    const url = `https://api.football-data.org/v4/competitions/${code}/matches`;

    const res = await fetch(url, {
        headers: { "X-Auth-Token": FOOTBALL_DATA_KEY }
    });

    if (!res.ok) {
        console.error(`Erreur API pour ${competitionName}:`, res.status, await res.text());
        return [];
    }

    const data = await res.json();
    const matches = data.matches || [];
    return matches.filter(isValidMatch).map(m => mapMatch(m, competitionName, odds));
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
    for (const [name, code] of Object.entries(COMPETITIONS)) {
        try {
            const matches = await fetchCompetitionMatches(code, name);
            allMatches = allMatches.concat(matches);
            console.log(`${name}: ${matches.length} matchs trouves`);
            await new Promise(r => setTimeout(r, 6500));
        } catch (err) {
            console.error(`Erreur pour ${name}:`, err.message);
        }
    }
    if (allMatches.length > 0) {
        await upsertMatches(allMatches);
    }
}

run();