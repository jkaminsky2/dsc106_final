<script>
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { geoPath, geoAlbersUsa } from 'd3-geo';
  import * as topojson from 'topojson-client';

  export let us;
  export let overall_pres;

  let data = [];
  let svgNode;
  let lastClicked = null;
  let isZoomed = false;
  let sliderValue = 0;

  onMount(async () => {
    const width = 975;
    const height = 610;

    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);

    const svg = d3.select(svgNode)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;")
      .on("click", reset);

    const path = d3.geoPath();
    const resultsMap = {};
    overall_pres.forEach(entry => {
      resultsMap[entry.state] = entry.result;
    });
    const g = svg.append("g");

    const states = g.append("g")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("cursor", "pointer")
      .attr("fill", d => {
        const stateName = d.properties.name;
        const result = resultsMap[stateName];
        return result === 1 ? "blue" : "red";
      })
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .on("click", clicked)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    svg.call(zoom);

    function reset() {
      if (lastClicked) {
        clicked(null, lastClicked);
      } else {
        states.transition().style("fill", null);
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
      }
    }

    function clicked(event, d) {
      if (lastClicked === d) {
        lastClicked = null;
        reset();
        isZoomed = false;
        return;
      }
      
      lastClicked = d;
      handleMouseOut();
      isZoomed = true;
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      states.transition().style("fill", null);
      d3.select(this).transition();
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, svg.node())
      );
    }

    

    function zoomed(event) {
      const {transform} = event;
      g.attr("transform", transform);
      g.attr("stroke-width", 1 / transform.k);
    }

    function handleMouseOver(event, d) {
      if (isZoomed == false) {
        const stateName = d.properties.name;
      d3.select("#state-tooltip")
        .text(stateName)
        .style("visibility", "visible")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
      }
    }

    function handleMouseOut() {
        d3.select("#state-tooltip").style("visibility", "hidden");

    }
    
    const barData = [150, 57];
    const barWidth = 200;
    const barPadding = 5;
    const barChartHeight = 50;
    const marginTop = 50;

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(barData)])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain([barData.map((_, i) => i)])
      .range([0, 500])
      .paddingInner(0.1);

    const barChart = d3.select(".bar-chart")
      .attr("width", 600)
      .attr("height", 25) 

    const bars = barChart.selectAll("rect")
      .data(barData)
      .enter()
      .append("rect")
      .attr("x", 0) 
      .attr("y", barChartHeight - 50) 
      .attr("width", d => xScale(d))
      .attr("height", d => yScale.bandwidth())
      .attr("fill", (d, i) => i === 0 ? "red" : "blue"); 

    barChart.append("line")
      .attr("x1", 300)
      .attr("y1", 0)
      .attr("x2", 300)
      .attr("y2", barChartHeight)
      .attr("stroke", "black")
      .attr("stroke-width", 2);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(d3.scaleLinear().domain([0, d3.sum(barData)]).range([0, barChartHeight]));

    barChart.append("g")
      .attr("transform", `translate(0, ${barChartHeight + marginTop})`)
      .call(xAxis);

    barChart.append("g")
      .call(yAxis);
    const barsAndText = barChart.append("g").classed("bars-and-text", true);
    
    const namesBox = d3.select(".chart-container")
      .insert("svg", ":first-child")
      .attr("class", "names-box")
      .attr("width", width)
      .attr("height", 50);

    namesBox.append("text")
      .attr("x", 226)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", 16)
      .text("Joe Biden");

    namesBox.append("text")
      .attr("x", 490)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", 16)
      .text("Goal (270)");

    namesBox.append("text")
      .attr("x", 736)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("font-size", 16)
      .text("Donald Trump");

    // Your existing code

    // Add the slider
    d3.select('.chart-container')
      .append('input')
      .attr('type', 'range')
      .attr('min', -1)
      .attr('max', 1)
      .attr('step', 0.1)
      .attr('value', sliderValue)
      .on('input', function() {
        sliderValue = this.value;
        // Update the opacity based on the slider value
        states.attr('fill-opacity', d => {
          const stateName = d.properties.name;
          const result = resultsMap[stateName];
          console.log(stateName);
          if (sliderValue === '1' && result === -1) {
            return 0; 
          } else if (sliderValue === '-1' && result === 1) {
            return 0; 
          } else {
            return 1;
          }
        });
      });
  });
</script>

<div class="chart-container">
  <!-- Stacked Bar Chart -->
  <svg class="bar-chart"></svg>
  <div class="map-and-text">
    <!-- Map -->
    <div class="states">
      <svg bind:this={svgNode} width="800" height="600"></svg>
    </div>
    <!-- Text Box -->
    <div class="text-box">
      Shown is the overall and state breakdown of the 2020 presidential election between Joe Biden (Democrat) and Donald Trump (Republican). Democrats are associated with the color blue and Republicans with the color red, which is utilized in color-coding the state results and the overall results. As seen, Joe Biden and Donald Trump both won 25 states but Joe Biden won the election 306 electoral college votes to 232. How could this happen?
    </div>
  </div>
  <!-- Tooltip for state name -->
  <div id="state-tooltip"></div>
  
</div>

<!-- <input type="range" min="-1" max="1" bind:value={$sliderPosition} on:input={onMount} /> -->
<input type="range" min="-1" max="1" step="0.01" value="0" on:input={onMount}/>

<style>
 .chart-container {
  display: flex;
  flex-direction: column;
  margin-top: -25px;
}

.map-and-text {
  display: flex;
  margin-top: 10px;
  flex: 1;
}

.states {
  flex: 1.75;
}

.text-box {
  position: absolute;
  top: 300px;
  right: 75px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 300px;
}

#state-tooltip {
  position: absolute;
  background: #fff;
  border: 1px solid #000;
  padding: 5px;
  visibility: hidden;
  z-index: 999;
}

.bar-chart {
  margin-left: 188px;
}

input[type="range"] {
  width: 150px;
  height: 10px;
}
</style>
