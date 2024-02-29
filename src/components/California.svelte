<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as d3 from 'd3';

    export let electoralCollegeByState;
    export let state_pres;

    let svgNode;
    let previousGroup = null;
    const width = 975;
    const height = 610;

    let caResult = [];
    let svgNode2;
    let transitionSpeed = 600;
    let highlightState = 'California';

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
            .attr('fill', function() {
                const state = d3.select(this.parentNode).attr('data-state');
                return state === highlightState ? 'black' : 'lightgray';
            })
            .end() // Call createStackedBarPlot after the transition ends
            .then(() => {
                // Filter data for California
                caResult = state_pres.filter(element => {
                    return element.state === highlightState;
                });

                // Create the stacked bar plot after highlighting California squares
                createStackedBarPlot();
            });
    }

    function createStackedBarPlot() {
        // Define color scale for each party
        const colorScale = d3.scaleOrdinal()
            .domain(["DEMOCRAT", "REPUBLICAN", "LIBERTARIAN", "OTHER", "GREEN"]) // List of parties
            .range(["blue", "red", "yellow", "black", "green"]); // Corresponding colors

        // Prepare data for plotting
        let parties = [...new Set(caResult.map(d => d.party))];
        let partyData = parties.map(party => ({
            party: party,
            votes: caResult.filter(d => d.party === party).reduce((acc, cur) => acc + cur.candidatevotes, 0)
        }));
        let totalVotes = partyData.reduce((acc, cur) => acc + cur.votes, 0);

        // Calculate percentages and sort data by percentage
        partyData.forEach(d => {
            d.percentage = (d.votes / totalVotes) * 100;
        });

        partyData.sort((a, b) => b.percentage - a.percentage); // Sort by percentage in descending order

        // Set up dimensions for the SVG
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Create SVG element
        const svg = d3.select(svgNode2)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Create scales
        const x = d3.scaleBand()
            .domain(partyData.map(d => d.party)) // Use sorted parties
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        // Create bars
        const bars = svg.selectAll(".bar")
            .data(partyData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.party))
            .attr("width", x.bandwidth())
            .attr("y", height) // Initially set bars to start from the bottom
            .attr("height", 0)
            .attr("fill", d => colorScale(d.party)); // Set fill color based on party

        // Transition bars to their correct position
        bars.transition()
            .duration(transitionSpeed)
            .attr("y", d => y(d.percentage))
            .attr("height", d => height - y(d.percentage))
            .end() // Call the function after the transition is complete
            .then(() => {
                // Add labels after the transition is complete
                svg.selectAll(".label")
                    .data(partyData)
                    .enter().append("text")
                    .attr("class", "label")
                    .attr("x", d => x(d.party) + x.bandwidth() / 2)
                    .attr("y", d => y(d.percentage) - 5)
                    .attr("text-anchor", "middle")
                    .text(d => `${d.percentage.toFixed(2)}%`)
                    .style("opacity", 0) // Set initial opacity to 0
                    .transition()
                    .duration(200) // Duration for the text transition
                    .style("opacity", 1)
                    .end()
                    .then(() => {
                        d3.selectAll(`.state-group[data-state="${highlightState}"] rect`)
                            .transition()
                            .duration(200) // Duration for the color transition
                            .attr('fill', colorScale(partyData[0].party))
                            .end().then(() => {dispatch('transitionend')});
                    })
            });

        // Add X axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y).ticks(10));
    }

</script>

<div>
    <svg bind:this={svgNode} width={width} height={200} />
    <div class="text-box">
        <p>Not all states assign their electoral votes the same. 48 states do a winner take all system, where the candidate with the most votes for that state receive all electoral votes assigned to the state. This is the case for California, where Joe Biden received 63% of the votes. Because Joe Biden received the most votes in the state, he got all 55 electoral votes from California.</p>
    </div>
    <svg bind:this={svgNode2} width={width} height={420} />
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
