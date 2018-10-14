const domReady = require('domready');
import {stack} from 'd3-shape';
import {scaleLinear, scaleOrdinal, scaleBand} from 'd3-scale';
import {range} from 'd3-array';
import {axisLeft, axisBottom} from 'd3-axis';
import {select, selectAll, event} from 'd3-selection';
import {drag} from 'd3-drag';
import {annotation, annotationCallout, annotationCalloutElbow} from 'd3-svg-annotation';
import tip from 'd3-tip';

domReady(() => {
  fetch('./data/example.json')
    .then(response => response.json())
    .then(data => myVis(data));
});

const width = 5000 / 5;
const height = 36 / 24 * width / 5;
const margin = {top: 10, bottom: 10, left: 10, right: 10};
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.left - margin.top;

function myVis(data) {
  buildChartOne();
  buildChartTwo();
  buildChartThree();
  buildChartFour();
}

// ******* CHART ONE : SLIDER *******
function buildChartOne() {
  const chart1Container = select('.vis1').append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'first-vis')
    .style('font-family', 'Consolas, monaco, monospace');

  const sliderOne = chart1Container.append('g')
    .attr('class', 'slider')
    .attr('transform', 'translate('.concat(width / 4, ',', margin.top, ')'));
  const ratioChart = chart1Container.append('g')
    .attr('class', 'ratioChart')
    .attr('transform', 'translate('.concat(width / 4, ',', margin.top * 3.5, ')'))
    .style('opacity', 0);
  const colorScale = scaleLinear().domain([0, 50, 100]).range(['SteelBlue', 'Silver', 'Pink']);
  const sliderScale = scaleLinear().domain([0, 100]).range([0, plotWidth / 2]).clamp(true);

  const handle = sliderOne.insert('circle', '.track-overlay')
    .attr('class', 'handle')
    .attr('r', 7)
    .style('fill', '#fff')
    .style('stroke-width', '1.25px')
    .style('stroke', '#000')
    .style('stroke-opacity', 0.5);

  // SLIDER ---
  sliderOne.append('line')
    .attr('class', 'track')
    .attr('x1', sliderScale(0))
    .attr('x2', sliderScale(100))
    .attr('class', 'track-inset')
    .attr('class', 'track-overlay');

  let longitude = 0;
  select('.vis1').insert('h2', ':first-child')
    .style('font-family', 'Consolas, monaco, monospace')
    .style('text-align', 'center');

  let allowGuess = true;
  sliderOne.append('line')
    .attr('class', 'track')
    .attr('x1', 0)
    .attr('x2', plotWidth / 2)
    .style('stroke', '#000')
    .style('stroke-opacity', 0.3)
    .style('stroke-width', '10px')
  .select((a, b, c) => select(c[0]).node().parentNode.appendChild(select(c[0]).node().cloneNode(true)))
    .attr('class', 'track-inset')
    .style('stroke', '#ddd')
    .style('stroke-width', '8px')
  .select((a, b, c) => select(c[0]).node().parentNode.appendChild(select(c[0]).node().cloneNode(true)))
    .attr('class', 'track-overlay')
    .style('pointer-events', 'stroke')
    .style('stroke-width', '50px')
    .style('cursor', 'crosshair')
  .call(drag()
    .on('start drag', X => allowGuess ? guess(sliderScale.invert(event.x)) : null)
    .on('end', X => allowGuess ? reveal(sliderScale.invert(event.x)) : null));

  sliderOne.insert('g', '.track-overlay')
    .attr('class', 'ticks')
    .attr('transform', 'translate(0, 20)')
    .style('stroke-linecap', 'round')
    .style('font-size', '10px')
    .selectAll('text')
      .data(sliderScale.ticks(10)).enter().append('text')
        .attr('x', sliderScale)
        .attr('text-anchor', 'middle')
        .text(d => d.toString().concat('%'));

  // women in a technical role
  ratioChart.append('rect')
    .attr('x', 0)
    .attr('y', margin.top)
    .attr('height', 50)
    .attr('width', sliderScale(24))
    .style('fill', 'pink');

  ratioChart.append('text')
    .attr('class', 'ratio-label')
    .attr('x', sliderScale(24) - 65)
    .attr('y', margin.top + 35)
    .style('text-anchor', 'left')
    .style('font-size', 36)
    .style('fill', 'white')
    .text('24%');

  // men in a technical role
  ratioChart.append('rect')
    .attr('x', sliderScale(24))
    .attr('y', margin.top)
    .attr('height', 50)
    .attr('width', sliderScale(76))
    .style('fill', 'steelblue');

  ratioChart.append('text')
    .attr('class', 'ratio-label')
    .attr('x', sliderScale(24) + sliderScale(76) - 65)
    .attr('y', margin.top + 35)
    .style('text-anchor', 'right')
    .style('font-size', 36)
    .style('fill', 'white')
    .text('76%');

  // legend
  ratioChart.append('rect')
    .attr('x', 0)
    .attr('y', margin.top - 30)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', 'pink')
    .attr('class', 'legend');
  ratioChart.append('text')
    .attr('x', 30)
    .attr('y', margin.top - 10)
    .text('Women')
    .style('fill', 'black');

  ratioChart.append('rect')
    .attr('x', 20 + 70)
    .attr('y', margin.top - 30)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', 'steelblue')
    .attr('class', 'legend');
  ratioChart.append('text')
    .attr('x', 20 + 70 + 30)
    .attr('y', margin.top - 10)
    .text('Men')
    .style('fill', 'black');

  // FUNCTIONS
  function buildAnnotations(g) {
    const annotateGuess = annotation()
      .annotations([{
        note: {label: 'Your guess: '.concat(Math.round(longitude).toString(), '%')},
        x: g, y: margin.top + 35,
        dy: 50, dx: 50,
        type: annotationCallout,
        color: 'black'
      },
      {
        note: {label: 'Actual % of women in technical roles', align: 'middle'},
        x: sliderScale(24), y: margin.top + 35,
        dy: 50, dx: -50,
        type: annotationCalloutElbow,
        color: 'black'
      }]);
    ratioChart.call(annotateGuess);
    ratioChart.append('line')
      .attr('x1', g)
      .attr('x2', g)
      .attr('y1', margin.top)
      .attr('y2', margin.top + 50)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.2);
    ratioChart.append('line')
      .attr('x1', sliderScale(24))
      .attr('x2', sliderScale(24))
      .attr('y1', margin.top)
      .attr('y2', margin.top + 50)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.2);
  }

  function guess(g) {
    handle.attr('cx', sliderScale(g));
    longitude = g;
    select('h2').style('color', colorScale(g));
    select('h2').text((Math.round(g).toString()).concat('% of all technical roles are held by women'));
  }

  function reveal(g) {
    allowGuess = false;
    buildAnnotations(sliderScale(g));
    sliderOne.style('opacity', 0);
    select('h2').text('Reality: 24% of technical roles are held by women.');
    select('.ratioChart').style('opacity', 1);
  }
}

