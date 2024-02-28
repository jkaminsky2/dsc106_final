<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import * as d3 from 'd3';
    import States from './States.svelte';
    import CountyPop from './CountyPop.svelte';
    import Urban from './Urban.svelte';
    import ElectoralCollege from './ElectoralCollege.svelte';
    import California from './California.svelte';
    import Kansas from './Kansas.svelte';
    import Nebraska from './Nebraska.svelte';
    import ElectoralCollegeResult from './ElectoralCollegeResult.svelte';
    import DifferentYears from './DifferentYears.svelte';
    import Counties from './Counties.svelte';
  
    let slides = [States, Counties, CountyPop, ElectoralCollege, California, Nebraska, ElectoralCollegeResult, DifferentYears];
    let currentSlideIndex = 0;
    let currentSlide = slides[currentSlideIndex];
    let isTransitioning = false;

    let us;
    let county;
    let urban;
    let popValues;
    let presidential;
    let state_pres;
    let county_pres;
    let overall_pres;
    let statesByResult;
    let electoralCollegeByState;
    let electoralCollegeResults;
    let allYearsCountiesResults;
    let allYearsOverallPres;
    const state_ids = new Map();
    const countyIdsByStates = new Map();

    const dispatch = createEventDispatcher();

    function handleTransitionStart() {
        isTransitioning = true;
    }
    function handleTransitionEnd() {
        isTransitioning = false;
    }

    onMount(async () => {
        let res = await fetch('states-albers-10m.json');
        us = await res.json();

        res = await fetch('counties-albers-10m_v2.json');
        county = await res.json();

        county.objects.states.geometries.forEach(entry => {
            const id = entry.id;
            const state_name = entry.properties.name.toLowerCase();
            state_ids.set(id, state_name);
        });

        county.objects.counties.geometries.forEach(entry => {
            const id = entry.id;
            const state_id = id.slice(0, 2);
            
            if (countyIdsByStates.has(state_id)) {
                countyIdsByStates.get(state_id).push(id);
            } else {
                countyIdsByStates.set(state_id, [id]);
            }
        })
    

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

        electoralCollegeByState = {};

        state_pres.forEach(element => {
            electoralCollegeByState[element.state] = element.Electoral_College_Votes;
        });

        // console.log(electoralCollegeByState);

        res = await fetch('2020_overall_pres_data.csv');
        csv = await res.text();
        overall_pres = await d3.csvParse(csv, d => ({
            year: +d['year'],
            state: d['state'],
            state_po: d['state_po'],
            result: +d['result']
        }))

        statesByResult = {
            "-1": [],
            "1": []
        };
        overall_pres.forEach(element => {
            statesByResult[element.result.toString()].push(getKeyByValue(state_ids, element.state.toLowerCase()));
        });

        res = await fetch('2020_county_pres_data_v2.csv');
        csv = await res.text();
        county_pres = d3.csvParse(csv, d => ({
            state: d['state'],
            county_name: d['county_name'],
            party: d['party'],
            candidatevotes: +d['candidatevotes'],
            totalvotes: +d['totalvotes'],
            win_percentage: +d['win_percentage']
        }))

        res = await fetch('2020_electoral_college_result.csv');
        csv = await res.text();
        electoralCollegeResults = d3.csvParse(csv, d => ({
            state: d['state'],
            votes: {
                democrat: +d['democratVote'],
                republican: +d['republicanVote']
            }
        })).reduce((acc, curr) => {
            acc[curr.state] = curr.votes;
            return acc;
        }, {});

        res = await fetch('all_years_county_pres.csv');
        csv = await res.text();
        allYearsCountiesResults = d3.csvParse(csv, d => ({
            state: d['state'].toLowerCase(),
            county_name: d['county_name'].toLowerCase(),
            party: d['party'].toLowerCase(),
            year: +d['year'],
            candidatevotes: +d['candidatevotes'],
            win_percentage: +d['win_percentage']
        }));

        res = await fetch('all_years_overall_pres_data.csv');
        csv = await res.text();
        allYearsOverallPres = d3.csvParse(csv, d => ({
            state: d['state'],
            state_po: d['state_po'],
            year: +d['year'],
            result: +d['result'],
        }));
    })

    function getKeyByValue(map, searchValue) {
        for (let [key, value] of map.entries()) {
            if (value === searchValue) {
            return key;
            }
        }
        return null; // Value not found
    }
  
    function nextSlide() {
        if (!isTransitioning) {
            isTransitioning = true;
            const nextIndex = currentSlideIndex + 1;
            currentSlideIndex = nextIndex;
            currentSlide = slides[nextIndex];
            isTransitioning = false;
        }
    }

    function prevSlide() {
        if (!isTransitioning) {
            isTransitioning = true;
            const prevIndex = currentSlideIndex - 1;
            currentSlideIndex = prevIndex;
            currentSlide = slides[prevIndex];
            isTransitioning = false;
        }
    }
  </script>

<main>
    <h1>Geospatial Breakdown of 2020 U.S. Presidential Elections</h1>
    <!-- {#if electoralCollegeByState}
    <ElectoralCollege {electoralCollegeByState} />
    {/if} -->

    {#if currentSlide === CountyPop && county && popValues && countyIdsByStates && statesByResult}
        <CountyPop {county} {popValues} {countyIdsByStates} {overall_pres} {statesByResult}/>
    {:else if currentSlide === States && us && overall_pres}
        <States {us} {overall_pres} />
    {:else if currentSlide === Counties && county && county_pres && state_ids}
        <Counties {county_pres} {county} {state_ids}/>
    {:else if currentSlide === ElectoralCollege}
        <ElectoralCollege {electoralCollegeByState} {us} />
    {:else if currentSlide === ElectoralCollegeResult}
        <ElectoralCollegeResult {electoralCollegeByState} {state_pres} {electoralCollegeResults} on:transitionstart={handleTransitionStart} on:transitionend={handleTransitionEnd} />
    {:else if currentSlide === California}
        <California {electoralCollegeByState} {state_pres} on:transitionstart={handleTransitionStart} on:transitionend={handleTransitionEnd} />
    {:else if currentSlide === Nebraska}
        <Nebraska {electoralCollegeByState} {state_pres} on:transitionstart={handleTransitionStart} on:transitionend={handleTransitionEnd} />
    {:else if currentSlide === DifferentYears && allYearsCountiesResults && allYearsOverallPres}
        <DifferentYears {allYearsCountiesResults} {county} {state_ids} {allYearsOverallPres} {us} />
    {:else}
        <p>Loading...</p>
    {/if}

    <div>
        <button on:click={prevSlide} disabled={currentSlideIndex === 0 || isTransitioning}>Previous</button>
        <button on:click={nextSlide} disabled={currentSlideIndex === slides.length - 1 || isTransitioning}>Next</button>
    </div>
</main>

<style>
</style>
