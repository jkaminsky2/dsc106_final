<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as d3 from 'd3';

    export let electoralCollegeByState;
    export let state_pres;
    export let electoralCollegeResults;

    let previousGroup = null;
    const width = 975;
    const height = 610;

    let caResult = [];
    let svg;
    let transitionSpeed = 600;
    let counterNEB = 0;
    let counterME = 0;
    let enableMouseoverEffect = false;
    let enableRevert = false;

    let democratTotalVotes = 0;
    let republicanTotalVotes = 0;
    let originalColors = [];
    let topMargin = 85;
    let highlightState;
    let result;
    const squareSize = 15;
    const squareSpacing = 2;
    const squaresPerLine = 50;

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
                    if (!enableMouseoverEffect) return;
                    // Change color of squares in the same group
                    // var currentColor = d3.select(this).selectAll('rect').attr('fill');
                    d3.select(this).selectAll('rect')
                        .attr('fill', function() {
                            var color = d3.select(this).attr('fill');
                            var fadedColor = d3.color(color);
                            fadedColor.opacity = 1; // Adjust the opacity level as needed
                            return fadedColor;
                        });
                    
                    // Change color of squares in other groups
                    d3.selectAll('.state-group:not([data-state="' + state + '"]) rect')
                        .attr('fill', function() {
                            var color = d3.select(this).attr('fill');
                            var fadedColor = d3.color(color);
                            fadedColor.opacity = 0.2; // Adjust the opacity level as needed
                            return fadedColor;
                        });


                    highlightState = d3.select(this).attr('data-state');

                    result = state_pres.filter(element => {
                        return element.state === highlightState;
                    });
                    d3.selectAll('.state-label')
                        .style('display', function() {
                            return d3.select(this.parentNode).attr('data-state') === state ? 'block' : 'none';
                        });
                    d3.selectAll('.initial-label')
                        .style('display', 'none');

                    updateBarPlot();
                });

            stateGroup.append('text')
                .attr('class', 'state-label')
                .attr('x', 0)
                .attr('y', -10)
                .text(`${state} - ${votes} Electoral votes`)
                .attr('fill', 'black')
                .style('display', 'none')
                .style('font-size', '22px');
        

                

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

            stateGroup.append('text')
                .attr('class', 'initial-label')
                .attr('x', 0)
                .attr('y', -10)
                .text('Democrat - 306 votes | Republican - 232 votes')
                .attr('fill', 'black')
                .style('display', 'block')
                .style('font-size', '22px');
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
                storeOriginalColors();
                enableMouseoverEffect = true;
                dispatch('transitionend');
            });

        svg.on('click', function () {
            // Restore original color of squares in all groups
            d3.selectAll('.state-group rect')
                .attr('fill', function() {
                    var color = d3.select(this).attr('fill');
                    var fadedColor = d3.color(color);
                    fadedColor.opacity = 1; // Adjust the opacity level as needed
                    return fadedColor;
                });
            

            // Hide state label
            d3.selectAll('.state-label').style('display', 'none');
            d3.selectAll('.initial-label')
                    .style('display', 'block');
            d3.selectAll('.map-state path').attr('fill', 'black');
            previousGroup = null; // Reset the previous group

            svg.selectAll(".bar").remove();
            svg.selectAll(".label").remove();
            svg.selectAll(".axis").remove();
        });
    }

    function recolorSquares() {
        if (enableMouseoverEffect) {
            enableRevert = true;
            enableMouseoverEffect = false;
            storeOriginalColors(svg)

            // Recolor the squares based on the button click
            svg.selectAll('.state-group rect')
                .transition()
                .duration(300)
                .attr('fill', function(_, i) {
                    return i < democratTotalVotes ? 'blue' : 'red';
                });

            svg.selectAll(".bar").remove();
            svg.selectAll(".label").remove();
            svg.selectAll(".axis").remove();
            d3.selectAll('.state-label').style('display', 'none');
            d3.selectAll('.initial-label')
                .style('display', 'block');
        }
    }

    function storeOriginalColors() {
        // Store the original fill color of each square
        svg.selectAll('.state-group rect').each(function(_, i) {
            originalColors.push(d3.select(this).attr('fill'));
        });
    }

    function revert() {
        if (enableRevert) {
            enableMouseoverEffect = true;
            // Apply the original colors to each square
            svg.selectAll('.state-group rect')
                .transition()
                .duration(300)
                .attr('fill', (_, i) => originalColors[i]);

            d3.selectAll('.initial-label')
                .style('display', 'block');

            enableRevert = false;
        }
    }



    function updateBarPlot() {
        // Remove previous bar plot if it exists
        svg.selectAll(".bar").remove();
        svg.selectAll(".label").remove();
        svg.selectAll(".axis").remove();

        // Define color scale for each party
        const colorScale = d3.scaleOrdinal()
            .domain(["DEMOCRAT", "REPUBLICAN", "LIBERTARIAN", "OTHER", "GREEN"]) // List of parties
            .range(["blue", "red", "yellow", "black", "green"]);

        let parties = [...new Set(result.map(d => d.party))];
        let partyData = parties.map(party => ({
            party: party,
            votes: result.filter(d => d.party === party).reduce((acc, cur) => acc + cur.candidatevotes, 0)
        }));
        let totalVotes = partyData.reduce((acc, cur) => acc + cur.votes, 0);
        partyData.forEach(d => {
            d.percentage = (d.votes / totalVotes) * 100;
        });
        partyData.sort((a, b) => b.percentage - a.percentage);

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
            .attr("transform", `translate(80, ${topMargin + (squareSize + squareSpacing) * 12})`);

        const bars = g.selectAll(".bar")
            .data(partyData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.party))
            .attr("height", y.bandwidth())
            .attr("x", 0) // Initially set bars to start from the left
            .attr("width", d => x(d.percentage))
            .attr("fill", d => colorScale(d.party)); // Set fill color based on party

        // Add labels
        g.selectAll(".label")
            .data(partyData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d.percentage) + 5)
            .attr("y", d => y(d.party) + y.bandwidth() / 2)
            .text(d => `${d.percentage.toFixed(2)}%`);
            
        // Add Y axis
        g.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y));

        // Add X axis
        g.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(10));
    }

