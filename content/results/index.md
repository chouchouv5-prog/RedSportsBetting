---
title: "Results"
date: 2026-07-01
draft: false
---

<div id="results-container">Loading results...</div>

<script>
async function loadResults() {
    const { data: matches, error } = await supabaseClient
        .from('matches')
        .select('*')
        .eq('status', 'finished')
        .order('match_date', { ascending: false });

    const container = document.getElementById('results-container');

    if (!matches || matches.length === 0) {
        container.innerHTML = "<p>No results yet.</p>";
        return;
    }

    container.innerHTML = matches.map(m => `
        <div style="border: 2px solid #0b3d0b; border-radius: 10px; padding: 20px; margin-bottom: 15px; background: #f9f9f9;">
            <p style="color: #555; margin: 0 0 8px 0;">${new Date(m.match_date).toLocaleDateString('en-GB')}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.3em; font-weight: bold;">
                <span>${m.team_home}</span>
                <span style="background: #145214; color: white; padding: 5px 15px; border-radius: 5px;">${m.score_home} - ${m.score_away}</span>
                <span>${m.team_away}</span>
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
waitForSupabase(loadResults);
</script>