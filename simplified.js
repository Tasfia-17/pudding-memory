if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['puddingSectionScores', 'puddingScoresUrl'], function(result) {
        const scores = result.puddingSectionScores;
        if (!scores) return;

        const vals = Object.values(scores).map(v => v.score);
        const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
        const hardCount = vals.filter(s => s >= 60).length;
        const easyCount = vals.filter(s => s < 60).length;

        const banner = document.getElementById('score-banner');
        banner.style.display = 'block';
        banner.innerHTML =
            '<strong>📊 Live complexity data from your reading session</strong><br>' +
            'Pudding scored <strong>' + vals.length + ' paragraphs</strong> on this page. ' +
            'Average difficulty: <strong>' + avg + '/100</strong> &nbsp;·&nbsp; ' +
            '<span style="color:#c0392b">⚠️ ' + hardCount + ' hard sections</span> &nbsp;·&nbsp; ' +
            '<span style="color:#27ae60">✅ ' + easyCount + ' easy sections</span><br>' +
            '<span style="font-size:11px;color:#b0907a">Scores based on: pause duration · re-read count · sentence complexity · jargon density · HydraDB history</span>';

        document.querySelectorAll('.section').forEach(function(section) {
            var heading = (section.querySelector('h3') || {}).textContent || '';
            var tag = section.querySelector('.tag');
            if (!tag) return;

            var keywords = heading.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(function(w) { return w.length > 3; });
            var bestScore = null;
            Object.entries(scores).forEach(function(entry) {
                var kl = entry[0].toLowerCase();
                var val = entry[1];
                if (keywords.some(function(kw) { return kl.includes(kw); })) {
                    if (!bestScore || val.score > bestScore.score) bestScore = val;
                }
            });

            if (bestScore) {
                var hard = bestScore.score >= 60;
                tag.className = 'tag ' + (hard ? 'hard' : 'easy');
                tag.innerHTML = hard
                    ? '⚠️ Struggled here &nbsp;<span class="live-score" style="background:#fde8e8;color:#c0392b;border:1px solid #e74c3c44">score: ' + bestScore.score + '</span>'
                    : '✅ You got this &nbsp;<span class="live-score" style="background:#e8fdf0;color:#27ae60;border:1px solid #2ecc7144">score: ' + bestScore.score + '</span>';
                tag.title = 'Pudding measured: complexity score ' + bestScore.score + '/100';
            }
        });
    });
}
