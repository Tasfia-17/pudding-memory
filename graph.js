const MEMORY_API = 'http://localhost:8000';
const statusEl = document.getElementById('status');

async function loadGraph() {
    let data;
    try {
        const res = await fetch(`${MEMORY_API}/memory/status`);
        data = await res.json();
    } catch (e) {
        statusEl.textContent = '⚠️ Backend offline – start the server at localhost:8000';
        return;
    }

    const { graph } = data;
    if (!graph.length) {
        statusEl.textContent = 'No concepts tracked yet. Simplify some pages first!';
        return;
    }

    const nodes = new vis.DataSet(graph.map((node, i) => ({
        id: i,
        label: `${node.concept}\n(${node.difficulty_score})`,
        color: {
            background: node.node_color === 'red' ? '#e74c3c' : '#2ecc71',
            border:     node.node_color === 'red' ? '#c0392b' : '#27ae60',
        },
        font: { color: '#fff', size: 14 },
        shape: 'dot',
        size: 10 + node.difficulty_score / 10,  // bigger = harder
    })));

    // Connect nodes that share similar difficulty bands (within 20 pts)
    const edges = new vis.DataSet();
    for (let a = 0; a < graph.length; a++) {
        for (let b = a + 1; b < graph.length; b++) {
            if (Math.abs(graph[a].difficulty_score - graph[b].difficulty_score) <= 20) {
                edges.add({ from: a, to: b, color: { color: '#444' }, width: 1 });
            }
        }
    }

    new vis.Network(
        document.getElementById('network'),
        { nodes, edges },
        {
            physics: { stabilization: { iterations: 150 } },
            interaction: { hover: true, tooltipDelay: 100 },
        }
    );

    statusEl.textContent = `${graph.length} concept${graph.length !== 1 ? 's' : ''} in your graph`;
}

loadGraph();
