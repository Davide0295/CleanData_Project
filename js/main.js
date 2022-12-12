/* Toggle between showing and hiding the navigation menu links when the user clicks on the hamburger menu / bar icon */
function myFunction() {
  var x = document.getElementById("myLinks");
  if (x.style.display === "block") {
    x.style.display = "none";
  } else {
    x.style.display = "block";
  }
}

const parseDate = d3.utcParse("%Y");
const parseTime = d3.timeFormat("%Y");

/* Load the dataset and formatting variables
  Ref: https://www.d3indepth.com/requests/ */
d3.csv("data/cleaned_data_extended.csv", (d) => {
  return {
    Year: +d.Year,
    Country: d.Country,
    Plastic_waste_generated: +d.Plastic_waste_generated,
    Plastic_waste_treated: +d.Plastic_waste_treated,
    "Disposal - Total": +d["Disposal - Total"],
    "Disposal - Total": +d["Disposal - Total"],
    "Disposal - landfill and other": +d["Disposal - landfill and other"],
    "Disposal - incineration": +d["Disposal - incineration"],
    "Recovery - Total": +d["Recovery - Total"],
    "Recovery - energy recovery": +d["Recovery - energy recovery"],
    "Recovery - recycling": +d["Recovery - recycling"],
    "Recovery - backfilling": +d["Recovery - backfilling"],
    Date: parseTime(parseDate(+d.Year)),
  };
}).then((data) => {
  //Percentage plastic waste treated grouped by country only
  const Percentage_Plastic_waste_treated = d3
    .rollups(
      data,
      (v) => {
        return {
          values: {
            Total_gen: d3.sum(v, (x) => x.Plastic_waste_generated),
            Total_waste: d3.sum(v, (x) => x.Plastic_waste_treated),
          },
        };
      },
      (d) => d.Country
    )
    .map(([k, v]) => ({
      Country: k,
      Plastic_waste_generated: v.values.Total_gen,
      Plastic_waste_treated: v.values.Total_waste,
    }));

  //Sort data
  Percentage_Plastic_waste_treated.sort(function (b, a) {
    return a.Plastic_waste_generated - b.Plastic_waste_generated;
  });

  //Total plastic waste treated grouping by country and year
  const Plastic_waste_treatedVsgenerated = d3
    .rollups(
      data,
      (v) => {
        return {
          values: {
            Total_gen: d3.sum(v, (x) => x.Plastic_waste_generated),
            Total_waste: d3.sum(v, (x) => x.Plastic_waste_treated),
            Percentage_treated:
              (d3.sum(v, (x) => x.Plastic_waste_treated) /
                d3.sum(v, (x) => x.Plastic_waste_generated)) *
              100,
            Percentage_untreated:
              ((d3.sum(v, (x) => x.Plastic_waste_generated) -
                d3.sum(v, (x) => x.Plastic_waste_treated)) /
                d3.sum(v, (x) => x.Plastic_waste_generated)) *
              100,
          },
        };
      },
      (d) => d.Date
    )
    .map(([k, v]) => ({
      Year: k,
      Plastic_waste_generated: v.values.Total_gen,
      Plastic_waste_treated: v.values.Total_waste,
      Percentage_treated: v.values.Percentage_treated,
      Percentage_untreated: v.values.Percentage_untreated,
    }));

  //printing data and some values to test
  console.log(Percentage_Plastic_waste_treated);

  console.log(Plastic_waste_treatedVsgenerated);

  // Get the mean and median of plastic waste generated
  console.log(d3.mean(data, (d) => d.Plastic_waste_treated));
  console.log(d3.median(data, (d) => d.Plastic_waste_generated));

  createGroupedBarChart(Percentage_Plastic_waste_treated);

  createLineChart(Plastic_waste_treatedVsgenerated);
});

