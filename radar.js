d3.radarDataManager = function module() {
  var exports = {},data;

  var nameMap = d3.map({
    'default': '전체',
    'company_100': '100대 기업',
    'company_not_100': '비 100대 기업',
    'company_recommended': '추천 리뷰',
    'company_not_recommended': '비추천 리뷰',
  })

  var categoryList = [{'name':'서비스업', 'number':100},
  {'name':'제조/화학', 'number':200},
  {'name':'의료/제약/복지', 'number':300},
  {'name':'판매유통', 'number':400},
  {'name':'교육업', 'number':500},
  {'name':'건설업', 'number':600},
  {'name':'IT/웹/통신', 'number':700},
  {'name':'미디어/디자인', 'number':800},
  {'name':'은행/금융업', 'number':900},
  {'name':'기관/협회', 'number':1000}]

  exports.loadCsvData = function(_file, _callback) {
    function type(d) {
      for (var key in d) {
        if(d.hasOwnProperty(key) && key !== 'type' ) {
          d[key] = +d[key]
        }
      }
      if (d.category) {
        d.type_kr = categoryList.filter(function(c) {
          return (c.number == d.category)
        })[0]['name']

      } else {
        d.type_kr = nameMap.get(d.type)
      }
      return d;
    }
    d3.csv(_file, type, function(_err, _response) {
      data = _response;
      _callback(data);
    });

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
  var maxVal = 5.0;
  var svg;
  var targetData = [];
  var labelMap = d3.map({
    'worklife_balance_rating':'업무와 삶의 균형',
    'advancement_rating':'승진기회',
    'culture_rating':'사내문화',
    'management_rating':'경영진',
    'compensation_rating':'복지/급여'})
  function getLabelsOnly(d,i) {
    return labelMap.keys().map(function(k){
      return {name:k, value:d[k], type:i}
    })
  }

  function exports(_selection) {
    _selection.each(function(_data) {
      var self = this;
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

      var z = ['#1a468c', '#f9a33d', '#d13d30']
      var line = d3.svg.line.radial()
      .interpolate("linear-closed")
      .angle(function(d) { return angle(d.name); })
      .radius(function(d) { return radius( d.value); });

      var area = d3.svg.area.radial()
      .interpolate("linear-closed")
      .angle(function(d) { return angle(d.name); })
      .innerRadius(0)
      .outerRadius(function(d) { return radius(d.value); });

      setSelects(_data.map(function(d) {return {type:d.type, type_kr:d.type_kr};}), 2)
      //targetData = _data.slice(0, 2).map(getLabelsOnly)

      if (!svg) {
        svg = d3.select(self).append("svg")
        .attr("class", "canvas")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + (margin.left + width/2) + "," + (margin.top + height/2) + ")");
      }


      radius.domain([0, maxVal]);//d3.max([5.0, d3.max(_data, function(d) { return d.value; }) ])]);
      angle.domain((function() { var keys = labelMap.keys(); keys.push('-'); return keys})());

      svg.selectAll(".axis")
      .data(angle.domain()) // get angle domain
      .enter().append("g")
      .attr("class", "axis")
      .attr("transform", function(d) { return "rotate(" + angle(d) * 180 / Math.PI + ")"; })
      .call(
        d3.svg.axis()
        .scale(radius.copy().range([-innerRadius, -outerRadius]))
        .ticks(tickNumber)
        .tickSize(0,0)
        .orient("left")
      )

      var radiusPoints = d3.range(
        radius.domain()[0] + radius.domain()[1]/tickNumber,
        radius.domain()[1] + radius.domain()[1]/tickNumber,
        radius.domain()[1]/tickNumber)
      var spiderPoints = radiusPoints.map(function(d) {
        return labelMap.keys().map(function(dd) {
          return {name:dd, value:d}
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
        .data(labelMap.keys())
      .enter().append('text')
      .attr("class", 'label')
      .attr("x", function(d) {
        return (outerRadius + 20)* Math.cos(angle(d) - Math.PI*.5 )
      })
      .attr("y", function(d) {
        return (outerRadius + 20)* Math.sin(angle(d) - Math.PI*.5 )
      })
      .attr("text-anchor", 'middle')
      .text(function(d) {
        return labelMap.get(d);
      })

      function update(targetData) {
        var duration = 400;
        var areaSelect = svg.selectAll(".area")
          .data(targetData)

        areaSelect.enter().append("path")
          .attr("class", "area")
          .style("fill", function(d, i) { return z[i]; })

        areaSelect.transition()
          .duration(duration)
          .attr("d", function(d) { return area(d); })

        var lineSelect = svg.selectAll(".line")
          .data(targetData)

        lineSelect.enter().append("path")
          .attr("class", "line")
          .style("fill", 'none')
          .style("stroke", function(d, i) { return z[i]; })

        lineSelect.transition()
        .duration(duration)
        .attr("d", function(d) { return line(d); })


        var pointSelect = svg.selectAll(".point")
          .data(targetData.reduce(
            function(pre,cur) {
                return pre.concat(cur)
            }, []))

        pointSelect.enter().append('circle')
        .attr('class', 'point')
        .attr("r", 4)
        .style("fill", function(d) { return z[d.type]; })

        pointSelect.transition()
        .duration(duration)
        .attr('cx', function(d) {
          return Math.cos(angle(d.name) - Math.PI*.5 ) * radius(d.value)
        })
        .attr('cy', function(d) {
          return Math.sin(angle(d.name) - Math.PI*.5 ) * radius(d.value)
        })

      }// end of update

      function setSelects(options, selectNum) {

        selectNum = selectNum || 2
        var optionsArr = d3.range(selectNum).map(function(d) {
          return options
        });
        d3.select(self)
        .select('div.menu')
        .selectAll('select.targets')
          .data(optionsArr)
        .enter().append('select')
        .attr("class", 'targets')
        .style("border-color", function(d,i) {
          return z[i];
        })
        .on('change', function(d,i) {
          exports.targetData(_data[this.selectedIndex], i);
          update(targetData);
        })
        .selectAll('option')
          .data(function(d) { return d})
        .enter().append('option')
        .attr("value", function(d) {return d.type})
        .html(function(d) {
          return d.type_kr
        })

        d3.select(self).selectAll('select.targets')
        .each(function(d, i) {
          exports.targetData(_data[i], i)
          d3.select(this).selectAll('option')
            .each(function(dd,ii) {
              if (ii === i) {
                d3.select(this).attr("selected", true);
              }
            })
        })

      } // end of setSelects

      update(targetData);
    }) // end of each
  } // end of exports

  exports.targetData = function(data, optionIndex) {
    if (!arguments.length) {
      return targetData;
    } else if (arguments.length == 1) {
      targetData = data.map(getLabelsOnly);
    } else {
      targetData[optionIndex] = getLabelsOnly(data, optionIndex);
    }
  }

  return exports;

} // end of class scope
