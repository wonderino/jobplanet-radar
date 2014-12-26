d3.radarDataManager = function module() {
  var exports = {},data;

  exports.loadCsvData = function(_file, _callback) {
    function type(d) {
      d.value = +d.value;
      return d;
    }
    d3.csv(_file, type, function(_err, _response) {
      data = _response;
      _callback(data);
    });
  }
  exports.getData = function() {
    return data;
  }
  return exports
}

d3.radar = function module() {

  (function setWidth () {
    $('div.chart').width(Math.max(280, Math.min($('body').width(), 480)));
  }());

  var windowWidth;
  var margin = {top: 20, right: 25, bottom: 20, left: 25};
  var tickNumber = 5;
  var svg;

  function exports(_selection) {
    _selection.each(function(_data) {
      var labelMap = d3.map({
      'worklife_balance_rating':'업무와 삶의 균형',
      'advancement_rating':'승진기회/가능성',
      'culture_rating':'사내문화',
      'management_rating':'경영진',
      'compensation_rating':'복지/급여'})

      var windowWidth = Number(d3.select(this).style("width").replace("px", ""));
      var width = windowWidth - margin.left - margin.right, height = windowWidth*.85 - margin.top - margin.bottom;
      //height = Math.max(60, Math.min(20, height));
      var legendW = 8;
      var outerRadius = height / 2 - 10
      ,innerRadius = 0//outerRadius * 0.25;

      var angle = d3.scale.ordinal()
      .rangePoints([0, 2 * Math.PI]);
      var radius = d3.scale.linear()
      .range([0, outerRadius])

      var nest = d3.nest()
      .key(function(d) { return d.key; });
      var z = d3.scale.category20();
      var line = d3.svg.line.radial()
      .interpolate("linear-closed")
      .angle(function(d) { return angle(d.order); })
      .radius(function(d) { return radius( d.value); });

      var area = d3.svg.area.radial()
      .interpolate("linear-closed")
      .angle(function(d) { return angle(d.order); })
      .innerRadius(0)
      .outerRadius(function(d) { return radius(d.value); });

      if (!svg) {
        svg = d3.select(this).append("svg")
        .attr("class", "canvas")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");
      }

      radius.domain([0, d3.max([5.0, d3.max(_data, function(d) { return d.value; }) ])]);
      var layers = nest.entries(_data);
      var orders = layers[0].values.map(function(d) {return d.order})
      orders.push(orders[orders.length-1] + '_');
      angle.domain(orders);

      svg.selectAll(".axis")
      .data(angle.domain()) // get angle domain
      .enter().append("g")
      .attr("class", "axis")
      .attr("transform", function(d) { return "rotate(" + angle(d) * 180 / Math.PI + ")"; })
      .call(
        d3.svg.axis()
        .scale(radius.copy().range([-innerRadius, -outerRadius]))
        .ticks(tickNumber)
        .orient("left")
      )
      var anglePoints = layers[0].values.map(function(d) {return d.order})
      var radiusPoints = d3.range(radius.domain()[0] + radius.domain()[1]/tickNumber,radius.domain()[1]+radius.domain()[1]/tickNumber, radius.domain()[1]/tickNumber)

      var spiderPoints = radiusPoints.map(function(d) {
        return anglePoints.map(function(dd) {
          return {order:dd, value:d}
        })
      });

      svg.selectAll(".spider")
      .data(spiderPoints)
      .enter().append("path")
      .attr("class", "spider")
      .attr("d", function(d) { return line(d); })
      .style("fill", 'none')
      .style("stroke", '#aaa')
      .style("stroke-opacity", .75)
      .style("stroke-width", '.3px')

      svg.selectAll('.label')
        .data(anglePoints)
      .enter().append('text')
      .attr("class", 'label')
      .attr("x", function(d) {
        return (outerRadius + 15)* Math.cos(angle(d) - Math.PI*.5 )
      })
      .attr("y", function(d) {
        return (outerRadius + 15)* Math.sin(angle(d) - Math.PI*.5 )
      })
      .attr("text-anchor", 'middle')
      .text(function(d) {
        return labelMap.get(d);
      })

      svg.selectAll(".area")
      .data(layers)
      .enter().append("path")
      .attr("class", "area")
      .attr("d", function(d) { return area(d.values); })
      .style("fill", function(d, i) { return z(d.key); })

      svg.selectAll(".line")
      .data(layers)
      .enter().append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("fill", 'none')
      .style("stroke", function(d, i) { return z(d.key); })

      svg.selectAll(".line")
      .data(layers)
      .enter().append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("fill", 'none')
      .style("stroke", function(d, i) { return z(d.key); })

      svg.selectAll(".point")
        .data(_data)
      .enter().append("circle")
      .attr("class", "point")
      .attr('cx', function(d) {
        return Math.cos(angle(d.order) - Math.PI*.5 ) * radius(d.value)
      })
      .attr('cy', function(d) {
        return Math.sin(angle(d.order) - Math.PI*.5 ) * radius(d.value)
      })
      .attr("r", 4)
      .style("fill", function(d) { return z(d.key); })


    }) // end of each
  } // end of exports

  return exports;

} // end of class scope
