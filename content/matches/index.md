---
title: "Upcoming Matches"
date: 2026-07-01
draft: false
---

<div id="matches-container">Chargement des matchs...</div>

<div id="bet-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1000; justify-content: center; align-items: center;">
    <div style="background: white; color: black; padding: 30px; border-radius: 10px; width: 350px;">
        <h3 id="bet-match-title"></h3>
        <p id="bet-choice-label"></p>
        <input id="bet-amount" type="number" placeholder="Montant en coins" style="width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box;">
        <button onclick="confirmBet()" style="width: 100%; padding: 10px; background: #f2b705; border: none; cursor: pointer; font-weight: bold;">Confirmer le pari</button>
        <button onclick="closeBetModal()" style="width: 100%; padding: 10px; margin-top: 10px; background: gray; color: white; border: none; cursor: pointer;">Annuler</button>
    </div>
</div>

<script>
let currentMatchId = null;
let currentChoice = null;
let currentOdds = null;

async function loadMatches() {
    const { data: matches, error } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('status', 'upcoming')
        .order('match_date', { ascending: true });

    const container = document.getElementById('matches-container');

    if (!matches || matches.length === 0) {
        container.innerHTML = "<p>Aucun match pour le moment.</p>";
        return;
    }

    container.innerHTML = matches.map(m => `
        <div style="border: 2px solid #0b3d0b; border-radius: 10px; padding: 20px; margin-bottom: 15px; background: #f9f9f9;">
            <h3 style="margin: 0 0 10px 0;">${m.team_home} vs ${m.team_away}</h3>
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
