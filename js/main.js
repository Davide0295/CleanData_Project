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
  };
}).then((data) => {
  //Total plastic waste treated grouping by country
  const Total_Plastic_waste_treated = d3
    .rollups(
      data,
      (xs) => d3.sum(xs, (x) => x.Plastic_waste_treated),
      (d) => d.Country
    )
    .map(([k, v]) => ({ Country: k, Plastic_waste_treated: v }));

  //printing data and some values to test
  console.log(data);

  console.log(Total_Plastic_waste_treated);

  console.log(d3.max(data, (d) => d["Disposal - Total"]));

  console.log(d3.max(data, (d) => d["Recovery - backfilling"]));

  // Get the mean and median of plastic waste generated
  console.log(d3.mean(data, (d) => d.Plastic_waste_treated));
  console.log(d3.median(data, (d) => d.Plastic_waste_generated));

  //Mean of total plastic waste treated
  console.log(d3.mean(Total_Plastic_waste_treated, (d) => d.Plastic_waste_treated));
});
