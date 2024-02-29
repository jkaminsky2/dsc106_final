<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as d3 from 'd3';

    export let electoralCollegeByState;
    export let state_pres;
    export let electoralCollegeResults;

    let svgNode;
    let previousGroup = null;
    const width = 975;
    const height = 610;

    let caResult = [];
    let svgNode2;
    let transitionSpeed = 600;
    let counterNEB = 0;
    let counterME = 0;

    let democratTotalVotes = 0;
    let republicanTotalVotes = 0;
    let originalColors = [];

    // Iterate over each state's data in electoralCollegeResults
    for (const stateData of Object.values(electoralCollegeResults)) {
        // Accumulate the votes for each party
        democratTotalVotes += stateData.democrat;
        republicanTotalVotes += stateData.republican;
    }


    const dispatch = createEventDispatcher();

    onMount(() => {
        dispatch('transitionstart')
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
                .attr('data-state', state);

            // Add squares
            for (let i = 0; i < votes; i++) {
                counter += 1;
                if (counter > squaresPerLine) {
                    counter = 1;
                    y += squareSize + squareSpacing
                }

                // Set initial color to black for all squares
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

        // Apply transition to change colors
        svg.selectAll('.state-group rect')
            .transition()
            .duration(50) // Reduced duration for faster transition
            .delay((d, i) => i * 2) // Adjusted delay for faster transition
            .attr('fill', function(_, i) {
                const state = d3.select(this.parentNode).attr('data-state');
                const votes = electoralCollegeResults[state];
                const democratVotes = votes.democrat;
                const republicanVotes = votes.republican;

                if (republicanVotes === 0) {
                    return 'blue';
                } else if (democratVotes === 0) {
                    return 'red';
                }

                if (state === 'Nebraska') {
                    counterNEB += 1;
                    return counterNEB <= democratVotes ? 'blue' : 'red';
                }

                if (state === 'Maine') {
                    counterME += 1;
                    return counterME <= democratVotes ? 'blue' : 'red';
                }

            })
            .end() // Call createStackedBarPlot after the transition ends
            .then(() => {
                dispatch('transitionend')    
            });
    }

    function recolorSquares() {
        const svg = d3.select(svgNode);

        storeOriginalColors(svg)

        // Recolor the squares based on the button click
        svg.selectAll('.state-group rect')
            .transition()
            .duration(300)
            .attr('fill', function(_, i) {
                return i < democratTotalVotes ? 'blue' : 'red';
            });
    }

    function storeOriginalColors(svg) {
        // Store the original fill color of each square
        svg.selectAll('.state-group rect').each(function(_, i) {
            originalColors.push(d3.select(this).attr('fill'));
        });
    }

    function revert() {
        const svg = d3.select(svgNode);

        // Apply the original colors to each square
        svg.selectAll('.state-group rect')
            .transition()
            .duration(300)
            .attr('fill', (_, i) => originalColors[i]);
    }

</script>
<div class="map-title">
    <p>2020 Presidential Election Electoral College Voting Results</p>
</div>
<div>
    <svg bind:this={svgNode} width={width} height={200} />
    <div class="text-box">
        <p>Included are the results of the presidential election by state in terms of electoral votes. Now, it should be more clear that Joe Biden won the election due to winning 25 states that had a combined electoral vote count greater than the states that Donald Trump won; this difference can be accredited to the population of the states won by each candidate, where Donald Trump won states that typically have fewer residents than the states that Joe Biden won. This makes sense as Republican candidates (Donald Trump) typically do better in rural states and counties, which have a lower population than that of more populous urban counties and states (which lean more Democratic). </p>
    </div>
    <div>
        <button on:click={recolorSquares}>Sort Electoral College Votes</button>
        <button on:click={revert}>Revert</button>
    </div>
</div>

<style>
.text-box {
  position: absolute;
  top: 200px; /* Move the text box down by 200 pixels */
  right: 75px; /* Adjust as needed */
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10; /* Ensure the text box is above the map */
  width: 300px; /* Adjust the width as needed */
}
.button-container {
  margin-bottom: 10px; 
}
.map-title {
  top: 40px;
  margin-left: 120px; /* Adjust the left position as needed */
  font-size: 20px; /* Adjust the font size as needed */
  font-weight: bold; /* Adjust the font weight as needed */
  color: black; /* Adjust the color as needed */
  z-index: 10; /* Ensure the title is above the map */
}
</style>
