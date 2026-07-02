---
title: "My Profile"
date: 2026-06-29
draft: false
---

<div id="profile-content">Loading your profile...</div>

<script>
async function loadProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const container = document.getElementById('profile-content');

    if (!user) {
        container.innerHTML = `<p>Please <a href="/">login</a> first.</p>`;
        return;
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    const genderIcons = { male: '♂️', female: '♀️', other: '⚧️' };
    const genderIcon = profile && profile.gender ? genderIcons[profile.gender] || '' : '';

    container.innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        ${profile && profile.username ? `<p><strong>Username:</strong> ${profile.username}</p>` : ''}
        ${profile && (profile.first_name || profile.last_name) ? `<p><strong>Name:</strong> ${profile.first_name || ''} ${profile.last_name || ''} ${genderIcon}</p>` : ''}
        <p><strong>VSB Coins:</strong> <span style="color: gold; font-size: 1.8em;">${profile ? profile.vsb_coins : 1000}</span></p>
        <button onclick="logout()" style="padding: 12px 24px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer;">Logout</button>
    `;
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