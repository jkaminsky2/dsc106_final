<script>
  // https://observablehq.com/@thepartsofspeech/us-population
  import * as d3 from 'd3';
  import * as topojson from 'topojson-client';
  import { onMount } from 'svelte';

  let us;
  let svg;
  let svgNode;
  let lastClicked = null;

  export let county;
  export let popValues;
  export let countyIdsByStates;

  // NOTE zooming in isn't smooth (possibly bc there are lots of geometry. So maybe remove the zoom in function?)

  const width = 975;
  const height = 610;

  onMount(async () => {
    plotACSVariable(popFill);
  });

  let color = d3.scaleQuantize([0, 54], d3.schemeBlues[9]);
  let path = d3.geoPath();

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
      // State name
      // console.log(d.properties.name);
      lastClicked = d;
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      states.transition();
      d3.select(this).transition();
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3.pointer(event, svg.node())
      );
      // let countiesToHighlight = countyPerState.get(d.properties.name.toLowerCase());
      // console.log(states._groups[0][0].__data__.properties.name);
      // console.log(states._groups[0][0].__data__.id);  // to get id
      // console.log(d.id);
      const highlightedStateId = d.id;
      const highlightedCountiesId = countyIdsByStates.get(highlightedStateId);
      // Fade out other states' fill colors excluding the selected county
      states.filter(state => !highlightedCountiesId.includes(state.id))
            .transition()
            .style("fill", "rgba(0, 0, 0, 0.1)");

      // Highlight the selected county
      states.filter(state => highlightedCountiesId.includes(state.id))
            .transition()
            .style("fill", fill(variable.get(d.id)));
          }


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

    const variable = processACSData(popValues);
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
    const g = svg.append("g");

    if (typeof fill != "function") {
      fill = d => fill;
    }

    const states = g.append("g")
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
    
    g
      .append("path")
      .datum(topojson.mesh(county, county.objects.states, (a, b) => a !== b))
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", "1px")
      .attr("d", path);

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

<style>
  /* Write your CSS here */
</style>
