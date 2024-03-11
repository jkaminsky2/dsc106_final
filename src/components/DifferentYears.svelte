<script>
    import * as d3 from 'd3';
    import { onMount } from 'svelte';
    import { geoPath, geoAlbersUsa } from 'd3-geo';
    import * as topojson from 'topojson-client';

    export let allYearsCountiesResults;
    export let county;
    export let state_ids;
    export let allYearsOverallPres;
    export let us;

    let svgNode;
    let svgNode2;
    let lastClicked = null;
    let isZoomed = false;
    let svg;
    let counties;
    let states;
    let currentYear = 2020;
    let filteredResults;
    let filteredStateResults;
    let stateMapStates;

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    onMount(async () => {
        filteredResults = allYearsCountiesResults.filter(result => result.year === currentYear);
        filteredStateResults = allYearsOverallPres.filter(d => d.year === currentYear);
        plotMap();
        plotStateMap();
        plotBarPlot();
    });

    const barData = [
            {year: 2000, candidate: 'Al Gore', electoralVotes: 266, color: 'blue' },
            {year: 2000, candidate: 'George W. Bush', electoralVotes: 271, color: 'red' },
            {year: 2004, candidate: 'John Kerry', electoralVotes: 251, color: 'blue' },
            {year: 2004, candidate: 'George W. Bush', electoralVotes: 286, color: 'red' },
            {year: 2008, candidate: 'Barack Obama', electoralVotes: 365, color: 'blue' },
            {year: 2008, candidate: 'John McCain', electoralVotes: 173, color: 'red' },
            {year: 2012, candidate: 'Barack Obama', electoralVotes: 332, color: 'blue' },
            {year: 2012, candidate: 'Mitt Romney', electoralVotes: 206, color: 'red' },
            {year: 2016, candidate: 'Hillary Clinton', electoralVotes: 227, color: 'blue' },
            {year: 2016, candidate: 'Donald Trump', electoralVotes: 304, color: 'red' },
            {year: 2020, candidate: 'Joe Biden', electoralVotes: 306, color: 'blue' },
            {year: 2020, candidate: 'Donald Trump', electoralVotes: 232, color: 'red' }
        ];

    function plotBarPlot() {
        const width = 800; // Define width

        const filteredBarData = barData.filter(data => data.year === currentYear);
        const barWidth = width / (filteredBarData[0].electoralVotes + filteredBarData[1].electoralVotes);

        const svg = d3.select(".chart-container")
            .insert("svg", ":first-child")
            .attr("width", width)
            .attr("height", 100);

        let xPosition = 0;
        svg.selectAll('rect')
            .data(filteredBarData)
            .enter()
            .append('rect')
            .attr('x', d => {
                const xPos = xPosition;
                xPosition += d.electoralVotes * barWidth;
                return xPos;
            })
            .attr('y', 50)
            .attr('width', d => d.electoralVotes * barWidth)
            .attr('height', 25)
            .attr('fill', d => d.color);

        svg.append("text")
            .attr("x", 5)
            .attr("y", 40)
            .attr("text-anchor", "start")
            .attr("fill", "black")
            .text(filteredBarData[0].candidate)
            .attr("font-size", "18px");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .text("Goal (270)")
            .attr("font-size", "18px");

        svg.append("text")
            .attr("x", width - 5)
            .attr("y", 40)
            .attr("text-anchor", "end")
            .attr("fill", "black")
            .text(filteredBarData[1].candidate)
            .attr("font-size", "18px");

        svg.append("line")
            .attr("x1", width / 2)
            .attr("y1", 50)
            .attr("x2", width / 2)
            .attr("y2", 50 + 30)
            .attr("stroke", "white")
            .attr("stroke-width", 3);
    }

    function plotStateMap() {
        const width = 975;
        const height = 610;

        const svg = d3.select(svgNode2)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto;");

        const path = d3.geoPath();
        const resultsMap = {};
        filteredStateResults.forEach(entry => {
            resultsMap[entry.state] = entry.result;
        });
        const g = svg.append("g");

        stateMapStates = g.append("g")
            .selectAll("path")
            .data(topojson.feature(us, us.objects.states).features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const stateName = d.properties.name;
                const result = resultsMap[stateName];
                return result === 1 ? "blue" : "red";
            })
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")

        g.append("path")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
    }

    function plotMap() {
        const width = 975;
        const height = 610;

        svg = d3.select(svgNode)
            .attr("viewBox", [0, 0, width, height])
            .attr("width", width)
            .attr("height", height)
            .attr("style", "max-width: 100%; height: auto;");

        const path = d3.geoPath();
        const resultsMap = {};
        filteredResults.forEach(entry => {
            // Check if the state exists in the resultsMap, if not, initialize it
            if (!resultsMap[entry.state]) {
                resultsMap[entry.state] = {};
            }
            resultsMap[entry.state][entry.county_name] = {
                'winner': entry.party,
                'win_percentage': entry.win_percentage
            };
        });

        const g = svg.append("g");

        const colorScale = d3.scaleLinear()
            .domain([0.45, 0.9]) // win_percentage ranges from 0 to 1
            .range(["lightblue", "blue"]); // Adjust the range of colors as needed for Democrats

        const redScale = d3.scaleLinear()
            .domain([0.45, 0.9]) // win_percentage ranges from 0 to 1
            .range(["#fad8d8", "#e62828"]);

        counties = g.append("g")
            .selectAll("path")
            .data(topojson.feature(county, county.objects.counties).features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const countyName = d.properties.name.toLowerCase();
                const stateName = state_ids.get(d.id.substring(0,2));
                const result = resultsMap[stateName][countyName];
                try {
                    const winPercentage = result.win_percentage;
                    const winner = result.winner.toLowerCase();
                    if (winner === "democrat") {
                        return colorScale(winPercentage);
                    } else if (winner === "republican") {
                        return redScale(winPercentage);
                    } else {
                        return "black"; // TODO Handle other cases
                    }
                } catch(err) {
                    return 'black';
                }
            })
            .attr("stroke", "white")
            .attr("stroke-width", "0.3px")
            .attr("stroke-linejoin", "round");

        states = g.append("g")
        .selectAll("path")
        .data(topojson.feature(county, county.objects.states).features)
        .join("path")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .attr("stroke-linejoin", "round")
    }

    function updateMap() {
        const resultsMap = {};
        filteredResults.forEach(entry => {
            // Check if the state exists in the resultsMap, if not, initialize it
            if (!resultsMap[entry.state]) {
                resultsMap[entry.state] = {};
            }
            resultsMap[entry.state][entry.county_name] = {
                'winner': entry.party,
                'win_percentage': entry.win_percentage
            };
        });

        const colorScale = d3.scaleLinear()
            .domain([0.45, 0.9]) // win_percentage ranges from 0 to 1
            .range(["lightblue", "blue"]); // Adjust the range of colors as needed for Democrats

        const redScale = d3.scaleLinear()
            .domain([0.45, 0.9]) // win_percentage ranges from 0 to 1
            .range(["#fad8d8", "#e62828"]);

        counties
            .attr("fill", d => {
                const countyName = d.properties.name.toLowerCase();
                const stateName = state_ids.get(d.id.substring(0,2));
                const result = resultsMap[stateName][countyName];
                try {
                    const winPercentage = result.win_percentage;
                    const winner = result.winner.toLowerCase();
                    if (winner === "democrat") {
                        return colorScale(winPercentage);
                    } else if (winner === "republican") {
                        return redScale(winPercentage);
                    } else {
                        return "black"; // TODO Handle other cases
                    }
                } catch(err) {
                    // these data are missing from the csv file
                    // 2000 Colorado broomfield (this county was formed in 2001)
                    return 'black';
                }
            });

        
        const statesResultsMaps = {};
        filteredStateResults.forEach(entry => {
            resultsMap[entry.state] = entry.result;
        });

        stateMapStates
            .attr("fill", d => {
                const stateName = d.properties.name;
                const result = resultsMap[stateName];
                return result === 1 ? "blue" : "red";
            });
    }

    function updateYear(event) {
        currentYear = parseInt(event.target.value);
        filteredResults = allYearsCountiesResults.filter(result => result.year === currentYear);
        filteredStateResults = allYearsOverallPres.filter(d => d.year === currentYear);
        updateMap();
        d3.select(".chart-container").select("svg").remove();
        plotBarPlot();
    }
