---
title: "My Profile"
date: 2026-06-29
draft: false
---

<div id="profile-content">Loading your profile...</div>

<h3>My Recent Bets</h3>
<div id="profile-bets">Loading...</div>

<script>
async function loadProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById('profile-content');

    if (!user) {
        container.innerHTML = `<p>Please <a href="/">login</a> first.</p>`;
        document.getElementById('profile-bets').innerHTML = '';
        return;
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    const genderIcons = { male: '♂️', female: '♀️', other: '⚧️' };
    const genderIcon = profile && profile.gender ? genderIcons[profile.gender] || '' : '';
    const displayName = profile && profile.username ? profile.username : user.email.split('@')[0];

    container.innerHTML = `
        <div style="text-align:center; margin-bottom:15px;">${getAvatarHTML(displayName, 80)}</div>
        <p style="text-align:center;"><a href="/settings/">⚙️ Account Settings</a></p>
        ${profile && profile.username ? `<p><strong>Username:</strong> ${profile.username}</p>` : ''}
        ${profile && (profile.first_name || profile.last_name) ? `<p><strong>Name:</strong> ${profile.first_name || ''} ${profile.last_name || ''} ${genderIcon}</p>` : ''}
        <p><strong>VSB Coins:</strong> <span style="color: gold; font-size: 1.8em;">${profile ? profile.vsb_coins : 1000}</span></p>
        <button onclick="logout()" style="padding: 12px 24px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer;">Logout</button>
    `;

    loadRecentBets(user.id);
}

async function loadRecentBets(userId) {
    const betsContainer = document.getElementById('profile-bets');

    const { data: bets } = await supabaseClient
        .from('bets')
        .select('*, matches(team_home, team_away)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (!bets || bets.length === 0) {
        betsContainer.innerHTML = `<p>No bets yet. <a href="/matches/">Place your first bet!</a></p>`;
        return;
    }

    const statusLabels = { pending: '⏳ Pending', won: '💰 Won', won_paid: '💰 Won', lost: '❌ Lost' };
    const choiceLabels = { home: 'Home', draw: 'Draw', away: 'Away' };

    betsContainer.innerHTML = bets.map(b => `
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #f9f9f9;">
            <strong>${b.matches.team_home} vs ${b.matches.team_away}</strong><br>
            ${choiceLabels[b.choice]} — ${b.amount} coins — ${statusLabels[b.status] || b.status}
        </div>
    `).join('') + `<p><a href="/my-bets/">See all my bets →</a></p>`;
}

function logout() {
    supabaseClient.auth.signOut().then(() => location.href = "/");
}

function waitForSupabase(callback) {
    if (typeof supabaseClient !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForSupabase(callback), 100);
    }
}
waitForSupabase(loadProfile);
</script>