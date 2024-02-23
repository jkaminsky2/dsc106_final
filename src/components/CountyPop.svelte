<script>
    import * as d3 from 'd3';
    import * as topojson from 'topojson-client';
    import { onMount } from 'svelte';
  
    let us;
    let svg;
    let svgNode;

    export let county;
    export let popValues;

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
      const variable = processACSData(popValues);
      const svg = d3.select(svgNode)
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;");
      
      const path = d3.geoPath();
      const g = svg.append("g");
  
      if (typeof fill != "function") {
        fill = d => fill;
      }
      g.selectAll("path")
        .data(topojson.feature(county, county.objects.counties).features)
        .join("path")
        .attr("fill", d => fill(variable.get(d.id)))
        .attr("d", path);
  
      svg
        .append("path")
        .datum(topojson.mesh(county, county.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path);
  
      svg
        .append("path")
        .datum(topojson.mesh(county, county.objects.counties, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", ".5px")
        .attr("stroke-linejoin", "round")
        .attr("d", path);
  
        document.querySelector('.county-pop').appendChild(svg.node()); // Append SVG to the .county-pop div
    }
  
    function popFill(d) {
      if (!d) {
        return 0;
      } else {
        const pop = d.get("B01003_001E");
        return color(pop / 1000);
      }
    }
  </script>
  
  <div class="county-pop">
    <svg bind:this={svgNode} />
  </div>

  <style>
    /* Write your CSS here */
  </style>
  