//PATH GENERATION ––––––––––––––––––––––––––––––––––––––––––––––––––––––
 
  var generateAngle = function() {
    let deg  = Math.random() * (180 - 0);
    let rad = deg * (Math.PI) / 180;
    return rad;
  };
  
  var generatePath = function(s) {
    path = [];
    
    for (let i = 0; i < s; i++) {
      alpha = generateAngle();
      path.push(alpha);
    }
    return path;
  };
 
  var createDataArray = function(n, s) {
    let pathArray = [];
    
    for (let i = 0; i < n; i++) {
      pathArray.push(generatePath(s));
    }

    return pathArray;
  };

  // FITNESS FUNCTION ––––––––––––––––––––––––––––––––––––––––––––––––––

    var calculateDistance = function(angleArray, nodeArray, endPoint) {
      let lastPoints = [];
      for (let i = 0; i < nodeArray.length; i++) {
        lastPoints.push(nodeArray[i].reverse()[0]); // getting last point in nodeArray 
      }

      for (let i = 0; i < angleArray.length; i++) {
        let lastCoords = lastPoints[i],
            deltaX = endPoint.x - lastCoords.x, // difference in x distance between path's last coord & endpoint
            deltaY = endPoint.y - lastCoords.y, // same for y
            deltaD = Math.sqrt(deltaX * deltaX + deltaY * deltaY); // same for total

        angleArray[i].unshift({distance: deltaD});
      }
      return angleArray;
    };

    var calculateScore = function(distanceObj, totalDistance) {
      let distance = totalDistance - distanceObj.distance,
          score = distance * 100 / totalDistance;
          
      distanceObj.rawFitness = score;
      return distanceObj;
    };

    var calculateFitness = function(distanceArray, startPoint, endPoint) {
      let totalDistance = asCrowFlies(startPoint, endPoint);

      for (let i = 0; i < distanceArray.length; i++) {
        calculateScore(distanceArray[i][0], totalDistance);
      }
      return distanceArray;
    };

    var fitness = function(pathArray, l, startPoint, endPoint) {
      let angleArray = arrayDeepCopy(pathArray),
          nodeArray = arrayDeepCopy(calculateNodes(angleArray, l, startPoint)),
          angle_w_distance_a = arrayDeepCopy(calculateDistance(angleArray, nodeArray, endPoint)),
          scoreArray = arrayDeepCopy(calculateFitness(angle_w_distance_a, startPoint, endPoint));

      
      return scoreArray;
    };

  // SELECTION –––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  var normalise = function(fitnessArray) {
    let workingArray = arrayDeepCopy(fitnessArray),
        rawFitnessArray = [],
        fitnessTotal = 0;

    for (let i = 0; i < workingArray.length; i++) {
      rawFitnessArray.push(workingArray[i][0]);
    }

    for (let i = 0; i < rawFitnessArray.length; i++) {
      fitnessTotal += rawFitnessArray[i].rawFitness;
    }

    for (let i = 0; i < workingArray.length; i++) {
      let normalisedFitness = workingArray[i][0].rawFitness / fitnessTotal;
      workingArray[i][0].normalisedFitness = normalisedFitness;
    }

    // verification - totalCheck should equal 1
    // let totalCheck = 0;
    // for (let i in workingArray) {
    //   totalCheck += workingArray[i][0].normalisedFitness;
    // }
    // console.log(totalCheck);

    return workingArray;
  };

  var sortDescending = function(normalizedArray) {
    let workingArray = arrayDeepCopy(normalizedArray);

    workingArray.sort(function(a, b) {
      return b[0].normalisedFitness - a[0].normalisedFitness;
    });
    return workingArray;
  };

  var accumulateFitness = function(sortedArray) {
    let workingArray = arrayDeepCopy(sortedArray);

    for (let i = 0; i < workingArray.length; i++) {
      workingArray[i][0].accumulatedFitness = 0;

      for (let j = 0; j <= i; j++) {
        workingArray[i][0].accumulatedFitness +=
        workingArray[j][0].normalisedFitness;
      }
    }

    // verification
    // for (let i in workingArray) {
    //   console.log(workingArray[i][0].accumulatedFitness);
    // }

    return workingArray;
  };

  var selectParent = function(accumulatedFitnessArray) {
    let workingArray = arrayDeepCopy(accumulatedFitnessArray);

    let R = Math.random() * (1 - 0.5),
        selectedParent = [{accumulatedFitness: -1}];

    for (let i in workingArray) {
      if (workingArray[i][0].accumulatedFitness > selectedParent[0].accumulatedFitness) {
        if (workingArray[i][0].accumulatedFitness < R) {
          selectedParent = workingArray[i];
        }
      }
    }
    return selectedParent;
  };

  var selectParents = function(workingArray, p) {
    let selectedParentsArray = [];

    while (selectedParentsArray.length < p) {
      let selectedParent = selectParent(workingArray);

      if (selectedParent[0].accumulatedFitness > -1) {
        selectedParentsArray.push(selectedParent);
      }
    }

    return selectedParentsArray;
  };

  var selection = function(fitnessArray, p) {
    let normalizedArray = arrayDeepCopy(normalise(fitnessArray)),
        sortedArray = sortDescending(normalizedArray),
        accumulatedFitnessArray = arrayDeepCopy(accumulateFitness(sortedArray)),
        selectedParents = arrayDeepCopy(selectParents(accumulatedFitnessArray, p));

    return selectedParents;
  };

  // CROSSOVER –––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  var selectCouple = function(parentsArray, p) {
     let coupleArray = [],
        one = Math.floor(Math.random() * (p - 0)),
        two = Math.floor(Math.random() * (p - 0));

    coupleArray.push(parentsArray[one], parentsArray[two]);

    return coupleArray;
  };

  var createChild = function(coupleArray) {
    let father = arrayDeepCopy(coupleArray[0]),
        mother = arrayDeepCopy(coupleArray[1]),
        child = [];

    for (let i = 1; i < father.length; i++) {
      let num = Math.floor(Math.random() * (2));

      num === 0 ? child.push(father[i]) : child.push(mother[i]);
    }

    return child;
  };

  var createChildren = function(parentsArray, c, p) {
    let childrenArray = [];

    while (childrenArray.length < c) {
      let coupleArray = selectCouple(parentsArray, p),
          child = createChild(coupleArray);
      childrenArray.push(child);
    }
    return childrenArray;
  };

  var crossover = function(selectedParentsArray, c, p) {
    let parentsArray = arrayDeepCopy(selectedParentsArray),
        childrenArray = createChildren(parentsArray, c, p);

    return childrenArray;
  };

  // MUTATION ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  var mutate = function(childrenArray, m) {
    let workingArray = arrayDeepCopy(childrenArray);

    for (i = 0; i < workingArray.length; i++) {
      for (let j in workingArray[i]) {
        let num = Math.random();

        if (num < m) {
          workingArray[i][j] = Math.PI - workingArray[i][j] * Math.random() * (Math.PI/workingArray[i][j] - 0);
        }
      }
    }
    return workingArray;
  };

  // BRAIN –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  var nextGeneration = function(pathArray, l, p, c, m, startPoint, endPoint) {
    let fitnessArray = arrayDeepCopy(fitness(pathArray, l, startPoint, endPoint)),
      selectedParentsArray = arrayDeepCopy(selection(fitnessArray, p)),
      childrenArray = arrayDeepCopy(crossover(selectedParentsArray, c, p)),
      mutatedWorkingArray = arrayDeepCopy(mutate(childrenArray, m));

    return mutatedWorkingArray;
  };

  var generateZGenerations = function(n, s, l, p, c, m, z, startPoint, endPoint) {
    let pathArray = arrayDeepCopy(createDataArray(n, s)),
        currentGeneration = arrayDeepCopy(pathArray),
        generationArray = [];

    for (let i = 0; i < z; i++) {
      generationArray.push(currentGeneration);
      currentGeneration = arrayDeepCopy(nextGeneration(currentGeneration, l, p, c, m, startPoint, endPoint));
    }
    return generationArray;
  };

  var brain = function() {
    let n = 100,  // number of paths
        s = 22,  // number of segments per path
        l = 5,   // length of segment
        p = 10,   // number of parents
        c = 100,  // number of children   
        m = 0.2, // mutation probablity
        z = 100,  // number of generations
        startPoint = {x: 50, y: 0},
        endPoint = {x: 50, y: 100};

    //D3

    let zGenerationsArray = generateZGenerations(n, s, l, p, c, m, z, startPoint, endPoint);
    drawZGenerations(zGenerationsArray, l, startPoint);
  };



  // HELPER CODE –––––––––––––––––––––––––––––––––––––––––––––––––––––––

    var arrayDeepCopy = function(array) {
      var copy = JSON.parse(JSON.stringify(array));
      return copy;
    };

    var lastElementInArray = function(array) {
      return array[array.length-1];
    };

    // Durstenfeld shuffle (computer optimized Fischer-Yates shuffle)
    // 1. Works from end to begining - selects last el, sets it = to currEl
    // 2. Selects random number between 0 and i (array.length decrementing) (i+1 necessary otherwise last el excluded)
    // 3. Swaps random el (array[j] for last array[i])
    // 4. Continues until it arrives at the begining of array.
    var shuffleArray = function(inputArray) {
      let array = arrayDeepCopy(inputArray);

      for (let i = array.length - 1; i > 0; i--) {
        let currEl = array[i],
            j = Math.floor(Math.random() * (i + 1));

        array[i] = array[j];
        array[j] = currEl;
      }
      return array;
    };

    var asCrowFlies = function(startPoint, endPoint) {
      let deltaX = endPoint.x - startPoint.x,
          deltaY = endPoint.y - startPoint.y;

      let deltaD  = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      return deltaD;
    };