// ******* CHART TWO : PIPELINE *******
function buildChartTwo() {
  const chart2Width = 500;
  const chart2Height = 500;
  const chart2 = select('.vis2').append('svg').attr('class', 'vis-container2')
    .attr('width', chart2Width)
    .attr('height', chart2Height)
    .attr('transform', 'translate('.concat((100 + margin.left), ', ', margin.top, ')'));

  const isotype = chart2.append('g')
    .attr('class', 'isotype')
    .attr('width', chart2Width)
    .attr('height', chart2Height);

  const buttonData = [
    {
      level: 'Entry',
      percentage: 36
    }, {
      level: 'Manager',
      percentage: 30
    }, {
      level: 'SR Manager',
      percentage: 27
    }, {
      level: 'VP',
      percentage: 25
    }, {
      level: 'SVP',
      percentage: 20
    }, {
      level: 'C-Suite',
      percentage: 17
    }];
  let selected = buttonData[0];
  const pinkRange = ['#f1eef6', 'rgb(212, 165, 200)', 'rgb(201, 128, 199)', '#df65b0', '#dd1c77', '#980043'];
  const pinkScale = scaleOrdinal().domain(range(6).reverse()).range(pinkRange);

  selectAll('.button').attr('fill', (d, i) => pinkScale(i)).attr('stroke',
    (d, i) => i === 0 ? pinkScale(i) : 'black');

  const render = (index) => {
    selected = buttonData[index];
    selectAll('.icon')
    .style('fill', (d, i) => i < selected.percentage ? pinkScale(index) : 'steelblue');
    selectAll('.button')
      .attr('fill', (d, i) => pinkScale(i))
      .attr('stroke', (d, i) => i === index ? 'black' : pinkScale(i));
    select('.textValue').text(selected.level.concat('- ', selected.percentage, '%'));
  };

  const buttonContainer = select('.vis2').append('p').append('svg').attr('class', 'buttons')
    .attr('width', 700)
    .attr('height', 80).append('g')
      .attr('transform', 'translate('.concat((20 + margin.left), ', ', margin.top, ')'));

  const buttonGroups = buttonContainer.selectAll('button')
    .data(buttonData)
    .enter()
    .append('g').attr('class', 'buttonGroup');
  buttonGroups.append('rect')
    .attr('class', 'button')
    .attr('width', 100)
    .attr('height', 50)
    .attr('fill', (d, i) => pinkScale(i))
    .attr('stroke-width', 5)
    .attr('x', (d, i) => i * 110 + 3)
    .attr('y', 10)
    .attr('rx', 15)
    .attr('ry', 15)
    .on('click', (d, i) => render(i));
  buttonGroups.append('text')
    .attr('x', (d, i) => (i * 110) + 10)
    .attr('y', 30).text(d => d.level)
    .attr('font-size', '14px')
    .attr('font-family', 'Consolas, monaco, monospace')
    .on('click', (d, i) => render(i));

  render(0);

  isotype.append('rect')
    .attr('width', chart2Width)
    .attr('height', chart2Height)
    .attr('fill', '#00000f');

  const numCols = 10;
  const numRows = 10;

  const xPadding = 10;
  const yPadding = 15;

  const hBuffer = 45;
  const wBuffer = 45;

  const myIndex = range(numCols * numRows);

  isotype.append('text')
    .attr('class', 'textValue')
    .attr('x', xPadding)
    .attr('y', yPadding + 10)
    .attr('font-size', '26px')
    .attr('font-family', 'Consolas, monaco, monospace')
    .style('fill', '#ffffff')
    .text(selected.level.concat('- ', selected.percentage, '%'));

  isotype.append('g')
    .attr('class', 'pictolayer')
    .selectAll('icon')
    .data(myIndex)
    .enter()
    .append('text')
      .attr('class', 'icon')
      .attr('font-family', 'FontAwesome')
      .attr('font-size', '45px')
      .style('fill', (d, i) => i < selected.percentage ? pinkScale(0) : '#5DADE2')
      .text('\uf007')
      .attr('x', d => {
        const remainder = d % numCols;
        return xPadding + (remainder * wBuffer) + 20;
      })
      .attr('y', d => {
        const whole = Math.floor(d / numCols);
        return yPadding + (whole * hBuffer) + 50;
      });
}

  // ******* CHART THREE : STACKED BAR CHART *******
