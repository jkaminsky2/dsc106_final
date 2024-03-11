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
    let svg;
    const width = 975;
    const height = 610;
    let topMargin = 50;
    const squareSize = 15;
    const squareSpacing = 2;
    const squaresPerLine = 50;

    onMount(() => {
        createSquares();
        createMap();
    });

    function createSquares() {
        svg = d3.select('.svg')
            .attr("viewBox", [0, 0, width, height+topMargin])
            .attr("width", width)
            .attr("height", height+topMargin)
            .attr("style", "max-width: 100%; height: auto;");


        // Initial position
        let x = 0;
        let y = 0;
        let counter = 0;

        // Create squares and state labels for each state
        for (const [state, votes] of Object.entries(electoralCollegeByState)) {
            // Group element for each state
            const stateGroup = svg.append('g')
                .attr("transform", `translate(0, ${topMargin})`)
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
                .attr('y', -10)
                .text(`${state} - ${votes} Electoral College Votes`)
                .attr('fill', 'black')
                .style('display', 'none')
                .style('font-size', '22px');
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
        // svg = d3.select('')
        //     .attr("style", "max-width: 100%; height: auto;");
        const scale = 0.6;
        const path = d3.geoPath();
        // Render states
        const g = svg.append("g");

        const states = g.append("g")
            .attr("transform", `translate(130, ${topMargin + (squareSize + squareSpacing) * 12}) scale(${scale})`)
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


<div class="chart-container">
    <div class="map-and-text">
        <div class="states">
            <svg class="svg"></svg>
        </div>
        <div class="text-box" style="margin-top: 50px;">
            <b style="font-size: 20px;">County-Level 2020 Presidential Election Results</b>
            <p>The flaw in the "both candidates won 25 states" argument is that the idea does not take into account the electoral college voting system. Each state has a certain number of electoral college votes based on their total population compared to other states, where the number of electoral votes increases as the number of residents in that state increases. In addition, the total number of electoral college votes of all states combined is 538. The electoral college votes are used to determine the presidential election winner, where the candidate with more electoral votes (not more states won) wins. Highlight different boxes or states to see how many electoral college votes each state has. <br> <br> How the electoral votes are dispersed by each state is more nuanced, however; go to the next slide to learn more.</p>
        </div>
    </div>
</div>

<style>
    .chart-container {
        display: flex;
        flex-direction: column;
        margin-top: -25px; /* Adjusted to reduce the gap */
    }

    .map-and-text {
        display: flex;
        margin-top: 10px;
    }

    .states {
        flex: 7;
    }

    .text-box {
        flex: 3;
        padding: 20px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-left: 20px; /* Adjusted to create space between text box and map */
        width: 400px; /* Adjusted to widen the text box */
    }

</style>
