d3.radarDataManager = function module() {
  var exports = {},data;

  var nameMap = d3.map({
    'default': '전체',
    'company_100': '100대 기업',
    'company_not_100': '비 100대 기업',
    'company_recommended': '추천 리뷰',
    'company_not_recommended': '비추천 리뷰',
  })

  exports.loadCsvData = function(_file, _callback) {
    function type(d) {
      for (var key in d) {
        if(d.hasOwnProperty(key) && key !== 'type' && key !== 'category_name') {
          d[key] = +d[key]
        }
      }
      if (d.category) {
        d.type_kr = d.category_name
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
  var margin = {top: 50, right: 25, bottom: 20, left: 25};
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
      .domain([0, maxVal]);

      var barY = d3.scale.linear()
      .domain([1.0, maxVal-.5])
      .range([width*.075, 0]);

      var barX = d3.scale.ordinal()
      .rangePoints([0, width*.025]);

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
          "translate(" + (margin.left + width/2)
            + "," + (margin.top + height/2) + ")"
          );
      }

      //d3.max([5.0, d3.max(_data, function(d) { return d.value; }) ])]);
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
      .attr("x", function(d, i) {
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
        var duration = 800;
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

        /// bar chart
        var zippedData = []
        for (var i = 0; i < targetData[0].length ; i++ ) {
          var tempArr = [];
          for (var j= 0; j< targetData.length ; j++) {
            tempArr.push(targetData[j][i])
          }
          zippedData.push(tempArr);
        }

        barX.domain(d3.range(zippedData[0].length));

        var smallBarSelect = svg.selectAll(".bar")
        .data(zippedData)

        smallBarSelect.enter().append('g')
        .attr("class", 'bar')
        .attr("transform", function(d,i) {
          var x = Math.cos(angle(d[0].name) - Math.PI*.5 ) * (outerRadius + 20)
          var y = Math.sin(angle(d[0].name) - Math.PI*.5 ) * (outerRadius + 20)

          if (i==0) y -= barY.range()[0] + 14
          return "translate("+ x +","+ y + ")"
        })

        var lineInSmallBarSelect = smallBarSelect.selectAll("line")
          .data(function(d){return d})

        lineInSmallBarSelect
        .enter().append('line')
        .attr("x1", function(d,i) {return barX(i)})
        .attr("y1", barY.range()[0])
        .attr("x2", function(d,i) {return barX(i)})
        .style("stroke-width", 2)
        .style("stroke", function(d,i) {return z[i]})

        lineInSmallBarSelect.transition()
        .duration(duration)
        .attr("y2", function(d,i) {return barY(d.value)})


        var textInSmallBarSelect = smallBarSelect.selectAll("text")
          .data(function(d) { return d})
        textInSmallBarSelect
          .enter().append('text')
          .attr("x", function(d,i) {return barX(i)})
          .attr("y", barY.range()[0])
          .attr("text-anchor", function(d,i){
            if (i==0) return "end"
            else if(i==zippedData[0].length-1) return "start"
            else return "middle"
          })
          .attr("dx", function(d,i){
            if (i==0) return "-.35em"
            else if(i==zippedData[0].length-1) return ".35em"
            else return "0"
          })
          .style("fill", function(d,i){return z[i]})

        textInSmallBarSelect.transition().duration(duration)
          .text(function(d){return (Math.round(d.value*10)/10).toFixed(1)})

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
        .on('click', function(d,i) {
          var dist = d3.select(self).node().getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) ;
          d3.transition()
            .duration(800)
            .tween("scroll", (function(offset) {
              return function() {
                var fromTo = [window.pageYOffset || document.documentElement.scrollTop, offset]

                var i = d3.interpolateNumber(fromTo[0], fromTo[1]);
                return function(t) { scrollTo(0, i(t)); };
              }
            })(dist))
          //window.scroll(0, d3.select(self).node().getBoundingClientRect().top);
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
