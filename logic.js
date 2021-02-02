//when user changes the year in the selection element -> updates current year
onYearChange = function() {
    var selection = d3.select("#yearSelection").node();
    var currentYear = selection.options[selection.selectedIndex].value;
    d3.select(".selected").classed("selected", false)
    updateChart("year", currentYear);
}

var svg = d3.select(".real");

var svgWidth = +svg.attr("width");

var svgHeight = +svg.attr("height");

var padding = {l: 40, r: 100, t:50, b:100};

var chartWidth = svgWidth - padding.l - padding.r;

var chartHeight = svgHeight - padding.t - padding.b;

var formatDeaths = d3.format(".2s");

//parse values from dataset
var rowConverter = d => {   
    return {
        cause: d.cause,
        code: d.code,
        year: parseFloat(d.year),
        yearCode: parseFloat(d.yearcode),
        deaths: parseFloat(d.deaths),
        population: d.population,
        rate: d.rate
    }
}

var chartG = svg.append("g")
    .attr("transform", "translate(" + [padding.l, padding.t] + ")")
    .attr("class", "chartG");

var yAxisG = chartG.append("g")
    .attr("class", "y axis");

    //sorts deaths in ascending order
var sortDeaths = function() {
    chartG.selectAll("rect")
        .sort(function(a, b) {
            return a.deaths - b.deaths;
        })
        .transition()
        .duration(500)
        .attr("x", (d, i) => {
            return xScale(i);
        })
    
    chartG.selectAll(".labels")
        .sort(function(a, b) {
            return a.deaths - b.deaths;
        })
        .transition()
        .duration(500)
        .attr("x", (d, i) => {
            return xScale(i) + 2;
        })
        .attr("y", chartHeight + 10)
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(30," + (xScale(i) + 2) + "," + (chartHeight + 10) + ")";
        });

    chartG.selectAll(".counts")
        .sort(function(a, b) {
            return a.deaths - b.deaths;
        })
        .transition()
        .duration(500)
        .attr("x", (d, i) => {
            return xScale(i) + 10;
        })
        .attr("y", d => {
            return yScale(d.deaths) - 5;
        })
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(-90," + (xScale(i) + 10) + "," + (yScale(d.deaths) - 5) + ")";
        });
}

d3.csv("causeofdeath.csv", rowConverter).then(function(dataset) {
    //current selection for year is 2019
    currentYear = "2019"

    //nest data into years
    nested = d3.nest()
    .key(d => {
        return d.year;
    })
    .entries(dataset);

    //isolate deaths from current year
    nested.forEach(d => {
        if (d.key == currentYear) {
            filtered = d.values;
        }
    })

    //global variables
    data = dataset;

    //xScale
    xScale = d3.scaleBand()
        .rangeRound([0, chartWidth])
        .paddingInner(.1);

    //instantiate yScale and set range
    yScale = d3.scaleLinear()
        .range([chartHeight, 0]);

    colorScale = d3.scaleLinear()
        .range(["green", "orange", "red"]);

    updateChart("year", "2019");
})

d3.selectAll(".filter")
    .on("click", function() {
        var selected = d3.select(this);

        d3.select(".filter.selected").classed("selected", false)

        selected.classed("selected", true)

        updateChart("type", selected.attr("value"))
    })

