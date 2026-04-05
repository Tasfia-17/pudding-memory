const MEMORY_API = 'http://localhost:8000';
const statusEl = document.getElementById('status');
const detailEl = document.getElementById('node-detail');

async function loadGraph() {
    let data;
    try {
        const res = await fetch(`${MEMORY_API}/api/graph?user_id=guest`);
        data = await res.json();
    } catch (e) {
        statusEl.textContent = '⚠️ Backend offline – start the server at localhost:8000';
        return;
    }

    const { nodes: rawNodes } = data;
    if (!rawNodes.length) {
        statusEl.textContent = 'No concepts tracked yet. Simplify some pages first!';
        return;
    }

    const nodes = new vis.DataSet(rawNodes.map((node, i) => ({
        id: i,
        label: node.label,
        color: {
            background: node.color === 'red' ? '#e74c3c' : '#2ecc71',
            border:     node.color === 'red' ? '#c0392b' : '#27ae60',
            highlight: { background: '#F4C542', border: '#d4a017' }
        },
        font: { color: '#fff', size: 14 },
        shape: 'dot',
        size: 12 + node.difficulty_score / 8,
        _meta: node
    })));

    const edges = new vis.DataSet();
    for (let a = 0; a < rawNodes.length; a++) {
        for (let b = a + 1; b < rawNodes.length; b++) {
            if (Math.abs(rawNodes[a].difficulty_score - rawNodes[b].difficulty_score) <= 25) {
                edges.add({
                    from: a, to: b,
                    color: { color: rawNodes[a].color === 'red' ? '#e74c3c55' : '#2ecc7155' },
                    width: 1.5,
                    dashes: rawNodes[a].difficulty_score < 60
                });
            }
        }
    }

    const network = new vis.Network(
        document.getElementById('network'),
        { nodes, edges },
        {
            physics: { stabilization: { iterations: 200 }, barnesHut: { gravitationalConstant: -3000 } },
            interaction: { hover: true, tooltipDelay: 80 },
            edges: { smooth: { type: 'curvedCW', roundness: 0.2 } }
        }
    );

    network.on('click', params => {
        if (!params.nodes.length) { detailEl.style.display = 'none'; return; }
        const node = nodes.get(params.nodes[0]);
        const m = node._meta;
        const struggled = m.difficulty_score >= 60;
        detailEl.style.display = 'block';
        detailEl.innerHTML =
            '<h3>Concept Detail</h3>' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
            '<span style="width:14px;height:14px;border-radius:50%;background:' + (struggled ? '#e74c3c' : '#2ecc71') + ';display:inline-block;flex-shrink:0"></span>' +
            '<strong style="font-size:15px">' + m.label + '</strong></div>' +
            '<div style="color:#ccc;font-size:12px;line-height:1.9">' +
            '<div>📊 Difficulty: <b style="color:' + (struggled ? '#e74c3c' : '#2ecc71') + '">' + m.difficulty_score + ' / 100</b></div>' +
            '<div>🔗 Relation: <b>' + m.relation + '</b></div>' +
            '<div>🧠 Status: <b>' + (struggled ? '⚠️ Still struggling' : '✅ Mastered') + '</b></div></div>' +
            '<hr style="border-color:#ffffff11;margin:12px 0">' +
            '<div style="font-size:11px;color:#555;line-height:1.6">' +
            (struggled
                ? '🔁 HydraDB will auto-highlight this concept the next time it appears on any page you visit.'
                : '📦 HydraDB has deprioritised this in your recall layer.') +
            '</div>';
    });

    statusEl.textContent = rawNodes.length + ' concept' + (rawNodes.length !== 1 ? 's' : '') + ' in your cognitive graph';
}

loadGraph();
