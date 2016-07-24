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

var GitHub = require('../3rdParty/Github.bundle.min.js');
var Rx = require('rx');

module.exports = GithubService;

function GithubService() {

    var self = this;

    var _credentialStorageLocation = "gCreds";

    var _gh = null;

    /**
     * Github user object that is currentely logged in.
     * @type User
     */
    var _me = null;


    self.userLogin$ = new Rx.ReplaySubject(1);


    self.userLoginError$ = new Rx.Subject();
    

    self.userRepositories$ = new Rx.ReplaySubject(1);
    
    
    self.searchRepositoryResults$ = new Rx.Subject();
    
    
    self.repositoriesLoaded$ = self.userRepositories$
        .merge(self.searchRepositoryResults$)
        .share();

    
    self.repositoryCommitsLoaded$ = new Rx.ReplaySubject(1);
    
    
    self.repositoryTreeLoaded$ = new Rx.ReplaySubject(1);
    
    self.repositoryDetailsLoaded$ = new Rx.ReplaySubject(1);

    self.repositoryLoaded$ = Rx.Rx.Observable.zip(
        self.repositoryCommitsLoaded$,
        self.repositoryTreeLoaded$,
        self.repositoryDetailsLoaded$,
        function(commits, tree, details) {
            return {
                commits: commits,
                tree: tree,
                details: details
            };
        }).share();

    self.logOutCommand$ = new Rx.Subject();

    self.isLoggedIn$ =
            self.userLogin$
            .map(function () {
                return true;
            })
            .merge(self.logOutCommand$.map(function () {
                return false;
            }))
            .merge(self.userLoginError$.map(function () {
                return false;
            })).share();


    self.login = function (username, password) {

        _gh = new GitHub({
            username: username,
            password: password
        });

        _me = _gh.getUser();

        _me.getProfile(function (err, data) {

            if (err) {
                self.userLoginError$.onNext(err);
            }

            if (data) {
                self.userLogin$.onNext(data);
                localStorage[_credentialStorageLocation] = JSON.stringify([username, password]);
            }

        });

    };
    
    
    self.logout = function (){
        self.logOutCommand$.onNext({"reason": "user"});
        localStorage[_credentialStorageLocation] = '';
    };


    self.connectWithCachedCredentials = function () {

        if (localStorage[_credentialStorageLocation]) {
            try {
                var data = JSON.parse(localStorage[_credentialStorageLocation]);
                self.login(data[0], data[1]);
            } catch(e){
                
            }
        }

    };
    
    
    self.isLoggedIn$.subscribe(function(){
        
        _me.listRepos(function(err, data){
            if(data){
                self.userRepositories$.onNext(data);
            }
        });
        
    });


    self.loadRepo = function(fullname){
        
        var repo = _gh.getRepo(fullname);
        
        
        // One day I'll make this look pretty....
        // Have to get a tree sha, done so by grabbing commits and looking at their tree sha.
        repo.listCommits(null, function(err, data){
            if(!err){
                self.repositoryCommitsLoaded$.onNext(data);
                repo.getTree(data[0].commit.tree.sha+"?recursive=1", function(e,d){
                    if(!e){
                        console.log(d);
                        self.repositoryTreeLoaded$.onNext(d.tree);
                    }
                });
            }
        });
        
        repo.getDetails(function(err, data){
            if(!err){
                self.repositoryDetailsLoaded$.onNext(data);
            }
        });
        
    };

}
