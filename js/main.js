const margin = { top: 100, right: 20, bottom: 50, left: 50 };
const width = 1160;
const height = 600;
const groups = [
  { key: 'nominees_caucasian', label: 'Caucasian or anotheri', color: '#BFD3C1' },
  { key: 'nominees_afrodescendant', label: 'Afro-descendant', color: '#68A691' },
  { key: 'nominees_hispanic', label: 'Hispanic', color: '#EFC7C2' },
  { key: 'nominees_asian', label: 'Asian', color: '#694F5D' },
];
var map = d3.map({ '': 'nominees_caucasian', 'black': 'nominees_afrodescendant', 'hispanic': 'nominees_hispanic', 'asian': 'nominees_asian' });
const findCount = (ethnic_background, nominees) => {
  var nomineesFound = nominees.find(e => e.key == ethnic_background);
  return (nomineesFound == undefined ? 0 : nomineesFound.value);

}
d3.csv('./data/academy_awards_nominees.csv').then(data => {
  console.log(data);

  let new_data = data.map(datum => {
    datum['year'] = + datum.year;
    datum['ethnic_background'] = map.get(datum.ethnic_background);
    return datum;
  });
  console.log(new_data);
  new_data = d3.nest()
    .key(d => d.year)
    .key(d => d.ethnic_background)
    .rollup(v => v.length)
    .entries(new_data);

  console.log(new_data);
  const dataFormatted = [];
  new_data.forEach((d, i) => {
    let yearTotal = {
      year: + d['key'],
      nominees_total: d3.sum(d.values, d => d.value),
      nominees_caucasian: findCount('nominees_caucasian', d.values),
      nominees_afrodescendant: findCount('nominees_afrodescendant', d.values),
      nominees_hispanic: findCount('nominees_hispanic', d.values),
      nominees_asian: findCount('nominees_asian', d.values)
    }
    dataFormatted.push(yearTotal);
  });
  console.log(dataFormatted);
  createViz(dataFormatted);

});

// Create your visualization here
const createViz = (dataFormatted) => {

  let xExtent = d3.extent(dataFormatted, d => d.year)
  const xScale = d3.scaleLinear()
    .domain(d3.extent(dataFormatted, d => d.year))
    .range([margin.left, width - margin.right])

  const xAxis = d3.axisBottom(xScale).tickFormat(x => x.toFixed(0))
  const nominees_max = d3.max(dataFormatted, d => d.nominees_total);
  const yScale = d3.scaleLinear()
    .domain([0, nominees_max])
    .range([height - margin.bottom, margin.top])

  const yAxis = d3.axisLeft(yScale)


  let fillScale = d3.scaleOrdinal()
    .domain(groups.map(g => g.key))
    .range(d3.schemeTableau10);

  var stack = d3.stack()
    .keys(groups.map(g => g.key)) // Pass your array of keys here
    .order(d3.stackOrderAscending)
    .offset(d3.stackOffsetNone);

  let series = stack(dataFormatted);
  console.log(series)
  var stackArea = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveCatmullRom.alpha(0.5));

  let svg = d3.select('#viz')
    .append("svg")
    .attr('viewbox', [0, 0, width, height])
    .attr('width', width)
    .attr('height', height);

  console.log(series)
  const nomineesPaths = svg
    .append('g')
    .attr('class', 'stream-paths')
    .selectAll('path')
    .data(series)
    .join('path')
    .attr('d', stackArea)
    .attr('fill', d => fillScale(d.key));


  const legend = d3.select('.legend')
    .append('ul')
    .selectAll('li')
    .data(groups)
    .join('li');

  legend
    .append('span')
    .attr('class', 'legend-color')
    .style('background-color', d => fillScale(d.key));
  legend
    .append('span')
    .attr('class', 'legend-label')
    .text(d => d.label);
  svg.append("g")
    .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`)
    .call(xAxis)
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
  svg.append("text")
    .attr("x", margin.left-150)
    .attr("y", margin.top -80)
    .attr("fill", "currentColor")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .text("Number of nominees")
};