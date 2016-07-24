/*
The MIT License (MIT)

Copyright (c) 2014 Barry Simpson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict';

module.exports = function($provide, directiveName) {
	// Duck-typing function lifted from the rx.js source.
	function isObservable(obj) {
		return obj && typeof obj.subscribe === 'function';
	}

	$provide.decorator(directiveName + 'Directive', ['$delegate', 'rx', function($delegate, rx) {
		var directiveConfig = $delegate[0];

		// Save the original compile function for delegation later.
		var originalCompileFn = directiveConfig.compile;

		directiveConfig.compile = function() {
			// Run the original compile function with the arguments we were given in case it does
			// something important. It also returns the linking function we'll delegate to below.
			var originalLinkFn = originalCompileFn.apply(directiveConfig, arguments);

			return function postLink(scope, iElement, iAttrs) {
				var originalScope = scope;
				var linkArgs = arguments;

				// Expression in the directive's attribute value we need to watch.
				var attrExpression = iAttrs[directiveName];

				// If the current scope property value is null or undefined, watch for the first
				// value that isn't, in case it's an Observable.
				originalScope.$toObservable(attrExpression)
					.pluck('newValue')
					.skipWhile(function isUndefinedOrNull(value) {
						return typeof value === 'undefined' || value === null;
					})
					.first()
					.subscribe(function onFirstUsefulValue(firstValue) {
						// If we're bound to an Observable, subscribe to it.
						if (isObservable(firstValue)) {
							// The property name we want the original directive linking function to
							// set a watcher on.
							var RX_VALUE_SCOPE_PROPERTY = '$$rxValue';

							// Get a shared version of the value stream we're bound to, since we'll
							// be making multiple subscriptions.
							var valueStream = firstValue.share();

							// Create a new isolate scope to pass to the original linking function.
							var isolateScope = originalScope.$new(true);

							// Replace `originalScope` with `isolateScope` in the link function
							// args, used when calling the original link function with `apply()`
							// below.
							linkArgs[0] = isolateScope;

							// Replace the original directive name attribute value with the
							// property name we want the original directive to watch instead.
							iAttrs.$set(directiveName, RX_VALUE_SCOPE_PROPERTY);

							// Invoke the original linking function with the modified link args we
							// prepared earlier.
							originalLinkFn.apply(directiveConfig, linkArgs);

							// Subscribe to the Observable, updating the child scope property the
							// original linking function code is watching whenever we receive a new
							// value.
							var valueStreamDisposable = valueStream
								.safeApply(isolateScope, function onNextValue(value) {
									isolateScope[RX_VALUE_SCOPE_PROPERTY] = value;
								})
								.subscribe();

							// Our subscription should not live longer than the scope.
							originalScope.$on('$destroy', function() {
								valueStreamDisposable.dispose();
							});
						} else {
							// Else the directive is not bound to an Observable, so we call the
							// original linking function with its original args.
							originalLinkFn.apply(directiveConfig, linkArgs);
						}
					});
			};
		};

		return $delegate;
	}]);
}
