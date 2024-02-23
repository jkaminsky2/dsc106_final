// plotACSVariable.js
import { writable } from 'svelte/store';
import { topojson } from 'topojson-client';
import { geoPath } from 'd3-geo';
import { scaleQuantize, schemeBlues } from 'd3-scale';

const colorScale = scaleQuantize().domain([0, 54]).range(schemeBlues[9]);
const path = geoPath();

export async function plotACSVariable(variableCode, year) {
  const variable = await getACSVariable(variableCode, year);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 975 610");

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  topojson.feature(us, us.objects.counties).features.forEach(d => {
    const countyPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    countyPath.setAttribute("fill", colorScale(variable.get(d.id)));
    countyPath.setAttribute("d", path(d));
    g.appendChild(countyPath);
  });

  const statesPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  statesPath.setAttribute("fill", "none");
  statesPath.setAttribute("stroke", "white");
  statesPath.setAttribute("stroke-linejoin", "round");
  statesPath.setAttribute("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));
  g.appendChild(statesPath);

  const countiesPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  countiesPath.setAttribute("fill", "none");
  countiesPath.setAttribute("stroke", "white");
  countiesPath.setAttribute("stroke-width", ".5px");
  countiesPath.setAttribute("stroke-linejoin", "round");
  countiesPath.setAttribute("d", path(topojson.mesh(us, us.objects.counties, (a, b) => a !== b)));
  g.appendChild(countiesPath);

  svg.appendChild(g);

  return svg;
}

async function getACSVariable(variableCode, year) {
  const url = `https://api.census.gov/data/${year}/acs/acs5?get=${variableCode}&for=county:*`;
  const response = await fetch(url);
  const rawData = await response.json();
  const keys = rawData[0];
  const data = rawData.slice(1).map(d => new Map(zip(keys, d)));
  return indexBy(data, d => d.get('state') + d.get('county'));
}

function indexBy(data, func) {
  return new Map(data.map(d => [func(d), d]));
}

function zip(a, b) {
  const N = Math.min(a.length, b.length);
  return Array.from({ length: N }, (_, i) => [a[i], b[i]]);
}

const us = await FileAttachment("counties-albers-10m.json").json();