//updates chart based on the year clicked
var updateChart = function(filterKey, filterValue) {

    var realDataset;
    //set that year's array of death objects to filtered
    if (filterKey == "year") {
        nested.forEach(d => {
            if (d.key == filterValue) {
                filtered = d.values;
            }
        })
        realDataset = filtered;
    }

    if (filterKey == "type") {
        console.log(filtered);
        var deathsByType;
        if (filterValue == "illness") {
            deathsByType = filtered.filter(d => {
                return d.cause.includes("Non-Injury:")
            })
        } else if (filterValue == "injury") {
            deathsByType = filtered.filter(d => {
                return !d.cause.includes("Non-Injury:")
            })
        }
        realDataset = deathsByType;
    }
    //calculate cause with most deaths to find upper limit of domain
    var maxDeaths = d3.max(realDataset, d => {
        return d.deaths;
    })

    //update yScale domain
    yScale.domain([0, maxDeaths]);

    colorScale.domain([0, maxDeaths / 2, maxDeaths])

    //xScale
    xScale.domain(d3.range(realDataset.length))

    var yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(formatDeaths);

    yAxisG.transition()
        .duration(1000)
        .call(yAxis);

    var bars = d3.select(".chartG").selectAll("rect")
        .data(realDataset, function(d) {
            return d.cause;
        });

    bars.exit()
    .transition()
    .duration(500)
    .attr("y", chartHeight)
    .attr("height", 0)
    .remove();

    var barsEnter = bars.enter()
        .append("rect")
        .attr("x", (d, i) => {
            return xScale(i);
        })
        .attr("y", chartHeight)
        .attr("height",  0)
        .attr("width", xScale.bandwidth())
        .attr("fill", d => {
            return colorScale(d.deaths);
        })
        .on("mouseover", function(d) {
            d3.select("#tooltip")
                .classed("hidden", false)
                .select("#value")
                    .text(d.cause + " killed " + d.deaths + " people in " + d.year);

            })
            .on("mouseout", function() {
                d3.select("#tooltip")
                    .classed("hidden", true)
            });
        
    barsEnter.transition()
        .duration(1000)
        .attr("y", d => {
            return yScale(d.deaths)
        })
        .attr("height", d => {
            return chartHeight - yScale(d.deaths)
        });
    
        barsEnter.merge(bars)
        .transition()
        .duration(1000)
        .attr("y", d => {
            return yScale(d.deaths);
        })
        .attr("x", (d, i) => {
            return xScale(i);
        })
        .attr("height", d => {
            return chartHeight - yScale(d.deaths);
        })
        .attr("width", xScale.bandwidth());



    var labels = d3.select(".chartG").selectAll(".labels")
        .data(realDataset, function(d) {
            return d.cause;
        })

    labels.exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
    
    var labelsEnter = labels.enter()
        .append("text")
        .on("mouseover", function(d) {
            d3.select("#tooltip")
                .classed("hidden", false)
                .select("#value")
                    .text(d.cause + " killed  " + d.deaths + " people in " + d.year);

            })
        .on("mouseout", function() {
                d3.select("#tooltip")
                    .classed("hidden", true)
            })
        .text(d => {
            if (d.cause.includes("Non-Injury:")) {
                var indexOfColon = d.cause.indexOf(":") + 2;
                return d.cause.substr(indexOfColon)
            } else {
                return d.cause;
            }
        })
        .attr("class", "labels")
        .attr("x", (d, i) => {
            return xScale(i) + 6.5;
        })
        .attr("y", chartHeight + 10)
        .attr("transform", (d, i) => {
            return "rotate(30," + (xScale(i) + 6.5) + "," + (chartHeight + 10) + ")";
        })
        // .style("opacity", 0);

    labelsEnter.transition()
        .duration(500)
        // .style("opacity", 100);

    labelsEnter.merge(labels)
        .transition()
        .duration(1000)
        .text(d => {
            if (d.cause.includes("Non-Injury:")) {
                var indexOfColon = d.cause.indexOf(":") + 2;
                return d.cause.substr(indexOfColon)
            } else {
                return d.cause;
            }
        })
        .attr("class", "labels")
        .attr("x", (d, i) => {
            return xScale(i) + 6.5;
        })
        .attr("y", chartHeight + 10)
        .attr("transform", (d, i) => {
            return "rotate(30," + (xScale(i) + 6.5) + "," + (chartHeight + 10) + ")";
        })
        //.style("opacity", 100);
    
    var counts = d3.select(".chartG").selectAll(".counts")
        .data(realDataset, function(d) {
            return d.cause;
        })

    var countsEnter = counts.enter()
        .append("text")
        .on("mouseover", function(d) {
            d3.select("#tooltip")
                .classed("hidden", false)
                .select("#value")
                    .text(d.cause + " killed  " + d.deaths + " people in " + d.year);

        })
            .on("mouseout", function() {
                d3.select("#tooltip")
                    .classed("hidden", true)
            })
        .text(d => {
            return formatDeaths(d.deaths);
        })
        .attr("class", "counts")
        .attr("x", (d, i) => {
            return xScale(i) + 6;
        })
        .attr("y", d => {
            return yScale(d.deaths) - 5;
        })
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(-90," + (xScale(i) + 6) + "," + (yScale(d.deaths)- 5) + ")";
        });

    countsEnter.merge(counts)
        .transition()
        .duration(1000)
        .text(d => {
            return formatDeaths(d.deaths)
        })
        .attr("x", (d, i) => {
            return xScale(i) + 6;
        })
        .attr("y", d => {
            return yScale(d.deaths - 5);
        })
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(-90," + (xScale(i) + 6) + "," + (yScale(d.deaths) - 5) + ")";
        });

    counts.exit()
        .remove();
}

var sortByDeathType = function(filterKey) {
    var deathsByType;
    if (filterKey == "illness") {
        deathsByType = filtered.filter(d => {
            return d.cause.includes("Non-Injury:")
        })
    } else if (filterKey == "injury") {
        deathsByType = filtered.filter(d => {
            return !d.cause.includes("Non-Injury:")
        })
    }

    //adjust xScale
    xScale.domain(d3.range(deathsByType.length))

    var bars = chartG.selectAll("rect")
        .data(deathsByType, function(d) {
            return d.cause;
        })

    bars.enter()
        .append("rect")
        .attr("x", (d, i) => {
            return xScale(i);
        })
        .attr("width", xScale.bandwidth)
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("x", (d, i) => {
            return xScale(i);
        })
        .attr("width", xScale.bandwidth)

    bars.exit()
    .transition()
    .duration(500)
    .remove();

        
    // var barsEnter = bars.enter()
    //     .attr("x", (d, i) => {
    //         return xScale(i);
    //     })
    //     .attr("width", xScale.bandwidth)
    //     .merge()
    
}