const createGroupedBarChart = (data) => {
  const width = 900,
    height = 500;
  const margin = { top: 30, right: 30, bottom: 80, left: 60 };

  console.log(data);

  /* Create the SVG container */
  //console.log(d3.select("#bar")) we select an element to manipulate
  const svg = d3
    .select("#bar")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  //Scale quantitative and nominal
  xScale = d3
    .scaleBand(
      data.map((d) => d.Country),
      [margin.left, width - margin.right]
    )
    .padding(0.2);

  yScale = d3.scaleLinear(
    [0, d3.max(data, (d) => d.Plastic_waste_generated)],
    [height - margin.bottom, margin.top]
  );

  /* Working with Color: https://observablehq.com/@d3/working-with-color 
    d3-scale-chromatic: https://github.com/d3/d3-scale-chromatic */
  const sub = data.map(
    ({ Plastic_waste_generated, Plastic_waste_treated }) => ({
      Plastic_waste_generated,
      Plastic_waste_treated,
    })
  );
  const subgroups = Object.keys(sub[0]);

  //console.log(subgroups);

  const color = d3.scaleOrdinal().domain(subgroups).range(d3.schemeTableau10);

  //Another scale for subgroup (categories) position
  const xSubgroup = d3
    .scaleBand()
    .domain(subgroups)
    .range([0, xScale.bandwidth()])
    .padding([0.05]);

  /* Create the bar elements and append to the SVG group
    https://d3-graph-gallery.com/graph/barplot_grouped_basicWide.html */
  const bar = svg
    .append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d) => `translate(${xScale(d.Country)}, 0)`)
    .selectAll("rect")
    .data(function (d) {
      return subgroups.map(function (key) {
        return { key: key, value: d[key] };
      });
    })
    .join("rect")
    .attr("x", (d) => xSubgroup(d.key))
    .attr("y", (d) => yScale(d.value))
    .attr("width", xSubgroup.bandwidth())
    .attr("height", (d) => yScale(0) - yScale(d.value))
    .attr("fill", (d) => color(d.key));

  /* Add the tooltip when hover on the bar */
  bar.append("title").text((d) => d.key + ": " + d.value);

  /* Create the x and y axes and append them to the chart
    Ref: https://www.d3indepth.com/axes/ and https://github.com/d3/d3-axis */
  const xAxis = d3.axisBottom(xScale);

  const xGroup = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  xGroup
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  const yAxis = d3.axisLeft(yScale);

  svg.append("g").attr("transform", `translate(${margin.left}, 0)`).call(yAxis);

  /*Legend
  Ref: https://observablehq.com/@itrew/legend
  */
  // Legend as a group
  const legend = svg
    .append("g")
    // Apply a translation to the entire group
    .attr("transform", `translate(650, ${margin.top})`);

  const size = 15;
  const border_padding = 12;
  const item_padding = 5;
  const text_offset = 2;

  // Border
  legend
    .append("rect")
    .attr("width", 220)
    .attr("height", 60)
    .style("fill", "none")
    .style("stroke-width", 1)
    .style("stroke", "black");

  // Boxes
  legend
    .selectAll("boxes")
    .data(subgroups)
    .enter()
    .append("rect")
    .attr("x", border_padding)
    .attr("y", (d, i) => border_padding + i * (size + item_padding))
    .attr("width", size)
    .attr("height", size)
    .style("fill", (d) => color(d));

  // Labels
  legend
    .selectAll("labels")
    .data(subgroups)
    .enter()
    .append("text")
    .attr("x", border_padding + size + item_padding)
    .attr(
      "y",
      (d, i) =>
        border_padding + i * (size + item_padding) + size / 2 + text_offset
    )
    // .style("fill", (d) => color(d))
    .text((d) => d)
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .style("font-family", "sans-serif");
};

const createLineChart = (data) => {
  /* Set the dimensions and margins of the graph */
  const width = 900,
    height = 400;
  const margins = { top: 20, right: 100, bottom: 80, left: 60 };

  /* Create the SVG container */
  const svg = d3
    .select("#line")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  console.log(data);

  /* Define x-axis, y-axis, and color scales */
  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([height - margins.bottom, margins.top]);

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.Year))
    .range([margins.left, width - margins.right]);

  /* Construct a line generator
    Ref: https://observablehq.com/@d3/line-chart and https://github.com/d3/d3-shape */
  const line = d3
    .line()
    .curve(d3.curveLinear)
    .x((d) => xScale(d.Year))
    .y((d) => yScale(d.Percentage_treated));

  console.log(data);

  const sub = data.map(
    ({ Plastic_waste_generated, Plastic_waste_treated }) => ({
      Plastic_waste_generated,
      Plastic_waste_treated,
    })
  );
  console.log(sub);

  const subgroups = Object.keys(sub[0]);

  const color = d3.scaleOrdinal().domain(subgroups).range(d3.schemeTableau10);

  //* Create line paths for each country */
  const path = svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line()
        .x(function (d) {
          return xScale(d.Year);
        })
        .y(function (d) {
          return yScale(d.Percentage_treated);
        })
    );

  /* [NEW] Add the tooltip when hover on the line */
  //path.append("title").text(([i, d]) => i);

  /* [NEW] Create the x and y axes and append them to the chart */
  const xAxis = d3.axisBottom(xScale);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margins.bottom})`)
    .call(xAxis);

  const yAxis = d3.axisLeft(yScale);

  svg.append("g").attr("transform", `translate(${margins.left},0)`).call(yAxis);
};
