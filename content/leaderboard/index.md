---
title: "Leaderboard"
date: 2026-07-01
draft: false
---

<div id="leaderboard-container">Loading leaderboard...</div>

<script>
async function loadLeaderboard() {
    const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('email, username, vsb_coins')
        .order('vsb_coins', { ascending: false })
        .limit(20);

    const container = document.getElementById('leaderboard-container');

    if (!profiles || profiles.length === 0) {
        container.innerHTML = "<p>No players yet.</p>";
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 3px solid #145214;">
                    <th style="text-align: left; padding: 10px;">Rank</th>
                    <th style="text-align: left; padding: 10px;">Player</th>
                    <th style="text-align: right; padding: 10px;">Coins</th>
                </tr>
            </thead>
            <tbody>
                ${profiles.map((p, i) => `
                    <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">${medals[i] || (i + 1)}</td>
                        <td style="padding: 10px;">${p.username || p.email.split('@')[0]}</td>
                        <td style="padding: 10px; text-align: right; color: #f2b705; font-weight: bold;">${p.vsb_coins}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function waitForSupabase(callback) {
    if (typeof supabaseClient !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForSupabase(callback), 100);
    }
}
waitForSupabase(loadLeaderboard);
</script>