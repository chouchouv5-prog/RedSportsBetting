let currentMatchId = null;
let currentChoice = null;
let currentOdds = null;

async function loadCompetitionMatches(competitionName, containerId) {
    const container = document.getElementById(containerId);

    const { data: matches, error } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('competition', competitionName)
        .neq('status', 'finished')
        .order('match_date', { ascending: true });

    if (error || !matches || matches.length === 0) {
        container.innerHTML = "<p>Aucun match disponible pour le moment.</p>";
    } else {
        matches.sort((a, b) => {
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (b.status === 'live' && a.status !== 'live') return 1;
            return new Date(a.match_date) - new Date(b.match_date);
        });

        container.innerHTML = matches.map(m => `
            <div style="border: 1px solid #ddd; border-radius: 12px; padding: 15px; margin-bottom: 15px; background: white;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px;">
                    <h3 style="margin: 0;">${m.team_home} vs ${m.team_away}</h3>
                    ${m.status === 'live' ? '<span style="background:#e63946;color:white;padding:3px 10px;border-radius:6px;font-size:0.8em;font-weight:bold;">🔴 LIVE</span>' : ''}
                </div>
                <p style="color: #666; margin: 0 0 10px;">${new Date(m.match_date).toLocaleString('en-GB')}</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="openBetModal(${m.id}, '${m.team_home} vs ${m.team_away}', 'home', ${m.odds_home})" style="flex:1; padding: 10px; background:#1a5c1a; color:white; border:none; border-radius:8px; font-weight:bold;">${m.team_home}<br>${m.odds_home}</button>
                    <button onclick="openBetModal(${m.id}, '${m.team_home} vs ${m.team_away}', 'draw', ${m.odds_draw})" style="flex:1; padding: 10px; background:#555; color:white; border:none; border-radius:8px; font-weight:bold;">Nul<br>${m.odds_draw}</button>
                    <button onclick="openBetModal(${m.id}, '${m.team_home} vs ${m.team_away}', 'away', ${m.odds_away})" style="flex:1; padding: 10px; background:#1a5c1a; color:white; border:none; border-radius:8px; font-weight:bold;">${m.team_away}<br>${m.odds_away}</button>
                </div>
            </div>
        `).join('');
    }

    loadRecentResults(competitionName);
}

async function loadRecentResults(competitionName) {
    const resultsContainer = document.getElementById('recent-results-container');
    if (!resultsContainer) return;

    const { data: results } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('competition', competitionName)
        .eq('status', 'finished')
        .order('match_date', { ascending: false })
        .limit(5);

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = "<p>Aucun résultat récent.</p>";
        return;
    }

    resultsContainer.innerHTML = results.map(m => {
        const scoreDisplay = (m.score_home !== null && m.score_away !== null)
            ? `${m.score_home} - ${m.score_away}`
            : "Score N/A";
        return `
        <div style="border: 1px solid #ddd; border-radius: 10px; padding: 15px; margin-bottom: 10px; background: #f9f9f9;">
            <p style="color: #666; margin: 0 0 6px;">${new Date(m.match_date).toLocaleDateString('en-GB')}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                <span>${m.team_home}</span>
                <span style="background: #145214; color: white; padding: 4px 12px; border-radius: 6px;">${scoreDisplay}</span>
                <span>${m.team_away}</span>
            </div>
        </div>
        `;
    }).join('');
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

function waitForSupabaseAndLoad(competitionName) {
    if (typeof supabaseClient !== 'undefined') {
        loadCompetitionMatches(competitionName, 'matches-container');
    } else {
        setTimeout(() => waitForSupabaseAndLoad(competitionName), 100);
    }
}