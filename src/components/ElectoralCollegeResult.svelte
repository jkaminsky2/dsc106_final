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
    let topMargin = 50;
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
        let stateGroup;

        // Create squares and state labels for each state
        for (const [state, votes] of Object.entries(electoralCollegeByState)) {

            // Group element for each state
            stateGroup = svg.append('g')
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

                    updateBarPlot(state, votes);
                });


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

        stateGroup.append('text')
                .attr('class', 'initial-label')
                .attr('x', 0)
                .attr('y', -10)
                .text('Democrat - 306 votes | Republican - 232 votes')
                .attr('fill', 'black')
                .style('display', 'block')
                .style('font-size', '22px');

        let textToDisplay = ''

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
            svg.selectAll(".chart-title").remove();
        });

        const initialButtonX = width*0.711;
        const buttonGroup = svg.append('g')
            .attr('transform', `translate(${initialButtonX}, 5)`);
        
        const buttonWidth = 140;
        const buttonHeight = 40;

        const unsortButton = buttonGroup.append('foreignObject')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 80)
            .attr('height', buttonHeight)
            .on('click', () => revert());

        unsortButton.append('xhtml:button')
            .style('font-size', '16px')
            .style('border-radius', '5px 0px 0px 5px')
            .style('border', '1px')
            .style('width', '100%')
            .style('height', '100%')
            .style('color', 'white')
            .style('background-color', '#6c757d')
            .style('cursor', 'pointer')
            .style('transition', 'background-color 0.2s ease;')
            .style('border-right', '1px solid #ced4da')
            .text('Unsort')
            .on('mouseover', function() {
                d3.select(this).transition(150)
                    .style('background-color', '#495057'); // Change background color on hover
            })
            .on('mouseout', function() {
                d3.select(this).transition(150)
                    .style('background-color', '#6c757d'); // Restore original background color on mouseout
            });

        const sortButton = buttonGroup.append('foreignObject')
            .attr('x', 80)
            .attr('y', 0)
            .attr('width', 75)
            .attr('height', buttonHeight)
            .on('click', () => recolorSquares());
        
        sortButton.append('xhtml:button')
        .style('font-size', '16px')
            .style('border-radius', '0px 5px 5px 0px')
            .style('border', '1px')
            .style('width', '100%')
            .style('height', '100%')
            .style('color', 'white')
            .style('background-color', '#6c757d')
            .style('cursor', 'pointer')
            .style('transition', 'background-color 0.2s ease;')
            .text('Sort')
            .on('mouseover', function() {
                d3.select(this).transition(150)
                    .style('background-color', '#495057'); // Change background color on hover
            })
            .on('mouseout', function() {
                d3.select(this).transition(150)
                    .style('background-color', '#6c757d'); // Restore original background color on mouseout
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
            svg.selectAll(".chart-title").remove();
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
            svg.selectAll(".chart-title").remove();
            
            enableRevert = false;
        }
    }



    function updateBarPlot(stateName, elecVotes) {
        // Remove previous bar plot if it exists
        svg.selectAll(".bar").remove();
        svg.selectAll(".label").remove();
        svg.selectAll(".axis").remove();
        svg.selectAll(".chart-title").remove();
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
            .attr("transform", `translate(80, ${topMargin + 30 + (squareSize + squareSpacing) * 12})`);

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
            .call(d3.axisBottom(x).ticks(10).tickFormat(d => `${d}%`));
        let textToShow = stateName + " Voting Results - " + elecVotes + " Electoral Votes"
        g.append("text")
                .attr("class", "chart-title")
                .attr("x", 200 + 30 - textToShow.length)
                .attr("y", topMargin / 2 - 40)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("font-weight", "bold")
                .text(textToShow)
    }

</script>


<div class="chart-container">
    <div class="map-and-text">
        <div class="states">
            <svg class="svg"></svg>
        </div>
        <div class="text-box" style="margin-top: {50}px;">
            <b style="font-size: 20px;">Electoral College Voting Results</b>
            <p>Included are the results of the presidential election by state in terms of electoral votes. Highlight over boxes to see the election results for that particular state or sort by candidate to visualize the total electoral votes for each candidate. If you sorted and want to see the highlight interactivty previously mentioned, click unsort first.<br> <br> Now it should be more clear that Joe Biden won the election due to winning 25 states that had a combined electoral vote count greater than the states that Donald Trump won. Even though Donald Trump won more counties and the same number of states as Joe Biden, taking into account population is the difference. Joe Biden (Democrat candidate) had better success in more urban counties and states, which have a higher population and, thus, more electoral votes. Donald Trump, on the other hand, had his success in less populous rural counties and states, which have less electoral votes due to having a lower state population. While the 2020 presidential election results can be confusing when looking at the state-level and county-level representations, factoring in how the election handles state populations clearly conveys how Joe Biden won the election. <br> <br><span style="font-weight: bold;">Now, let us prove the claim that it is a reocurring trend that Democrats do better in urban areas and Republicans do better in more rural counties.</span></p>
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
