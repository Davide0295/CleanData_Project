const parseDate = d3.utcParse("%Y");
const parseTime = d3.timeFormat("%Y");

/* Load the dataset and formatting variables
  Ref: https://www.d3indepth.com/requests/ */
d3.csv("./data/merged_data_population.csv", (d) => {
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
    "Population": +d.Population,
    "Plastic_waste_generated_per_person": +d.Plastic_waste_generated_per_person,
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

  //Filter for total plastic waste generated > 150.000, explanation in Analysis report assignement
  const Plastic_waste = Percentage_Plastic_waste_treated.filter(
    (d) => d.Plastic_waste_generated > 150000
  );

  //Sort data
  Plastic_waste.sort(function (b, a) {
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

  console.log(data);
  //printing data and some values to test
  console.log(Plastic_waste);

  console.log(Plastic_waste_treatedVsgenerated);

  //Manipulate data for management operations
  const newData = data.map((d) => ({
    Country: d.Country,
    "Disposal - landfill and other": d["Disposal - landfill and other"],
    "Disposal - incineration": d["Disposal - incineration"],
    "Recovery - energy recovery": d["Recovery - energy recovery"],
    "Recovery - recycling": d["Recovery - recycling"],
    "Recovery - backfilling": d["Recovery - backfilling"],
  }));

  const groupedData = newData.reduce((acc, curr) => {
    const { Country, ...values } = curr;
    if (!acc[Country]) {
      acc[Country] = { Country, ...values };
    } else {
      Object.keys(values).forEach((key) => {
        acc[Country][key] += values[key];
      });
    }
    return acc;
  }, {});

  const dataArray = Object.entries(groupedData).map(([_, values]) => ({
    Country: values.Country,
    ...values,
  }));

  const PercentageManagementOp = dataArray.map((d) => {
    const total = Object.values(d)
      .filter((v) => typeof v === "number")
      .reduce((acc, curr) => acc + curr, 0);
    return {
      Country: d.Country,
      ...Object.keys(d).reduce((acc, key) => {
        if (key !== "Country") {
          acc[key] = (d[key] / total) * 100;
        }
        return acc;
      }, {}),
    };
  });

  PercentageManagementOp.sort((a, b) => a.Country.localeCompare(b.Country));

  console.log(PercentageManagementOp);

  createGroupedBarChart(Plastic_waste);

  createLineChart(Plastic_waste_treatedVsgenerated);

  createDonutChart(PercentageManagementOp);
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

  /* Add the tooltip when hover on the bar */
  //bar.append("title").text((d) => d.key + ": " + d.value);
  const tooltip = d3
    .select("#bar")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px");

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    tooltip
      .style("background-color", "black")
      .style("color", "white")
      .style("opacity", "80%");
    d3.select(this).style("stroke", "black").style("opacity", 1);
  };
  const mousemove = function (event, d) {
    if (event && d.value) {
      const x = event.pageX + 10;
      const y = event.pageY + 10;
      tooltip
        .html(d.key + ": " + d.value)
        .style("left", x + "px")
        .style("top", y + "px");
    }
  };
  const mouseleave = function (event, d) {
    tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none");
  };


  const buttonContainer = d3.select("#container").append("div");

  // Sort the data by Plastic_waste_generated and update the chart
  function compareByGenerated(a, b) {
    if (a.Plastic_waste_generated > b.Plastic_waste_generated) {
      return -1;
    }
    if (a.Plastic_waste_generated < b.Plastic_waste_generated) {
      return 1;
    }
    return 0;
  }

  const generateButton = buttonContainer
    .append("button")
    .text("Sort by Plastic Waste Generated")
    .on("click", function () {
      data.sort(compareByGenerated);
      // Remove the old chart and buttons
      d3.select("#container").selectAll("*").remove();
      d3.select("#bar").selectAll("*").remove();
      createGroupedBarChart(data);
    });

  function compareByTreated(a, b) {
    if (a.Plastic_waste_treated > b.Plastic_waste_treated) {
      return -1;
    }
    if (a.Plastic_waste_treated < b.Plastic_waste_treated) {
      return 1;
    }
    return 0;
  }

  const treatedButton = buttonContainer
    .append("button")
    .text("Sort by Plastic Waste Treated")
    .on("click", function () {
      data.sort(compareByTreated);
      // Remove the old chart and buttons
      d3.select("#container").selectAll("*").remove();
      d3.select("#bar").selectAll("*").remove();
      createGroupedBarChart(data);
    });

  function compareAlphabetically(a, b) {
    if (a.Country < b.Country) {
      return -1;
    }
    if (a.Country > b.Country) {
      return 1;
    }
    return 0;
  }

  const alphabeticalButton = buttonContainer
    .append("button")
    .text("Sort Alphabetically")
    .on("click", function () {
      data.sort(compareAlphabetically);
      // Remove the old chart and buttons
      d3.select("#container").selectAll("*").remove();
      d3.select("#bar").selectAll("*").remove();
      createGroupedBarChart(data);
    });

  /* Working with Color: https://observablehq.com/@d3/working-with-color 
    d3-scale-chromatic: https://github.com/d3/d3-scale-chromatic */
  const sub = data.map(
    ({Plastic_waste_generated, Plastic_waste_treated }) => ({
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
    .attr("class", "bars")
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
    .attr("fill", (d) => color(d.key))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  /* Create the x and y axes and append them to the chart
    Ref: https://www.d3indepth.com/axes/ and https://github.com/d3/d3-axis */
  const xAxis = d3.axisBottom(xScale);

  const xGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  xGroup
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)");

  svg
    .selectAll(".x-axis text")
    .on("mouseover", function () {
      d3.select(this).style("cursor", "pointer");
    })
    .on("mouseout", function () {
      d3.select(this).style("cursor", "default");
    })
    .on("click", function () {
      console.log(d3.select(this).text());
    });

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
    .domain([0, d3.max(data, d => d.Plastic_waste_generated)])
    .range([height - margins.bottom, margins.top]);

  const yScale2 = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.Plastic_waste_treated)])
    .range([height - margins.bottom, margins.top]);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => parseDate(+d.Year)))
    .range([margins.left, width - margins.right]);

    const tooltip = d3
    .select("#line")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    tooltip
    .style("background-color", "black")
    .style("color","white")
    .style("opacity", "70%")
  d3.select(this)
    .style("stroke", "#1F77B4FF")
    .style("opacity", 1)
    .style('stroke-width', '4px')
  };
  const mousemove = function (event, d) {
    tooltip
    .html("Plastic waste generated")
    .style("top", (event.pageY)+"px")
    .style("left",(event.pageX)+"px");   
  };
  const mouseleave = function (event, d) {
    tooltip.style("opacity", 0)
    d3.select(this)
      .style("stroke", "#1F77B4FF")
      .style('stroke-width', '2px')
  };

  const mouseover2 = function (event, d) {
    tooltip
    .style("background-color", "black")
    .style("color","white")
    .style("opacity", "70%")
  d3.select(this)
    .style("stroke", "#FF7F0EFF")
    .style("opacity", 1)
    .style('stroke-width', '4px')
  };
  const mousemove2 = function (event, d) {
    tooltip
    .html("Plastic waste treated")
    .style("top", (event.pageY)+"px")
    .style("left",(event.pageX)+"px");   
  };
  const mouseleave2 = function (event, d) {
    tooltip.style("opacity", 0)
    d3.select(this)
      .style("stroke", "#FF7F0EFF")
      .style('stroke-width', '2px')
  }

  //* Create line paths for each country */
  const path = svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("id","line1")
    .attr("stroke", "#1F77B4FF")
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line()
        .x(function (d) {
          return xScale(parseDate(+d.Year));
        })
        .y(function (d) {
          return yScale(d.Plastic_waste_generated);
        })
    )
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

    const path2 = svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("id","line2")
      .attr("stroke", "#FF7F0EFF")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return xScale(parseDate(+d.Year));
          })
          .y(function (d) {
            return yScale(d.Plastic_waste_treated);
          })
      )
      .on("mouseover", mouseover2)
      .on("mousemove", mousemove2)
      .on("mouseleave", mouseleave2);
  
  const plasticWasteGenerated = data.map((d) => d.Plastic_waste_generated);
  const plasticWasteTreated = data.map((d) => d.Plastic_waste_treated);

  const circles = svg
    .selectAll("circle")
    .data(plasticWasteGenerated) 
    .enter()
    .append("circle")
    .attr("cx", (d, i) => xScale(parseDate(+data[i].Year))) 
    .attr("cy", (d) => yScale(d)) 
    .attr("r", 5)
    .style("fill", "#1F77B4FF")
    .style("opacity", 0.7);

    /*
  const text = svg
    .selectAll("text")
    .data(plasticWasteGenerated) 
    .enter()
    .append("text")
    .attr("x", (d, i) => xScale(parseDate(+data[i].Year)) + 5) 
    .attr("y", (d) => yScale(d) + 15) 
    .text((d) => d) 
    .style("font-size", "12px")
    .style("fill", "black")
    .style("opacity", 0.7);
    */

  const circles2 = svg
  .selectAll("circle2")
  .data(plasticWasteTreated) 
  .enter()
  .append("circle")
  .attr("cx", (d, i) => xScale(parseDate(+data[i].Year))) 
  .attr("cy", (d) => yScale(d)) 
  .attr("r", 5)
  .style("fill", "#FF7F0EFF")
  .style("opacity", 0.7);

  /*
const text2 = svg
  .selectAll("text2")
  .data(plasticWasteTreated) 
  .enter()
  .append("text")
  .attr("x", (d, i) => xScale(parseDate(+data[i].Year)) + 5) 
  .attr("y", (d) => yScale(d) + 15) 
  .text((d) => d) 
  .style("font-size", "12px")
  .style("fill", "black")
  .style("opacity", 0.7);
  */

     const tooltip3 = d3
       .select("#line")
       .append("div")
       .style("opacity", 0)
       .attr("class", "tooltip")
       .style("border", "solid")
       .style("border-width", "2px")
       .style("border-radius", "5px")
       .style("padding", "5px");

     // Function that shows the tooltip when hovering on the line
     const mouseover3 = function (event, d) {
       tooltip
         .html(
           `Difference: ${d.Plastic_waste_generated - d.Plastic_waste_treated}`
         )
         .style("opacity", "70%")
         .style("top", event.pageY + "px")
         .style("left", event.pageX + "px");
     };

     // Function that updates the position of the tooltip when moving the cursor
     const mousemove3 = function (event, d) {
       tooltip
         .style("top", event.pageY + "px")
         .style("left", event.pageX + "px");
     };

     // Function that hides the tooltip when moving the cursor away from the line
     const mouseleave3 = function (event, d) {
       tooltip.style("opacity", 0);
     };

  svg
    .selectAll("line")
    .data(data)
    .enter()
    .append("line")
    .attr("x1", (d) => xScale(parseDate(+d.Year)))
    .attr("y1", (d) => yScale(d.Plastic_waste_generated))
    .attr("x2", (d) => xScale(parseDate(+d.Year)))
    .attr("y2", (d) => yScale(d.Plastic_waste_treated))
    .attr("stroke", "red")
    .attr("stroke-width", 3)
    .on("mouseover", mouseover3)
    .on("mousemove", mousemove3)
    .on("mouseleave", mouseleave3);
  


  const xAxis = d3.axisBottom(xScale);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margins.bottom})`)
    .call(xAxis);

  const yAxis = d3.axisLeft(yScale);

  svg.append("g").attr("transform", `translate(${margins.left},0)`).call(yAxis);

      const legend = svg
        .append("g")
        .attr(
          "transform",
          "translate(" +
            (width - margins.right - 120) +
            "," +
            (height - margins.bottom - 70) +
            ")"
        );

        legend
          .append("rect")
          .attr("width", 150)
          .attr("height", 60)
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .attr("x", -5)
          .attr("y", -5);

     legend
       .append("rect")
       .attr("width", 18)
       .attr("height", 18)
       .attr("fill", "#1F77B4FF")
       .attr("x", 0)
       .attr("y", 0);

     legend
       .append("text")
       .attr("x", 20)
       .attr("y", 12)
       .text("Plastic waste generated")
       .style("font-size", "12px");

     legend
       .append("rect")
       .attr("width", 18)
       .attr("height", 18)
       .attr("fill", "#FF7F0EFF")
       .attr("x", 0)
       .attr("y", 25);
       
     legend
       .append("text")
       .attr("x", 20)
       .attr("y", 37)
       .text("Plastic waste treated")
       .style("font-size", "12px")
       .style("fill", "black")
       .style("stroke", "none");


};


const createDonutChart = (data) => {
  // Set up the donut chart using D3.js
  const width = 800,
    height = 400;

  // Set the initial radius value
  let radius = Math.min(width, height) / 2 - 20;

  const color = d3.scaleOrdinal().range(d3.schemeTableau10);

  const pie = d3
    .pie()
    .sort(null)
    .value(function (d) {
      return d.value;
    });

  const arc = d3
    .arc()
    .outerRadius(radius - 10)
    .innerRadius(radius - 70);

  const tooltip = d3
        .select("#donut")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltipDonut")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px");

  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    tooltip
      .style("background-color", "black")
      .style("color", "white")
      .style("opacity", "70%");
    d3.select(this)
      .style("stroke", "black")
      .style("opascity", 1)
      .style("stroke-width", "1px");
  };
  const mousemove = function (event, d) {
    if (event && d.value) {
      const x = event.pageX + 10;
      const y = event.pageY + 10;
      tooltip
        .html(d.data.key + ": " + d3.format(".2f")(d.data.value) + "%")
        .style("left", x + "px")
        .style("top", y + "px");
    }
  };
  const mouseleave = function (event, d) {
    tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none").style("stroke-width", "0px");
  };

  const svg = d3
    .select("#donut")
    .append("svg")
    .attr("class", "donut")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(200," + height / 2 + ")");

  // Add a text element to display the name of the selected country
  const countryNameText = svg
    .append("text")
    .attr("class", "countryName")
    .attr("text-anchor", "middle")
    .attr("dy", "0em")
    .attr("font-size", "25px")
    .text("");

  // Update the donut chart with the data for the selected country
  function updateDonut(country) {
    // Find the data for the selected country
    const dataForCountry = data.find(function (d) {
      return d.Country == country;
    });

    const legendRectSize = 18;
    const legendSpacing = 4;
    const legendX = 250;
    const legendY = -180;

    const legendData = Object.entries(dataForCountry)
      .filter((entry) => entry[0] !== "Country")
      .map((entry) => ({
        key: entry[0],
        value: parseFloat(entry[1]) || 0,
      }));

    const legend = svg
      .selectAll(".legend")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) {
        return (
          "translate(" +
          legendX +
          "," +
          (legendY + i * (legendRectSize + legendSpacing)) +
          ")"
        );
      });

    legend
      .append("rect")
      .attr("width", legendRectSize)
      .attr("height", legendRectSize)
      .style("fill", function (d) {
        return color(d.key);
      })
      .style("stroke", function (d) {
        return color(d.key);
      });

    legend
      .append("text")
      .attr("x", legendRectSize + legendSpacing)
      .attr("y", legendRectSize - legendSpacing)
      .text(function (d) {
        return d.key;
      });
    console.log(Object.entries(dataForCountry));

    // Bind the data to the pie layout and generate the path elements
    const g = svg.selectAll(".arc").data(
      pie(
        Object.entries(dataForCountry)
          .filter((entry) => entry[0] !== "Country")
          .map((entry) => ({
            key: entry[0],
            value: parseFloat(entry[1]) || 0,
          }))
      )
    );
    const gEnter = g.enter().append("g").attr("class", "arc");

    gEnter
      .append("path")
      .attr("class", "arcs")
      .style("fill", function (d) {
        return color(d.data.key);
      })
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave);

    /*
    gEnter
      .append("text")
      .attr("class", "text")
      .style("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(function (d) {
        return d3.format(".2f")(d.data.value) + "%";
      });
      */

    // Merge the entering and existing elements, and apply the data and style to the merged selection
    g.merge(gEnter)
      .select("path")
      .attr("d", arc)
      .style("fill", function (d) {
        return color(d.data.key);
      });
    g.merge(gEnter)
      .select("text")
      .attr("transform", function (d) {
        // Position the text along the arc
        const c = arc.centroid(d),
          x = c[0],
          y = c[1],
          // Calculate the angle of the arc
          h = Math.sqrt(x * x + y * y);
        return "translate(" + (x / h) * radius + "," + (y / h) * radius + ")";
      })
      .text(function (d) {
        return d3.format(".2f")(d.data.value) + "%";
      });


    // Append a text element to the g element and set its text to the name of the country
    countryNameText.text(country);

    console.log(dataForCountry);

    // Update the text element with the name of the selected country
    countryNameText.text(country);

    // Remove any excess elements that are not bound to data
    g.exit().remove();
  }

  // Set up the dropdown menu
  const select = d3.select("#country-select").on("change", function () {
    updateDonut(this.value);
  });

  // Populate the select element with the names of the countries in the data
  select
    .selectAll("option")
    .data(data)
    .enter()
    .append("option")
    .text(function (d) {
      return d.Country;
    });

  // Initialize the donut chart with the data for the first country in the list
  updateDonut(data[0].Country);
  
};
