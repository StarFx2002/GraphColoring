function getConnectivity() {
	const checkboxes = document.querySelectorAll('#connectivity input[type="checkbox"]');
	const connectivity = [];
	checkboxes.forEach((checkbox, index) => {
		if (checkbox.checked) {
			connectivity.push(checkbox.value);
		}
	});
	return connectivity;
}

function generateGraphData(numNodes, connectivity) {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const nodes = d3.range(numNodes).map(i => ({ id: i, name: alphabet[i % alphabet.length] }));
	const links = [];
	connectivity.forEach(element => {
		let eachNode = element.split('-').map(item => item.trim())
		links.push({source : alphabet.indexOf(eachNode[0]), target : alphabet.indexOf(eachNode[1])})
	});
	return { nodes, links };
}

const customColors = [
	'#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
	'#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
	'#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
	'#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
	'#8c564b', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b',
	'#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5',
	'#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c',
	'#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5'
];

function backTrackingWay(graphData) {
	const numColors = parseInt(document.getElementById('color').value);
    const nodeColors = new Array(graphData.nodes.length).fill(null);

    function isSafe(nodeIndex, color) {
        for (let i = 0; i < graphData.links.length; i++) {
            const link = graphData.links[i];
            if (link.source === nodeIndex || link.target === nodeIndex) {
                const neighborIndex = link.source === nodeIndex ? link.target : link.source;
                if (nodeColors[neighborIndex] === color) {
                    return false;
                }
            }
        }
        return true;
    }

    function graphColoringUtil(nodeIndex) {
        if (nodeIndex === graphData.nodes.length) {
            return true;
        }

        for (let color = 0; color < numColors; color++) {
            if (isSafe(nodeIndex, color)) {
                nodeColors[nodeIndex] = color;

                if (graphColoringUtil(nodeIndex + 1)) {
                    return true;
                }

                nodeColors[nodeIndex] = null; // Backtrack
            }
        }

        return false;
    }

    if (!graphColoringUtil(0)) return null;


    graphData.nodes.forEach((node, index) => {
        node.color = customColors[nodeColors[index]];
    });

    return graphData;
}

function bruteForceWay(graphData) {
	const numColors = parseInt(document.getElementById('color').value);
    const nodeColors = new Array(graphData.nodes.length).fill(null);

    function graphColoringUtil(nodeIndex) {
        if (nodeIndex === graphData.nodes.length) {
            return true;
        }

        for (let color = 0; color < numColors; color++) {
            nodeColors[nodeIndex] = color;

            if (isValidColoring()) {
                if (graphColoringUtil(nodeIndex + 1)) {
                    return true;
                }
            }

            nodeColors[nodeIndex] = null; // Backtrack
        }

        return false;
    }

    function isValidColoring() {
        for (let i = 0; i < graphData.nodes.length; i++) {
            for (let j = i + 1; j < graphData.nodes.length; j++) {
                if (areConnected(i, j) && nodeColors[i] === nodeColors[j]) {
                    return false;
                }
            }
        }
        return true;
    }

    function areConnected(node1, node2) {
        return graphData.links.some(link =>
            (link.source === node1 && link.target === node2) || 
            (link.source === node2 && link.target === node1)
        );
    }

    if (!graphColoringUtil(0)) return null;

    graphData.nodes.forEach((node, index) => {
        node.color = customColors[nodeColors[index]];
    });

    return graphData;
}

function colorGraph(graphData) {
	const startTime = performance.now();
	const backTrackSolution = backTrackingWay(structuredClone(graphData));
	const endTime = performance.now();
	const elapsedTime = endTime - startTime;

	if (backTrackSolution === null) {
		document.getElementById('graph').innerHTML = "<h1> No Solution </h1>"
		return null;
	}

	const startTime1 = performance.now();
	const bruteFroceSolution = bruteForceWay(structuredClone(graphData));
	const endTime1 = performance.now();
	const elapsedTime1= endTime1 - startTime1;

	document.getElementById('backtracking').innerHTML = `${elapsedTime} ms`;
	document.getElementById('bruteforce').innerHTML = `${elapsedTime1} ms`;

	return backTrackSolution;
}

