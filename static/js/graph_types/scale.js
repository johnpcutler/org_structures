// Scale Graph Configuration
class ScaleGraphConfig {
    // Common settings and methods shared between left and right graphs
    static common = {
        color: d3.scaleOrdinal()
            .domain(['Engineering', 'Product', 'Sales', 'Operations'])
            .range(['#2196F3', '#4CAF50', '#FFC107', '#9C27B0']) // Material colors for teams
    };

    // Settings specific to the left (small) graph
    static left = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            return {
                width,
                height,
                nodeRadius: 8,
                chargeStrength: -400,
                linkDistance: 60,
                linkWidth: 1,
                color: ScaleGraphConfig.common.color
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
                    .translate(-397.056146069114, -384.87865050483276)
                    .scale(2.8866234420295767));

            return result;
        }
    };

    // Settings specific to the right (large) graph
    static right = {
        getOptions(width, height) {
            // Ensure minimum dimensions
            width = Math.max(width || 400, 400);
            height = Math.max(height || 400, 400);
            
            return {
                width,
                height,
                nodeRadius: 6,
                chargeStrength: -200,
                linkDistance: 30,
                linkWidth: 0.5,
                color: ScaleGraphConfig.common.color
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
                    .translate(187.6144232818897, 152.59225941645343)
                    .scale(0.351024031243994));

            return result;
        }
    };
} 