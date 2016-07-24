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

var NodeView = require('NodeView');

module.exports = TreeDisplayDirective;

function TreeDisplayDirective() {
    return {
        'restrict': 'E',
        'templateUrl': 'partials/directives/treeDisplay.directive.html',
        'controllerAs': 'treeDisplay',
        'controller': /*@ngInject*/ function ($element, $scope, Github) {

            var self = this;

            var canvas = $element.find('canvas');

            var graph = new NodeView(canvas[0]);
            graph.setOption('applyGravity', false);

            self.inflatedTree = null;

            graph.setBackgroundRenderMethod(function (graph) {
                var ctx = graph.getContext();
                ctx.fillStyle = "#3949ab";
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            });


            var _convertTreeToNodes = function (tree, parent) {
                
                tree.forEach(function (obj) {
                    
                    var color = "";
                    var radius = parent ? parent.getRadius() * 0.7 : 300;
                    
                    if(obj.type === 'blob') {
                        color = "#E3ECF5";
                        radius *= 0.8;
                    }
                    
                    if(obj.type === 'tree') {
                        color = "#009688";
                    }
                    
                    var node = graph.createNode({
                        renderData : {
                            color: color,
                            name: obj.name
                        },
                        radius :  radius
                    });
                    
                    if(obj.type === 'tree') {
                        _convertTreeToNodes(obj.contents, node);
                    }
                    
                    if(parent) {
                        parent.addChild(node);
                    }
                    
                });
                
            };


            var _inflateTree = function(tree, path) {
                
                path = path || '';
                
                return tree
                    .filter(function(item){
                        return item.path.indexOf(path) !== -1;
                    })
                    .map(function(item){
                        item.name = item.path.replace(path,"");
                        return item;
                    })
                    .filter(function(item){
                        return item.name.indexOf('/') === -1;
                    })
                    .map(function(item){
                        
                        if(item.type === 'tree'){
                            item.contents = _inflateTree(tree, path + item.name + "/");
                        }
                    
                        return item;
                    
                    });
                
            };
            
            $scope.repo = null;

            Github.repositoryLoaded$.safeApply($scope, function(repo){
                console.log(repo);
                graph.clearNodes();
                self.inflatedTree = _inflateTree(repo.tree);
                _convertTreeToNodes(self.inflatedTree);
                $scope.repo = repo;
            }).subscribe();

        }
    };

}
