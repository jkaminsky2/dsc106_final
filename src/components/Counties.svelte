<script>
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { geoPath, geoAlbersUsa } from 'd3-geo';
  import * as topojson from 'topojson-client';

  export let county;
  export let county_pres;
  export let countyIdsByStates;
  export let state_ids;

  let data = [];
  let svgNode;
  let lastClicked = null;
  let isZoomed = false;
  let svg;
  let counties;
  let states;
  let topMargin = 85;
  let highlightedCounties = "";
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  onMount(async () => {
    plotMap();
  });

  function capitalizeFirstLetter(str) {
    // Check if the string is not empty
    if (str.length > 0) {
      // Capitalize the first letter and concatenate with the rest of the string
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } else {
      return str; // Return the string as is if it's empty
    }
  }

  function plotMap() {
    const width = 975;
    const height = 610;

    svg = d3.select('.svg')
      .attr("viewBox", [0, 0, width, height+topMargin])
      .attr("width", width)
      .attr("height", height+topMargin)
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

    const g = svg.append("g")
      .attr("transform", `translate(0, ${topMargin})`);

    function zoomed(event) {
      const {transform} = event;
      const { k, x, y } = transform;
      g.attr("transform", `translate(${x},${y + topMargin}) scale(${k})`);
      g.attr("stroke-width", 1 / k);
    }

    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);

    const blueScale = d3.scaleLinear()
        .domain([0.45, 0.9]) // win_percentage ranges from 0 to 1
        .range(["lightblue", "blue"]); // Adjust the range of colors as needed for Democrats

    const redScale = d3.scaleLinear()
        .domain([0.45, 0.9]) // win_percentage ranges from 0 to 1
        .range(["#fad8d8", "#e62828"]);

    // legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20, 20)')

    let democratCs = [];
    let republicanCs = [];
    for (let p = 0; p<4; p++){
      const democratC = blueScale(0.45 + p*0.15);
      const republicanC = redScale(0.45 + p*0.15);
      democratCs.push(democratC);
      republicanCs.push(republicanC);
    }
    democratCs = democratCs.reverse();
    const legendColors = [... democratCs, ... republicanCs];
    const legendThresholds = ['90', '75', '60', '45', '45', '60', '75', '90'];
    console.log(legendColors);
    // Calculate the width and height of each color square
    const squareWidth = 40; // Adjusted width
    const squareHeight = 20;

    // Append color squares to the legend
    const legendItems = legend.selectAll('.legend-item')
        .data(legendColors)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(${i * (squareWidth)}, 0)`);

    legendItems.append('rect')
        .attr('width', squareWidth) // Adjusted width
        .attr('height', squareHeight)
        .attr('fill', d => d);

    // Append text labels to the legend
    legendItems.append('text')
        .attr('x', (d, i) => {
          if (i < 4){
            return 0;
          }
          return squareWidth;
        })
        .attr('y', 45) // Adjust the position of the text labels below the squares
        .style('text-anchor', 'middle')
        .style('font-size', '13px')
        .text((d, i) => legendThresholds[i]);

    legendItems.append('line')
        .attr('x1', squareWidth) // Start from the right edge of each square
        .attr('y1', 0) // Start from the top of each square
        .attr('x2', squareWidth) // Extend vertically
        .attr('y2', 30) // Extend downwards
        .attr('stroke', (d, i) =>{
          if (i === 3) {
            return 'none'
          }
          if (i < 7) {
            return 'black'
          }
          return 'none'
        });

    // Append legend title
    legend.append('text')
        .attr('class', 'legend-title')
        .attr('x', 0)
        .attr('y', -7)
        .style('font-size', '18px')
        .text('Win percentage (%)');


    function fill(result) {
      try {
        const winPercentage = result.win_percentage;
        const winner = result.winner.toLowerCase();
        if (winner === "democrat") {
            return blueScale(winPercentage);
        } else if (winner === "republican") {
            return redScale(winPercentage);
        } else {
            return "black"; // TODO Handle other cases
        }
      } catch(err) {
        return 'black';
      }
    }

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
        return fill(result);
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
    
    g
      .append("g")
      .selectAll("path")
      .data(topojson.feature(county, county.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("fill", "transparent")
      .attr("cursor", "pointer")
      .on("click", clicked);

    // zoom-in implementation
    function clicked(event, d) {
      if (lastClicked === d) {
        lastClicked = null;
        reset();
        return;
      }

      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      lastClicked = d;
      // Zoom to the selected state
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, svg.node())
      );

      // Get the id of the selected state
      const highlightedStateId = d.id;
      
      // Get the ids of counties in the selected state
      const highlightedCountiesId = countyIdsByStates.get(highlightedStateId);

      // highlightedCountiesIdText = highlightedCountiesId.join(", ");
      const stateId = highlightedCountiesId[0].substring(0, 2);
      const stateName = state_ids.get(stateId);
      const filteredCountyPres = county_pres.filter(entry => entry.state.toLowerCase() === stateName);
      // console.log(filteredCountyPres);
      const result = filteredCountyPres.reduce((acc, entry) => {
          let { party, totalvotes, state } = entry;
          party = capitalizeFirstLetter(party);
          state = capitalizeFirstLetter(state);
          // 1. Calculate which party wins in how many counties
          acc.partyWins[party] = (acc.partyWins[party] || 0) + 1;

          return acc;
      }, { partyWins: {}});

      highlightedCounties = `Out of ${filteredCountyPres.length} counties in ${capitalizeFirstLetter(stateName)}, Democrat won in ${result.partyWins.Democrat} counties and Republican won in ${result.partyWins.Republican}.`



      
      // Highlight the selected counties and fade out others
      counties.transition()
        .style("fill", state => {
          if (!highlightedCountiesId.includes(state.id)) {
            return "rgba(0, 0, 0, 0.1)";
          }
        });
    }


    function reset() {
      if (lastClicked) {
        clicked(null, lastClicked);
      } else {
        counties.transition().style("fill", null);
        highlightedCounties = '';
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
      }
    }
  }

</script>

<div class="chart-container">
<div class="map-and-text">
  <div class="states">
    <!-- <svg bind:this={svgNode} /> -->
    <svg class="svg"></svg>
  </div>
  <div class="text-box" style="margin-top: {topMargin}px;">
    <b style="font-size: 20px;">County-Level 2020 Presidential Election Results</b>
    <p>Upon looking at the county breakdown of the 2020 presidential election, it seems like the Republican candidate Donald Trump got more votes in the overwhelming majority of counties in the U.S.. How did the Democratic candidate Joe Biden win then if he got more votes in the same number of states and in less counties when compared to Donald Trump?</p>
    <p>{highlightedCounties}</p>
  </div>
</div>
</div>

<style>
  .chart-container {
    display: flex;
    flex-direction: column;
    margin-top: -25px;
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
  }
  </style>