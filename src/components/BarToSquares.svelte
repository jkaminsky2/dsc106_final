<script>
    import { onMount } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import * as d3 from 'd3';

    export let state_pres;

    let caResult = [];
    let svgNode;
    let transitionSpeed = 1000;

    // Use tweened value for animation control
    const translateY = tweened(0, { duration: transitionSpeed, easing: cubicOut });

    onMount(() => {
        // Filter data for California
        caResult = state_pres.filter(element => {
            return element.state === 'California';
        });

        // Create the stacked bar plot
        createStackedBarPlot();
    });

    function createStackedBarPlot() {
        // Prepare data for plotting
        let parties = [...new Set(caResult.map(d => d.party))];
        let partyData = parties.map(party => ({
            party: party,
            votes: caResult.filter(d => d.party === party).reduce((acc, cur) => acc + cur.candidatevotes, 0)
        }));
        let totalVotes = partyData.reduce((acc, cur) => acc + cur.votes, 0);

        // Calculate percentages and sort data by percentage
        partyData.forEach(d => {
            d.percentage = (d.votes / totalVotes) * 100;
        });

        partyData.sort((a, b) => b.percentage - a.percentage); // Sort by percentage in descending order

        // Set up dimensions for the SVG
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = 600 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Create SVG element
        const svg = d3.select(svgNode)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Create scales
        const x = d3.scaleBand()
            .domain(partyData.map(d => d.party)) // Use sorted parties
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        // Create bars
        const bars = svg.selectAll(".bar")
            .data(partyData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.party))
            .attr("width", x.bandwidth())
            .attr("y", d => y(0)) // Initially set bars to start from y=0
            .attr("height", 0);

        // Transition bars to their correct position
        bars.transition()
            .duration(transitionSpeed)
            .delay((d, i) => i * (transitionSpeed / partyData.length))
            .attr("y", d => y(d.percentage))
            .attr("height", d => height - y(d.percentage));

        // Add X axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y).ticks(10));

        // Add labels
        svg.selectAll(".label")
            .data(partyData)
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d.party) + x.bandwidth() / 2)
            .attr("y", d => y(d.percentage) - 5)
            .attr("text-anchor", "middle")
            .text(d => `${d.percentage.toFixed(2)}%`);

    }

</script>

<div>
    <svg bind:this={svgNode} />
</div>

<style>
    /* Add CSS styles for the plot if needed */
</style>