</script>


<div class="chart-container">
    <div class="map-and-text">
        <div class="states">
            <svg class="svg"></svg>
        </div>
        <div class="text-box" style="margin-top: {topMargin}px;">
            <b style="font-size: 20px;">2020 Presidential Election Electoral College Voting Results</b>
            <p>Included are the results of the presidential election by state in terms of electoral votes. Now, it should be more clear that Joe Biden won the election due to winning 25 states that had a combined electoral vote count greater than the states that Donald Trump won; this difference can be accredited to the population of the states won by each candidate, where Donald Trump won states that typically have fewer residents than the states that Joe Biden won. This makes sense as Republican candidates (Donald Trump) typically do better in rural states and counties, which have a lower population than that of more populous urban counties and states (which lean more Democratic). </p>
        </div>
    </div>
    <div class="buttons">
        <button class="button sort-button" on:click={recolorSquares}>Sort</button>
        <button class="button revert-button" on:click={revert}>Unsort</button>

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
    
    .map-title {
        font-size: 20px;
        font-weight: bold;
        color: black;
        margin-bottom: 10px;
    }

    .buttons {
        flex-shrink: 0; /* Prevent buttons from shrinking */
        margin-left: 20px; /* Need to change location of the buttons */
        display: flex;
    }

    .sort-button {
        padding: 10px 20px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
        border: none;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s ease;
        background-color: #6c757d; /* Gray */
        color: white;
    }

    .sort-button:hover {
        background-color: #495057; /* Darker gray on hover */
    }

    .revert-button {
        padding: 10px 20px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
        border: none;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s ease;
        background-color: #6c757d; /* Gray */
        color: white;
        border-left: 1px solid #ced4da; /* Add border on the left side */
    }

    .revert-button:hover {
        background-color: #495057; /* Darker gray on hover */
    }


</style>
