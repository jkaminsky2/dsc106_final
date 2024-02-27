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
          // console.log("Data for county not found:", err);
          return 'black';
        }
      })
      .attr("stroke", "white")
      .attr("stroke-width", "0.3px")
      .attr("stroke-linejoin", "round")

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

<div class="chart-container">
  TODO: need to clean the dataset (Alaska in district number & need to match name from the map file and csv file that contains the election result)
  <div class="states" style="margin-top: 10px;">
    <svg bind:this={svgNode} />
  </div>
</div>

<style>
</style>
