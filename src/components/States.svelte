<script>
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { geoPath, geoAlbersUsa } from 'd3-geo';
  import * as topojson from 'topojson-client';

  export let us;
  export let overall_pres;

  let data = [];
  let svgNode;
  const topMargin = 85;
  const width = 975;
  const height = 610;


  onMount(async () => {
    const combinedSvg = d3.select('.combined-svg')
      .attr("viewBox", [0, 0, width, height+topMargin])
      .attr("width", width)
      .attr("height", height+topMargin)
      .attr("style", "max-width: 95%; height: auto;");
    
    const barData = [
      { candidate: 'Joe Biden', electoralVotes: 306, color: 'blue' },
      { candidate: 'Donald Trump', electoralVotes: 232, color: 'red' }
    ];
    const barWidth = width / (barData[0].electoralVotes + barData[1].electoralVotes);

    let xPosition = 0;
    combinedSvg.selectAll('rect')
      .data(barData)
      .enter()
      .append('rect')
      .attr('x', d => {
        const xPos = xPosition;
        xPosition += d.electoralVotes * barWidth;
        return xPos;
      })
      .attr('y', 50)
      .attr('width', d => d.electoralVotes * barWidth)
      .attr('height', 30)
      .attr('fill', d => d.color);

    combinedSvg.append("text")
      .attr("x", 5) // Adjust the x position as needed
      .attr("y", 40) // Move the text to the top
      .attr("text-anchor", "start")
      .attr("fill", "black")
      .text("Joe Biden")
      .attr("font-size", "18px");

    combinedSvg.append("text")
      .attr("x", width / 2) // Center the text
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .text("Goal")
      .attr("font-size", "18px");

    combinedSvg.append("text")
      .attr("x", width - 5) // Adjust the x position as needed
      .attr("y", 40)
      .attr("text-anchor", "end")
      .attr("fill", "black")
      .text("Donald Trump")
      .attr("font-size", "18px");

    // Add the thick white vertical line at 270
    combinedSvg.append("line")
      .attr("x1", width / 2)
      .attr("y1", 50)
      .attr("x2", width / 2)
      .attr("y2", 50 + 30)
      .attr("stroke", "white")
      .attr("stroke-width", 3);

    // Map
    const path = d3.geoPath();
    const resultsMap = {};
    overall_pres.forEach(entry => {
      resultsMap[entry.state] = entry.result;
    });

    const mapGroup = combinedSvg.append("g")
      .attr("class", "map-group")
      .attr("transform", `translate(0, ${topMargin})`);

    const states = mapGroup.append("g")
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
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    mapGroup.append("path")
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    const tooltip = d3.select("#state-tooltip");

    function zoomed(event) {
      const {transform} = event;
      g.attr("transform", transform);
      g.attr("stroke-width", 1 / transform.k);
    }

    function handleMouseOver(event, d) {
      const stateName = d.properties.name;
      const stateWinner = resultsMap[stateName]
      const textWinner = stateWinner === 1 ? "Joe Biden" : "Donald Trump";
      const displayText = `<span>${stateName}</span><br><span>Voted for ${textWinner}</span>`;
      tooltip
        .html(displayText)
        .style("visibility", "visible");
      updateTooltipPosition(event);
    }

    function handleMouseMove(event) {
      updateTooltipPosition(event);
    }

    function handleMouseOut() {
      tooltip.style("visibility", "hidden");
    }

    function updateTooltipPosition(event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    }

    combinedSvg.on("mousemove", handleMouseMove);

  });

  
</script>


<div class="chart-container">
  <div class="map-and-text">
    <div class="states">
      <svg class="combined-svg"></svg>
    </div>
    <div class="text-box" style="margin-top: {50}px;">
      <b style="font-size: 20px;">Overall and State-Level 2020 Presidential Election Results</b>
      <p>
      In presidential elections, votes are first counted by state and then overall. Shown is the overall and state breakdown of the 2020 presidential election between Joe Biden (Democrat) and Donald Trump (Republican). Democrats are associated with the color <span style="color: blue; font-weight:bold;">blue</span> and Republicans with the color <span style="color: red; font-weight:bold;">red</span>, which is utilized in color-coding the state results and the overall results. As seen, Joe Biden and Donald Trump both won 25 states but, evident from the bar chart above the map, Joe Biden won the election. <span style="font-weight: bold;">How did this happen?</span>
      </p>
    </div>
  </div>
  <div id="state-tooltip"></div>
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

#state-tooltip {
  position: absolute;
  background: #fff;
  border: 1px solid #000;
  padding: 5px;
  visibility: hidden;
  z-index: 999;
}

</style>
