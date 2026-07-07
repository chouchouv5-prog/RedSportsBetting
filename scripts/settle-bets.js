// scripts/settle-bets.js
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchPendingBets() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/bets?status=eq.pending&select=*,matches(status,score_home,score_away)`,
        {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        }
    );
    return res.json();
}

function getMatchResult(scoreHome, scoreAway) {
    if (scoreHome > scoreAway) return "home";
    if (scoreHome < scoreAway) return "away";
    return "draw";
}

async function updateBetStatus(betId, status) {
    await fetch(`${SUPABASE_URL}/rest/v1/bets?id=eq.${betId}`, {
        method: "PATCH",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
    });
}

async function creditUser(userId, amountToAdd) {
    // Recupere le solde actuel
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=vsb_coins`,
        {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        }
    );
    const data = await res.json();
    if (!data || data.length === 0) return;
    const currentCoins = data[0].vsb_coins;
    const newCoins = currentCoins + amountToAdd;

    await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
        method: "PATCH",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ vsb_coins: newCoins })
    });
}

async function run() {
    const bets = await fetchPendingBets();
    console.log(`${bets.length} paris en attente trouves.`);

    for (const bet of bets) {
        const match = bet.matches;
        if (!match || match.status !== "finished") continue;
        if (match.score_home === null || match.score_away === null) continue;

        const result = getMatchResult(match.score_home, match.score_away);

        if (bet.choice === result) {
            const payout = bet.amount * bet.odds;
            await updateBetStatus(bet.id, "won");
            await creditUser(bet.user_id, payout);
            console.log(`Pari ${bet.id} : GAGNE, +${payout} coins pour user ${bet.user_id}`);
        } else {
            await updateBetStatus(bet.id, "lost");
            console.log(`Pari ${bet.id} : PERDU`);
        }
    }
}

run();