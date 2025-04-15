// Edge Weight Graph Configuration
class EdgeWeightGraphConfig {
    // Common settings and methods shared between left and right graphs
    static common = {
        color: d3.scaleOrdinal()
            .domain(['Engineering', 'Product', 'Sales', 'Operations'])
            .range(['#2196F3', '#4CAF50', '#FFC107', '#9C27B0']), // Material colors for teams

        // Custom link styling for edge weights
        setupLinks(link, options) {
            link
                .attr("stroke-width", d => options.linkWidth * Math.pow(d.weight, 0.7) * 8)  // More dramatic width scaling
                .attr("stroke-opacity", 0.4)  // Set opacity alongside width
                .attr("stroke", "#666");  // Consistent color for better weight visibility
        },

        createSimulation(data, options) {
            return d3.forceSimulation(data.nodes)
                .force("link", d3.forceLink(data.links)
                    .id(d => d.id)
                    .distance(d => options.linkDistance * (2.5 - d.weight * 2)) // Stronger weight = closer nodes
                    .strength(d => Math.pow(d.weight, 0.7))) // Non-linear strength scaling
                .force("charge", d3.forceManyBody()
                    .strength(options.chargeStrength))
                .force("center", d3.forceCenter(options.width / 2, options.height / 2))
                .force("collision", d3.forceCollide().radius(options.nodeRadius * 1.5))
                .force("x", d3.forceX(options.width / 2).strength(0.05))
                .force("y", d3.forceY(options.height / 2).strength(0.05));
        },

        setupTooltips(node) {
            node.append("title")
                .text(d => d.type || 'Unknown Type');
        },

        createDragBehavior(simulation) {
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
            
            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        },

        setupSimulationTick(simulation, link, node, options) {
            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y)
                    .attr("stroke-width", d => options.linkWidth * Math.pow(d.weight, 0.7) * 8)
                    .attr("stroke-opacity", 0.4)  // Direct value like modularity.js
                    .attr("stroke", "#666");

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            });
        },

        getOptions(width, height) {
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            return {
                width,
                height,
                nodeRadius: 8,
                chargeStrength: -200,
                linkDistance: 60,
                linkWidth: 2,
                stroke: "#666",
                color: EdgeWeightGraphConfig.common.color
            };
        }
    };

    // Settings specific to the left (small) graph - lightweight integration
    static left = {
        createVisualization(containerId, data) {
            const container = document.getElementById(containerId);
            const options = EdgeWeightGraphConfig.common.getOptions(container?.clientWidth, container?.clientHeight);
            const result = BaseGraphConfig.createVisualization(containerId, data, options);
            
            // Apply custom link styling
            EdgeWeightGraphConfig.common.setupLinks(result.link, options);

            // Apply specific transform for small graph
            result.svg
                .transition()
                .duration(0)
                .call(result.zoom.transform, d3.zoomIdentity
                    .translate(96.64309292397974, 74.14597853413247)
                    .scale(0.6025073685172911));

            return result;
        }
    };

    // Settings specific to the right (large) graph - heavy integration
    static right = {
        createVisualization(containerId, data) {
            const container = document.getElementById(containerId);
            const options = EdgeWeightGraphConfig.common.getOptions(container?.clientWidth, container?.clientHeight);
            const result = BaseGraphConfig.createVisualization(containerId, data, options);

            // Apply custom link styling
            EdgeWeightGraphConfig.common.setupLinks(result.link, options);

            // Apply specific transform for large graph
            result.svg
                .transition()
                .duration(0)
                .call(result.zoom.transform, d3.zoomIdentity
                    .translate(23.721455519306005, 21.060603262190966)
                    .scale(0.7958309989877309));

            return result;
        }
    };
} 