// Betweenness Centrality Graph Configuration
class BetweennessCentralityGraphConfig {
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
                    if (d.betweenness !== undefined) {
                        tooltip += `\nBetweenness: ${d.betweenness.toFixed(3)}`;
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
                    .attr("stroke-width", d => {
                        // Use the custom linkWidth function if it's a function, otherwise use the value
                        return typeof options.linkWidth === 'function' ? 
                            options.linkWidth(d) : 
                            options.linkWidth * d.weight;
                    })
                    .attr("stroke-opacity", d => Math.max(0.2, d.weight));

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => {
                        return typeof options.nodeRadius === 'function' ? 
                            options.nodeRadius(d) : 
                            options.nodeRadius * (d.betweenness ? 1 + d.betweenness : 1);
                    })
                    .attr("fill", d => d.color);
            });
        }
    };

    // Settings specific to the left (small) graph - matrixed org
    static left = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            // Use same team colors as right graph
            const teamColors = {
                'Frontend': '#2196F3',    // Material Blue
                'Backend': '#4CAF50',     // Material Green
                'Mobile': '#9C27B0',      // Material Purple
                'Infrastructure': '#FFC107', // Material Amber
                'Platform': '#F44336',    // Material Red
                'Security': '#607D8B'     // Material Blue Grey
            };
            
            return {
                width,
                height,
                nodeRadius: 5,  // Slightly smaller nodes
                chargeStrength: -200,
                linkDistance: 40,
                linkWidth: d => 0.5 * d.weight,  // Thinner edges, scaled by weight
                color: d => d.color
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
                    .translate(-62.1753943631536, -80.11100021683308)
                    .scale(1.3175042338969367));

            return result;
        }
    };

    // Settings specific to the right (large) graph - two-pizza teams
    static right = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            // Create color scale for teams with platform team highlighted
            const teamColors = {
                'Frontend': '#2196F3',    // Material Blue
                'Backend': '#4CAF50',     // Material Green
                'Mobile': '#9C27B0',      // Material Purple
                'Infrastructure': '#FFC107', // Material Amber
                'Platform': '#F44336',    // Material Red
                'Security': '#607D8B'     // Material Blue Grey
            };
            
            const getNodeRadius = d => {
                if (d.team === 'Platform') {
                    return 12 + (d.betweenness * 40);
                }
                return 6 + (d.betweenness * 15);
            };

            const getLinkDistance = d => {
                if (d.source.team === 'Platform' || d.target.team === 'Platform') {
                    return 50;
                }
                return 100;
            };

            const getLinkWidth = d => {
                if (d.source.team === 'Platform' || d.target.team === 'Platform') {
                    return 3 * d.weight;
                }
                return 1 * d.weight;
            };
            
            return {
                width,
                height,
                nodeRadius: getNodeRadius,
                chargeStrength: -300,
                linkDistance: getLinkDistance,
                linkWidth: getLinkWidth,
                color: d => teamColors[d.team] || '#999'
            };
        },

        createVisualization(containerId, data) {
            const container = document.getElementById(containerId);
            const options = this.getOptions(container?.clientWidth, container?.clientHeight);
            const result = BaseGraphConfig.createVisualization(containerId, data, options);

            // Create a stronger center force for platform team
            const centerForce = d3.forceCenter(options.width / 2, options.height / 2);
            
            // Modify simulation for platform-centric layout with more spread
            result.simulation
                .force("charge", d3.forceManyBody().strength(d => 
                    d.team === 'Platform' ? -1000 : -400  // Increased repulsion
                ))
                .force("center", centerForce)
                .force("collision", d3.forceCollide().radius(d => 
                    d.team === 'Platform' ? 40 : 20  // Increased collision radius
                ).strength(0.8))  // Increased collision strength
                .force("x", d3.forceX(options.width / 2).strength(d => 
                    d.team === 'Platform' ? 0.3 : 0.05  // Reduced x-centering for non-platform
                ))
                .force("y", d3.forceY(options.height / 2).strength(d => 
                    d.team === 'Platform' ? 0.3 : 0.05  // Reduced y-centering for non-platform
                ));

            // Apply specific transform for large graph
            result.svg
                .transition()
                .duration(0)
                .call(result.zoom.transform, d3.zoomIdentity
                    .translate(-27.970240367137706, -33.43834991048804)
                    .scale(1.2206802088733655));

            return result;
        }
    };
} 