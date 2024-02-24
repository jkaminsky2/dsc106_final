<script>
  // Write your JS here, or import other files
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { geoPath, geoAlbersUsa } from 'd3-geo';
  import * as topojson from 'topojson-client';

  export let us;
  export let overall_pres;

  let data = [];
  let svgNode;
  let lastClicked = null;

  onMount(async () => {

    // console.log(topojson.feature(us, us.objects.states).features[0]);

    // Chart rendering logic
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
    // Render states
    const g = svg.append("g");

    const states = g.append("g")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .attr("d", path)
      .attr("cursor", "pointer")
      .attr("fill", d => {
        const stateName = d.properties.name; // Assuming the state name is stored in the name property
        const result = resultsMap[stateName];
        return result === 1 ? "blue" : "red";
      })
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .on("click", clicked);

    // states.append("title")
    //   .text(d => d.properties.name);


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
        return;
      }
      
      lastClicked = d;
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

  });

  

</script>

<div class="states">
  <svg bind:this={svgNode} />
</div>

<style>
</style>
