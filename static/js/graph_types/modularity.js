// Modularity Graph Configuration
class ModularityGraphConfig {
    // Common settings and methods shared between left and right graphs
    static common = {
        // Use node color based on team
        getNodeColor(d) {
            return d.color;
        },

        // Create force simulation with clustering forces
        createSimulation(data, options) {
            const simulation = d3.forceSimulation(data.nodes)
                .force("link", d3.forceLink(data.links)
                    .id(d => d.id)
                    .distance(d => options.linkDistance * (1 + d.weight))
                    .strength(d => d.weight))
                .force("charge", d3.forceManyBody()
                    .strength(options.chargeStrength))
                .force("center", d3.forceCenter(options.width / 2, options.height / 2))
                .force("collision", d3.forceCollide().radius(options.nodeRadius * 1.5))
                .force("x", d3.forceX(options.width / 2).strength(0.05))
                .force("y", d3.forceY(options.height / 2).strength(0.05));

            // Add clustering force to group nodes by team
            const forceCluster = alpha => {
                const centroids = {};
                const strength = 0.3;

                // Calculate team centroids
                data.nodes.forEach(d => {
                    if (!centroids[d.team]) {
                        centroids[d.team] = {x: 0, y: 0, count: 0};
                    }
                    centroids[d.team].x += d.x;
                    centroids[d.team].y += d.y;
                    centroids[d.team].count += 1;
                });

                // Normalize centroids
                for (let team in centroids) {
                    centroids[team].x /= centroids[team].count;
                    centroids[team].y /= centroids[team].count;
                }

                // Apply force towards team centroid
                data.nodes.forEach(d => {
                    const centroid = centroids[d.team];
                    d.vx += (centroid.x - d.x) * strength * alpha;
                    d.vy += (centroid.y - d.y) * strength * alpha;
                });
            };

            simulation.force("cluster", forceCluster);
            return simulation;
        },

        setupTooltips(node) {
            node.append("title")
                .text(d => {
                    let tooltip = `Team: ${d.team}`;
                    if (d.secondary_team) {
                        tooltip += `\nSecondary Team: ${d.secondary_team}`;
                    }
                    if (d.role) {
                        tooltip += `\nRole: ${d.role}`;
                    }
                    return tooltip;
                });
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
                    .attr("stroke-width", d => options.linkWidth * d.weight)
                    .attr("stroke-opacity", d => Math.max(0.2, d.weight));

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => options.nodeRadius * (d.role === 'Lead' ? 1.5 : 1));
            });
        }
    };

    // Settings specific to the left (small) graph - matrixed org
    static left = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            // Create color scale for teams
            const teamColors = {
                'Product': '#4CAF50',
                'Engineering': '#2196F3',
                'Design': '#9C27B0',
                'Data': '#FFC107'
            };
            
            return {
                width,
                height,
                nodeRadius: 6,
                chargeStrength: -200,
                linkDistance: 40,
                linkWidth: 1.5,
                color: d => teamColors[d.team] || '#999'  // Use team colors with fallback
            };
        },

        createVisualization(containerId, data) {
            const container = document.getElementById(containerId);
            const options = this.getOptions(container?.clientWidth, container?.clientHeight);
            const result = BaseGraphConfig.createVisualization(containerId, data, options);

            // Apply specific transform for small graph
            result.svg
                .transition()
                .duration(0)
                .call(result.zoom.transform, d3.zoomIdentity
                    .translate(-96.58102802250403, -126.24077184993126)
                    .scale(1.5181312823002522));

            return result;
        }
    };

    // Settings specific to the right (large) graph - two-pizza teams
    static right = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            // Create color scale for teams
            const teamColors = {
                'Frontend': '#2196F3',
                'Backend': '#4CAF50',
                'Mobile': '#9C27B0',
                'Infrastructure': '#FFC107',
                'Data Platform': '#FF5722',
                'Security': '#607D8B'
            };
            
            return {
                width,
                height,
                nodeRadius: 6,
                chargeStrength: -300,
                linkDistance: 60,
                linkWidth: 2,
                color: d => teamColors[d.team] || '#999'  // Use team colors with fallback
            };
        },

        createVisualization(containerId, data) {
            const container = document.getElementById(containerId);
            const options = this.getOptions(container?.clientWidth, container?.clientHeight);
            const result = BaseGraphConfig.createVisualization(containerId, data, options);

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