# CleanData_Project
Repository for the Visual Analytics project at CentraleSupelec


![alt text](https://github.com/Davide0295/CleanData_Project/blob/main/CleanDataLogo.png?raw=true)

### Aim
The aim of this analysis would be to provide a comparative study of the different plastic
disposal methodologies adopted in different countries of the EU across the years, to find how the
trend changed and how these relate to the global plastic generated in each country.

After considering different research questions, we finally decided to focus on answering the following: How is plastic treated in different countries of the EU, how is the trend evolving over the last years and what is the relationship between plastic waste treatment and plastic waste generation?

The data used for this project has been collected from Eurostat:
* [ Eurostat - Plastic management operations in EU countries, over the years](https://ec.europa.eu/eurostat/databrowser/view/ENV_WASTRT__custom_3487128/default/table?lang=en)
* [ Eurostat - Plastic waste generation in EU countries, over the years](https://ec.europa.eu/eurostat/databrowser/view/ENV_WASGEN/default/table?lang=en&category=env.env_was.env_wasgt)

This has been cleaned and pre-processed as documented in the CleanData_Assignment_2.
A first Data Analysis Report has been produced using Tableau, full details can be found in the CleanData-Assignment3.

And add this in the readme:

### Assignment 5
The purpose of this assignment was to learn D3 basic concepts and familiarise with JS in order to be able to apply them to the final project. To do this we started creating the first chart of our Dashboard. This is a grouped bar chart that shows the total plastic waste generated against the total plastic waste treated for each country. The two variables have been calculate with a rollup on the correspondent values. Hovering on each bar allows to display the value of that bar. Finally, a legend has also been added to the chart. A screenshot of the result of this assignment is illustrated below:

![alt text](https://github.com/Davide0295/CleanData_Project/blob/main/CleanData_Assignment5.png?raw=true)

Further development will include some minimal interaction that would allow the user to see more clearly the values of 'smaller' bars, as well as add other visualisations that are currently under development.
