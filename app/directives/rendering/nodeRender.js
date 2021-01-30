/*
 * The MIT License
 *
 * Copyright 2016 Eli Davis.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var additionColor = "#b3ffb3";
var deletionColor = "#ffb3b3";

module.exports = function (node, nodeCanvasPos, graph) {
  var mainColor = node.getRenderData()["color"];

  var commitDetails = node.getRenderData().commitDetails;

  var extraDataForTitle = "";
  var signRender = null;

  var addPercentage = null;

  if (commitDetails) {
    if (commitDetails.status === "added") {
      mainColor = additionColor;
      signRender = "+";
    }

    if (commitDetails.status === "removed") {
      mainColor = deletionColor;
      signRender = "-";
    }

    if (commitDetails.status === "modified") {
      extraDataForTitle =
        " (+" + commitDetails.additions + ", -" + commitDetails.deletions + ")";
      addPercentage = commitDetails.additions / commitDetails.changes;
    }
  }

  var ctx = graph.getContext();
  if (addPercentage === null) {
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(
      nodeCanvasPos[0],
      nodeCanvasPos[1],
      node.getRadius() * graph.getScale() * 0.8,
      0,
      2 * Math.PI
    );
    ctx.fill();
  } else {
    ctx.fillStyle = additionColor;
    ctx.beginPath();
    ctx.moveTo(nodeCanvasPos[0], nodeCanvasPos[1]);
    ctx.arc(
      nodeCanvasPos[0],
      nodeCanvasPos[1],
      node.getRadius() * graph.getScale() * 0.8,
      0,
      2 * Math.PI * addPercentage
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = deletionColor;
    ctx.beginPath();
    ctx.moveTo(nodeCanvasPos[0], nodeCanvasPos[1]);
    ctx.arc(
      nodeCanvasPos[0],
      nodeCanvasPos[1],
      node.getRadius() * graph.getScale() * 0.8,
      2 * Math.PI * addPercentage,
      2 * Math.PI
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (node.getRenderData()["$mouseOver"]) {
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(
      nodeCanvasPos[0],
      nodeCanvasPos[1],
      node.getRadius() * graph.getScale() * 0.8 * 0.5,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  if (node.getRenderData()["$beingDragged"]) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
      nodeCanvasPos[0],
      nodeCanvasPos[1],
      node.getRadius() * graph.getScale() * 0.8 * 0.3,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  if (
    node.getRenderData().$mouseOver ||
    node.getRenderData().$neighborMouseOver
  ) {
    // Make sure the mouse over box is always on top of everything.
    graph.postRender(function () {
      ctx.font = "16px Monospace";
      var textDimensions = ctx.measureText(
        node.getRenderData()["name"] + extraDataForTitle
      );

      // Draw a rectangle for text.
      ctx.fillStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.fillRect(
        nodeCanvasPos[0] - 70 - textDimensions.width,
        nodeCanvasPos[1] - 95 - 20,
        textDimensions.width + 40,
        40
      );

      // Draw a line coming from the node to the rectangle
      ctx.strokeStyle = mainColor;
      ctx.beginPath();
      ctx.moveTo(nodeCanvasPos[0], nodeCanvasPos[1]);
      ctx.lineTo(nodeCanvasPos[0], nodeCanvasPos[1] - 95);
      ctx.lineTo(nodeCanvasPos[0] - 50, nodeCanvasPos[1] - 95);
      ctx.stroke();

      // display the text
      ctx.fillStyle = "black";
      ctx.fillText(
        node.getRenderData()["name"] + extraDataForTitle,
        nodeCanvasPos[0] - 50 - textDimensions.width,
        nodeCanvasPos[1] - 95
      );
    });
  }

  if (signRender) {
    ctx.strokeStyle = signRender === "+" ? "#1aff1a" : "#ff4d4d";

    ctx.lineWidth = 10 * graph.getScale();
    var offset = node.getRadius() * 0.4 * graph.getScale();
    ctx.beginPath();
    ctx.moveTo(nodeCanvasPos[0] - offset, nodeCanvasPos[1]);
    ctx.lineTo(nodeCanvasPos[0] + offset, nodeCanvasPos[1]);
    ctx.stroke();

    if (signRender === "+") {
      ctx.beginPath();
      ctx.moveTo(nodeCanvasPos[0], nodeCanvasPos[1] - offset);
      ctx.lineTo(nodeCanvasPos[0], nodeCanvasPos[1] + offset);
      ctx.stroke();
    }
  }
};
