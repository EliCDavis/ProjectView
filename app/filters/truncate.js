
//https://github.com/a8m/angular-filter/blob/master/src/_filter/string/truncate.js

module.exports = function () {
    return function (input, length, suffix, preserve) {

        length = !length ? input.length : length;
        preserve = preserve || false;
        suffix = suffix || '';

        if (typeof input !== 'string' || (input.length <= length))
            return input;

        return input.substring(0, (preserve)
                ? ((input.indexOf(' ', length) === -1) ? input.length : input.indexOf(' ', length))
                : length) + suffix;
    };
};