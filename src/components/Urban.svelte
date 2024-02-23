<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { geoPath, geoMercator, zoom, select, pointer } from 'd3';
  import * as topojson from 'topojson-client';

  export let urban;

  let svgNode;
  let projection;
  let pathGenerator;
  let svg;


  const mapWidth = 975; // Adjust as needed
  const mapHeight = 610; // Adjust as needed


  onMount(() => {
    if (urban) {
      console.log(urban);
      projection = d3.geoAlbersUsa().fitSize([mapWidth, mapHeight], urban);
      pathGenerator = d3.geoPath().projection(projection);
      svg = d3.select('#map-container')
        .append('svg')
        .attr('width', mapWidth)
        .attr('height', mapHeight);

      svg.selectAll('svg')
        .data(urban.features)
        .enter()
        .append('path')
        .attr('d', pathGenerator)
        .attr('fill', 'none')
        .attr('stroke', '#000000')
        .attr('stroke-width', 0.15);
    }
  });


</script>

<div id="map-container">
</div>

<style>
  #map-container {
    width: 100%;
    height: 600px;
  }
</style>
