// Base D3 graph configuration and utilities
class BaseGraphConfig {
    static createVisualization(containerId, data, options) {
        // Clear any existing SVG
        d3.select(`#${containerId}`).selectAll("*").remove();

        // Create SVG with explicit dimensions
        const svg = d3.select(`#${containerId}`)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", [0, 0, options.width, options.height]);

        // Create container for the graph
        const graphContainer = svg.append("g");

        // Create links
        const link = graphContainer.append("g")
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("class", "link")
            .attr("stroke", options.stroke || "#666")
            .attr("stroke-width", d => typeof options.linkWidth === 'function' ? options.linkWidth(d) : options.linkWidth);

        // Create nodes
        const node = graphContainer.append("g")
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("class", "node")
            .attr("r", d => typeof options.nodeRadius === 'function' ? options.nodeRadius(d) : options.nodeRadius)
            .attr("fill", d => typeof options.color === 'function' ? options.color(d) : options.color);

        // Create simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links)
                .id(d => d.id)
                .distance(d => typeof options.linkDistance === 'function' ? options.linkDistance(d) : options.linkDistance)
                .strength(0.7))
            .force("charge", d3.forceManyBody()
                .strength(options.chargeStrength))
            .force("center", d3.forceCenter(options.width/2, options.height/2))
            .force("collision", d3.forceCollide().radius(d => {
                const radius = typeof options.nodeRadius === 'function' ? options.nodeRadius(d) : options.nodeRadius;
                return radius * 1.5;
            }));

        // Add drag behavior
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                graphContainer.attr("transform", event.transform);
                // Log transform values when zooming ends
                const t = event.transform;
                console.log(`Transform values for ${containerId}:
.translate(${t.x}, ${t.y})
.scale(${t.k})`);
            });

        svg.call(zoom);

        // Set up simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        return { simulation, svg, graphContainer, link, node, zoom };
    }
} 