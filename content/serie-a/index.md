---
title: "Serie A"
date: 2026-07-04
draft: false
---

<div id="matches-container">Loading...</div>

<script>
async function loadMatches() {
    const container = document.getElementById('matches-container');
    const { data: matches, error } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('competition', 'Serie A')
        .order('match_date', { ascending: true });

    if (error || !matches || matches.length === 0) {
        container.innerHTML = "<p>Aucun match disponible pour le moment.</p>";
        return;
    }

    container.innerHTML = matches.map(m => `
        <div style="border: 1px solid #ddd; border-radius: 12px; padding: 15px; margin-bottom: 15px; background: white;">
            <h3 style="margin: 0 0 5px;">${m.team_home} vs ${m.team_away}</h3>
            <p style="color: #666; margin: 0 0 10px;">${new Date(m.match_date).toLocaleString('fr-FR')}</p>
            <div style="display: flex; gap: 10px;">
                <button style="flex:1; padding: 10px; background:#1a5c1a; color:white; border:none; border-radius:8px; font-weight:bold;">${m.team_home}<br>${m.odds_home}</button>
                <button style="flex:1; padding: 10px; background:#555; color:white; border:none; border-radius:8px; font-weight:bold;">Nul<br>${m.odds_draw}</button>
                <button style="flex:1; padding: 10px; background:#1a5c1a; color:white; border:none; border-radius:8px; font-weight:bold;">${m.team_away}<br>${m.odds_away}</button>
            </div>
        </div>
    `).join('');
}

function waitForSupabase(callback) {
    if (typeof supabaseClient !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForSupabase(callback), 100);
    }
}
waitForSupabase(loadMatches);
</script>