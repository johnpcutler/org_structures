// Edge Density Graph Configuration
class EdgeDensityGraphConfig {
    // Common settings and methods shared between left and right graphs
    static common = {
        color: d3.scaleOrdinal()
            .domain(['Engineering', 'Product', 'Sales', 'Operations'])
            .range(['#2196F3', '#4CAF50', '#FFC107', '#9C27B0']) // Material colors for teams
    };

    // Settings specific to the left (small) graph - sparse connections
    static left = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            return {
                width,
                height,
                nodeRadius: 4,
                chargeStrength: -400,
                linkDistance: 40,
                linkWidth: 1,
                color: EdgeDensityGraphConfig.common.color
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
                    .translate(78.27583338704221, 52.84784610815478)
                    .scale(0.6544906831511542));

            return result;
        }
    };

    // Settings specific to the right (large) graph - dense connections
    static right = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            return {
                width,
                height,
                nodeRadius: 4,
                chargeStrength: -200,
                linkDistance: 30,
                linkWidth: 0.5,
                color: EdgeDensityGraphConfig.common.color
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
                    .translate(-117.8363825001062, -100.91955952008149)
                    .scale(1.5830151871186482));

            return result;
        }
    };
} 