function drawGraph(graphData) {
	//Don't do anything if there's no solution
	if (graphData === null) return;

	const graph = document.getElementById('graph').innerHTML;
	if (graph !== "") document.getElementById('graph').innerHTML = "";

	const width = document.getElementById('graph').clientWidth;
    const height = document.getElementById('graph').clientHeight;

	const svg = d3.select('#graph').append('svg')
		.attr('width', width)
		.attr('height', height);

	const link = svg.selectAll('.link')
		.data(graphData.links)
		.enter().append('line')
		.attr('class', 'link')
		.attr('stroke', '#999')
		.attr('stroke-opacity', 0.6)
		.attr('stroke-width', 1.5);

	const node = svg.selectAll('.node')
		.data(graphData.nodes)
		.enter().append('g')
		.attr('class', 'node')
		.call(d3.drag()
			.on('start', dragstarted)
			.on('drag', dragged)
			.on('end', dragended));

	node.append('circle')
		.attr('r', 20)
		.attr('fill', d => d.color);
	
	node.append('text')
		.attr('dy', '.35em')
		.attr('text-anchor', 'middle')
		.attr('fill', '#fff')
		.text(d => d.name);

	const simulation = d3.forceSimulation(graphData.nodes)
		.force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
		.force('charge', d3.forceManyBody().strength(-100))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.on('tick', ticked);

	function ticked() {
		link
			.attr('x1', d => d.source.x)
			.attr('y1', d => d.source.y)
			.attr('x2', d => d.target.x)
			.attr('y2', d => d.target.y);

		node
			.attr('transform', d => `translate(${d.x},${d.y})`);
	}

	function dragstarted(event, d) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragended(event, d) {
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
}

function generatePossibleLinks() {
	const nodeCount = 2;
	const connectivityContainer = document.getElementById('connectivity');
	connectivityContainer.innerHTML = '';
	const nodeLabels = Array.from({length: nodeCount}, (_, i) => String.fromCharCode(65 + i));
	if (nodeLabels.length > 100) {
		const label = document.createElement('label');
		label.appendChild(document.createTextNode('Cannot exceed more than 100 nodes'));
		connectivityContainer.appendChild(label);
		return;
	}
	for (let i = 0; i < nodeLabels.length; i++) {
		for (let j = i + 1; j < nodeLabels.length; j++) {
			const pair = `${nodeLabels[i]} - ${nodeLabels[j]}`;
			const label = document.createElement('label');
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.value = pair;
			label.appendChild(checkbox);
			label.appendChild(document.createTextNode(pair));
			connectivityContainer.appendChild(label);
		}
	}
}

function main() {
	document.getElementById('graphColoringForm').addEventListener('submit', function(event) {
		event.preventDefault();
        const numNodes = parseInt(document.getElementById('nodes').value);
        const connectivity = getConnectivity();
        const graphData = generateGraphData(numNodes, connectivity);
        const coloredGraphData = colorGraph(graphData);
        drawGraph(coloredGraphData);
	});

	document.getElementById('nodes').addEventListener('input', function() {
		const nodeCount = this.value;
		const connectivityContainer = document.getElementById('connectivity');
		connectivityContainer.innerHTML = '';
		const nodeLabels = Array.from({length: nodeCount}, (_, i) => String.fromCharCode(65 + i));
		if (nodeLabels.length > 100) {
			const label = document.createElement('label');
			label.appendChild(document.createTextNode('Cannot exceed more than 100 nodes'));
			connectivityContainer.appendChild(label);
			return;
		}
		for (let i = 0; i < nodeLabels.length; i++) {
			for (let j = i + 1; j < nodeLabels.length; j++) {
				const pair = `${nodeLabels[i]} - ${nodeLabels[j]}`;
				const label = document.createElement('label');
				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.value = pair;
				label.appendChild(checkbox);
				label.appendChild(document.createTextNode(pair));
				connectivityContainer.appendChild(label);
			}
		}
	});

	// Handle "Select All" checkbox functionality
	document.getElementById('selectAll').addEventListener('change', (event) => {
		const checkboxes = document.querySelectorAll('#connectivity input[type="checkbox"]');
		checkboxes.forEach(checkbox => {
			if (checkbox.id !== 'selectAll') {
				checkbox.checked = event.target.checked;
			}
		});
	});

	// Update "Select All" checkbox state based on individual checkbox changes
	document.getElementById('connectivity').addEventListener('change', (event) => {
		if (event.target.id !== 'selectAll') {
			const checkboxes = document.querySelectorAll('#connectivity input[type="checkbox"]');
			const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked || checkbox.id === 'selectAll');
			document.getElementById('selectAll').checked = allChecked;
		}
	});
}

generatePossibleLinks();
main();
