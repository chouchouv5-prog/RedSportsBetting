---
title: "My Profile"
date: 2026-06-29
draft: false
---

# My Profile

<div id="profile-content">
    Loading your profile...
</div>

<script>
async function loadProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        document.getElementById('profile-content').innerHTML = `<p>Please <a href="/">login</a> first.</p>`;
        return;
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('vsb_coins')
        .eq('user_id', user.id)
        .single();

    document.getElementById('profile-content').innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>VSB Coins:</strong> <span style="color: gold; font-size: 1.8em;">${profile ? profile.vsb_coins : 1000}</span></p>
        <button onclick="logout()" style="padding: 12px 24px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer;">Logout</button>
    `;
}

function logout() {
    supabaseClient.auth.signOut().then(() => location.href = "/");
}

loadProfile();
</script>