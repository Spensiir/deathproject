//when user changes the year in the selection element -> updates current year
onYearChange = function() {
    var selection = d3.select("#yearSelection").node();
    var currentYear = selection.options[selection.selectedIndex].value;
    updateChart(currentYear)
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

    updateChart("2019");
})

//updates chart based on the year clicked
var updateChart = function(year) {
    nested.forEach(d => {
        if (d.key == year) {
            filtered = d.values;
        }
    })

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

    var yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(formatDeaths);

    yAxisG.transition()
        .duration(500)
        .call(yAxis);

    chartG.append("g")
        .call(yAxis)
        //.attr("transform", "translate(0, " + (padding.t) + ")");

    var bars = d3.select(".chartG").selectAll("rect")
        .data(filtered)
        .enter()
        .append("rect")
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
        .attr("fill", "blue");

    var labels = d3.select(".chartG").selectAll(".labels")
        .data(filtered)
        .enter()
        .append("text")
        .text(d => {
            return d.cause;
        })
        .attr("class", "labels")
        .attr("x", (d, i) => {
            return xScale(i) + 5;
        })
        .attr("y", chartHeight + 10)
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(30," + (xScale(i) + 2) + "," + (chartHeight) + ")";
        });
        
        var counts = d3.select(".chartG").selectAll(".counts")
        .data(filtered)
        .enter()
        .append("text")
        .text(d => {
            return formatDeaths(d.deaths);
        })
        .attr("class", "counts")
        .attr("x", (d, i) => {
            return xScale(i) + 8;
        })
        .attr("y", d => {
            return yScale(d.deaths) - 10;
        })
        .attr("transform", (d, i) => {
            //return "rotate(90, 100, 100)";
            return "rotate(-45," + (xScale(i) + 8) + "," + (yScale(d.deaths) - 10) + ")";
        });
    
}