function buildChartThree() {

  const dataKeys = ['major', 'minor'];
  const genders = ['men', 'women'];
  const problemData = [
        {gender: 'men', major: '29', minor: '37'},
        {gender: 'women', major: '44', minor: '36'}];

  const checkboxes = select('.vis3').append('svg').attr('class', 'checkboxes')
        .attr('width', 500 / 2).attr('height', 500).append('g')
        .attr('transform', 'translate(0, 20)');

  checkboxes.append('text')
        .attr('y', 10).text('The lack of women in the tech');
  checkboxes.append('text')
        .attr('y', 40).text('industry is a ____ problem');

  checkboxes.selectAll('foreignObject')
          .data(dataKeys).enter()
          .append('foreignObject')
            .attr('transform', (d, i) => 'translate(10, '.concat((60 + i * 60), ')'))
            .attr('width', 100)
            .attr('height', 100)
            .append('xhtml:body')
            .html(d => '<form><input type=checkbox id='.concat(d, ' /></form>'))
            .on('click', (d, i) => {
              if (select('#'.concat(d)).node().checked) {
                selectAll('.barGroups'.concat(d)).selectAll('.bar')
                  .attr('stroke', '#000000')
                  .attr('stroke-width', 1);
              } else {
                selectAll('.barGroups'.concat(d)).selectAll('.bar').attr('stroke', 'none');
              }
            }).append('text')
                .text(d => d)
                .attr('font-family', 'Consolas, monaco, monospace')
                .attr('font-size', '18px');

  const chart3 = select('.vis3').append('svg').attr('class', 'vis-container3')
        .attr('width', 500)
        .attr('height', 500);
  const g = chart3.append('g').attr('transform', 'translate('.concat(margin.left, ', 0)'));

  const tooltip = tip()
        .offset([-10, 0])
        .html((d, i) => {
          const str = (Number(problemData[i].major) + Number(problemData[i].minor));
          return '<strong>Net:</strong> <span style=\'color:#dd1c77\'>'.concat(str, '%</span>');
        });

  const xScale = scaleBand()
        .domain(['men', 'women'])
        .rangeRound([0, 500 - margin.left - margin.right])
        .paddingInner(0.05)
        .align(0.1);

  const yScale = scaleLinear().domain([0, 100])
        .rangeRound([500 - margin.top - margin.bottom, 0]);

  const zScale = scaleOrdinal().domain(range(2))
      .range(['#c994c7', '#e7e1ef']);

  const barGroups = g.append('g')
        .selectAll('g')
        .data(stack().keys(dataKeys)(problemData))
        .enter().append('g')
          .attr('class', (d, i) => 'barGroups'.concat(dataKeys[i]))
          .attr('fill', (d, i) => {
            return zScale(i);
          });

  barGroups.selectAll('rect')
        .data(d => {
          return d;
        })
        .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', d => xScale(d.data.gender))
          .attr('y', d => yScale(d[1]))
          .attr('height', d => yScale(d[0]) - yScale(d[1]))
          .attr('width', xScale.bandwidth());

  let textIndex = 0;
  const labels = ['29%', '44%', '37%', '36%'];
  barGroups.selectAll('text')
        .data((d, i) => d).enter().append('text')
          .attr('x', d => xScale(d.data.gender) + xScale.bandwidth() / 2 - margin.left * 2)
          .attr('y', d => yScale(d[1]) + 60)
          .style('fill', '#000000')
          .attr('font-family', 'Consolas, monaco, monospace')
          .attr('font-size', '18px')
          .text((d, i) => {
            textIndex = textIndex + 1;
            return labels[textIndex - 1];
          });

  barGroups.call(tooltip);
  barGroups.selectAll('container')
        .data(genders)
        .enter()
        .append('rect')
        .attr('class', 'container')
        .attr('x', (d, i) => xScale(d))
        .attr('y', (d, i) => yScale(66 + i * 14))
        .attr('height', (d, i) => yScale(100 - (66 + i * 14)))
        .attr('width', xScale.bandwidth())
        .attr('fill', 'transparent')
        .on('mouseover', tooltip.show)
        .on('mouseout', tooltip.hide);
  const axis = g.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(0,'.concat((500 - margin.bottom - margin.top), ')'))
          .call(axisBottom(xScale));
  axis.selectAll('.tick').selectAll('text')
          .attr('font-size', '14px')
          .attr('font-family', 'Consolas, monaco, monospace');
  g.append('g')
              .attr('class', 'axis')
              .call(axisLeft(yScale).ticks(null, 's'));
  makeChart3Legend(g, dataKeys, zScale);

}

