<script>
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { geoPath, geoAlbersUsa } from 'd3-geo';
  import * as topojson from 'topojson-client';

  export let county;
  export let county_pres;
  export let state_ids;

  let data = [];
  let svgNode;
  let lastClicked = null;
  let isZoomed = false;
  let svg;
  let counties;
  let states;
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  onMount(async () => {
    plotMap();
  });

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
    county_pres.forEach(entry => {
      // Check if the state exists in the resultsMap, if not, initialize it
      if (!resultsMap[entry.state.toLowerCase()]) {
        resultsMap[entry.state.toLowerCase()] = {};
      }
      resultsMap[entry.state.toLowerCase()][entry.county_name.toLowerCase()] = {
        'winner': entry.party.toLowerCase(),
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
      // .attr("cursor", "pointer")
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
          console.log(stateName, countyName);
          return 'black';
        }
      })
      .attr("stroke", "white")
      .attr("stroke-width", "0.3px")
      .attr("stroke-linejoin", "round")
      .on("mouseover", function(d) {
        const countyName = d.toElement.__data__.properties.name;
        const stateName = state_ids.get(d.toElement.__data__.id.substring(0,2));
        const tooltipText = `${countyName}, ${stateName}`;
        // Show tooltip
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(tooltipText);
      })
      .on("mouseout", function(d) {
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

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

</script>
<div class="map-title">
    <p>County-Level 2020 Presidential Election Results</p>
</div>
<div class="chart-container">
  <div class="states" style="margin-top: 10px;">
    <svg bind:this={svgNode} />
  </div>
  <div class="text-box" style="float: right; width: 300px;">
    <p>Upon looking at the county breakdown of the 2020 presidential election, it seems like the Republican candidate Donald Trump got more votes in the overwhelming majority of counties in the U.S.. How did the Democratic candidate Joe Biden win then if he got more votes in the same number of states and in less counties when compared to Donald Trump?</p>
  </div>
</div>

<style>
.text-box {
  position: absolute;
  top: 300px; /* Move the text box down by 200 pixels */
  right: 75px; /* Adjust as needed */
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10; /* Ensure the text box is above the map */
  width: 300px; /* Adjust the width as needed */
}
.map-title {
  position: absolute;
  top: 40px;
  left: 20.75%; /* Adjust the left position as needed */
  font-size: 20px; /* Adjust the font size as needed */
  font-weight: bold; /* Adjust the font weight as needed */
  color: black; /* Adjust the color as needed */
  z-index: 10; /* Ensure the title is above the map */
}
</style>
