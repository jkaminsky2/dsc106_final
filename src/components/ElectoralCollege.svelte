<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    export let electoralCollegeByState;

    let svgNode;
    let previousGroup = null;
    const width = 975;
    const height = 610;

    onMount(() => {
        createSquares();
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
                })


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
            previousGroup = null; // Reset the previous group
        });
    }
</script>

<div>
    <svg bind:this={svgNode} width={width} height={height} />
</div>

<style>
</style>
