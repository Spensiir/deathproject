//when user changes the year in the selection element -> updates current year
onYearChange = function() {
    var selection = d3.select("#yearSelection").node();
    var currentYear = selection.options[selection.selectedIndex].value;
    updateChart(currentYear);
}

var svg = d3.select("svg");

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
    .attr("class", "y axis")

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
        .domain(d3.range(filtered.length))
        .rangeRound([0, chartWidth])
        .paddingInner(.1);
    
    //instantiate yScale and set range
    yScale = d3.scaleLinear()
        .range([chartHeight, 0]);

    colorScale = d3.scaleLinear()
        .range(["green", "orange", "red"]);

    updateChart("2019");
})

//updates chart based on the year clicked
var updateChart = function(year) {
    //set that year's array of death objects to filtered
    nested.forEach(d => {
        if (d.key == year) {
            filtered = d.values;
        }
    })

    //get rid of non-injury 
    //this can probably be prettier, maybe use a regex formatter instead of change the object value for cause
    filtered.forEach(d => {
        if (d.cause.includes("Non-Injury:")) {
            var indexOfColon = d.cause.indexOf(":") + 2;
            d.cause = d.cause.substr(indexOfColon)
        }
    })

    //update yScale domain
    yScale.domain([0, d3.max(filtered, d => {
            return d.deaths;
        })]);

    var maxDeaths = d3.max(filtered, d => {
        return d.deaths;
    })

    colorScale.domain([0, maxDeaths / 2, maxDeaths])

    var yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(formatDeaths);

    yAxisG.transition()
        .duration(500)
        .call(yAxis);

    var bars = d3.select(".chartG").selectAll("rect")
        .data(filtered, function(d) {
            return d.cause;
        });

    var barsEnter = bars.enter()
        .append("rect")
        .on("mouseover", function(d) {
            console.log(d);
            d3.select("#tooltip")
                .classed("hidden", false)
                .select("#value")
                    .text(d.cause + " killed " + d.deaths + " people in " + year);

        })
            .on("mouseout", function() {
                d3.select("#tooltip")
                    .classed("hidden", true)
            })
        .attr("x", (d, i) => {
            return xScale(i);
        })
        .attr("y", d => {
            return yScale(d.deaths);
        })
        .attr("height", d => {
            return chartHeight - yScale(d.deaths);
        })
        .attr("width", xScale.bandwidth())
        .attr("fill", d => {
            return colorScale(d.deaths);
        })
        
    barsEnter.merge(bars)
        .transition()
        .duration(500)
        .attr("y", d => {
            return yScale(d.deaths);
        })
        .attr("x", (d, i) => {
            return xScale(i);
        })
        .attr("height", d => {
            return chartHeight - yScale(d.deaths);
        });

    bars.exit()
        .remove();

    var labels = d3.select(".chartG").selectAll(".labels")
        .data(filtered, function(d) {
            return d.cause;
        })
    
    var labelsEnter = labels.enter()
        .append("text")
        .on("mouseover", function(d) {
            console.log(d);
            d3.select("#tooltip")
                .classed("hidden", false)
                .select("#value")
                    .text(d.cause + " killed  " + d.deaths + " people in " + year);

        })
            .on("mouseout", function() {
                d3.select("#tooltip")
                    .classed("hidden", true)
            })
        .text(d => {
            return d.cause;
        })
        .attr("class", "labels")
        .attr("x", (d, i) => {
            return xScale(i) + 6.5;
        })
        .attr("y", chartHeight + 10)
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(30," + (xScale(i) + 6.5) + "," + (chartHeight + 10) + ")";
        });

    labelsEnter.merge(labels)
        .transition()
        .duration(500)
        .text(d => {
            return d.cause;
        })
        .attr("x", (d, i) => {
            return xScale(i) + 6.5;
        })
        .attr("y", chartHeight + 10)
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(30," + (xScale(i) + 6.5) + "," + (chartHeight) + ")";
        });
    
    labels.exit()
        .transition()
        .duration(100)
        .remove();

        
    var counts = d3.select(".chartG").selectAll(".counts")
        .data(filtered, function(d) {
            return d.cause;
        })


    var countsEnter = counts.enter()
        .append("text")
        .on("mouseover", function(d) {
            console.log(d);
            d3.select("#tooltip")
                .classed("hidden", false)
                .select("#value")
                    .text(d.cause + " killed  " + d.deaths + " people in " + year);

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
        .duration(500)
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