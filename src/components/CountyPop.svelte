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
    const threshold = 0.1;
    const value = parseFloat(event.target.value);

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
      // console.log('default');
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
      g.attr("transform", transform);
      g.attr("stroke-width", 1 / transform.k);
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
    svg = d3.select(svgNode)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;")
      .on("click", reset);
    
    const path = d3.geoPath();
    g = svg.append("g");

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
      .attr("stroke-width", ".5px")
      .attr("d", path);
    
    states = g.append("g")
      .selectAll("path")
      .data(topojson.feature(county, county.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "black")
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


      document.querySelector('.county-pop').appendChild(svg.node()); // Append SVG to the .county-pop div

    svg.call(zoom);
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


<div class="county-pop">
  <svg bind:this={svgNode} />
</div>
<!-- <input type="range" min="-1" max="1" bind:value={$sliderPosition} on:input={handleSliderChange} /> -->
<input type="range" min="-1" max="1" step="0.01" value="0" on:input={handleSliderChange}/>


<style>

</style>
