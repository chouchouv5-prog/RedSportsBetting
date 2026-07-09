---
title: "Upcoming Matches"
date: 2026-07-01
draft: false
---

<div id="matches-container">Loading...</div>

<script>
let currentMatchId = null;
let currentChoice = null;
let currentOdds = null;

async function loadMatches() {
    const { data: matches, error } = await supabaseClient
        .from('matches')
        .select('*')
        .neq('status', 'finished')
        .order('match_date', { ascending: true });

    const container = document.getElementById('matches-container');

    if (!matches || matches.length === 0) {
        container.innerHTML = "<p>Aucun match pour le moment.</p>";
        return;
    }

    matches.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        return new Date(a.match_date) - new Date(b.match_date);
    });

    container.innerHTML = matches.map(m => `
        <div style="border: 2px solid #0b3d0b; border-radius: 10px; padding: 20px; margin-bottom: 15px; background: #f9f9f9;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                <h3 style="margin: 0;">${m.team_home} vs ${m.team_away}</h3>
                ${m.status === 'live' ? '<span style="background:#e63946;color:white;padding:3px 10px;border-radius:6px;font-size:0.8em;font-weight:bold;">🔴 LIVE</span>' : ''}
            </div>
            <p style="color: #555;">${new Date(m.match_date).toLocaleString('fr-FR')}</p>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="openBetModal(${m.id}, '${m.team_home} vs ${m.team_away}', 'home', ${m.odds_home})" style="flex:1; padding: 10px; background: #145214; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    ${m.team_home}<br>${m.odds_home}
                </button>
                <button onclick="openBetModal(${m.id}, '${m.team_home} vs ${m.team_away}', 'draw', ${m.odds_draw})" style="flex:1; padding: 10px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Nul<br>${m.odds_draw}
                </button>
                <button onclick="openBetModal(${m.id}, '${m.team_home} vs ${m.team_away}', 'away', ${m.odds_away})" style="flex:1; padding: 10px; background: #145214; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    ${m.team_away}<br>${m.odds_away}
                </button>
            </div>
        </div>
    `).join('');
}

async function openBetModal(matchId, matchTitle, choice, odds) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("Connecte-toi d'abord pour parier !");
        return;
    }
    currentMatchId = matchId;
    currentChoice = choice;
    currentOdds = odds;
    document.getElementById('bet-match-title').textContent = matchTitle;
    document.getElementById('bet-choice-label').textContent = "Ton choix : " + choice + " (cote " + odds + ")";
    document.getElementById('bet-modal').style.display = 'flex';
}

function closeBetModal() {
    document.getElementById('bet-modal').style.display = 'none';
    document.getElementById('bet-amount').value = '';
}

async function confirmBet() {
    const amount = parseFloat(document.getElementById('bet-amount').value);
    if (!amount || amount <= 0) {
        alert("Entre un montant valide.");
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('vsb_coins')
        .eq('user_id', user.id)
        .single();

    if (!profile || profile.vsb_coins < amount) {
        alert("Tu n'as pas assez de coins !");
        return;
    }

    const { error: betError } = await supabaseClient.from('bets').insert({
        user_id: user.id,
        match_id: currentMatchId,
        choice: currentChoice,
        amount: amount,
        odds: currentOdds
    });

    if (betError) {
        alert("Erreur : " + betError.message);
        return;
    }

    await supabaseClient
        .from('profiles')
        .update({ vsb_coins: profile.vsb_coins - amount })
        .eq('user_id', user.id);

    alert("Pari enregistré !");
    closeBetModal();
    location.reload();
}

loadMatches();
</script>