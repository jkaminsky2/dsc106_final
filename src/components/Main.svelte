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
    let state_pres;
    let overall_pres;

    onMount(async () => {
        let res = await fetch('states-albers-10m.json');
        us = await res.json();

        res = await fetch('counties-albers-10m.json');
        county = await res.json();

        res = await fetch('urban.json');
        urban = await res.json();

        res = await fetch('popValue.json');
        popValues = await res.json();

        res = await fetch('2020_presidential.csv');
        let csv = await res.text();
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

        res = await fetch('2020_state_pres_data.csv');
        csv = await res.text();
        state_pres = await d3.csvParse(csv, d => ({
            year: +d['year'],
            state: d['state'],
            state_po: d['state_po'],
            candidate: d['candidate'],
            party: d['party'],
            candidatevotes: +d['candidatevotes'],
            Electoral_College_Votes: +d['Electoral_College_Votes'],
        }));

        res = await fetch('2020_overall_pres_data.csv');
        csv = await res.text();
        overall_pres = await d3.csvParse(csv, d => ({
            year: +d['year'],
            state: d['state'],
            state_po: d['state_po'],
            result: +d['result']
        }))

        // console.log(us.objects.states);
        // console.log(overall_pres);
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
    <h1>Geospatial Breakdown of 2020 U.S. Presidential Elections</h1>

    {#if currentSlide === States && us && overall_pres}
        <States {us} {overall_pres} />
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
  