---
title: "My Profile"
date: 2026-06-29
draft: false
---

# My Profile

Welcome back!

<div id="profile-content">
    Loading...
</div>

<script>
async function loadProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = "/";
        return;
    }

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();

    document.getElementById('profile-content').innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>VSB Coins:</strong> <span style="color: gold; font-size: 1.5em;">${profile ? profile.vsb_coins : 1000}</span></p>
        <button onclick="logout()" style="padding: 10px 20px; background: red; color: white;">Logout</button>
    `;
}

function logout() {
    supabaseClient.auth.signOut();
    location.reload();
}

loadProfile();
</script>