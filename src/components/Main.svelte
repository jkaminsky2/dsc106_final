<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import States from './States.svelte';
    import CountyPop from './CountyPop.svelte';
    import Urban from './Urban.svelte';
  
    let slides = [States, CountyPop, Urban];
    let currentSlideIndex = 0;
    let currentSlide = slides[currentSlideIndex];
    let isTransitioning = false;

    let us;
    let county;
    let urban;
    let popValues;
    let presidential;

    onMount(async () => {
        const us_response = await fetch('states-albers-10m.json');
        us = await us_response.json();

        const county_response = await fetch('counties-albers-10m.json');
        county = await county_response.json();

        const urban_response = await fetch('urban.json');
        urban = await urban_response.json();

        const popValues_response = await fetch('popValue.json');
        popValues = await popValues_response.json();

        const presidential_res = await fetch('2020_presidential.csv');
        const csv = await presidential_res.text();
        presidential = await d3.csvParse(csv, d => ({
            year: +d['year'],
            state: d['state'],
            state_po: d['state_po'],
            county_name: d['county_name'],
            county_fips: d['county_fips'],
            office: d['office'],
            candidate: d['candidate'],
            party: d['party'],
            candidatevotes: +d['candidatevotes'],
            totalvotes: +d['totalvotes'],
            version: d['version'],
            mode: d['mode']
        }));

        // console.log(presidential);
    })
  
    function nextSlide() {
      if (!isTransitioning) {
        isTransitioning = true;
        const nextIndex = (currentSlideIndex + 1) % slides.length;
        currentSlideIndex = nextIndex;
        currentSlide = slides[nextIndex];
        setTimeout(() => {
          isTransitioning = false;
        }, 0); // Adjust transition time as needed
      }
    }
  
    function prevSlide() {
      if (!isTransitioning) {
        isTransitioning = true;
        const prevIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        currentSlideIndex = prevIndex;
        currentSlide = slides[prevIndex];
        setTimeout(() => {
          isTransitioning = false;
        }, 0); // Adjust transition time as needed
      }
    }
  </script>
  
<main>
    <h1>Svelte Slideshow</h1>

    {#if currentSlide === States && us}
        <States {us} />
    {:else if currentSlide === CountyPop && county && popValues}
        <CountyPop {county} {popValues} />
    <!-- {:else if currentSlide === Urban && urban}
        <Urban {urban} /> -->
    {:else}
        <p>Loading...</p>
    {/if}

    <div>
        <button on:click={prevSlide}>Previous</button>
        <button on:click={nextSlide}>Next</button>
    </div>
</main>
  
  <style>
    .slide-container {
      transition: opacity 0.5s ease;
      opacity: 1;
    }
  
    .slide-container.fade-out {
      opacity: 0;
    }
  </style>
  