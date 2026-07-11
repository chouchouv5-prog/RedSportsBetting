---
title: "Account Settings"
date: 2026-07-02
draft: false
---
<div id="settings-content">Loading...</div>
<script>
async function loadSettings() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById('settings-content');
    if (!user) {
        container.innerHTML = `<p>Please <a href="/">login</a> first.</p>`;
        return;
    }
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('favorite_team')
        .eq('user_id', user.id)
        .single();
    container.innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <hr style="margin: 20px 0;">
        <h3>Change Password</h3>
        <input id="new-password" type="password" placeholder="New password" style="width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box;">
        <button onclick="changePassword()" style="padding: 10px 20px; background: #d4af37; border: none; cursor: pointer; font-weight: bold;">Update Password</button>
        <hr style="margin: 20px 0;">
        <h3>Favorite Team</h3>
        <select id="favorite-team-select" style="width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box;">
            <option value="">Loading teams...</option>
        </select>
        <button onclick="saveFavoriteTeam()" style="padding: 10px 20px; background: #0d8f4f; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 5px;">Save Favorite Team</button>
    `;
    loadTeamOptions(profile ? profile.favorite_team : null);
}
async function loadTeamOptions(currentFavorite) {
    const { data: matches } = await supabaseClient
        .from('matches')
        .select('team_home, team_away, competition');
    const select = document.getElementById('favorite-team-select');
    if (!matches || matches.length === 0) {
        select.innerHTML = `<option value="">No teams available</option>`;
        return;
    }
    const teamsByCompetition = {};
    matches.forEach(m => {
        if (!teamsByCompetition[m.competition]) {
            teamsByCompetition[m.competition] = new Set();
        }
        teamsByCompetition[m.competition].add(m.team_home);
        teamsByCompetition[m.competition].add(m.team_away);
    });
    let html = `<option value="">-- Select your favorite team --</option>`;
    Object.keys(teamsByCompetition).sort().forEach(competition => {
        html += `<optgroup label="${competition}">`;
        const sortedTeams = Array.from(teamsByCompetition[competition]).sort();
        sortedTeams.forEach(team => {
            const selected = team === currentFavorite ? 'selected' : '';
            html += `<option value="${team}" ${selected}>${team}</option>`;
        });
        html += `</optgroup>`;
    });
    select.innerHTML = html;
}
async function saveFavoriteTeam() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const selectedTeam = document.getElementById('favorite-team-select').value;
    if (!selectedTeam) {
        alert("Please select a team.");
        return;
    }
    const { error } = await supabaseClient
        .from('profiles')
        .update({ favorite_team: selectedTeam })
        .eq('user_id', user.id);
    if (error) alert("Error: " + error.message);
    else alert("Favorite team saved!");
}
async function changePassword() {
    const newPassword = document.getElementById('new-password').value;
    if (!newPassword || newPassword.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else alert("Password updated!");
}
function waitForSupabase(callback) {
    if (typeof supabaseClient !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForSupabase(callback), 100);
    }
}
waitForSupabase(loadSettings);
</script>