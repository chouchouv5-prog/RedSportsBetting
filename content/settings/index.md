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

    container.innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <hr style="margin: 20px 0;">
        <h3>Change Password</h3>
        <input id="new-password" type="password" placeholder="New password" style="width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box;">
        <button onclick="changePassword()" style="padding: 10px 20px; background: #d4af37; border: none; cursor: pointer; font-weight: bold;">Update Password</button>
    `;
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