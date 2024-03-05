<script>
  // https://observablehq.com/@thepartsofspeech/us-population
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';
  import { onMount } from 'svelte';
  

  let us;
  let svg;
  let svgNode;
  let lastClicked = null;
  let g;
  let topMargin = 85;

  export let county;
  export let popValues;
  export let countyIdsByStates;
  export let overall_pres;
  export let statesByResult;

  // NOTE zooming in isn't smooth (possibly bc there are lots of geometry. So maybe remove the zoom in function?)

  const width = 975;
  const height = 610;
  let counties;
  let states;

  onMount(async () => {
    plotACSVariable(popFill);
  });

  let color = d3.scaleQuantize([0, 54], d3.schemeGreens[9]);
  let path = d3.geoPath();

  function handleSliderChange(event) {
    const threshold = 0.2;
    const value = parseFloat(event.target.value);

    if (value < -0.2) {
      document.documentElement.style.setProperty('--thumb-color', '#0000FF'); // Blue for Democrat
    } else if (value > 0.2) {
      document.documentElement.style.setProperty('--thumb-color', '#FF0000'); // Red for Republican
    } else {
      document.documentElement.style.setProperty('--thumb-color', '#4CAF50'); // Default color for neutral
    }

    if (Math.abs(value) < threshold) {
        event.target.value = 0; // Snap the value to 0 if it's close enough
    }

    const opacity = 1 - Math.abs(event.target.value);
    if (event.target.value > 0) {
      const republican = statesByResult['-1']
      counties.transition()
        .style("opacity", state => {
            return republican.includes(state.id.substring(0, 2)) ? 1 : opacity;
        });

      states.transition()
        .style("stroke-opacity", state => {
          return republican.includes(state.id.substring(0, 2)) ? 1 : opacity;
        });
    } else if (event.target.value < 0) {
      const democratic = statesByResult['1'];
      counties.transition()
        .style("opacity", state => {
            return democratic.includes(state.id.substring(0, 2)) ? 1 : opacity;
        });
      states.transition()
        .style("stroke-opacity", state => {
          return democratic.includes(state.id.substring(0, 2)) ? 1 : opacity;
        });

    } else {
      counties.transition().style("opacity", 1); // Set opacity to 1 for default (neutral)
      states.transition().style("stroke-opacity", 1);
    }
  }

  function zip(a, b) {
    const N = Math.min(a.length, b.length);
    return d3.range(N).map(i => [a[i], b[i]]);
  }

  function indexBy(data, func) {
    return new Map(data.map(d => [func(d), d]));
  }

  function processACSData(data) {
    const keys = data[0];
    const parsedData = data.slice(1).map(d => new Map(zip(keys, d)));
    const indexedData = indexBy(parsedData, d => d.get('state') + d.get('county'));
    return indexedData;
  }


  async function plotACSVariable(fill) {
    function zoomed(event) {
      const {transform} = event;
      const { k, x, y } = transform;
      g.attr("transform", `translate(${x},${y + topMargin}) scale(${k})`);
      g.attr("stroke-width", 1 / k);
    }

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
      
      // Highlight the selected counties and fade out others
      counties.transition()
        .style("fill", state => {
          if (highlightedCountiesId.includes(state.id)) {
            // Fill color for highlighted counties
            return fill(variable.get(state.id));
          } else {
            // Gray color for non-highlighted counties
            return "rgba(0, 0, 0, 0.1)";
          }
        });
    }



    function reset() {
      if (lastClicked) {
        clicked(null, lastClicked);
      } else {
        counties.transition().style("fill", null);
        svg.transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
        );
      }
    }

    const variable = processACSData(popValues);
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);
    svg = d3.select('.svg')
      .attr("viewBox", [0, 0, width, height+topMargin])
      .attr("width", width)
      .attr("height", height+topMargin)
      .attr("style", "max-width: 100%; height: auto;")
      .on("click", reset);
    
    const path = d3.geoPath();
    g = svg.append("g")
      .attr("transform", `translate(0, ${topMargin})`);

    if (typeof fill != "function") {
      fill = d => fill;
    }

    counties = g.append("g")
      .selectAll("path")
      .data(topojson.feature(county, county.objects.counties).features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => fill(variable.get(d.id)))


    g
      .append("path")
      .datum(topojson.mesh(county, county.objects.counties, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", ".35px")
      .attr("d", path);
    
    states = g.append("g")
      .selectAll("path")
      .data(topojson.feature(county, county.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-width", "1px");

    g
      .append("g")
      .selectAll("path")
      .data(topojson.feature(county, county.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("fill", "transparent")
      .attr("cursor", "pointer")
      .on("click", clicked);


      // document.querySelector('.county-pop').appendChild(svg.node()); // Append SVG to the .county-pop div

    svg.call(zoom);

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(20, 20)')

    // legend.append('rect')
    //   .attr('class', 'legend-background')
    //   .attr('width', (squareWidth * legendColors.length)) // Adjusted width to cover all legend items
    //   .attr('height', squareHeight + 20) // Adjusted height to cover legend items and provide padding
    //   .attr('fill', 'white') // White background color
    //   .attr('opacity', 0.8);

    
    const legendColors = ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'];
    const legendThresholds = ['6', '12', '18', '24', '30', '36', '42', '48'];

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
          return squareWidth;
        })
        .attr('y', 50) // Adjust the position of the text labels below the squares
        .style('text-anchor', 'middle')
        .text((d, i) => legendThresholds[i]);

    legendItems.append('line')
        .attr('x1', squareWidth) // Start from the right edge of each square
        .attr('y1', 0) // Start from the top of each square
        .attr('x2', squareWidth) // Extend vertically
        .attr('y2', 30) // Extend downwards
        .attr('stroke', (d, i) =>{
          if (i !== 8) {
            return 'black'
          }
        }); // Color of the lines

    // Append legend title
    legend.append('text')
        .attr('class', 'legend-title')
        .attr('x', 0)
        .attr('y', -5)
        .text('Population (in thousands)');
  }

  function popFill(d) {
    if (!d) {
      return 0;
    } else {
      const pop = d.get("B01003_001E");
      return color(pop / 1000);  // This decides the unit
    }
  }

  // TODO need to add a legend for this plot
</script>

<div class="chart-container">
  <div class="map-and-text">
    <div class="states">
      <svg class="svg"></svg>
    </div>
    <div class="text-box" style="margin-top: {topMargin}px;">
      <b style="font-size: 20px;">Choropleth Map of U.S. County Populations</b>
      <p>A quick explanation to this is the county-level preisdential election map results do not convey total population by county. Counties throughout the U.S. have varying populations; this map conveys this. Counties shaded in as a darker green have a relatively higher population that counties shaded in a lighter shade of green. Make note of observations you can see such as coastal California counties being more populated and more rural areas in Nebraska being more sparsely populated. Utilize the slider to filter states based on their voting tendencies--left to view only Democrat-leaning states and right for Republican-leaning states. You can see that Democratic-leaning states tend to have more populous counties compared to Republican-leaning. This makes sense as rural areas tend to be more Republican-leaning whereas more dense urban areas tend to be more Democratic-leaning. But this does not explain the fact that both presidents won 25 states; how did Joe Biden come out victorious despite this fact?
      </p>
    </div>
  </div>
  <input class="slider" type="range" min="-1" max="1" step="0.01" value="0" on:input={handleSliderChange} style="width: 150px; margin-left: 0; display: block;"/>
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
  
  .map-title {
    font-size: 20px;
    font-weight: bold;
    color: black;
    margin-bottom: 10px;
  }

  .slider {
  -webkit-appearance: none; /* Remove default styles */
  appearance: none;
  width: 100%; /* Set width to fill its container */
  height: 10px; /* Set height */
  border-radius: 5px; /* Rounded corners */
  background: #d3d3d3; /* Background color */
  outline: none; /* Remove outline */
  opacity: 0.7; /* Set opacity */
  transition: opacity 0.2s; /* Add transition for smoother hover effect */
}

.slider:hover {
  opacity: 1; /* Increase opacity on hover */
}

/* Styling for the slider thumb */
.slider::-webkit-slider-thumb {
  -webkit-appearance: none; /* Remove default styles */
  appearance: none;
  width: 20px; /* Set width of the thumb */
  height: 20px; /* Set height of the thumb */
  border-radius: 50%; /* Rounded shape */
  background: #4CAF50; /* Green background color */
  cursor: pointer; /* Add cursor pointer */
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #4CAF50;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none; /* Remove default styles */
  appearance: none;
  width: 20px; /* Set width of the thumb */
  height: 20px; /* Set height of the thumb */
  border-radius: 50%; /* Rounded shape */
  background: var(--thumb-color, #4CAF50); /* Use the --thumb-color variable with a default value of #4CAF50 */
  cursor: pointer; /* Add cursor pointer */
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--thumb-color, #4CAF50); /* Use the --thumb-color variable with a default value of #4CAF50 */
  cursor: pointer;
}


</style>