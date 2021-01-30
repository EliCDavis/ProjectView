/*
 * The MIT License
 *
 * Copyright 2021 Eli Davis.
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

var angular = require("angular");
var rxDecorateDirective = require("./3rdParty/rxDecorateDirective");

require("angular-material");
require("rx-angular");

var app = angular.module("Project View", ["ngMaterial", "rx"]);

app.config([
  "$provide",
  function ($provide) {
    rxDecorateDirective($provide, "ngShow");
    rxDecorateDirective($provide, "ngHide");
    rxDecorateDirective($provide, "ngDisabled");
    rxDecorateDirective($provide, "ngIf");
    rxDecorateDirective($provide, "ngBind");
  },
]);

require("./filters");
require("./services");
require("./directives");
require("./controllers");

angular.bootstrap(document, ["Project View"]);
