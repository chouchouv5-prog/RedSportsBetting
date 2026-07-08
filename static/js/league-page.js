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
        return;
    }

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
                <button style="flex:1; padding: 10px; background:#1a5c1a; color:white; border:none; border-radius:8px; font-weight:bold;">${m.team_home}<br>${m.odds_home}</button>
                <button style="flex:1; padding: 10px; background:#555; color:white; border:none; border-radius:8px; font-weight:bold;">Nul<br>${m.odds_draw}</button>
                <button style="flex:1; padding: 10px; background:#1a5c1a; color:white; border:none; border-radius:8px; font-weight:bold;">${m.team_away}<br>${m.odds_away}</button>
            </div>
        </div>
    `).join('');
}

function waitForSupabaseAndLoad(competitionName) {
    if (typeof supabaseClient !== 'undefined') {
        loadCompetitionMatches(competitionName, 'matches-container');
    } else {
        setTimeout(() => waitForSupabaseAndLoad(competitionName), 100);
    }
}