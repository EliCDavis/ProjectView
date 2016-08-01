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

var NodeView = require('../../../NodeView/src/Graph/Graph2D');
var Rx = require('rx');

module.exports = TreeDisplayDirective;

function TreeDisplayDirective() {
    return {
        'restrict': 'E',
        'templateUrl': 'partials/directives/treeDisplay.directive.html',
        'controllerAs': 'treeDisplay',
        'controller': /*@ngInject*/ function ($element, $scope, Github) {

            var self = this;

            var canvas = $element.find('canvas');

            var MAX_NODES = 800;

            var graph = new NodeView(canvas[0]);
            graph.setOption('applyGravity', false);

            self.inflatedTree = null;

            self.displayRepositoryControls$ = Github.repositoryLoaded$
                    .map(function () {
                        return true;
                    });

            graph.setBackgroundRenderMethod(function (graph) {

                var ctx = graph.getContext();
                ctx.fillStyle = "#3949ab";
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                if (graph.getNodes().length === 0) {
                    ctx.font = "17px Monospace";
                    var message = "Click on a user repository";
                    var message2 = "or load one by name to begin.";
                    var textDimensions = ctx.measureText(message);
                    var textDimensions2 = ctx.measureText(message2);
                    ctx.fillStyle = "white";
                    ctx.fillText(message, (graph.getContext().canvas.width / 2) - (textDimensions.width / 2), graph.getContext().canvas.height / 2);
                    ctx.fillText(message2, (graph.getContext().canvas.width / 2) - (textDimensions2.width / 2), graph.getContext().canvas.height / 2 + 21);
                }

            });

            graph.setDefaultNodeRenderAndMouseDetection(
                    require('./rendering/nodeRender'), function (node, graph, mousePos) {
                        return (node.distanceFrom(mousePos) <= node.getRadius() * .8);
                    });


            /**
             * A failing attempt to get the nodes to organize themselves
             */
            graph.setNodeAttractionMethod(function (node1, node2, extraData) {

                var data = extraData;
                if (data === undefined || data === null) {
                    data = {};
                }

                var xDist = node2.pos[0] - node1.pos[0];
                var yDist = node2.pos[1] - node1.pos[1];
                var dist = Math.sqrt((xDist * xDist) + (yDist * yDist));

                var masses = Math.abs(node1.mass * node2.mass);
                var attraction = (masses / (dist * dist)) * 1.1;

                // If we're too close then let's reject
                if (dist < node1.mass + node2.mass) {
                    attraction *= -2.5;
                }


                if (data.$groupPos) {
                    attraction = .05;
                }


                if (node1.node && node2.node) {

                    if (node1.node.isLinkedWith(node2.node)) {
                        attraction = .2;

                        if (extraData.$linkData.$directedTowards) {

                            if (node2.getId() === extraData.$linkData.$directedTowards.getId()) {
                                attraction = 0;
                            }

                        }

                    } else {
                        attraction = 0;
                    }

                }

                return attraction;
            });

            var curNodesDisplayed = 0;

            var _convertTreeToNodes = function (tree, parent) {

                if  (!parent) {
                    curNodesDisplayed = 0;
                }

                if (curNodesDisplayed > MAX_NODES) {
                    return;
                }

                tree.forEach(function (obj) {

                    if (curNodesDisplayed > MAX_NODES) {
                        return;
                    }
                    curNodesDisplayed ++;

                    var color = "";
                    var radius = parent ? parent.getRadius() * 0.7 : 300;

                    if (obj.type === 'blob') {
                        color = "#E3ECF5";
                        radius *= 0.8;
                    }

                    if (obj.type === 'tree') {
                        color = "#10A0C8";
                    }

                    var node = graph.createNode({
                        renderData: {
                            color: color,
                            name: obj.name,
                            commitDetails: obj.commitDetails
                        },
                        radius: radius
                    });

                    if (obj.type === 'tree') {
                        _convertTreeToNodes(obj.contents, node);
                    }

                    if (parent) {
                        graph.linkNodes(parent, node, {
                            $directedTowards: node
                        });
                    }

                });

            };


            var _inflateTree = function (tree, path) {

                path = path || '';

                return tree
                        .filter(function (item) {
                            return item.path.indexOf(path) !== -1;
                        })
                        .map(function (item) {
                            item.name = item.path.replace(path, "");
                            return item;
                        })
                        .filter(function (item) {
                            return item.name.indexOf('/') === -1;
                        })
                        .map(function (item) {

                            if (item.type === 'tree') {
                                item.contents = _inflateTree(tree, path + item.name + "/");
                            }

                            return item;

                        });

            };

            $scope.repo = null;

            $scope.viewCommit = function (commit) {
                Github.loadCommitForRepository($scope.repo.details.full_name, commit.sha);
            };

            self.getItemNameMatches = function (searchText) {

                if (!searchText) {
                    return [];
                }

                return $scope.repo.tree.filter(function (item) {
                    return item.path.toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                });

            };

            self.itemSearchText = "";

            self.userAddedItemsToIgnore$ = new Rx.Subject();
            self.userRemovedItemsFromIgnore$ = new Rx.Subject();
            self.clearItemsBeingIgnored$ = Github.repositoryDetailsLoaded$;

            self.itemsBeingIgnored = [];

            self.itemsBeingIgnored$ = Rx.Observable.merge(
                    self.userAddedItemsToIgnore$.map(function (item) {
                        return {"added": item};
                    }),
                    self.userRemovedItemsFromIgnore$.map(function (item) {
                        return {"removed": item};
                    }),
                    self.clearItemsBeingIgnored$.map(function (item) {
                        return {"cleared": true};
                    })
                    ).scan(function (acc, x) {

                if (x.added) {
                    acc.push(x.added);
                    return acc;
                } else if (x.removed) {

                    if (acc.lengh === 0) {
                        return acc;
                    }

                    return acc.filter(function (item) {
                        return acc.path !== item.removed;
                    });
                } else {
                    self.itemsBeingIgnored = [];
                    return [];
                }

            }, []);

            self.addItemToIgnore = function (item) {

                if (!item) {
                    return;
                }

                self.itemSearchText = "";

                self.userAddedItemsToIgnore$.onNext(item);

                self.itemsBeingIgnored.push(item);

            };


            self.removeItemFromIgnore = function (itemToRemove) {

                if (!itemToRemove) {
                    return;
                }

                self.itemsBeingIgnored = self.itemsBeingIgnored.filter(function (item) {
                    return itemToRemove.path !== item.path;
                });
                self.userRemovedItemsFromIgnore$.onNext(itemToRemove);
            };

            /**
             * Stream of files that come from the repository tree + any extra 
             * files found in the currently loaded commit if there is one.
             */
            var _newFilesForDisplay$ = Rx.Observable
                    .combineLatest(
                            Github.repositoryLoaded$,
                            self.itemsBeingIgnored$.startWith([undefined]),
                            Github.commits$.startWith(undefined)
                            ).map(function (data) {

                var repo = {
                    commits: data[0].commits,
                    details: data[0].details
                };

                var ignoredItems = data[1];

                var newCommit = data[2];

                // Add in any deletions that happened during te commit to be rendered.
                var additionalFiles = [];
                if (newCommit) {
                    for (var i = 0; i < newCommit.files.length; i++) {
                        if(newCommit.files[i].status === "removed"){
                            newCommit.files[i].path = newCommit.files[i].filename;
                            additionalFiles.push(newCommit.files[i]);
                        }
                    }
                }

                repo.tree = data[0].tree.filter(function (item) {

                    for (var i = 0; i < ignoredItems.length; i++) {

                        if (!ignoredItems[i]) {
                            continue;
                        }

                        if (ignoredItems[i].type === "blob") {
                            if (ignoredItems[i].path === item.path) {
                                return false;
                            }
                        } else {
                            if (item.path.indexOf(ignoredItems[i].path) === 0) {
                                return false;
                            }
                        }

                    }

                    return true;
                });

                additionalFiles.forEach(function(file){
                    repo.tree.push(file);
                });

                if (newCommit) {
                    repo.tree = repo.tree.map(function (item) {

                        for (var i = 0; i < newCommit.files.length; i++) {

                            if (newCommit.files[i].filename === item.path) {
                                item.commitDetails = {
                                    additions: newCommit.files[i].additions,
                                    deletions: newCommit.files[i].deletions,
                                    changes: newCommit.files[i].changes,
                                    status: newCommit.files[i].status
                                };
                            }

                        }

                        return item;
                    });
                    
                }

                return {repo: repo, ignoredItems: ignoredItems};

            }).share();

            _newFilesForDisplay$.safeApply($scope, function (item) {
                $scope.repo = item.repo;
            }).subscribe();

            var _newTreeForDisplay$ = _newFilesForDisplay$.filter(function (data) {
                return data.repo.tree.length < MAX_NODES;
            }).share();
            
            _newFilesForDisplay$.safeApply($scope, function (item) {
                graph.clearNodes();
                self.inflatedTree = _inflateTree(item.repo.tree);
                _convertTreeToNodes(self.inflatedTree);
            }).subscribe();

            /**
             * A stream of how many extra files that are listed to display that
             * is over the max allowed.
             * 
             * @type Rx.Observable<Number>
             */
            var _filesTooManyForRendering$ = _newFilesForDisplay$.map(function(data) {
                return Math.max(0, data.repo.tree.length - MAX_NODES);
            }).share();

            self.repoOverload$ = _newFilesForDisplay$.map(function(data){
                console.log("Overload Fire");
                return data.repo.tree.length > MAX_NODES ? data : null;
            }).share();
            
            /**
             * If there was an error displaying the repository then it is piped
             * to this stream
             * 
             * @type Rx.Observable<String>
             */
            self.repoOverloadErrorMessage$ = self.repoOverload$.map(function(data){
                
                if(!data) {
                    return "";
                }
                
                return "Your trying to load way to big of a repository! Theres a combination of "+data.repo.tree.length+" files\
                        and folders in this repository (I've set a max of " + MAX_NODES + ").  Try adding some folder to the filter\
                        to help cut down on things!";
            });
                   
            self.userToggleSideView$ = new Rx.Subject();

            self.lastTreeCommand$ = Github.repositoryLoaded$
                    .map(function () {
                        return {repoLoaded: true};
                    }).merge(self.userToggleSideView$).share();
                    
            self.showCommitView$ = self.lastTreeCommand$
                    .scan(function (acc, x) {
                        return x.commitView ? !acc : false;
                    }, false).share();

            self.showFileFilter$ = self.lastTreeCommand$
                    .scan(function (acc, x) {
                        return x.fileFilter ? !acc : false;
                    }, false)
                    .combineLatest(
                    _filesTooManyForRendering$,
                    function(lastToggle, tooMany) {
                        return lastToggle || tooMany > 0;
                    }).share();

            self.showSidebar$ = self.showFileFilter$
                    .combineLatest(
                            self.showCommitView$,
                            _filesTooManyForRendering$.map(function(num){return num > 0;}),
                            function (fileFilter, commitView, fileOverload) {
//                                console.log(fileFilter, commitView, fileOverload);
                                return fileFilter || commitView || fileOverload;
                            }
                    ).share();

            self.toggleFileFilter = function () {
                self.userToggleSideView$.onNext({fileFilter: true});
            };

            self.toggleCommitView = function () {
                self.userToggleSideView$.onNext({commitView: true});
            };

        }
    };

}
