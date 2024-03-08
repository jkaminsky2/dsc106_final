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
    let svg;
    let transitionSpeed = 600;
    let highlightState = 'California';
    let topMargin = 50;
    const squareSize = 15;
    const squareSpacing = 2;
    const squaresPerLine = 50;

    const dispatch = createEventDispatcher();

    onMount(() => {
        dispatch('transitionstart');
        createSquares();
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

        // Create scales
        const y = d3.scaleBand()
            .domain(partyData.map(d => d.party)) // Use sorted parties
            .range([0, height])
            .padding(0.1);

        const x = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width]);

        // Create bars
        const g = svg.append("g")
            .attr("transform", `translate(80, ${topMargin + 30 + (squareSize + squareSpacing) * 12})`);
        g.append("text")
            .attr("class", "chart-title")
            .attr("x", 111)
            .attr("y", topMargin / 2 - 40)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text("California Voting Results")

        const bars = g.selectAll(".bar")
            .data(partyData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.party))
            .attr("height", y.bandwidth())
            .attr("x", 0) // Initially set bars to start from the left
            .attr("width", 0)
            .attr("fill", d => colorScale(d.party)); // Set fill color based on party

        // Transition bars to their correct position
        bars.transition()
    .duration(transitionSpeed)
    .attr("x", 0)
    .attr("width", d => x(d.percentage))
    .end() // Call the function after the transition is complete
    .then(() => {
        // Add labels after the transition is complete
        g.selectAll(".label")
            .data(partyData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d.percentage) + 5)
            .attr("y", d => y(d.party) + y.bandwidth() / 2)
            .text(d => `${d.percentage.toFixed(2)}%`)
            .style("opacity", 0) // Set initial opacity to 0
            .transition()
            .duration(200) // Duration for the text transition
            .style("opacity", 1)
            .end()
            .then(() => {
                const firstSquare = d3.select(`.state-group[data-state="${highlightState}"] rect`).nodes()[0];
                const xPosition = +firstSquare.getAttribute("x");
                const yPosition = +firstSquare.getAttribute("y") + topMargin;

                const initialXPosition = x(partyData[0].percentage) + 80 - squareSize;
                const initialYPosition = y(partyData[0].party) + topMargin + (squareSize + squareSpacing) * 12;

                svg.append("rect")
                    .attr("class", "animation-square")
                    .attr("x", initialXPosition)
                    .attr("y", initialYPosition)
                    .attr("width", squareSize)
                    .attr("height", squareSize)
                    .attr("fill", colorScale(partyData[0].party))
                    .transition()
                    .duration(1000)
                    .attr("x", xPosition)
                    .attr("y", yPosition)
                    .on("end", () => {
                        // Once animation-square reaches the first square, apply transitions to other squares
                        d3.selectAll(`.state-group[data-state="${highlightState}"] rect`)
                            .each(function(d, i) {
                                if (i > 0) {
                                    d3.select(this)
                                        .transition()
                                        .delay(i * 25)
                                        .duration(25)
                                        .attr('fill', colorScale(partyData[0].party))
                                        .end()
                                        .then(() => {
                                            if (i === partyData.length - 1) {
                                                dispatch('transitionend');
                                            }
                                        });
                                }
                            });
                    });
            });
    });


        // Add Y axis
        g.append("g")
            .call(d3.axisLeft(y));

        // Add X axis
        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(10)
            .tickFormat(d => `${d}%`));
    }


</script>


<div class="chart-container">
    <div class="map-and-text">
        <div class="states">
            <svg class="svg"></svg>
        </div>
        <div class="text-box" style="margin-top: 50px;">
            <b style="font-size: 20px;">Electoral College Voting System: Winner Takes All</b>
            <p>Not all states assign their electoral votes the same. 48 states do a winner take all system, where the candidate with the most votes in that state receive all electoral votes assigned to the state. This is the case for California, where Joe Biden received 63% of the votes. Because Joe Biden received the most votes in the state, he got all 55 electoral votes from California. <br> <br> <span style="font-weight: bold;">What about the two other states?</span></p>
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
        margin-left: 20px;
        width: 400px; /* Adjusted to widen the text box */
    }
</style>
