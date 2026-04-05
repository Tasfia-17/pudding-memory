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

    const { nodes: rawNodes, edges: rawEdges } = data;
    if (!rawNodes.length) {
        statusEl.textContent = 'No concepts tracked yet. Simplify some pages first!';
        return;
    }

    const nodes = new vis.DataSet(rawNodes.map((node, i) => ({
        id: i,
        label: node.label,
        title: `<b>${node.label}</b><br>Difficulty: ${node.difficulty_score}<br>Relation: ${node.relation}`,
        color: {
            background: node.color === 'red' ? '#e74c3c' : '#2ecc71',
            border:     node.color === 'red' ? '#c0392b' : '#27ae60',
            highlight: { background: '#F4C542', border: '#d4a017' }
        },
        font: { color: '#fff', size: 14, bold: node.color === 'red' },
        shape: 'dot',
        size: 12 + node.difficulty_score / 8,
        _meta: node
    })));

    const edges = new vis.DataSet();
    // Connect nodes with similar difficulty (within 25 pts) — mimics graph relationships
    const arr = rawNodes;
    for (let a = 0; a < arr.length; a++) {
        for (let b = a + 1; b < arr.length; b++) {
            if (Math.abs(arr[a].difficulty_score - arr[b].difficulty_score) <= 25) {
                edges.add({
                    from: a, to: b,
                    color: { color: arr[a].color === 'red' ? '#e74c3c55' : '#2ecc7155' },
                    width: 1.5,
                    dashes: arr[a].difficulty_score < 60
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

    // Show node detail panel on click
    network.on('click', params => {
        if (!params.nodes.length) { detailEl.style.display = 'none'; return; }
        const node = nodes.get(params.nodes[0]);
        const m = node._meta;
        const struggled = m.difficulty_score >= 60;
        detailEl.style.display = 'block';
        detailEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <span style="width:14px;height:14px;border-radius:50%;background:${struggled?'#e74c3c':'#2ecc71'};display:inline-block"></span>
                <strong style="font-size:16px">${m.label}</strong>
            </div>
            <div style="color:#aaa;font-size:13px;line-height:1.8">
                <div>📊 Difficulty score: <b style="color:${struggled?'#e74c3c':'#2ecc71'}">${m.difficulty_score}</b></div>
                <div>🔗 Relation: <b>${m.relation}</b></div>
                <div>🧠 Status: <b>${struggled ? '⚠️ Still struggling' : '✅ Mastered'}</b></div>
                <div style="margin-top:8px;font-size:11px;color:#666">
                    ${struggled
                        ? 'HydraDB will auto-highlight this concept on your next visit to related pages.'
                        : 'This concept is well understood. HydraDB will deprioritize it in future recalls.'}
                </div>
            </div>`;
    });

    statusEl.textContent = `${rawNodes.length} concept${rawNodes.length !== 1 ? 's' : ''} in your cognitive graph`;
}

loadGraph();
