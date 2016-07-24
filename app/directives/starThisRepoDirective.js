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


module.exports = StarThisRepoDirective;

function StarThisRepoDirective(){
    return {
        'restrict': 'E',
        'template': '<md-button ng-click="repoStarMe.starThisRepo()" ng-show="repoStarMe.showShow"><span ng-bind="repoStarMe.buttonText"></span></md-button>',
        'controllerAs': 'repoStarMe',
        'controller': /*@ngInject*/ function ($scope, Github, $mdToast) {
            
            var self = this;
            
            self.showShow = Github.isLoggedIn$;
            
            self.clicks = 0;
            self.buttonText = "You Should Totally Click Me";
            
            self.alreadyStared = false;

            Github.userLogin$.subscribe(function () {
                Github.getStarredRepositories(function (err, data) {

                    if(err){
                        self.showShow = false;
                        return;
                    }

                    data.forEach(function (repo) {
                        if (repo.full_name === "EliCDavis/ProjectView") {
                            self.alreadyStared = true;
                            self.buttonText = "Thanks For Starring <3";
                            $scope.$apply();
                        }
                    });

                });
            });
            
            
            self.messages = [
                "Too Lazy to implement unstarring",
                "No yeah you can stop trying, didn't do it",
                "I Know what your thinking",
                "You made all this dialouge happen",
                "But no unstarring?",
                "Yeah dude",
                "Duh",
                "This is a nice little site don't you think?",
                "No?",
                "Click me again",
                "I dare you",
                "Alright fine, your asking for it",
                "I just had you star another one of my repositories :)",
                "Bye",
                "<3"
            ];
            
            self.starThisRepo = function(){
                if(!self.alreadyStared){
                    Github.starRepository("EliCDavis/ProjectView");
                    $mdToast.show($mdToast.simple().textContent('Thanks For Staring!!!').position("top right"));
                    self.alreadyStared = true;
                    self.buttonText = "Thanks For Starring <3";
                    $scope.$apply();
                } else {
                    self.buttonText = self.messages[Math.min(self.clicks++, self.messages.length-1)];
//                    $scope.$apply();

                    if(self.clicks === 13){
                        Github.starRepository("EliCDavis/NodeView");
                    }
                }
            };
            
        }
    };
    
}