// DRAW and FITNESS HELPER –––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  var calculateXY = function(angle, l, coord = {x: 50, y: 0}) {
    let newCoord = {x: null, y: null};

    newCoord.x = coord.x + Math.cos(angle) * l;
    newCoord.y = coord.y + Math.sin(angle) * l; // length of segment

    return newCoord;
  };
  
  var calculateNodes = function(pathArray, l, startPoint) {
   let nodeArray = [];

    for (let i = 0; i < pathArray.length; i++) {
      let path = [],
          lastPoint = startPoint;

      for (let j = 0; j <= pathArray[i].length; j++) {
        path.push(lastPoint);
        let node = calculateXY(pathArray[i][j], l, lastPoint);
        lastPoint = node;
      }
      nodeArray.push(path);
    }
    return nodeArray;
  };

  var createD3Data = function(pathArray, l, startPoint) {
    let nodeArray = calculateNodes(pathArray, l, startPoint);

    return [nodeArray, 'x', 'y'];
  };

  var drawZGenerations = function(zGenerationsArray, l, startPoint) {
    for (let i = 0; i < zGenerationsArray.length; i++) {
      let inputDataArray = createD3Data(zGenerationsArray[i], l, startPoint);
      drawLines(inputDataArray);
    }
  };


// D3 ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  var drawLines = function(inputDataArray) {

      let dataArray = inputDataArray[0],
          prop1 = inputDataArray[1],
          prop2 = inputDataArray[2];

      let margin = {top: 20, right: 20, bottom: 60, left: 60},
          width = 1000 - margin.left - margin.right,
          height = 700 - margin.top - margin.bottom;

        var svg = d3.select("body").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");



        var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");


      var x = d3.scaleLinear()
        .range([0, width]);

      var y = d3.scaleLinear()
        .range([height, 0]);

      dataArray.forEach(function(data) { data.forEach(function(d) {
          d[prop1] = +d[prop1]; // formats whatever d.age is in d3.csv to number
          d[prop2] = +d[prop2];
        });
      });


      var lineArray = [];

      dataArray.forEach(function(data) {
        var line = d3.line()
          .x(function(d) { return x(d[prop1]); })
          .y(function(d) { return y(d[prop2]); });
        lineArray.push(line);
      });


      domainArray = [];
      for (let i = 0; i < dataArray.length-1; i++) {
        domainArray = dataArray[0];
        domainArray = domainArray.concat(dataArray[i+1]);
      }

      //Dynamic domains
      // x.domain(d3.extent(domainArray, function(d) { return d[prop1]; }));
      // y.domain(d3.extent(domainArray, function(d) { return d[prop2]; }));

      //Static domain
      x.domain([0, 105]).nice();
      y.domain([0, 105]).nice();

      svg.append("circle")
      .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")
        .attr("cx", x(50))
        .attr("cy", y(0))
        .attr("r", 3);

        svg.append("circle")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")
        .attr("cx", x(50))
        .attr("cy", y(100))
        .attr("r", 4);

      g.append("g")
          .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
          .append("text")
          .attr("fill", "#000")
          .attr("dx", "0.71em")
          .attr("y", 30)
          .attr("x", width)
          .attr("text-anchor", "start")
          .text("x");


      g.append("g")
          .call(d3.axisLeft(y))
        .append("text")
          .attr("fill", "#000")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("y");

          var generateColor = function() {
            return '#'+Math.random().toString(16).substr(-6);
          };


          for (let i = 0; i < dataArray.length; i++) {
            g.append("path")
              .datum(dataArray[i])
              .attr("fill", "none")
              .attr("stroke", generateColor())
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("stroke-width", 1.5)
              .attr("d", lineArray[i]);

          }

    };



// RUN THE APP –––––––––––––––––––––––––––––––––––––––––––––––––––––––––

brain();

  // function myWrite(output) {
  //   fs.appendFile('output.txt', output, function (err) {
  //     if (err) { /* Do whatever is appropriate if append fails*/ }
  //   });
// }
