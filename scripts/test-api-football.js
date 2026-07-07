// scripts/test-api-football.js
const API_KEY = process.env.API_FOOTBALL_KEY;

// IDs de ligues sur API-Football (differents de TheSportsDB !)
const LEAGUES = {
    "Premier League": 39,
    "La Liga": 140,
    "Ligue 1": 61,
    "Serie A": 135,
    "Bundesliga": 78,
    "World Cup": 1
};

async function testLeague(leagueId, leagueName) {
    const season = 2026;
    const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}&next=5`;

    const res = await fetch(url, {
        headers: {
            "x-apisports-key": API_KEY
        }
    });

    const data = await res.json();

    console.log(`\n=== ${leagueName} ===`);
    console.log(`Requetes restantes aujourd'hui: ${data.response ? "OK" : "voir erreurs"}`);

    if (data.errors && Object.keys(data.errors).length > 0) {
        console.log("ERREURS:", JSON.stringify(data.errors));
        return;
    }

    if (!data.response || data.response.length === 0) {
        console.log("Aucun match trouve.");
        return;
    }

    data.response.forEach(match => {
        const home = match.teams.home.name;
        const away = match.teams.away.name;
        const date = match.fixture.date;
        const status = match.fixture.status.long;
        console.log(`${home} vs ${away} - ${date} - Statut: ${status}`);
    });
}

async function run() {
    for (const [name, id] of Object.entries(LEAGUES)) {
        try {
            await testLeague(id, name);
        } catch (err) {
            console.error(`Erreur pour ${name}:`, err.message);
        }
    }
}

run();