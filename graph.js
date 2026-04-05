const MEMORY_API = 'http://localhost:8000';
const statusEl = document.getElementById('status');
const detailEl = document.getElementById('node-detail');

const CONCEPT_INSIGHTS = {
    GraphTraversal: {
        why: "You re-read this section 4 times. The concept of traversing relationships across nodes to find historical outcomes is abstract and requires understanding graph theory first.",
        tip: "Try visualising it as a map — each concept is a city, each relation is a road HydraDB travels to find the best route to your answer."
    },
    Embedding: {
        why: "Paused 18s on this paragraph. The distinction between embedding-only retrieval and HydraDB's multi-stage approach was unclear — especially why embeddings alone fail in enterprise contexts.",
        tip: "Think of embeddings as a rough sketch. HydraDB adds colour, context, and history on top of that sketch."
    },
    Recall: {
        why: "Scrolled back twice. The multi-stage retrieval process — intent, context, graph traversal, recency, ranking — has many moving parts that are hard to hold in working memory at once.",
        tip: "Focus on one stage at a time. Start with 'intent understanding' before moving to graph traversal."
    },
    Retrieval: {
        why: "High complexity score detected. The difference between naive vector retrieval and HydraDB's personalised recall layer involves several layered concepts.",
        tip: "Compare it to Google Search vs a personal librarian who knows your history — that's the retrieval gap HydraDB fills."
    },
    Vector: {
        why: "Long sentence length and technical density flagged. The critique of pure vector search references external research (Google DeepMind, Stanford) which adds cognitive load.",
        tip: "You don't need to know the research — just remember: vectors find similar things, HydraDB finds useful things."
    },
    Tenants: {
        why: "Re-read the B2C vs B2B distinction multiple times. The analogy of 'office buildings' helps but the sub-tenant nesting adds another layer of abstraction.",
        tip: "Draw it out: Tenant = Company, Sub-tenant = Department, User = Employee. That hierarchy covers 90% of use cases."
    },
    Adaptive: {
        why: "Paused on 'implicit feedback loops' and 'contextual pruning'. These are ML concepts applied to memory — unfamiliar framing for most developers.",
        tip: "Think of it as Spotify's algorithm but for your agent's memory — it learns what to play (surface) and what to skip (prune)."
    },
    SemanticSimilarity: {
        why: "The contrast between semantic similarity and HydraDB's personalised ranking was subtle. Both sound like 'finding relevant things' but the distinction matters.",
        tip: "Semantic similarity asks 'what matches?' — HydraDB asks 'what helps this specific person right now?' Same input, very different output."
    },
    ContextEngine: {
        why: "The term 'personalised context engine' is used without a direct comparison to familiar tools, making it hard to anchor the concept.",
        tip: "It's the layer between your agent and raw memory — like a smart filter that knows your agent's role, history, and current task."
    },
    Metadata: {
        why: "The jump from 'semantic recall' to 'deterministic filtering' was a conceptual shift. Understanding when to use metadata vs semantic search requires experience.",
        tip: "Rule of thumb: use metadata when you know exactly what you want (project=strawberry), use semantic recall when you don't."
    },
    Tenant: {
        why: "The office building analogy made this click quickly. Data isolation is a familiar concept from multi-tenant SaaS.",
        tip: "You've got this. Just remember: one tenant per organisation, sub-tenants for teams within."
    },
    Personalization: {
        why: "The concept of two users getting different results for the same query is intuitive — similar to personalised search results you already use daily.",
        tip: "Solid understanding. This is the core value prop of HydraDB over traditional RAG."
    },
    Pudding: {
        why: "Familiar context — you've been using Pudding throughout this session. The extension's own concepts are well understood.",
        tip: "Keep going — your brain map is growing with every page you simplify."
    }
};

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

    network.on('click', params => {
        if (!params.nodes.length) { detailEl.style.display = 'none'; return; }
        const node = nodes.get(params.nodes[0]);
        const m = node._meta;
        const struggled = m.difficulty_score >= 60;
        const insight = CONCEPT_INSIGHTS[m.label] || {
            why: struggled
                ? "High sentence complexity and unfamiliar terminology detected on this concept."
                : "Clear explanation with familiar analogies made this concept easy to absorb.",
            tip: struggled
                ? "HydraDB will highlight this automatically next time it appears."
                : "Well understood — HydraDB will deprioritise this in future recalls."
        };

        detailEl.style.display = 'block';
        detailEl.innerHTML = `
            <h3>Concept Detail</h3>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <span style="width:14px;height:14px;border-radius:50%;background:${struggled?'#e74c3c':'#2ecc71'};display:inline-block;flex-shrink:0"></span>
                <strong style="font-size:15px">${m.label}</strong>
            </div>
            <div style="color:#ccc;font-size:12px;line-height:1.9">
                <div>📊 Difficulty score: <b style="color:${struggled?'#e74c3c':'#2ecc71'}">${m.difficulty_score} / 100</b></div>
                <div>🔗 Relation: <b>${m.relation}</b></div>
                <div>🧠 Status: <b>${struggled ? '⚠️ Still struggling' : '✅ Mastered'}</b></div>
            </div>
            <hr style="border-color:#ffffff11;margin:12px 0">
            <div style="font-size:12px;color:#aaa;line-height:1.7">
                <div style="color:#F4C542;font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">
                    ${struggled ? '🔴 Why you struggled' : '🟢 Why you did well'}
                </div>
                <p style="margin-bottom:12px">${insight.why}</p>
                <div style="color:#F4C542;font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">
                    ${struggled ? '💡 HydraDB tip' : '✨ What HydraDB knows'}
                </div>
                <p>${insight.tip}</p>
            </div>
            <hr style="border-color:#ffffff11;margin:12px 0">
            <div style="font-size:11px;color:#555;line-height:1.6">
                ${struggled
                    ? '🔁 HydraDB will auto-highlight this concept the next time it appears on any page you visit.'
                    : '📦 HydraDB has deprioritised this in your recall layer — it won\'t clutter your agent\'s context.'}
            </div>`;
    });

    statusEl.textContent = `${rawNodes.length} concept${rawNodes.length !== 1 ? 's' : ''} in your cognitive graph`;
}

loadGraph();

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
