<script>
  // Write your JS here, or import other files
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { geoPath, geoAlbersUsa } from 'd3-geo';
  import * as topojson from 'topojson-client';

  let data = [];
  let svgNode;
  let us;

  onMount(async () => {
    const res = await fetch('countypres_2000-2020.csv');
    const csv = await res.text();
    data = await d3.csvParse(csv, d => ({
      year: +d['year'],
      state: d['state'],
      state_po: d['state_po'],
      county_name: d['county_name'],
      county_fips: +d['county_fips'],
      office	: d['office'],
      candidate: d['candidate'],
      party: d['party'],
      candidatevotes: +d['candidatevotes'],
      totalvotes: +d['totalvotes'],
      version: d['version'],
      mode: d['mode'],
    }));
  });

  onMount(async () => {
    const response = await fetch('states-albers-10m.json');
    us = await response.json();

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

    const g = svg.append("g");

    const states = g.append("g")
      .attr("fill", "#444")
      .attr("cursor", "pointer")
      .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
      .join("path")
      .on("click", clicked)
      .attr("d", path);

    states.append("title")
      .text(d => d.properties.name);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

    svg.call(zoom);

    function reset() {
      states.transition().style("fill", null);
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
      );
    }

    function clicked(event, d) {
      const [[x0, y0], [x1, y1]] = path.bounds(d);
      event.stopPropagation();
      states.transition().style("fill", null);
      d3.select(this).transition().style("fill", "red");
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

  let sections = [
    {
      title: "There are more rural areas in the United States",
      content: "Content for the first section...",
      interactive: "map", // Define which interactive element to show ('map', 'chart', etc.)
      index: 0
    },
    {
      title: "Rural areas are more Republican & urban areas are more Democratic",
      content: "Content for the second section...",
      interactive: "chart",
      index: 1
    },
    {
      title: "Simply looking at a map colored with red/blue seems like Republicans won the 2020 election",
      content: "Content for the third section...",
      interactive: "map",
      index: 2
    }
  ];

  let currentSection = 0;

  // Function to navigate to the next section
  function nextSection() {
    if (currentSection < sections.length - 1) {
      currentSection += 1;
    }
  }

  // Function to navigate to the previous section
  function prevSection() {
    if (currentSection > 0) {
      currentSection -= 1;
    }
  }

  function getACSVariable(variableCode, year) {
    const url = `https://api.census.gov/data/${year}/acs/acs5?get=${variableCode}&for=county:*`;
    const data = fetch(url)
      .then(response => response.json())
      .then(function(raw) {
        const keys = raw[0];
        var data = raw.slice(1);
        data = data.map(d => new Map(zip(keys, d)));
        return indexBy(data, d => d.get('state') + d.get('county'));
      });
    return data;
  }

  function plotACSVariable(variableCode, year, fill) {
    return getACSVariable(variableCode, year).then(function plot(variable) {
      const svg = d3.create("svg").attr("viewBox", [0, 0, 975, 610]);
      const g = svg.append("g");

      if (typeof fill != "function") {
        fill = d => fill;
      }

      g.selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .join("path")
        .attr("fill", d => fill(variable.get(d.id)))
        .attr("d", path);

      svg
        .append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

      svg
        .append("path")
        .datum(topojson.mesh(us, us.objects.counties, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", ".5px")
        .attr("stroke-linejoin", "round")
        .attr("d", path);

      return svg;
    });
  }

</script>

<main>
  <h1>Geospatial Breakdown of Past U.S. Presidential Elections</h1>

  <div class="slideshow-box">
    {#each sections as section, i}
      {#if i === currentSection}
        <section transition:fade>
          <p>{section.index}</p>
        </section>
      {/if}
    {/each}
  </div>

  <!-- Navigation buttons -->
  <button on:click={prevSection} disabled={currentSection === 0}>Previous</button>
  <button on:click={nextSection} disabled={currentSection === sections.length - 1}>Next</button>

  <svg bind:this={svgNode} />
</main>

<style>
.slideshow-container {
  position: relative; /* Set position relative */
  width: 80%;
  margin: auto;
}

.slideshow-box {
  position: relative; /* Set position relative */
  border: 2px solid #ccc;
  padding: 20px 40px; /* Adjust padding to add margin around the text content */
  margin-bottom: 20px;
  min-height: 500px; /* Adjust height as needed */
}

/* Add styles to make slides position absolute */
section {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.nav-btn {
  margin-right: 10px;
  cursor: pointer;
}

/* Optional: Add transition effects for smoother navigation */
section {
  transition: opacity 0.3s ease;
  will-change: opacity;
}
</style>