function makeChart3Legend(g, dataKeys, zScale) {
  const legend = g.selectAll('.legend')
        .data(dataKeys)
        .enter().append('g')
          .attr('class', 'legend')
          .attr('transform', (d, i) => 'translate(0,'.concat(i * 20, ')'))
          .attr('font-family', 'Consolas, monaco, monospace')
          .attr('font-size', '16px');

  legend.append('rect')
          .attr('x', 10)
          .attr('width', 18)
          .attr('height', 18)
          .attr('fill', zScale);

  legend.append('text')
          .attr('x', 35)
          .attr('y', 9)
          .attr('dy', '.35em')
          .attr('text-anchor', 'start')
          .text(d => d);
}
  // ******* CHART FOUR : CAUSES *******
function buildChartFour() {
  const chart4a = select('.vis4').append('svg').attr('class', 'vis-container4')
  .attr('width', width)
  .attr('height', height);

  const chart4 = chart4a.append('g')
    .attr('transform', 'translate(0,'.concat(plotHeight, ')'));

  const dataTotal = [
    {cause: 'Poor recruitment', women: '1', men: '8'},
    {cause: 'Lack of minorities', women: '23', men: '49'},
    {cause: 'Unconscious bias', women: '29', men: '12'},
    {cause: 'Few role models', women: '23', men: '4'}];

  const checkboxIds = ['#recruit', '#minority', '#bias', '#rolemodel'];

  selectAll('.option').on('click', drawSelection);

  const xScale1 = scaleBand()
    .rangeRound([0, plotWidth])
    .paddingInner(0.05)
    .align(0.1);
  const yScale1 = scaleLinear().domain([0, 100]).rangeRound([plotHeight, 0]);
  const xAxis = axisBottom().scale(xScale1);
  const yAxis = axisLeft().scale(yScale1).tickFormat(d => String(d).concat('%'));

  const tooltipW = tip()
        .offset([-5, 0])
        .html((d, i) => {
          return '<strong><span style=\'color:pink\'>'.concat(d.women, '%</span>');
        });
  const tooltipM = tip()
        .offset([-5, 0])
        .html((d, i) => {
          return '<strong><span style=\'color:steelblue\'>'.concat(d.men, '%</span>');
        });

  function drawSelection() {
    const choices = [];
    checkboxIds.forEach((d, i) => {
      const checkbox = select(d);
      if (checkbox.property('checked')) {
        choices.push(checkbox.property('value'));
      }
    });
    const newData = dataTotal.filter(d => choices.includes(d.cause));
    xScale1.domain(newData.map(d => d.cause));
    chart4.selectAll('.bar').remove();
    chart4.select('.yAxis').remove();
    chart4.select('.xAxis').remove();

    chart4.append('g')
      .attr('class', 'xAxis')
      .attr('transform', 'translate(0.5'.concat(plotHeight, ')'))
      .call(xAxis)
      .style('font-family', 'Consolas, monaco, monospace')
      .style('font-size', 14)
      .style('fontWeight', 'bold');
    chart4.append('g')
      .attr('transform', 'translate(30,'.concat(-plotHeight, ')'))
      .call(yAxis)
      .style('font-family', 'Consolas, monaco, monospace');

    chart4.call(tooltipW);
    chart4.call(tooltipM);
    const bars = chart4.selectAll('rect').data(newData);
    bars.exit().remove();
    bars.enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale1(d.cause) + xScale1.bandwidth() / 2)
      .attr('y', d => -1 * (plotHeight - yScale1(d.women)))
      .attr('height', d => plotHeight - yScale1(d.women))
      .attr('width', 40)
      .style('fill', 'pink')
      .on('mouseout', tooltipW.hide)
      .on('mouseover', tooltipW.show);

    bars.enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale1(d.cause) + xScale1.bandwidth() / 2 + 50)
      .attr('y', d => {
        return -1 * (plotHeight - yScale1(d.men));
      })
      .attr('height', d => plotHeight - yScale1(d.men))
      .attr('width', 40)
      .style('fill', 'steelblue')
      .on('mouseout', tooltipM.hide)
      .on('mouseover', tooltipM.show);
  }
}
