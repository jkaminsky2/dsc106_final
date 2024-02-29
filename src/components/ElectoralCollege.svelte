<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import { fade } from 'svelte/transition';
    import { geoPath, geoAlbersUsa } from 'd3-geo';
    import * as topojson from 'topojson-client';

    export let electoralCollegeByState;
    export let us;

    let svgNode;
    let svgNode2;
    let previousGroup = null;
    const width = 975;
    const height = 610;

    onMount(() => {
        createSquares();
        createMap();
    });

    function createSquares() {
        const svg = d3.select(svgNode);

        // Constants for square dimensions and spacing
        const squareSize = 13;
        const squareSpacing = 2;
        const squaresPerLine = 50; // Number of squares per line

        // Initial position
        let x = 0;
        let y = 0;
        let counter = 0;

        // Create squares and state labels for each state
        for (const [state, votes] of Object.entries(electoralCollegeByState)) {
            // Group element for each state
            const stateGroup = svg.append('g')
                .attr('class', 'state-group')
                .attr('data-state', state)
                .on('mouseover', function () {
                    // Change color of squares in the same group
                    d3.select(this).selectAll('rect')
                        .attr('fill', 'black');
                    // Change color of squares in other groups
                    d3.selectAll('.state-group:not([data-state="' + state + '"]) rect')
                        .attr('fill', 'lightgray');

                    // Show state label
                    d3.select(this).select('.state-label').style('display', 'block');

                    if (previousGroup && previousGroup !== this) {
                        d3.select(previousGroup).select('.state-label').style('display', 'none');
                    }

                    // Update the reference to the previously hovered group
                    previousGroup = this;

                    highlightState(state);
                });

            // Add squares
            for (let i = 0; i < votes; i++) {
                counter += 1;
                if (counter > squaresPerLine) {
                    counter = 1;
                    y += squareSize + squareSpacing
                }

                stateGroup.append('rect')
                    .attr('x', (counter - 1) * (squareSize + squareSpacing))
                    .attr('y', y)
                    .attr('width', squareSize)
                    .attr('height', squareSize)
                    .attr('fill', 'black');
            }

            // Add state label below the squares (initially hidden)
            stateGroup.append('text')
                .attr('class', 'state-label')
                .attr('x', 0)
                .attr('y', (squareSize + squareSpacing)*13)
                .text(`${state} - ${votes}`)
                .attr('fill', 'black')
                .style('display', 'none'); // Initially hide the label
        }

        svg.on('click', function () {
            // Restore original color of squares in all groups
            d3.selectAll('.state-group rect')
                .attr('fill', 'black');

            // Hide state label
            d3.selectAll('.state-label').style('display', 'none');
            d3.selectAll('.map-state path').attr('fill', 'black');
            previousGroup = null; // Reset the previous group
        });
    }

    function createMap() {
        const svg = d3.select(svgNode2)
            .attr("style", "max-width: 100%; height: auto;");

        const path = d3.geoPath();
        // Render states
        const g = svg.append("g");

        const states = g.append("g")
            .attr('class', 'map-state')
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .join("path")
            .attr("d", path)
            // .attr("cursor", "pointer")
            .attr("fill", "black")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .on('mouseover', function(d) {
                const mapState = d3.select(this)._groups[0][0].__data__.properties.name;
                const t = d3.select(this);
                // console.log(mapState);
                highlightState(mapState);
            });


        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
        
        svg.on('click', function () {
            // Restore original color of squares in all groups
            d3.selectAll('.state-group rect')
                .attr('fill', 'black');

            // Hide state label
            d3.selectAll('.state-label').style('display', 'none');
            d3.selectAll('.map-state path').attr('fill', 'black');
            previousGroup = null; // Reset the previous group
        });

    }

    function highlightState(state) {
        d3.selectAll('.state-group')
            .selectAll('rect')
            .attr('fill', function() {
                return d3.select(this.parentNode).attr('data-state') === state ? 'black' : 'lightgray';
        });
        d3.selectAll('.map-state path').attr('fill', function(d) {
            return d.properties.name === state ? 'black' : 'lightgray';
        });
        
        // Display state text
        d3.selectAll('.state-label')
            .style('display', function() {
                return d3.select(this.parentNode).attr('data-state') === state ? 'block' : 'none';
            });
    }
</script>

<div>
    <svg bind:this={svgNode} width={width} height={300} />
    <div class="text-box">
        <p>One insight to this perplexing situation is the electoral college voting system. Each state gets a certain number of electoral college votes based on their total population compared to other states, where the total number of electoral college votes of all states combined is 538. Highlight different boxes or states to see how many electoral college votes each state has.</p>
    </div>
    <svg bind:this={svgNode2} viewBox="0 0 975 610" width={975} height={320} />
</div>

<style>
.text-box {
  position: absolute;
  top: 200px;
  right: 125px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 300px;
}
</style>
