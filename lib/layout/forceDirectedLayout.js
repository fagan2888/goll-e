/**
 * forceDirectedLayout.js
 *
 * This module contains logic for performing the force-directed layout
 * algorithm on a graph.
 *
 * @author John O'Brien.
 */

var CardinalPortPosition = require('./../model/cardinalPortPosition');
 
var change = false;
//ideal length
var iLength = 500;
//force strength
var forceStr = 1 / 3;
//stretching force
var stretchForce = 0.70;
var vertices;
var mGraph;


//Based partially on https://code.google.com/p/jung/source/browse/branches/
//guava/jung/jung-algorithms/src/main/java/edu/uci/ics/jung/algorithms/
//layout/SpringLayout.java?r=19

/**
 * Defines force directed layout algorithm
 * 
 * @class forceDirectedLayout
 * 
 */
 
  /**
     * Takes the graph and re aligns the nodes
     * 
     * Returns nothing
     * 
     * @method layOutGraph
     * @param  {Graph} graph
     * @return nothing
     */

var layOutGraph = function(graph){
  mGraph = graph;
  vertices = graph.get('vertices');
  var edgeList = graph.get('edges');
  var runner = true;
  while(runner){
    change = false;
    for(var i = 0; i < edgeList.length; i++){
      springForce( edgeList[i] );
    }
    if(change === false){
      runner = false;
    }
  }
  //defaulting all ports that do not have a position
  for(var j = 0; j < vertices.length; j++){
    var inputs = vertices[j].get('inputs');
    var outputs = vertices[j].get('outputs');

    for(var h = 0; h < inputs.length; h++){
      if(inputs[h].get('position') === null){
        inputs[h].set('position', new CardinalPortPosition('E', 50));
      }
    }

    for(h = 0; h < outputs.length; h++){
      if(outputs[h].get('position') === null){
        outputs[h].set('position', new CardinalPortPosition('W', 50));
      }
    }
  }
};

 /**
     * Takes an edge and calculates the repulsion for that edge
     * 
     * Returns nothing
     * 
     * @method springForce
     * @param  {edge} edge
     * @return nothing
     */

var springForce = function(edge){
  //vertex to
  var vertexTo = mGraph.getVertexById(edge.get('to').get('ownerVertexId'));
  //vertex from
  var vertexFrom = mGraph.getVertexById(edge.get('from').get('ownerVertexId'));
  //x distance between them
  var xLength = edgeXLength(edge);
  //y distance between them
  var yLength = edgeYLength(edge);
  //straight line edge length
  var length = edgeLength(edge);
  //checks for both pinned
  if(vertexTo.get('isPinned') === true && vertexFrom.get('isPinned') === true){
    return;
  }

  //hacky solution for length being 0
  if(length === 0){
    length = 0.99;
  }
  //repulsion force calculation
  var force = forceStr * (iLength - length) / length;
  var pwrTo = vertexTo.get('inputs').length + vertexTo.get('outputs').length;
  var pwrFr = vertexFrom.get('inputs').length + vertexFrom.get('outputs').length;
  force = force * Math.pow(stretchForce, (pwrTo + pwrFr - 4));

  //repulsion change in x
  var repulsionX = force * xLength;
  //repulsion change in y
  var repulsionY = force * yLength;
  //attraction x
  var attractionX;
  //attraction y
  var attractionY;
  //math for min length
  if(length < 1){
    attractionX = Math.random() * 10 + 1;
    attractionY = Math.random() * 10 + 1;
  } else {
    attractionX = xLength / (length * length);
    attractionY = yLength / (length * length);
  }
  var len = attractionX * attractionX + attractionY * attractionY;
  //ensures length is positive
  if(len > 0){
    len = Math.sqrt(len);
    attractionX = attractionX / len;
    attractionY = attractionY / len;
  }
  //repulsion minus attraction
  repulsionX = repulsionX - attractionX;
  repulsionY = repulsionY - attractionY;
	
  //the minimum movement percentage to consider a move a change
  //constant can be altered for desired effects (higher means less runs lower will
  //be more accurate)
  var minLimit = 0.1;

  if(vertexTo.get('isPinned') === false && vertexFrom.get('isPinned') === false){
    vertexTo.set('position', {
      'x': (vertexTo.get('position').x + repulsionX),
      'y': (vertexTo.get('position').y + repulsionY)
    });
    vertexFrom.set('position', {
      'x': vertexFrom.get('position').x - repulsionX,
      'y': vertexFrom.get('position').y - repulsionY
    });
  }else if(vertexTo.get('isPinned') === true){
    vertexFrom.set('position', {
      'x': vertexFrom.get('position').x - repulsionX - repulsionX,
      'y': vertexFrom.get('position').y - repulsionY - repulsionY
    });

  }else if(vertexFrom.get('isPinned') === true){
    vertexTo.set('position', {
      'x': (vertexTo.get('position').x + repulsionX + repulsionX),
      'y': (vertexTo.get('position').y + repulsionY + repulsionY)
    });
  }
  if(repulsionX > minLimit || repulsionY > minLimit || (repulsionX < -minLimit) || (repulsionY < -minLimit)){
    change = true;
  }
};
/* not yet implemented
function portPositioning(edge){
  var vertexTo = mGraph.getVertexById(edge.get('to').get('ownerVertexId'));
  var vertexFrom = mGraph.getVertexById(edge.get('from').get('ownerVertexId'));
  var xLength = edgeXLength(edge);
  var yLength = edgeYLength(edge);
}*/

//calculates edge length
 /**
     * Takes an edge and returns its length
     * 
     * Returns nothing
     * 
     * @method edgeLength
     * @param  {edge} edge
     * @return {int} length
     */

var edgeLength = function(edge){
  var to = mGraph.getVertexById(edge.get('to').get('ownerVertexId'));
  var from = mGraph.getVertexById(edge.get('from').get('ownerVertexId'));

  //pythag theorem
  var x = to.get('position').x - from.get('position').x;
  var y = to.get('position').y - from.get('position').y;
  var c = x * x + y * y;

  return Math.sqrt(c);
};

/**
     * Takes an edge and returns its length's x value
     * 
     * Returns nothing
     * 
     * @method edgeXLength
     * @param  {edge} edge
     * @return {int} length
     */
var edgeXLength = function(edge){
  var to = mGraph.getVertexById(edge.get('to').get('ownerVertexId'));
  var from = mGraph.getVertexById(edge.get('from').get('ownerVertexId'));

  var x = to.get('position').x - from.get('position').x;
  return x;

};

/**
     * Takes an edge and returns its length's y value
     * 
     * Returns nothing
     * 
     * @method edgeYLength
     * @param  {edge} edge
     * @return {int} length
     */
var edgeYLength = function(edge){
  var to = mGraph.getVertexById(edge.get('to').get('ownerVertexId'));
  var from = mGraph.getVertexById(edge.get('from').get('ownerVertexId'));

  var y = to.get('position').y - from.get('position').y;
  return y;
};
module.exports = layOutGraph;