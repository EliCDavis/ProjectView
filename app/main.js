/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var angular = require('angular');
var rxDecorateDirective = require('./3rdParty/rxDecorateDirective');

require('angular-material');
require('rx-angular');

var app = angular.module('Project View', ['ngMaterial', 'rx']);

app.config(['$provide', function ($provide) {
        rxDecorateDirective($provide, 'ngShow');
        rxDecorateDirective($provide, 'ngHide');
        rxDecorateDirective($provide, 'ngDisabled');
        rxDecorateDirective($provide, 'ngIf');
        rxDecorateDirective($provide, 'ngBind');
    }])

require('./services');
require('./directives');
require('./controllers');

angular.bootstrap(document, ['Project View']);