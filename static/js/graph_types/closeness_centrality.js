// Closeness Centrality Graph Configuration
class ClosenessCentralityGraphConfig {
    // Common settings and methods shared between left and right graphs
    static common = {
        // Use node color based on department
        getNodeColor(d) {
            if (d.color) {
                return d.color;
            }
            // Fallback colors by department if no specific color is provided
            const departmentColors = {
                'Executive': '#F44336',    // Material Red
                'Product': '#2196F3',      // Material Blue
                'Engineering': '#4CAF50',  // Material Green
                'Design': '#9C27B0',       // Material Purple
                'Operations': '#FFC107'    // Material Amber
            };
            return departmentColors[d.team] || '#999';  // Fallback to gray if no team match
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
                const strength = 0.1;

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
                    if (d.role) {
                        tooltip += `\nRole: ${d.role}`;
                    }
                    if (d.closeness !== undefined) {
                        tooltip += `\nCloseness: ${d.closeness.toFixed(3)}`;
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
                        // Thicker edges for same-department connections
                        const sameDept = d.source.team === d.target.team;
                        return sameDept ? 2 + d.weight * 2 : 0.5 + d.weight;
                    })
                    .attr("stroke-opacity", d => Math.max(0.2, d.weight));

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .attr("r", d => {
                        // Base size on both level and closeness
                        const levelMultiplier = 1 - (d.level / 5); // Higher levels are more important
                        return 4 + (d.closeness * 15) + (levelMultiplier * 5);
                    })
                    .attr("fill", d => ClosenessCentralityGraphConfig.common.getNodeColor(d));
            });
        }
    };

    // Settings specific to the left (small) graph - deep hierarchy with departments
    static left = {
        getOptions(width, height) {
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            return {
                width,
                height,
                nodeRadius: d => {
                    const levelMultiplier = 1 - (d.level / 5);
                    return 4 + (d.closeness * 15) + (levelMultiplier * 5);
                },
                chargeStrength: -300,
                linkDistance: d => {
                    const levelDiff = Math.abs(d.source.level - d.target.level);
                    return 50 + (levelDiff * 50);
                },
                color: d => ClosenessCentralityGraphConfig.common.getNodeColor(d)
            };
        },

        createVisualization(containerId, data) {
            const container = document.getElementById(containerId);
            const options = this.getOptions(container?.clientWidth, container?.clientHeight);
            const result = BaseGraphConfig.createVisualization(containerId, data, options);
            
            const simulation = result.simulation;
            
            // Add strong vertical force for hierarchy levels
            simulation.force("y", d3.forceY(d => (d.level * 100)).strength(0.5));
            
            // Add horizontal force to group by department
            simulation.force("x", d3.forceX(d => {
                const teamOrder = {
                    'Executive': 0,
                    'Engineering': -2,
                    'Product': 2,
                    'Design': -1,
                    'Operations': 1
                };
                return (teamOrder[d.team] || 0) * 150;
            }).strength(0.3));

            simulation.force("collision", d3.forceCollide().radius(d => 
                options.nodeRadius(d) * 1.5
            ).strength(0.8));

            // Settings specific to the left (small) graph
            result.svg
                .transition()
                .duration(0)
                .call(result.zoom.transform, d3.zoomIdentity
                    .translate(107.48689393198079, 145.17370957710853)
                    .scale(0.4485817869267163));

            return result;
        }
    };

    // Settings specific to the right (large) graph - flat organization
    static right = {
        getOptions(width, height) {
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            const getNodeRadius = d => {
                if (d.role === 'Lead') {
                    return 8 + (d.closeness * 20);  // Larger nodes for leads
                }
                return 5 + (d.closeness * 15);  // Regular nodes sized by closeness
            };

            return {
                width,
                height,
                nodeRadius: getNodeRadius,
                chargeStrength: -400,  // Increased repulsion
                linkDistance: 200,  // Much longer link distance
                linkWidth: d => 1 + d.weight * 3,
                color: d => ClosenessCentralityGraphConfig.common.getNodeColor(d)
            };
        },

        createVisualization(containerId, data) {
            const container = document.getElementById(containerId);
            const options = this.getOptions(container?.clientWidth, container?.clientHeight);
            const result = BaseGraphConfig.createVisualization(containerId, data, options);

            // Relax all forces
            result.simulation
                .force("x", d3.forceX(options.width / 2).strength(0.01))  // Much weaker centering
                .force("y", d3.forceY(options.height / 2).strength(0.01))  // Much weaker centering
                .force("charge", d3.forceManyBody().strength(-300))  // Stronger repulsion
                .force("collision", d3.forceCollide().radius(d => 
                    options.nodeRadius(d) * 2  // Increased spacing
                ).strength(0.2))  // Weaker collision
                .force("cluster", alpha => {
                    // Lighter clustering by team
                    const centroids = {};
                    data.nodes.forEach(d => {
                        if (!centroids[d.team]) {
                            centroids[d.team] = {x: 0, y: 0, count: 0};
                        }
                        centroids[d.team].x += d.x;
                        centroids[d.team].y += d.y;
                        centroids[d.team].count += 1;
                    });
                    
                    // Apply weaker clustering force
                    data.nodes.forEach(d => {
                        if (centroids[d.team]) {
                            const centroid = centroids[d.team];
                            const x = centroid.x / centroid.count;
                            const y = centroid.y / centroid.count;
                            d.vx += (x - d.x) * alpha * 0.1;  // Reduced clustering strength
                            d.vy += (y - d.y) * alpha * 0.1;  // Reduced clustering strength
                        }
                    });
                });

            // Apply specific transform for flat org layout
            result.svg
                .transition()
                .duration(0)
                .call(result.zoom.transform, d3.zoomIdentity
                    .translate(154.58207571513188, 159.3221408107852)
                    .scale(0.2862733715291556));

            return result;
        }
    };
} 