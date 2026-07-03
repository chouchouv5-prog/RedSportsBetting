---
title: "Search Results"
date: 2026-07-03
draft: false
---

<div id="search-container">Loading...</div>

<script>
async function searchNews(q) {
    const res = await fetch('/index.json');
    const articles = await res.json();
    return articles.filter(a =>
        a.title.toLowerCase().includes(q.toLowerCase()) ||
        a.summary.toLowerCase().includes(q.toLowerCase())
    );
}

async function runSearch() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const container = document.getElementById('search-container');

    if (!q) {
        container.innerHTML = "<p>Type something in the search bar above.</p>";
        return;
    }

    container.innerHTML = `<p>Searching for "<strong>${q}</strong>"...</p>`;

    // Search matches (teams)
    const { data: matches } = await supabaseClient
        .from('matches')
        .select('*')
        .or(`team_home.ilike.%${q}%,team_away.ilike.%${q}%`);

    // Search players
    const { data: players } = await supabaseClient
        .from('profiles')
        .select('username, vsb_coins')
        .ilike('username', `%${q}%`);

    // Search news
    const news = await searchNews(q);

    let html = '';

    html += `<h3>⚽ Matches (${matches ? matches.length : 0})</h3>`;
    if (matches && matches.length > 0) {
        html += matches.map(m => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #f9f9f9;">
                <a href="/matches/">${m.team_home} vs ${m.team_away}</a> — ${new Date(m.match_date).toLocaleDateString('en-GB')}
            </div>
        `).join('');
    } else {
        html += '<p>No matches found.</p>';
    }

    html += `<h3>👤 Players (${players ? players.length : 0})</h3>`;
    if (players && players.length > 0) {
        html += players.map(p => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #f9f9f9;">
                ${getAvatarHTML(p.username, 24)} ${p.username} — 💰 ${p.vsb_coins}
            </div>
        `).join('');
    } else {
        html += '<p>No players found.</p>';
    }

    html += `<h3>📰 News (${news.length})</h3>`;
    if (news.length > 0) {
        html += news.map(n => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: #f9f9f9;">
                <a href="${n.url}">${n.title}</a> — ${new Date(n.date).toLocaleDateString('en-GB')}
                <p style="margin: 5px 0 0; color: #666; font-size: 0.9em;">${n.summary}</p>
            </div>
        `).join('');
    } else {
        html += '<p>No news found.</p>';
    }

    container.innerHTML = html;
}

function waitForSupabase(callback) {
    if (typeof supabaseClient !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForSupabase(callback), 100);
    }
}
waitForSupabase(runSearch);
</script>