</script>
<div class="chart-container" style="display: flex; flex-direction: column; margin-top: -40px;">
    <div class="bar-chart-container" style="display: flex;">
        <svg class="bar-chart"></svg>
    </div>

    <div class="map-container" style="display: flex; margin-top: -175px;">
        <div style="flex: 1;">
            <svg bind:this={svgNode} class="map"></svg>
        </div>
        <div style="flex: 1;">
            <svg bind:this={svgNode2} class="map"></svg>
        </div>
    </div>
</div>

<div class="text-box" style="margin: 10px auto;">
    <p style="font-size: 20px; font-weight:bold;">Presidential Election State-Level and County-Level Voting Patterns from 2000 to 2020</p>
    <p>Visualized above are the presidential election results for every election from 2000 to 2020 (they occur every 4 years). The trend of Republican candidates doing better in rural areas and Democratic candidates in urban areas--mentioned prior--are made apparent here. Since there are more rural than urban areas in the U.S., the county-level election results make it appear that the Republican candidate should win every election by a landslide. But as proved prior, this is not the case because of the use of the electoral college voting system, where state population is taken into account. Now, you can critically look at the county-level and state-level election results and understand how the presidential election outcome is determined.</p>
</div>
<div class="slider">
    <input type="range" min="2000" max="2020" step="4" bind:value={currentYear} on:input={updateYear} />
    <p>{currentYear} Presidential Election</p>
</div>
<style>
    .chart-container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .bar-chart-container {
        /* Adjusted style to move the bar chart over to the left by 50px */
        margin-right: 50px;
    }

    .slider {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 1000;
    }

    .slider input {
        margin-right: 50px;
        margin-top: 65px
    }

    .slider p {
        margin-top: -1px;
        margin-left: -25px;
        font-weight: bold;
    }

    .map-container {
        display: flex;
        justify-content: space-between;
        width: 90%;
        box-sizing: border-box;
        padding: 10px;
    }

    .text-box {
        margin-top: 10px; /* Adjusted margin top */
        padding: 5px;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: 800px;
        text-align: center; /* Center text horizontally */
    }

    /* Updated style to move the bar chart over to the left by 50px */
    .bar-chart-container {
        margin-right: 50px;
    }
</style>
