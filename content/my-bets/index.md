---
title: "My Bets"
date: 2026-07-01
draft: false
---

<div id="bets-container">Loading your bets...</div>

<script>
async function loadMyBets() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById('bets-container');

    if (!user) {
        container.innerHTML = `<p>Please <a href="/">login</a> to see your bets.</p>`;
        return;
    }

    const { data: bets, error } = await supabaseClient
        .from('bets')
        .select('*, matches(team_home, team_away, match_date)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (!bets || bets.length === 0) {
        container.innerHTML = "<p>You haven't placed any bets yet. <a href='/matches/'>See upcoming matches</a>.</p>";
        return;
    }

    const statusLabels = {
        pending: '⏳ Pending',
        won: '✅ Won',
        lost: '❌ Lost'
    };

    const choiceLabels = {
        home: 'Home team',
        draw: 'Draw',
        away: 'Away team'
    };

    container.innerHTML = bets.map(b => `
        <div style="border: 2px solid #0b3d0b; border-radius: 10px; padding: 15px; margin-bottom: 12px; background: #f9f9f9;">
            <strong>${b.matches.team_home} vs ${b.matches.team_away}</strong><br>
            <span style="color: #555;">${new Date(b.matches.match_date).toLocaleString('en-GB')}</span><br>
            Bet: ${choiceLabels[b.choice]} — Amount: ${b.amount} coins — Odds: ${b.odds}<br>
            Status: <strong>${statusLabels[b.status] || b.status}</strong>
        </div>
    `).join('');
}

loadMyBets();
</script>