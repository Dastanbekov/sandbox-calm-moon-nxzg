//! moment.js
//! version : 2.9.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.9.0',
        // the global-scope this is NOT the global object in Node.js
        globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenOffsetMs = /[\+\-]?\d+/, // 1234567890123
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-', '15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            x    : function () {
                return this.valueOf();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'],

        updateInProgress = false;

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
            typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    function monthDiff(a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // thie is not supposed to happen
            return hour;
        }
    }

    /************************************
     Constructors
     ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            moment.updateOffset(this);
            updateInProgress = false;
        }
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
     Helpers
     ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                    m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                        m._a[HOUR] < 0 || m._a[HOUR] > 24 ||
                        (m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 ||
                            m._a[SECOND] !== 0 ||
                            m._a[MILLISECOND] !== 0)) ? HOUR :
                            m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                                    m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                                        -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0 &&
                    m._pf.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/utcOffset equivalent to
    // model.
    function makeAs(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (moment.isMoment(input) || isDate(input) ?
                +input : +moment(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            moment.updateOffset(res, false);
            return res;
        } else {
            return moment(input).local();
        }
    }

    /************************************
     Locale
     ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _ordinalParseLenient.
            this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName, format, strict) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = moment.utc([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                    this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
                }
                if (!strict && !this._monthsParse[i]) {
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                    return i;
                } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LTS : 'h:mm:ss A',
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },


        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom, now) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom, [now]) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',
        _ordinalParse : /\d{1,2}/,

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        firstDayOfWeek : function () {
            return this._week.dow;
        },

        firstDayOfYear : function () {
            return this._week.doy;
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
     Formatting
     ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
     Parsing
     ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
            case 'Q':
                return parseTokenOneDigit;
            case 'DDDD':
                return parseTokenThreeDigits;
            case 'YYYY':
            case 'GGGG':
            case 'gggg':
                return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
            case 'Y':
            case 'G':
            case 'g':
                return parseTokenSignedNumber;
            case 'YYYYYY':
            case 'YYYYY':
            case 'GGGGG':
            case 'ggggg':
                return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
            case 'S':
                if (strict) {
                    return parseTokenOneDigit;
                }
            /* falls through */
            case 'SS':
                if (strict) {
                    return parseTokenTwoDigits;
                }
            /* falls through */
            case 'SSS':
                if (strict) {
                    return parseTokenThreeDigits;
                }
            /* falls through */
            case 'DDD':
                return parseTokenOneToThreeDigits;
            case 'MMM':
            case 'MMMM':
            case 'dd':
            case 'ddd':
            case 'dddd':
                return parseTokenWord;
            case 'a':
            case 'A':
                return config._locale._meridiemParse;
            case 'x':
                return parseTokenOffsetMs;
            case 'X':
                return parseTokenTimestampMs;
            case 'Z':
            case 'ZZ':
                return parseTokenTimezone;
            case 'T':
                return parseTokenT;
            case 'SSSS':
                return parseTokenDigits;
            case 'MM':
            case 'DD':
            case 'YY':
            case 'GG':
            case 'gg':
            case 'HH':
            case 'hh':
            case 'mm':
            case 'ss':
            case 'ww':
            case 'WW':
                return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
            case 'M':
            case 'D':
            case 'd':
            case 'H':
            case 'h':
            case 'm':
            case 's':
            case 'w':
            case 'W':
            case 'e':
            case 'E':
                return parseTokenOneOrTwoDigits;
            case 'Do':
                return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
            default :
                a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
                return a;
        }
    }

    function utcOffsetFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
            // QUARTER
            case 'Q':
                if (input != null) {
                    datePartArray[MONTH] = (toInt(input) - 1) * 3;
                }
                break;
            // MONTH
            case 'M' : // fall through to MM
            case 'MM' :
                if (input != null) {
                    datePartArray[MONTH] = toInt(input) - 1;
                }
                break;
            case 'MMM' : // fall through to MMMM
            case 'MMMM' :
                a = config._locale.monthsParse(input, token, config._strict);
                // if we didn't find a month name, mark the date as invalid.
                if (a != null) {
                    datePartArray[MONTH] = a;
                } else {
                    config._pf.invalidMonth = input;
                }
                break;
            // DAY OF MONTH
            case 'D' : // fall through to DD
            case 'DD' :
                if (input != null) {
                    datePartArray[DATE] = toInt(input);
                }
                break;
            case 'Do' :
                if (input != null) {
                    datePartArray[DATE] = toInt(parseInt(
                        input.match(/\d{1,2}/)[0], 10));
                }
                break;
            // DAY OF YEAR
            case 'DDD' : // fall through to DDDD
            case 'DDDD' :
                if (input != null) {
                    config._dayOfYear = toInt(input);
                }

                break;
            // YEAR
            case 'YY' :
                datePartArray[YEAR] = moment.parseTwoDigitYear(input);
                break;
            case 'YYYY' :
            case 'YYYYY' :
            case 'YYYYYY' :
                datePartArray[YEAR] = toInt(input);
                break;
            // AM / PM
            case 'a' : // fall through to A
            case 'A' :
                config._meridiem = input;
                // config._isPm = config._locale.isPM(input);
                break;
            // HOUR
            case 'h' : // fall through to hh
            case 'hh' :
                config._pf.bigHour = true;
            /* falls through */
            case 'H' : // fall through to HH
            case 'HH' :
                datePartArray[HOUR] = toInt(input);
                break;
            // MINUTE
            case 'm' : // fall through to mm
            case 'mm' :
                datePartArray[MINUTE] = toInt(input);
                break;
            // SECOND
            case 's' : // fall through to ss
            case 'ss' :
                datePartArray[SECOND] = toInt(input);
                break;
            // MILLISECOND
            case 'S' :
            case 'SS' :
            case 'SSS' :
            case 'SSSS' :
                datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
                break;
            // UNIX OFFSET (MILLISECONDS)
            case 'x':
                config._d = new Date(toInt(input));
                break;
            // UNIX TIMESTAMP WITH MS
            case 'X':
                config._d = new Date(parseFloat(input) * 1000);
                break;
            // TIMEZONE
            case 'Z' : // fall through to ZZ
            case 'ZZ' :
                config._useUTC = true;
                config._tzm = utcOffsetFromString(input);
                break;
            // WEEKDAY - human
            case 'dd':
            case 'ddd':
            case 'dddd':
                a = config._locale.weekdaysParse(input);
                // if we didn't get a weekday name, mark the date as invalid
                if (a != null) {
                    config._w = config._w || {};
                    config._w['d'] = a;
                } else {
                    config._pf.invalidWeekday = input;
                }
                break;
            // WEEK, WEEK DAY - numeric
            case 'w':
            case 'ww':
            case 'W':
            case 'WW':
            case 'd':
            case 'e':
            case 'E':
                token = token.substr(0, 1);
            /* falls through */
            case 'gggg':
            case 'GGGG':
            case 'GGGGG':
                token = token.substr(0, 2);
                if (input) {
                    config._w = config._w || {};
                    config._w[token] = toInt(input);
                }
                break;
            case 'gg':
            case 'GG':
                config._w = config._w || {};
                config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day || normalizedInput.date,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
            config._pf.bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR],
            config._meridiem);
        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
     Relative Time
     ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
     Week of Year
     ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
     Top Level Functions
     ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f,
            res;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        res = new Moment(config);
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' &&
            ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    moment.isDate = isDate;

    /************************************
     Moment Prototype
     ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d - ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                if ('function' === typeof Date.prototype.toISOString) {
                    // native implementation is ~50x faster, use it when we can
                    return this.toDate().toISOString();
                } else {
                    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                }
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(this._dateUtcOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (that.utcOffset() - this.utcOffset()) * 6e4,
                anchor, diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month' || units === 'quarter') {
                output = monthDiff(this, that);
                if (units === 'quarter') {
                    output = output / 3;
                } else if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = this - that;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                        units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                            units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                                units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're locat/utc/offset
            // or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                        diff < 0 ? 'lastDay' :
                            diff < 1 ? 'sameDay' :
                                diff < 2 ? 'nextDay' :
                                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this, moment(now)));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
                case 'year':
                    this.month(0);
                /* falls through */
                case 'quarter':
                case 'month':
                    this.date(1);
                /* falls through */
                case 'week':
                case 'isoWeek':
                case 'day':
                    this.hours(0);
                /* falls through */
                case 'hour':
                    this.minutes(0);
                /* falls through */
                case 'minute':
                    this.seconds(0);
                /* falls through */
                case 'second':
                    this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond') {
                return this;
            }
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return inputMs < +this.clone().startOf(units);
            }
        },

        isBefore: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return +this.clone().endOf(units) < inputMs;
            }
        },

        isBetween: function (from, to, units) {
            return this.isAfter(from, units) && this.isBefore(to, units);
        },

        isSame: function (input, units) {
            var inputMs;
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                inputMs = +moment(input);
                return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
            }
        },

        min: deprecate(
            'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
            function (other) {
                other = moment.apply(null, arguments);
                return other < this ? this : other;
            }
        ),

        max: deprecate(
            'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
            function (other) {
                other = moment.apply(null, arguments);
                return other > this ? this : other;
            }
        ),

        zone : deprecate(
            'moment().zone is deprecated, use moment().utcOffset instead. ' +
            'https://github.com/moment/moment/issues/1779',
            function (input, keepLocalTime) {
                if (input != null) {
                    if (typeof input !== 'string') {
                        input = -input;
                    }

                    this.utcOffset(input, keepLocalTime);

                    return this;
                } else {
                    return -this.utcOffset();
                }
            }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        utcOffset : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = utcOffsetFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateUtcOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                            moment.duration(input - offset, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }

                return this;
            } else {
                return this._isUTC ? offset : this._dateUtcOffset();
            }
        },

        isLocal : function () {
            return !this._isUTC;
        },

        isUtcOffset : function () {
            return this._isUTC;
        },

        isUtc : function () {
            return this._isUTC && this._offset === 0;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.utcOffset(this._tzm);
            } else if (typeof this._i === 'string') {
                this.utcOffset(utcOffsetFromString(this._i));
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).utcOffset();
            }

            return (this.utcOffset() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            var unit;
            if (typeof units === 'object') {
                for (unit in units) {
                    this.set(unit, units[unit]);
                }
            }
            else {
                units = normalizeUnits(units);
                if (typeof this[units] === 'function') {
                    this[units](value);
                }
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateUtcOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }

    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
            daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    // alias isUtc for dev-friendliness
    moment.fn.isUTC = moment.fn.isUtc;

    /************************************
     Duration Prototype
     ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
                this._days * 864e5 +
                (this._months % 12) * 2592e6 +
                toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(yearsToDays(this._months / 12));
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        },

        toJSON : function () {
            return this.toISOString();
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
     Default Locale
     ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                    (b === 1) ? 'st' :
                        (b === 2) ? 'nd' :
                            (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // moment.js locale configuration
// locale : afrikaans (af)
// author : Werner Mollentze : https://github.com/wernerm

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('af', {
            months : 'Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember'.split('_'),
            monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des'.split('_'),
            weekdays : 'Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag'.split('_'),
            weekdaysShort : 'Son_Maa_Din_Woe_Don_Vry_Sat'.split('_'),
            weekdaysMin : 'So_Ma_Di_Wo_Do_Vr_Sa'.split('_'),
            meridiemParse: /vm|nm/i,
            isPM : function (input) {
                return /^nm$/i.test(input);
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours < 12) {
                    return isLower ? 'vm' : 'VM';
                } else {
                    return isLower ? 'nm' : 'NM';
                }
            },
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[Vandag om] LT',
                nextDay : '[MГґre om] LT',
                nextWeek : 'dddd [om] LT',
                lastDay : '[Gister om] LT',
                lastWeek : '[Laas] dddd [om] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'oor %s',
                past : '%s gelede',
                s : '\'n paar sekondes',
                m : '\'n minuut',
                mm : '%d minute',
                h : '\'n uur',
                hh : '%d ure',
                d : '\'n dag',
                dd : '%d dae',
                M : '\'n maand',
                MM : '%d maande',
                y : '\'n jaar',
                yy : '%d jaar'
            },
            ordinalParse: /\d{1,2}(ste|de)/,
            ordinal : function (number) {
                return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de'); // Thanks to Joris RГ¶ling : https://github.com/jjupiter
            },
            week : {
                dow : 1, // Maandag is die eerste dag van die week.
                doy : 4  // Die week wat die 4de Januarie bevat is die eerste week van die jaar.
            }
        });
    }));
// moment.js locale configuration
// locale : Moroccan Arabic (ar-ma)
// author : ElFadili Yassine : https://github.com/ElFadiliY
// author : Abdel Said : https://github.com/abdelsaid

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('ar-ma', {
            months : 'ЩЉЩ†Ш§ЩЉШ±_ЩЃШЁШ±Ш§ЩЉШ±_Щ…Ш§Ш±Ші_ШЈШЁШ±ЩЉЩ„_Щ…Ш§ЩЉ_ЩЉЩ€Щ†ЩЉЩ€_ЩЉЩ€Щ„ЩЉЩ€ШІ_ШєШґШЄ_ШґШЄЩ†ШЁШ±_ШЈЩѓШЄЩ€ШЁШ±_Щ†Щ€Щ†ШЁШ±_ШЇШ¬Щ†ШЁШ±'.split('_'),
            monthsShort : 'ЩЉЩ†Ш§ЩЉШ±_ЩЃШЁШ±Ш§ЩЉШ±_Щ…Ш§Ш±Ші_ШЈШЁШ±ЩЉЩ„_Щ…Ш§ЩЉ_ЩЉЩ€Щ†ЩЉЩ€_ЩЉЩ€Щ„ЩЉЩ€ШІ_ШєШґШЄ_ШґШЄЩ†ШЁШ±_ШЈЩѓШЄЩ€ШЁШ±_Щ†Щ€Щ†ШЁШ±_ШЇШ¬Щ†ШЁШ±'.split('_'),
            weekdays : 'Ш§Щ„ШЈШ­ШЇ_Ш§Щ„ШҐШЄЩ†ЩЉЩ†_Ш§Щ„Ш«Щ„Ш§Ш«Ш§ШЎ_Ш§Щ„ШЈШ±ШЁШ№Ш§ШЎ_Ш§Щ„Ш®Щ…ЩЉШі_Ш§Щ„Ш¬Щ…Ш№Ш©_Ш§Щ„ШіШЁШЄ'.split('_'),
            weekdaysShort : 'Ш§Ш­ШЇ_Ш§ШЄЩ†ЩЉЩ†_Ш«Щ„Ш§Ш«Ш§ШЎ_Ш§Ш±ШЁШ№Ш§ШЎ_Ш®Щ…ЩЉШі_Ш¬Щ…Ш№Ш©_ШіШЁШЄ'.split('_'),
            weekdaysMin : 'Ш­_Щ†_Ш«_Ш±_Ш®_Ш¬_Ші'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[Ш§Щ„ЩЉЩ€Щ… Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextDay: '[ШєШЇШ§ Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextWeek: 'dddd [Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastDay: '[ШЈЩ…Ші Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastWeek: 'dddd [Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'ЩЃЩЉ %s',
                past : 'Щ…Щ†Ш° %s',
                s : 'Ш«Щ€Ш§Щ†',
                m : 'ШЇЩ‚ЩЉЩ‚Ш©',
                mm : '%d ШЇЩ‚Ш§Ш¦Щ‚',
                h : 'ШіШ§Ш№Ш©',
                hh : '%d ШіШ§Ш№Ш§ШЄ',
                d : 'ЩЉЩ€Щ…',
                dd : '%d ШЈЩЉШ§Щ…',
                M : 'ШґЩ‡Ш±',
                MM : '%d ШЈШґЩ‡Ш±',
                y : 'ШіЩ†Ш©',
                yy : '%d ШіЩ†Щ€Ш§ШЄ'
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Arabic Saudi Arabia (ar-sa)
// author : Suhail Alkowaileet : https://github.com/xsoh

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
            '1': 'ЩЎ',
            '2': 'Щў',
            '3': 'ЩЈ',
            '4': 'Щ¤',
            '5': 'ЩҐ',
            '6': 'Щ¦',
            '7': 'Щ§',
            '8': 'ЩЁ',
            '9': 'Щ©',
            '0': 'Щ '
        }, numberMap = {
            'ЩЎ': '1',
            'Щў': '2',
            'ЩЈ': '3',
            'Щ¤': '4',
            'ЩҐ': '5',
            'Щ¦': '6',
            'Щ§': '7',
            'ЩЁ': '8',
            'Щ©': '9',
            'Щ ': '0'
        };

        return moment.defineLocale('ar-sa', {
            months : 'ЩЉЩ†Ш§ЩЉШ±_ЩЃШЁШ±Ш§ЩЉШ±_Щ…Ш§Ш±Ші_ШЈШЁШ±ЩЉЩ„_Щ…Ш§ЩЉЩ€_ЩЉЩ€Щ†ЩЉЩ€_ЩЉЩ€Щ„ЩЉЩ€_ШЈШєШіШ·Ші_ШіШЁШЄЩ…ШЁШ±_ШЈЩѓШЄЩ€ШЁШ±_Щ†Щ€ЩЃЩ…ШЁШ±_ШЇЩЉШіЩ…ШЁШ±'.split('_'),
            monthsShort : 'ЩЉЩ†Ш§ЩЉШ±_ЩЃШЁШ±Ш§ЩЉШ±_Щ…Ш§Ш±Ші_ШЈШЁШ±ЩЉЩ„_Щ…Ш§ЩЉЩ€_ЩЉЩ€Щ†ЩЉЩ€_ЩЉЩ€Щ„ЩЉЩ€_ШЈШєШіШ·Ші_ШіШЁШЄЩ…ШЁШ±_ШЈЩѓШЄЩ€ШЁШ±_Щ†Щ€ЩЃЩ…ШЁШ±_ШЇЩЉШіЩ…ШЁШ±'.split('_'),
            weekdays : 'Ш§Щ„ШЈШ­ШЇ_Ш§Щ„ШҐШ«Щ†ЩЉЩ†_Ш§Щ„Ш«Щ„Ш§Ш«Ш§ШЎ_Ш§Щ„ШЈШ±ШЁШ№Ш§ШЎ_Ш§Щ„Ш®Щ…ЩЉШі_Ш§Щ„Ш¬Щ…Ш№Ш©_Ш§Щ„ШіШЁШЄ'.split('_'),
            weekdaysShort : 'ШЈШ­ШЇ_ШҐШ«Щ†ЩЉЩ†_Ш«Щ„Ш§Ш«Ш§ШЎ_ШЈШ±ШЁШ№Ш§ШЎ_Ш®Щ…ЩЉШі_Ш¬Щ…Ш№Ш©_ШіШЁШЄ'.split('_'),
            weekdaysMin : 'Ш­_Щ†_Ш«_Ш±_Ш®_Ш¬_Ші'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'HH:mm:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            meridiemParse: /Шµ|Щ…/,
            isPM : function (input) {
                return 'Щ…' === input;
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return 'Шµ';
                } else {
                    return 'Щ…';
                }
            },
            calendar : {
                sameDay: '[Ш§Щ„ЩЉЩ€Щ… Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextDay: '[ШєШЇШ§ Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextWeek: 'dddd [Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastDay: '[ШЈЩ…Ші Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastWeek: 'dddd [Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'ЩЃЩЉ %s',
                past : 'Щ…Щ†Ш° %s',
                s : 'Ш«Щ€Ш§Щ†',
                m : 'ШЇЩ‚ЩЉЩ‚Ш©',
                mm : '%d ШЇЩ‚Ш§Ш¦Щ‚',
                h : 'ШіШ§Ш№Ш©',
                hh : '%d ШіШ§Ш№Ш§ШЄ',
                d : 'ЩЉЩ€Щ…',
                dd : '%d ШЈЩЉШ§Щ…',
                M : 'ШґЩ‡Ш±',
                MM : '%d ШЈШґЩ‡Ш±',
                y : 'ШіЩ†Ш©',
                yy : '%d ШіЩ†Щ€Ш§ШЄ'
            },
            preparse: function (string) {
                return string.replace(/[ЩЎЩўЩЈЩ¤ЩҐЩ¦Щ§ЩЁЩ©Щ ]/g, function (match) {
                    return numberMap[match];
                }).replace(/ШЊ/g, ',');
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                }).replace(/,/g, 'ШЊ');
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale  : Tunisian Arabic (ar-tn)

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('ar-tn', {
            months: 'Ш¬Ш§Щ†ЩЃЩЉ_ЩЃЩЉЩЃШ±ЩЉ_Щ…Ш§Ш±Ші_ШЈЩЃШ±ЩЉЩ„_Щ…Ш§ЩЉ_Ш¬Щ€Ш§Щ†_Ш¬Щ€ЩЉЩ„ЩЉШ©_ШЈЩ€ШЄ_ШіШЁШЄЩ…ШЁШ±_ШЈЩѓШЄЩ€ШЁШ±_Щ†Щ€ЩЃЩ…ШЁШ±_ШЇЩЉШіЩ…ШЁШ±'.split('_'),
            monthsShort: 'Ш¬Ш§Щ†ЩЃЩЉ_ЩЃЩЉЩЃШ±ЩЉ_Щ…Ш§Ш±Ші_ШЈЩЃШ±ЩЉЩ„_Щ…Ш§ЩЉ_Ш¬Щ€Ш§Щ†_Ш¬Щ€ЩЉЩ„ЩЉШ©_ШЈЩ€ШЄ_ШіШЁШЄЩ…ШЁШ±_ШЈЩѓШЄЩ€ШЁШ±_Щ†Щ€ЩЃЩ…ШЁШ±_ШЇЩЉШіЩ…ШЁШ±'.split('_'),
            weekdays: 'Ш§Щ„ШЈШ­ШЇ_Ш§Щ„ШҐШ«Щ†ЩЉЩ†_Ш§Щ„Ш«Щ„Ш§Ш«Ш§ШЎ_Ш§Щ„ШЈШ±ШЁШ№Ш§ШЎ_Ш§Щ„Ш®Щ…ЩЉШі_Ш§Щ„Ш¬Щ…Ш№Ш©_Ш§Щ„ШіШЁШЄ'.split('_'),
            weekdaysShort: 'ШЈШ­ШЇ_ШҐШ«Щ†ЩЉЩ†_Ш«Щ„Ш§Ш«Ш§ШЎ_ШЈШ±ШЁШ№Ш§ШЎ_Ш®Щ…ЩЉШі_Ш¬Щ…Ш№Ш©_ШіШЁШЄ'.split('_'),
            weekdaysMin: 'Ш­_Щ†_Ш«_Ш±_Ш®_Ш¬_Ші'.split('_'),
            longDateFormat: {
                LT: 'HH:mm',
                LTS: 'LT:ss',
                L: 'DD/MM/YYYY',
                LL: 'D MMMM YYYY',
                LLL: 'D MMMM YYYY LT',
                LLLL: 'dddd D MMMM YYYY LT'
            },
            calendar: {
                sameDay: '[Ш§Щ„ЩЉЩ€Щ… Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextDay: '[ШєШЇШ§ Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextWeek: 'dddd [Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastDay: '[ШЈЩ…Ші Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastWeek: 'dddd [Ш№Щ„Щ‰ Ш§Щ„ШіШ§Ш№Ш©] LT',
                sameElse: 'L'
            },
            relativeTime: {
                future: 'ЩЃЩЉ %s',
                past: 'Щ…Щ†Ш° %s',
                s: 'Ш«Щ€Ш§Щ†',
                m: 'ШЇЩ‚ЩЉЩ‚Ш©',
                mm: '%d ШЇЩ‚Ш§Ш¦Щ‚',
                h: 'ШіШ§Ш№Ш©',
                hh: '%d ШіШ§Ш№Ш§ШЄ',
                d: 'ЩЉЩ€Щ…',
                dd: '%d ШЈЩЉШ§Щ…',
                M: 'ШґЩ‡Ш±',
                MM: '%d ШЈШґЩ‡Ш±',
                y: 'ШіЩ†Ш©',
                yy: '%d ШіЩ†Щ€Ш§ШЄ'
            },
            week: {
                dow: 1, // Monday is the first day of the week.
                doy: 4 // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// Locale: Arabic (ar)
// Author: Abdel Said: https://github.com/abdelsaid
// Changes in months, weekdays: Ahmed Elkhatib
// Native plural forms: forabi https://github.com/forabi

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
            '1': 'ЩЎ',
            '2': 'Щў',
            '3': 'ЩЈ',
            '4': 'Щ¤',
            '5': 'ЩҐ',
            '6': 'Щ¦',
            '7': 'Щ§',
            '8': 'ЩЁ',
            '9': 'Щ©',
            '0': 'Щ '
        }, numberMap = {
            'ЩЎ': '1',
            'Щў': '2',
            'ЩЈ': '3',
            'Щ¤': '4',
            'ЩҐ': '5',
            'Щ¦': '6',
            'Щ§': '7',
            'ЩЁ': '8',
            'Щ©': '9',
            'Щ ': '0'
        }, pluralForm = function (n) {
            return n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5;
        }, plurals = {
            s : ['ШЈЩ‚Щ„ Щ…Щ† Ш«Ш§Щ†ЩЉШ©', 'Ш«Ш§Щ†ЩЉШ© Щ€Ш§Ш­ШЇШ©', ['Ш«Ш§Щ†ЩЉШЄШ§Щ†', 'Ш«Ш§Щ†ЩЉШЄЩЉЩ†'], '%d Ш«Щ€Ш§Щ†', '%d Ш«Ш§Щ†ЩЉШ©', '%d Ш«Ш§Щ†ЩЉШ©'],
            m : ['ШЈЩ‚Щ„ Щ…Щ† ШЇЩ‚ЩЉЩ‚Ш©', 'ШЇЩ‚ЩЉЩ‚Ш© Щ€Ш§Ш­ШЇШ©', ['ШЇЩ‚ЩЉЩ‚ШЄШ§Щ†', 'ШЇЩ‚ЩЉЩ‚ШЄЩЉЩ†'], '%d ШЇЩ‚Ш§Ш¦Щ‚', '%d ШЇЩ‚ЩЉЩ‚Ш©', '%d ШЇЩ‚ЩЉЩ‚Ш©'],
            h : ['ШЈЩ‚Щ„ Щ…Щ† ШіШ§Ш№Ш©', 'ШіШ§Ш№Ш© Щ€Ш§Ш­ШЇШ©', ['ШіШ§Ш№ШЄШ§Щ†', 'ШіШ§Ш№ШЄЩЉЩ†'], '%d ШіШ§Ш№Ш§ШЄ', '%d ШіШ§Ш№Ш©', '%d ШіШ§Ш№Ш©'],
            d : ['ШЈЩ‚Щ„ Щ…Щ† ЩЉЩ€Щ…', 'ЩЉЩ€Щ… Щ€Ш§Ш­ШЇ', ['ЩЉЩ€Щ…Ш§Щ†', 'ЩЉЩ€Щ…ЩЉЩ†'], '%d ШЈЩЉШ§Щ…', '%d ЩЉЩ€Щ…Щ‹Ш§', '%d ЩЉЩ€Щ…'],
            M : ['ШЈЩ‚Щ„ Щ…Щ† ШґЩ‡Ш±', 'ШґЩ‡Ш± Щ€Ш§Ш­ШЇ', ['ШґЩ‡Ш±Ш§Щ†', 'ШґЩ‡Ш±ЩЉЩ†'], '%d ШЈШґЩ‡Ш±', '%d ШґЩ‡Ш±Ш§', '%d ШґЩ‡Ш±'],
            y : ['ШЈЩ‚Щ„ Щ…Щ† Ш№Ш§Щ…', 'Ш№Ш§Щ… Щ€Ш§Ш­ШЇ', ['Ш№Ш§Щ…Ш§Щ†', 'Ш№Ш§Щ…ЩЉЩ†'], '%d ШЈШ№Щ€Ш§Щ…', '%d Ш№Ш§Щ…Щ‹Ш§', '%d Ш№Ш§Щ…']
        }, pluralize = function (u) {
            return function (number, withoutSuffix, string, isFuture) {
                var f = pluralForm(number),
                    str = plurals[u][pluralForm(number)];
                if (f === 2) {
                    str = str[withoutSuffix ? 0 : 1];
                }
                return str.replace(/%d/i, number);
            };
        }, months = [
            'ЩѓШ§Щ†Щ€Щ† Ш§Щ„Ш«Ш§Щ†ЩЉ ЩЉЩ†Ш§ЩЉШ±',
            'ШґШЁШ§Ш· ЩЃШЁШ±Ш§ЩЉШ±',
            'ШўШ°Ш§Ш± Щ…Ш§Ш±Ші',
            'Щ†ЩЉШіШ§Щ† ШЈШЁШ±ЩЉЩ„',
            'ШЈЩЉШ§Ш± Щ…Ш§ЩЉЩ€',
            'Ш­ШІЩЉШ±Ш§Щ† ЩЉЩ€Щ†ЩЉЩ€',
            'ШЄЩ…Щ€ШІ ЩЉЩ€Щ„ЩЉЩ€',
            'ШўШЁ ШЈШєШіШ·Ші',
            'ШЈЩЉЩ„Щ€Щ„ ШіШЁШЄЩ…ШЁШ±',
            'ШЄШґШ±ЩЉЩ† Ш§Щ„ШЈЩ€Щ„ ШЈЩѓШЄЩ€ШЁШ±',
            'ШЄШґШ±ЩЉЩ† Ш§Щ„Ш«Ш§Щ†ЩЉ Щ†Щ€ЩЃЩ…ШЁШ±',
            'ЩѓШ§Щ†Щ€Щ† Ш§Щ„ШЈЩ€Щ„ ШЇЩЉШіЩ…ШЁШ±'
        ];

        return moment.defineLocale('ar', {
            months : months,
            monthsShort : months,
            weekdays : 'Ш§Щ„ШЈШ­ШЇ_Ш§Щ„ШҐШ«Щ†ЩЉЩ†_Ш§Щ„Ш«Щ„Ш§Ш«Ш§ШЎ_Ш§Щ„ШЈШ±ШЁШ№Ш§ШЎ_Ш§Щ„Ш®Щ…ЩЉШі_Ш§Щ„Ш¬Щ…Ш№Ш©_Ш§Щ„ШіШЁШЄ'.split('_'),
            weekdaysShort : 'ШЈШ­ШЇ_ШҐШ«Щ†ЩЉЩ†_Ш«Щ„Ш§Ш«Ш§ШЎ_ШЈШ±ШЁШ№Ш§ШЎ_Ш®Щ…ЩЉШі_Ш¬Щ…Ш№Ш©_ШіШЁШЄ'.split('_'),
            weekdaysMin : 'Ш­_Щ†_Ш«_Ш±_Ш®_Ш¬_Ші'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'HH:mm:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            meridiemParse: /Шµ|Щ…/,
            isPM : function (input) {
                return 'Щ…' === input;
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return 'Шµ';
                } else {
                    return 'Щ…';
                }
            },
            calendar : {
                sameDay: '[Ш§Щ„ЩЉЩ€Щ… Ш№Щ†ШЇ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextDay: '[ШєШЇЩ‹Ш§ Ш№Щ†ШЇ Ш§Щ„ШіШ§Ш№Ш©] LT',
                nextWeek: 'dddd [Ш№Щ†ШЇ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastDay: '[ШЈЩ…Ші Ш№Щ†ШЇ Ш§Щ„ШіШ§Ш№Ш©] LT',
                lastWeek: 'dddd [Ш№Щ†ШЇ Ш§Щ„ШіШ§Ш№Ш©] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'ШЁШ№ШЇ %s',
                past : 'Щ…Щ†Ш° %s',
                s : pluralize('s'),
                m : pluralize('m'),
                mm : pluralize('m'),
                h : pluralize('h'),
                hh : pluralize('h'),
                d : pluralize('d'),
                dd : pluralize('d'),
                M : pluralize('M'),
                MM : pluralize('M'),
                y : pluralize('y'),
                yy : pluralize('y')
            },
            preparse: function (string) {
                return string.replace(/[ЩЎЩўЩЈЩ¤ЩҐЩ¦Щ§ЩЁЩ©Щ ]/g, function (match) {
                    return numberMap[match];
                }).replace(/ШЊ/g, ',');
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                }).replace(/,/g, 'ШЊ');
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : azerbaijani (az)
// author : topchiyev : https://github.com/topchiyev

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var suffixes = {
            1: '-inci',
            5: '-inci',
            8: '-inci',
            70: '-inci',
            80: '-inci',

            2: '-nci',
            7: '-nci',
            20: '-nci',
            50: '-nci',

            3: '-ГјncГј',
            4: '-ГјncГј',
            100: '-ГјncГј',

            6: '-ncД±',

            9: '-uncu',
            10: '-uncu',
            30: '-uncu',

            60: '-Д±ncД±',
            90: '-Д±ncД±'
        };
        return moment.defineLocale('az', {
            months : 'yanvar_fevral_mart_aprel_may_iyun_iyul_avqust_sentyabr_oktyabr_noyabr_dekabr'.split('_'),
            monthsShort : 'yan_fev_mar_apr_may_iyn_iyl_avq_sen_okt_noy_dek'.split('_'),
            weekdays : 'Bazar_Bazar ertЙ™si_Г‡Й™rЕџЙ™nbЙ™ axЕџamД±_Г‡Й™rЕџЙ™nbЙ™_CГјmЙ™ axЕџamД±_CГјmЙ™_ЕћЙ™nbЙ™'.split('_'),
            weekdaysShort : 'Baz_BzE_Г‡Ax_Г‡Й™r_CAx_CГјm_ЕћЙ™n'.split('_'),
            weekdaysMin : 'Bz_BE_Г‡A_Г‡Й™_CA_CГј_ЕћЙ™'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[bugГјn saat] LT',
                nextDay : '[sabah saat] LT',
                nextWeek : '[gЙ™lЙ™n hЙ™ftЙ™] dddd [saat] LT',
                lastDay : '[dГјnЙ™n] LT',
                lastWeek : '[keГ§Й™n hЙ™ftЙ™] dddd [saat] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s sonra',
                past : '%s Й™vvЙ™l',
                s : 'birneГ§Й™ saniyyЙ™',
                m : 'bir dЙ™qiqЙ™',
                mm : '%d dЙ™qiqЙ™',
                h : 'bir saat',
                hh : '%d saat',
                d : 'bir gГјn',
                dd : '%d gГјn',
                M : 'bir ay',
                MM : '%d ay',
                y : 'bir il',
                yy : '%d il'
            },
            meridiemParse: /gecЙ™|sЙ™hЙ™r|gГјndГјz|axЕџam/,
            isPM : function (input) {
                return /^(gГјndГјz|axЕџam)$/.test(input);
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'gecЙ™';
                } else if (hour < 12) {
                    return 'sЙ™hЙ™r';
                } else if (hour < 17) {
                    return 'gГјndГјz';
                } else {
                    return 'axЕџam';
                }
            },
            ordinalParse: /\d{1,2}-(Д±ncД±|inci|nci|ГјncГј|ncД±|uncu)/,
            ordinal : function (number) {
                if (number === 0) {  // special case for zero
                    return number + '-Д±ncД±';
                }
                var a = number % 10,
                    b = number % 100 - a,
                    c = number >= 100 ? 100 : null;

                return number + (suffixes[a] || suffixes[b] || suffixes[c]);
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : belarusian (be)
// author : Dmitry Demidov : https://github.com/demidov91
// author: Praleska: http://praleska.pro/
// Author : Menelion ElensГєle : https://github.com/Oire

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function plural(word, num) {
            var forms = word.split('_');
            return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
        }

        function relativeTimeWithPlural(number, withoutSuffix, key) {
            var format = {
                'mm': withoutSuffix ? 'С…РІС–Р»С–РЅР°_С…РІС–Р»С–РЅС‹_С…РІС–Р»С–РЅ' : 'С…РІС–Р»С–РЅСѓ_С…РІС–Р»С–РЅС‹_С…РІС–Р»С–РЅ',
                'hh': withoutSuffix ? 'РіР°РґР·С–РЅР°_РіР°РґР·С–РЅС‹_РіР°РґР·С–РЅ' : 'РіР°РґР·С–РЅСѓ_РіР°РґР·С–РЅС‹_РіР°РґР·С–РЅ',
                'dd': 'РґР·РµРЅСЊ_РґРЅС–_РґР·С‘РЅ',
                'MM': 'РјРµСЃСЏС†_РјРµСЃСЏС†С‹_РјРµСЃСЏС†Р°Сћ',
                'yy': 'РіРѕРґ_РіР°РґС‹_РіР°РґРѕСћ'
            };
            if (key === 'm') {
                return withoutSuffix ? 'С…РІС–Р»С–РЅР°' : 'С…РІС–Р»С–РЅСѓ';
            }
            else if (key === 'h') {
                return withoutSuffix ? 'РіР°РґР·С–РЅР°' : 'РіР°РґР·С–РЅСѓ';
            }
            else {
                return number + ' ' + plural(format[key], +number);
            }
        }

        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'СЃС‚СѓРґР·РµРЅСЊ_Р»СЋС‚С‹_СЃР°РєР°РІС–Рє_РєСЂР°СЃР°РІС–Рє_С‚СЂР°РІРµРЅСЊ_С‡СЌСЂРІРµРЅСЊ_Р»С–РїРµРЅСЊ_Р¶РЅС–РІРµРЅСЊ_РІРµСЂР°СЃРµРЅСЊ_РєР°СЃС‚СЂС‹С‡РЅС–Рє_Р»С–СЃС‚Р°РїР°Рґ_СЃРЅРµР¶Р°РЅСЊ'.split('_'),
                    'accusative': 'СЃС‚СѓРґР·РµРЅСЏ_Р»СЋС‚Р°РіР°_СЃР°РєР°РІС–РєР°_РєСЂР°СЃР°РІС–РєР°_С‚СЂР°СћРЅСЏ_С‡СЌСЂРІРµРЅСЏ_Р»С–РїРµРЅСЏ_Р¶РЅС–СћРЅСЏ_РІРµСЂР°СЃРЅСЏ_РєР°СЃС‚СЂС‹С‡РЅС–РєР°_Р»С–СЃС‚Р°РїР°РґР°_СЃРЅРµР¶РЅСЏ'.split('_')
                },

                nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = {
                    'nominative': 'РЅСЏРґР·РµР»СЏ_РїР°РЅСЏРґР·РµР»Р°Рє_Р°СћС‚РѕСЂР°Рє_СЃРµСЂР°РґР°_С‡Р°С†РІРµСЂ_РїСЏС‚РЅС–С†Р°_СЃСѓР±РѕС‚Р°'.split('_'),
                    'accusative': 'РЅСЏРґР·РµР»СЋ_РїР°РЅСЏРґР·РµР»Р°Рє_Р°СћС‚РѕСЂР°Рє_СЃРµСЂР°РґСѓ_С‡Р°С†РІРµСЂ_РїСЏС‚РЅС–С†Сѓ_СЃСѓР±РѕС‚Сѓ'.split('_')
                },

                nounCase = (/\[ ?[Р’РІ] ?(?:РјС–РЅСѓР»СѓСЋ|РЅР°СЃС‚СѓРїРЅСѓСЋ)? ?\] ?dddd/).test(format) ?
                    'accusative' :
                    'nominative';

            return weekdays[nounCase][m.day()];
        }

        return moment.defineLocale('be', {
            months : monthsCaseReplace,
            monthsShort : 'СЃС‚СѓРґ_Р»СЋС‚_СЃР°Рє_РєСЂР°СЃ_С‚СЂР°РІ_С‡СЌСЂРІ_Р»С–Рї_Р¶РЅС–РІ_РІРµСЂ_РєР°СЃС‚_Р»С–СЃС‚_СЃРЅРµР¶'.split('_'),
            weekdays : weekdaysCaseReplace,
            weekdaysShort : 'РЅРґ_РїРЅ_Р°С‚_СЃСЂ_С‡С†_РїС‚_СЃР±'.split('_'),
            weekdaysMin : 'РЅРґ_РїРЅ_Р°С‚_СЃСЂ_С‡С†_РїС‚_СЃР±'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY Рі.',
                LLL : 'D MMMM YYYY Рі., LT',
                LLLL : 'dddd, D MMMM YYYY Рі., LT'
            },
            calendar : {
                sameDay: '[РЎС‘РЅРЅСЏ Сћ] LT',
                nextDay: '[Р—Р°СћС‚СЂР° Сћ] LT',
                lastDay: '[РЈС‡РѕСЂР° Сћ] LT',
                nextWeek: function () {
                    return '[РЈ] dddd [Сћ] LT';
                },
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 5:
                        case 6:
                            return '[РЈ РјС–РЅСѓР»СѓСЋ] dddd [Сћ] LT';
                        case 1:
                        case 2:
                        case 4:
                            return '[РЈ РјС–РЅСѓР»С‹] dddd [Сћ] LT';
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'РїСЂР°Р· %s',
                past : '%s С‚Р°РјСѓ',
                s : 'РЅРµРєР°Р»СЊРєС– СЃРµРєСѓРЅРґ',
                m : relativeTimeWithPlural,
                mm : relativeTimeWithPlural,
                h : relativeTimeWithPlural,
                hh : relativeTimeWithPlural,
                d : 'РґР·РµРЅСЊ',
                dd : relativeTimeWithPlural,
                M : 'РјРµСЃСЏС†',
                MM : relativeTimeWithPlural,
                y : 'РіРѕРґ',
                yy : relativeTimeWithPlural
            },
            meridiemParse: /РЅРѕС‡С‹|СЂР°РЅС–С†С‹|РґРЅСЏ|РІРµС‡Р°СЂР°/,
            isPM : function (input) {
                return /^(РґРЅСЏ|РІРµС‡Р°СЂР°)$/.test(input);
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'РЅРѕС‡С‹';
                } else if (hour < 12) {
                    return 'СЂР°РЅС–С†С‹';
                } else if (hour < 17) {
                    return 'РґРЅСЏ';
                } else {
                    return 'РІРµС‡Р°СЂР°';
                }
            },

            ordinalParse: /\d{1,2}-(С–|С‹|РіР°)/,
            ordinal: function (number, period) {
                switch (period) {
                    case 'M':
                    case 'd':
                    case 'DDD':
                    case 'w':
                    case 'W':
                        return (number % 10 === 2 || number % 10 === 3) && (number % 100 !== 12 && number % 100 !== 13) ? number + '-С–' : number + '-С‹';
                    case 'D':
                        return number + '-РіР°';
                    default:
                        return number;
                }
            },

            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : bulgarian (bg)
// author : Krasen Borisov : https://github.com/kraz

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('bg', {
            months : 'СЏРЅСѓР°СЂРё_С„РµРІСЂСѓР°СЂРё_РјР°СЂС‚_Р°РїСЂРёР»_РјР°Р№_СЋРЅРё_СЋР»Рё_Р°РІРіСѓСЃС‚_СЃРµРїС‚РµРјРІСЂРё_РѕРєС‚РѕРјРІСЂРё_РЅРѕРµРјРІСЂРё_РґРµРєРµРјРІСЂРё'.split('_'),
            monthsShort : 'СЏРЅСЂ_С„РµРІ_РјР°СЂ_Р°РїСЂ_РјР°Р№_СЋРЅРё_СЋР»Рё_Р°РІРі_СЃРµРї_РѕРєС‚_РЅРѕРµ_РґРµРє'.split('_'),
            weekdays : 'РЅРµРґРµР»СЏ_РїРѕРЅРµРґРµР»РЅРёРє_РІС‚РѕСЂРЅРёРє_СЃСЂСЏРґР°_С‡РµС‚РІСЉСЂС‚СЉРє_РїРµС‚СЉРє_СЃСЉР±РѕС‚Р°'.split('_'),
            weekdaysShort : 'РЅРµРґ_РїРѕРЅ_РІС‚Рѕ_СЃСЂСЏ_С‡РµС‚_РїРµС‚_СЃСЉР±'.split('_'),
            weekdaysMin : 'РЅРґ_РїРЅ_РІС‚_СЃСЂ_С‡С‚_РїС‚_СЃР±'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'D.MM.YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[Р”РЅРµСЃ РІ] LT',
                nextDay : '[РЈС‚СЂРµ РІ] LT',
                nextWeek : 'dddd [РІ] LT',
                lastDay : '[Р’С‡РµСЂР° РІ] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 6:
                            return '[Р’ РёР·РјРёРЅР°Р»Р°С‚Р°] dddd [РІ] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[Р’ РёР·РјРёРЅР°Р»РёСЏ] dddd [РІ] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'СЃР»РµРґ %s',
                past : 'РїСЂРµРґРё %s',
                s : 'РЅСЏРєРѕР»РєРѕ СЃРµРєСѓРЅРґРё',
                m : 'РјРёРЅСѓС‚Р°',
                mm : '%d РјРёРЅСѓС‚Рё',
                h : 'С‡Р°СЃ',
                hh : '%d С‡Р°СЃР°',
                d : 'РґРµРЅ',
                dd : '%d РґРЅРё',
                M : 'РјРµСЃРµС†',
                MM : '%d РјРµСЃРµС†Р°',
                y : 'РіРѕРґРёРЅР°',
                yy : '%d РіРѕРґРёРЅРё'
            },
            ordinalParse: /\d{1,2}-(РµРІ|РµРЅ|С‚Рё|РІРё|СЂРё|РјРё)/,
            ordinal : function (number) {
                var lastDigit = number % 10,
                    last2Digits = number % 100;
                if (number === 0) {
                    return number + '-РµРІ';
                } else if (last2Digits === 0) {
                    return number + '-РµРЅ';
                } else if (last2Digits > 10 && last2Digits < 20) {
                    return number + '-С‚Рё';
                } else if (lastDigit === 1) {
                    return number + '-РІРё';
                } else if (lastDigit === 2) {
                    return number + '-СЂРё';
                } else if (lastDigit === 7 || lastDigit === 8) {
                    return number + '-РјРё';
                } else {
                    return number + '-С‚Рё';
                }
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Bengali (bn)
// author : Kaushik Gandhi : https://github.com/kaushikgandhi

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'а§§',
                '2': 'а§Ё',
                '3': 'а§©',
                '4': 'а§Є',
                '5': 'а§«',
                '6': 'а§¬',
                '7': 'а§­',
                '8': 'а§®',
                '9': 'а§Ї',
                '0': 'а§¦'
            },
            numberMap = {
                'а§§': '1',
                'а§Ё': '2',
                'а§©': '3',
                'а§Є': '4',
                'а§«': '5',
                'а§¬': '6',
                'а§­': '7',
                'а§®': '8',
                'а§Ї': '9',
                'а§¦': '0'
            };

        return moment.defineLocale('bn', {
            months : 'а¦ња¦ѕа¦Ёа§Ѓа§џа¦ѕа¦°а§Ђ_а¦«а§‡а¦¬а§Ѓа§џа¦ѕа¦°а§Ђ_а¦®а¦ѕа¦°а§Ќа¦љ_а¦Џа¦Єа§Ќа¦°а¦їа¦І_а¦®а§‡_а¦ња§Ѓа¦Ё_а¦ња§Ѓа¦Іа¦ѕа¦‡_а¦…а¦—а¦ѕа¦ёа§Ќа¦џ_а¦ёа§‡а¦Єа§Ќа¦џа§‡а¦®а§Ќа¦¬а¦°_а¦…а¦•а§Ќа¦џа§‹а¦¬а¦°_а¦Ёа¦­а§‡а¦®а§Ќа¦¬а¦°_а¦Ўа¦їа¦ёа§‡а¦®а§Ќа¦¬а¦°'.split('_'),
            monthsShort : 'а¦ња¦ѕа¦Ёа§Ѓ_а¦«а§‡а¦¬_а¦®а¦ѕа¦°а§Ќа¦љ_а¦Џа¦Єа¦°_а¦®а§‡_а¦ња§Ѓа¦Ё_а¦ња§Ѓа¦І_а¦…а¦—_а¦ёа§‡а¦Єа§Ќа¦џ_а¦…а¦•а§Ќа¦џа§‹_а¦Ёа¦­_а¦Ўа¦їа¦ёа§‡а¦®а§Ќ'.split('_'),
            weekdays : 'а¦°а¦¬а¦їа¦¬а¦ѕа¦°_а¦ёа§‹а¦®а¦¬а¦ѕа¦°_а¦®а¦™а§Ќа¦—а¦Іа¦¬а¦ѕа¦°_а¦¬а§Ѓа¦§а¦¬а¦ѕа¦°_а¦¬а§ѓа¦№а¦ёа§Ќа¦Єа¦¤а§Ќа¦¤а¦їа¦¬а¦ѕа¦°_а¦¶а§Ѓа¦•а§Ќа¦°а§Ѓа¦¬а¦ѕа¦°_а¦¶а¦Ёа¦їа¦¬а¦ѕа¦°'.split('_'),
            weekdaysShort : 'а¦°а¦¬а¦ї_а¦ёа§‹а¦®_а¦®а¦™а§Ќа¦—а¦І_а¦¬а§Ѓа¦§_а¦¬а§ѓа¦№а¦ёа§Ќа¦Єа¦¤а§Ќа¦¤а¦ї_а¦¶а§Ѓа¦•а§Ќа¦°а§Ѓ_а¦¶а¦Ёа¦ї'.split('_'),
            weekdaysMin : 'а¦°а¦¬_а¦ёа¦®_а¦®а¦™а§Ќа¦—_а¦¬а§Ѓ_а¦¬а§Ќа¦°а¦їа¦№_а¦¶а§Ѓ_а¦¶а¦Ёа¦ї'.split('_'),
            longDateFormat : {
                LT : 'A h:mm а¦ёа¦®а§џ',
                LTS : 'A h:mm:ss а¦ёа¦®а§џ',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY, LT',
                LLLL : 'dddd, D MMMM YYYY, LT'
            },
            calendar : {
                sameDay : '[а¦†а¦њ] LT',
                nextDay : '[а¦†а¦—а¦ѕа¦®а§Ђа¦•а¦ѕа¦І] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[а¦—а¦¤а¦•а¦ѕа¦І] LT',
                lastWeek : '[а¦—а¦¤] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s а¦Єа¦°а§‡',
                past : '%s а¦†а¦—а§‡',
                s : 'а¦•а¦Џа¦• а¦ёа§‡а¦•а§‡а¦Ёа§Ќа¦Ў',
                m : 'а¦Џа¦• а¦®а¦їа¦Ёа¦їа¦џ',
                mm : '%d а¦®а¦їа¦Ёа¦їа¦џ',
                h : 'а¦Џа¦• а¦а¦Ёа§Ќа¦џа¦ѕ',
                hh : '%d а¦а¦Ёа§Ќа¦џа¦ѕ',
                d : 'а¦Џа¦• а¦¦а¦їа¦Ё',
                dd : '%d а¦¦а¦їа¦Ё',
                M : 'а¦Џа¦• а¦®а¦ѕа¦ё',
                MM : '%d а¦®а¦ѕа¦ё',
                y : 'а¦Џа¦• а¦¬а¦›а¦°',
                yy : '%d а¦¬а¦›а¦°'
            },
            preparse: function (string) {
                return string.replace(/[а§§а§Ёа§©а§Єа§«а§¬а§­а§®а§Їа§¦]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            meridiemParse: /а¦°а¦ѕа¦¤|а¦¶а¦•а¦ѕа¦І|а¦¦а§Ѓа¦Єа§Ѓа¦°|а¦¬а¦їа¦•а§‡а¦І|а¦°а¦ѕа¦¤/,
            isPM: function (input) {
                return /^(а¦¦а§Ѓа¦Єа§Ѓа¦°|а¦¬а¦їа¦•а§‡а¦І|а¦°а¦ѕа¦¤)$/.test(input);
            },
            //Bengali is a vast language its spoken
            //in different forms in various parts of the world.
            //I have just generalized with most common one used
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'а¦°а¦ѕа¦¤';
                } else if (hour < 10) {
                    return 'а¦¶а¦•а¦ѕа¦І';
                } else if (hour < 17) {
                    return 'а¦¦а§Ѓа¦Єа§Ѓа¦°';
                } else if (hour < 20) {
                    return 'а¦¬а¦їа¦•а§‡а¦І';
                } else {
                    return 'а¦°а¦ѕа¦¤';
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : tibetan (bo)
// author : Thupten N. Chakrishar : https://github.com/vajradog

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'ајЎ',
                '2': 'ајў',
                '3': 'ајЈ',
                '4': 'ај¤',
                '5': 'ајҐ',
                '6': 'ај¦',
                '7': 'ај§',
                '8': 'ајЁ',
                '9': 'ај©',
                '0': 'ај '
            },
            numberMap = {
                'ајЎ': '1',
                'ајў': '2',
                'ајЈ': '3',
                'ај¤': '4',
                'ајҐ': '5',
                'ај¦': '6',
                'ај§': '7',
                'ајЁ': '8',
                'ај©': '9',
                'ај ': '0'
            };

        return moment.defineLocale('bo', {
            months : 'аЅџаѕіај‹аЅ–ај‹аЅ‘аЅ„ај‹аЅ”аЅј_аЅџаѕіај‹аЅ–ај‹аЅ‚аЅ‰аЅІаЅ¦ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ‚аЅ¦аЅґаЅај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅћаЅІај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅЈаѕ”ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ‘аѕІаЅґаЅ‚ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ‘аЅґаЅ“ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅўаѕ’аѕ±аЅ‘ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ‘аЅ‚аЅґај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ…аЅґај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ…аЅґај‹аЅ‚аЅ…аЅІаЅ‚ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ…аЅґај‹аЅ‚аЅ‰аЅІаЅ¦ај‹аЅ”'.split('_'),
            monthsShort : 'аЅџаѕіај‹аЅ–ај‹аЅ‘аЅ„ај‹аЅ”аЅј_аЅџаѕіај‹аЅ–ај‹аЅ‚аЅ‰аЅІаЅ¦ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ‚аЅ¦аЅґаЅај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅћаЅІај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅЈаѕ”ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ‘аѕІаЅґаЅ‚ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ‘аЅґаЅ“ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅўаѕ’аѕ±аЅ‘ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ‘аЅ‚аЅґај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ…аЅґај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ…аЅґај‹аЅ‚аЅ…аЅІаЅ‚ај‹аЅ”_аЅџаѕіај‹аЅ–ај‹аЅ–аЅ…аЅґај‹аЅ‚аЅ‰аЅІаЅ¦ај‹аЅ”'.split('_'),
            weekdays : 'аЅ‚аЅџаЅ ај‹аЅ‰аЅІај‹аЅај‹_аЅ‚аЅџаЅ ај‹аЅџаѕіај‹аЅ–ај‹_аЅ‚аЅџаЅ ај‹аЅаЅІаЅ‚ај‹аЅ‘аЅаЅўај‹_аЅ‚аЅџаЅ ај‹аЅЈаѕ·аЅ‚ај‹аЅ”ај‹_аЅ‚аЅџаЅ ај‹аЅ•аЅґаЅўај‹аЅ–аЅґ_аЅ‚аЅџаЅ ај‹аЅ”ај‹аЅ¦аЅ„аЅ¦ај‹_аЅ‚аЅџаЅ ај‹аЅ¦аѕ¤аЅєаЅ“ај‹аЅ”ај‹'.split('_'),
            weekdaysShort : 'аЅ‰аЅІај‹аЅај‹_аЅџаѕіај‹аЅ–ај‹_аЅаЅІаЅ‚ај‹аЅ‘аЅаЅўај‹_аЅЈаѕ·аЅ‚ај‹аЅ”ај‹_аЅ•аЅґаЅўај‹аЅ–аЅґ_аЅ”ај‹аЅ¦аЅ„аЅ¦ај‹_аЅ¦аѕ¤аЅєаЅ“ај‹аЅ”ај‹'.split('_'),
            weekdaysMin : 'аЅ‰аЅІај‹аЅај‹_аЅџаѕіај‹аЅ–ај‹_аЅаЅІаЅ‚ај‹аЅ‘аЅаЅўај‹_аЅЈаѕ·аЅ‚ај‹аЅ”ај‹_аЅ•аЅґаЅўај‹аЅ–аЅґ_аЅ”ај‹аЅ¦аЅ„аЅ¦ај‹_аЅ¦аѕ¤аЅєаЅ“ај‹аЅ”ај‹'.split('_'),
            longDateFormat : {
                LT : 'A h:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY, LT',
                LLLL : 'dddd, D MMMM YYYY, LT'
            },
            calendar : {
                sameDay : '[аЅ‘аЅІај‹аЅўаЅІаЅ„] LT',
                nextDay : '[аЅ¦аЅ„ај‹аЅ‰аЅІаЅ“] LT',
                nextWeek : '[аЅ–аЅ‘аЅґаЅ“ај‹аЅ•аѕІаЅ‚ај‹аЅўаѕ—аЅєаЅ¦ај‹аЅ], LT',
                lastDay : '[аЅЃај‹аЅ¦аЅ„] LT',
                lastWeek : '[аЅ–аЅ‘аЅґаЅ“ај‹аЅ•аѕІаЅ‚ај‹аЅаЅђаЅ ај‹аЅ] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s аЅЈај‹',
                past : '%s аЅ¦аѕ”аЅ“ај‹аЅЈ',
                s : 'аЅЈаЅај‹аЅ¦аЅ„',
                m : 'аЅ¦аѕђаЅўај‹аЅај‹аЅ‚аЅ…аЅІаЅ‚',
                mm : '%d аЅ¦аѕђаЅўај‹аЅ',
                h : 'аЅ†аЅґај‹аЅљаЅјаЅ‘ај‹аЅ‚аЅ…аЅІаЅ‚',
                hh : '%d аЅ†аЅґај‹аЅљаЅјаЅ‘',
                d : 'аЅ‰аЅІаЅ“ај‹аЅ‚аЅ…аЅІаЅ‚',
                dd : '%d аЅ‰аЅІаЅ“ај‹',
                M : 'аЅџаѕіај‹аЅ–ај‹аЅ‚аЅ…аЅІаЅ‚',
                MM : '%d аЅџаѕіај‹аЅ–',
                y : 'аЅЈаЅјај‹аЅ‚аЅ…аЅІаЅ‚',
                yy : '%d аЅЈаЅј'
            },
            preparse: function (string) {
                return string.replace(/[ајЎајўајЈај¤ајҐај¦ај§ајЁај©ај ]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            meridiemParse: /аЅаЅљаЅ“ај‹аЅаЅј|аЅћаЅјаЅ‚аЅ¦ај‹аЅЂаЅ¦|аЅ‰аЅІаЅ“ај‹аЅ‚аЅґаЅ„|аЅ‘аЅ‚аЅјаЅ„ај‹аЅ‘аЅ‚|аЅаЅљаЅ“ај‹аЅаЅј/,
            isPM: function (input) {
                return /^(аЅ‰аЅІаЅ“ај‹аЅ‚аЅґаЅ„|аЅ‘аЅ‚аЅјаЅ„ај‹аЅ‘аЅ‚|аЅаЅљаЅ“ај‹аЅаЅј)$/.test(input);
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'аЅаЅљаЅ“ај‹аЅаЅј';
                } else if (hour < 10) {
                    return 'аЅћаЅјаЅ‚аЅ¦ај‹аЅЂаЅ¦';
                } else if (hour < 17) {
                    return 'аЅ‰аЅІаЅ“ај‹аЅ‚аЅґаЅ„';
                } else if (hour < 20) {
                    return 'аЅ‘аЅ‚аЅјаЅ„ај‹аЅ‘аЅ‚';
                } else {
                    return 'аЅаЅљаЅ“ај‹аЅаЅј';
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : breton (br)
// author : Jean-Baptiste Le Duigou : https://github.com/jbleduigou

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function relativeTimeWithMutation(number, withoutSuffix, key) {
            var format = {
                'mm': 'munutenn',
                'MM': 'miz',
                'dd': 'devezh'
            };
            return number + ' ' + mutation(format[key], number);
        }

        function specialMutationForYears(number) {
            switch (lastNumber(number)) {
                case 1:
                case 3:
                case 4:
                case 5:
                case 9:
                    return number + ' bloaz';
                default:
                    return number + ' vloaz';
            }
        }

        function lastNumber(number) {
            if (number > 9) {
                return lastNumber(number % 10);
            }
            return number;
        }

        function mutation(text, number) {
            if (number === 2) {
                return softMutation(text);
            }
            return text;
        }

        function softMutation(text) {
            var mutationTable = {
                'm': 'v',
                'b': 'v',
                'd': 'z'
            };
            if (mutationTable[text.charAt(0)] === undefined) {
                return text;
            }
            return mutationTable[text.charAt(0)] + text.substring(1);
        }

        return moment.defineLocale('br', {
            months : 'Genver_C\'hwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu'.split('_'),
            monthsShort : 'Gen_C\'hwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker'.split('_'),
            weekdays : 'Sul_Lun_Meurzh_Merc\'her_Yaou_Gwener_Sadorn'.split('_'),
            weekdaysShort : 'Sul_Lun_Meu_Mer_Yao_Gwe_Sad'.split('_'),
            weekdaysMin : 'Su_Lu_Me_Mer_Ya_Gw_Sa'.split('_'),
            longDateFormat : {
                LT : 'h[e]mm A',
                LTS : 'h[e]mm:ss A',
                L : 'DD/MM/YYYY',
                LL : 'D [a viz] MMMM YYYY',
                LLL : 'D [a viz] MMMM YYYY LT',
                LLLL : 'dddd, D [a viz] MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[Hiziv da] LT',
                nextDay : '[Warc\'hoazh da] LT',
                nextWeek : 'dddd [da] LT',
                lastDay : '[Dec\'h da] LT',
                lastWeek : 'dddd [paset da] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'a-benn %s',
                past : '%s \'zo',
                s : 'un nebeud segondennoГ№',
                m : 'ur vunutenn',
                mm : relativeTimeWithMutation,
                h : 'un eur',
                hh : '%d eur',
                d : 'un devezh',
                dd : relativeTimeWithMutation,
                M : 'ur miz',
                MM : relativeTimeWithMutation,
                y : 'ur bloaz',
                yy : specialMutationForYears
            },
            ordinalParse: /\d{1,2}(aГ±|vet)/,
            ordinal : function (number) {
                var output = (number === 1) ? 'aГ±' : 'vet';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : bosnian (bs)
// author : Nedim Cholich : https://github.com/frontyard
// based on (hr) translation by Bojan MarkoviД‡

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function translate(number, withoutSuffix, key) {
            var result = number + ' ';
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'jedna minuta' : 'jedne minute';
                case 'mm':
                    if (number === 1) {
                        result += 'minuta';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'minute';
                    } else {
                        result += 'minuta';
                    }
                    return result;
                case 'h':
                    return withoutSuffix ? 'jedan sat' : 'jednog sata';
                case 'hh':
                    if (number === 1) {
                        result += 'sat';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'sata';
                    } else {
                        result += 'sati';
                    }
                    return result;
                case 'dd':
                    if (number === 1) {
                        result += 'dan';
                    } else {
                        result += 'dana';
                    }
                    return result;
                case 'MM':
                    if (number === 1) {
                        result += 'mjesec';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'mjeseca';
                    } else {
                        result += 'mjeseci';
                    }
                    return result;
                case 'yy':
                    if (number === 1) {
                        result += 'godina';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'godine';
                    } else {
                        result += 'godina';
                    }
                    return result;
            }
        }

        return moment.defineLocale('bs', {
            months : 'januar_februar_mart_april_maj_juni_juli_august_septembar_oktobar_novembar_decembar'.split('_'),
            monthsShort : 'jan._feb._mar._apr._maj._jun._jul._aug._sep._okt._nov._dec.'.split('_'),
            weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_ДЌetvrtak_petak_subota'.split('_'),
            weekdaysShort : 'ned._pon._uto._sri._ДЌet._pet._sub.'.split('_'),
            weekdaysMin : 'ne_po_ut_sr_ДЌe_pe_su'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD. MM. YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd, D. MMMM YYYY LT'
            },
            calendar : {
                sameDay  : '[danas u] LT',
                nextDay  : '[sutra u] LT',

                nextWeek : function () {
                    switch (this.day()) {
                        case 0:
                            return '[u] [nedjelju] [u] LT';
                        case 3:
                            return '[u] [srijedu] [u] LT';
                        case 6:
                            return '[u] [subotu] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[u] dddd [u] LT';
                    }
                },
                lastDay  : '[juДЌer u] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                            return '[proЕЎlu] dddd [u] LT';
                        case 6:
                            return '[proЕЎle] [subote] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[proЕЎli] dddd [u] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'za %s',
                past   : 'prije %s',
                s      : 'par sekundi',
                m      : translate,
                mm     : translate,
                h      : translate,
                hh     : translate,
                d      : 'dan',
                dd     : translate,
                M      : 'mjesec',
                MM     : translate,
                y      : 'godinu',
                yy     : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : catalan (ca)
// author : Juan G. Hurtado : https://github.com/juanghurtado

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('ca', {
            months : 'gener_febrer_marГ§_abril_maig_juny_juliol_agost_setembre_octubre_novembre_desembre'.split('_'),
            monthsShort : 'gen._febr._mar._abr._mai._jun._jul._ag._set._oct._nov._des.'.split('_'),
            weekdays : 'diumenge_dilluns_dimarts_dimecres_dijous_divendres_dissabte'.split('_'),
            weekdaysShort : 'dg._dl._dt._dc._dj._dv._ds.'.split('_'),
            weekdaysMin : 'Dg_Dl_Dt_Dc_Dj_Dv_Ds'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay : function () {
                    return '[avui a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                nextDay : function () {
                    return '[demГ  a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                nextWeek : function () {
                    return 'dddd [a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                lastDay : function () {
                    return '[ahir a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                lastWeek : function () {
                    return '[el] dddd [passat a ' + ((this.hours() !== 1) ? 'les' : 'la') + '] LT';
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'en %s',
                past : 'fa %s',
                s : 'uns segons',
                m : 'un minut',
                mm : '%d minuts',
                h : 'una hora',
                hh : '%d hores',
                d : 'un dia',
                dd : '%d dies',
                M : 'un mes',
                MM : '%d mesos',
                y : 'un any',
                yy : '%d anys'
            },
            ordinalParse: /\d{1,2}(r|n|t|ГЁ|a)/,
            ordinal : function (number, period) {
                var output = (number === 1) ? 'r' :
                    (number === 2) ? 'n' :
                        (number === 3) ? 'r' :
                            (number === 4) ? 't' : 'ГЁ';
                if (period === 'w' || period === 'W') {
                    output = 'a';
                }
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : czech (cs)
// author : petrbela : https://github.com/petrbela

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var months = 'leden_Гєnor_bЕ™ezen_duben_kvД›ten_ДЌerven_ДЌervenec_srpen_zГЎЕ™Г­_Е™Г­jen_listopad_prosinec'.split('_'),
            monthsShort = 'led_Гєno_bЕ™e_dub_kvД›_ДЌvn_ДЌvc_srp_zГЎЕ™_Е™Г­j_lis_pro'.split('_');

        function plural(n) {
            return (n > 1) && (n < 5) && (~~(n / 10) !== 1);
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + ' ';
            switch (key) {
                case 's':  // a few seconds / in a few seconds / a few seconds ago
                    return (withoutSuffix || isFuture) ? 'pГЎr sekund' : 'pГЎr sekundami';
                case 'm':  // a minute / in a minute / a minute ago
                    return withoutSuffix ? 'minuta' : (isFuture ? 'minutu' : 'minutou');
                case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'minuty' : 'minut');
                    } else {
                        return result + 'minutami';
                    }
                    break;
                case 'h':  // an hour / in an hour / an hour ago
                    return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
                case 'hh': // 9 hours / in 9 hours / 9 hours ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'hodiny' : 'hodin');
                    } else {
                        return result + 'hodinami';
                    }
                    break;
                case 'd':  // a day / in a day / a day ago
                    return (withoutSuffix || isFuture) ? 'den' : 'dnem';
                case 'dd': // 9 days / in 9 days / 9 days ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'dny' : 'dnГ­');
                    } else {
                        return result + 'dny';
                    }
                    break;
                case 'M':  // a month / in a month / a month ago
                    return (withoutSuffix || isFuture) ? 'mД›sГ­c' : 'mД›sГ­cem';
                case 'MM': // 9 months / in 9 months / 9 months ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'mД›sГ­ce' : 'mД›sГ­cЕЇ');
                    } else {
                        return result + 'mД›sГ­ci';
                    }
                    break;
                case 'y':  // a year / in a year / a year ago
                    return (withoutSuffix || isFuture) ? 'rok' : 'rokem';
                case 'yy': // 9 years / in 9 years / 9 years ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'roky' : 'let');
                    } else {
                        return result + 'lety';
                    }
                    break;
            }
        }

        return moment.defineLocale('cs', {
            months : months,
            monthsShort : monthsShort,
            monthsParse : (function (months, monthsShort) {
                var i, _monthsParse = [];
                for (i = 0; i < 12; i++) {
                    // use custom parser to solve problem with July (ДЌervenec)
                    _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
                }
                return _monthsParse;
            }(months, monthsShort)),
            weekdays : 'nedД›le_pondД›lГ­_ГєterГЅ_stЕ™eda_ДЌtvrtek_pГЎtek_sobota'.split('_'),
            weekdaysShort : 'ne_po_Гєt_st_ДЌt_pГЎ_so'.split('_'),
            weekdaysMin : 'ne_po_Гєt_st_ДЌt_pГЎ_so'.split('_'),
            longDateFormat : {
                LT: 'H:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd D. MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[dnes v] LT',
                nextDay: '[zГ­tra v] LT',
                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[v nedД›li v] LT';
                        case 1:
                        case 2:
                            return '[v] dddd [v] LT';
                        case 3:
                            return '[ve stЕ™edu v] LT';
                        case 4:
                            return '[ve ДЌtvrtek v] LT';
                        case 5:
                            return '[v pГЎtek v] LT';
                        case 6:
                            return '[v sobotu v] LT';
                    }
                },
                lastDay: '[vДЌera v] LT',
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[minulou nedД›li v] LT';
                        case 1:
                        case 2:
                            return '[minulГ©] dddd [v] LT';
                        case 3:
                            return '[minulou stЕ™edu v] LT';
                        case 4:
                        case 5:
                            return '[minulГЅ] dddd [v] LT';
                        case 6:
                            return '[minulou sobotu v] LT';
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'za %s',
                past : 'pЕ™ed %s',
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinalParse : /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : chuvash (cv)
// author : Anatoly Mironov : https://github.com/mirontoli

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('cv', {
            months : 'РєДѓСЂР»Р°С‡_РЅР°СЂДѓСЃ_РїСѓС€_Р°РєР°_РјР°Р№_Г§Д•СЂС‚РјРµ_СѓС‚Дѓ_Г§СѓСЂР»Р°_Р°РІДѓРЅ_СЋРїР°_С‡УіРє_СЂР°С€С‚Р°РІ'.split('_'),
            monthsShort : 'РєДѓСЂ_РЅР°СЂ_РїСѓС€_Р°РєР°_РјР°Р№_Г§Д•СЂ_СѓС‚Дѓ_Г§СѓСЂ_Р°РІ_СЋРїР°_С‡УіРє_СЂР°С€'.split('_'),
            weekdays : 'РІС‹СЂСЃР°СЂРЅРёРєСѓРЅ_С‚СѓРЅС‚РёРєСѓРЅ_С‹С‚Р»Р°СЂРёРєСѓРЅ_СЋРЅРєСѓРЅ_РєД•Г§РЅРµСЂРЅРёРєСѓРЅ_СЌСЂРЅРµРєСѓРЅ_С€ДѓРјР°С‚РєСѓРЅ'.split('_'),
            weekdaysShort : 'РІС‹СЂ_С‚СѓРЅ_С‹С‚Р»_СЋРЅ_РєД•Г§_СЌСЂРЅ_С€ДѓРј'.split('_'),
            weekdaysMin : 'РІСЂ_С‚РЅ_С‹С‚_СЋРЅ_РєГ§_СЌСЂ_С€Рј'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD-MM-YYYY',
                LL : 'YYYY [Г§СѓР»С…Рё] MMMM [СѓР№ДѓС…Д•РЅ] D[-РјД•С€Д•]',
                LLL : 'YYYY [Г§СѓР»С…Рё] MMMM [СѓР№ДѓС…Д•РЅ] D[-РјД•С€Д•], LT',
                LLLL : 'dddd, YYYY [Г§СѓР»С…Рё] MMMM [СѓР№ДѓС…Д•РЅ] D[-РјД•С€Д•], LT'
            },
            calendar : {
                sameDay: '[РџР°СЏРЅ] LT [СЃРµС…РµС‚СЂРµ]',
                nextDay: '[Р«СЂР°РЅ] LT [СЃРµС…РµС‚СЂРµ]',
                lastDay: '[Д”РЅРµСЂ] LT [СЃРµС…РµС‚СЂРµ]',
                nextWeek: '[Г‡РёС‚РµСЃ] dddd LT [СЃРµС…РµС‚СЂРµ]',
                lastWeek: '[РСЂС‚РЅД•] dddd LT [СЃРµС…РµС‚СЂРµ]',
                sameElse: 'L'
            },
            relativeTime : {
                future : function (output) {
                    var affix = /СЃРµС…РµС‚$/i.exec(output) ? 'СЂРµРЅ' : /Г§СѓР»$/i.exec(output) ? 'С‚Р°РЅ' : 'СЂР°РЅ';
                    return output + affix;
                },
                past : '%s РєР°СЏР»Р»Р°',
                s : 'РїД•СЂ-РёРє Г§РµРєРєСѓРЅС‚',
                m : 'РїД•СЂ РјРёРЅСѓС‚',
                mm : '%d РјРёРЅСѓС‚',
                h : 'РїД•СЂ СЃРµС…РµС‚',
                hh : '%d СЃРµС…РµС‚',
                d : 'РїД•СЂ РєСѓРЅ',
                dd : '%d РєСѓРЅ',
                M : 'РїД•СЂ СѓР№ДѓС…',
                MM : '%d СѓР№ДѓС…',
                y : 'РїД•СЂ Г§СѓР»',
                yy : '%d Г§СѓР»'
            },
            ordinalParse: /\d{1,2}-РјД•С€/,
            ordinal : '%d-РјД•С€',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Welsh (cy)
// author : Robert Allen

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('cy', {
            months: 'Ionawr_Chwefror_Mawrth_Ebrill_Mai_Mehefin_Gorffennaf_Awst_Medi_Hydref_Tachwedd_Rhagfyr'.split('_'),
            monthsShort: 'Ion_Chwe_Maw_Ebr_Mai_Meh_Gor_Aws_Med_Hyd_Tach_Rhag'.split('_'),
            weekdays: 'Dydd Sul_Dydd Llun_Dydd Mawrth_Dydd Mercher_Dydd Iau_Dydd Gwener_Dydd Sadwrn'.split('_'),
            weekdaysShort: 'Sul_Llun_Maw_Mer_Iau_Gwe_Sad'.split('_'),
            weekdaysMin: 'Su_Ll_Ma_Me_Ia_Gw_Sa'.split('_'),
            // time formats are the same as en-gb
            longDateFormat: {
                LT: 'HH:mm',
                LTS : 'LT:ss',
                L: 'DD/MM/YYYY',
                LL: 'D MMMM YYYY',
                LLL: 'D MMMM YYYY LT',
                LLLL: 'dddd, D MMMM YYYY LT'
            },
            calendar: {
                sameDay: '[Heddiw am] LT',
                nextDay: '[Yfory am] LT',
                nextWeek: 'dddd [am] LT',
                lastDay: '[Ddoe am] LT',
                lastWeek: 'dddd [diwethaf am] LT',
                sameElse: 'L'
            },
            relativeTime: {
                future: 'mewn %s',
                past: '%s yn Гґl',
                s: 'ychydig eiliadau',
                m: 'munud',
                mm: '%d munud',
                h: 'awr',
                hh: '%d awr',
                d: 'diwrnod',
                dd: '%d diwrnod',
                M: 'mis',
                MM: '%d mis',
                y: 'blwyddyn',
                yy: '%d flynedd'
            },
            ordinalParse: /\d{1,2}(fed|ain|af|il|ydd|ed|eg)/,
            // traditional ordinal numbers above 31 are not commonly used in colloquial Welsh
            ordinal: function (number) {
                var b = number,
                    output = '',
                    lookup = [
                        '', 'af', 'il', 'ydd', 'ydd', 'ed', 'ed', 'ed', 'fed', 'fed', 'fed', // 1af to 10fed
                        'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'eg', 'fed', 'eg', 'fed' // 11eg to 20fed
                    ];

                if (b > 20) {
                    if (b === 40 || b === 50 || b === 60 || b === 80 || b === 100) {
                        output = 'fed'; // not 30ain, 70ain or 90ain
                    } else {
                        output = 'ain';
                    }
                } else if (b > 0) {
                    output = lookup[b];
                }

                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : danish (da)
// author : Ulrik Nielsen : https://github.com/mrbase

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('da', {
            months : 'januar_februar_marts_april_maj_juni_juli_august_september_oktober_november_december'.split('_'),
            monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
            weekdays : 'sГёndag_mandag_tirsdag_onsdag_torsdag_fredag_lГёrdag'.split('_'),
            weekdaysShort : 'sГёn_man_tir_ons_tor_fre_lГёr'.split('_'),
            weekdaysMin : 'sГё_ma_ti_on_to_fr_lГё'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd [d.] D. MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[I dag kl.] LT',
                nextDay : '[I morgen kl.] LT',
                nextWeek : 'dddd [kl.] LT',
                lastDay : '[I gГҐr kl.] LT',
                lastWeek : '[sidste] dddd [kl] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'om %s',
                past : '%s siden',
                s : 'fГҐ sekunder',
                m : 'et minut',
                mm : '%d minutter',
                h : 'en time',
                hh : '%d timer',
                d : 'en dag',
                dd : '%d dage',
                M : 'en mГҐned',
                MM : '%d mГҐneder',
                y : 'et ГҐr',
                yy : '%d ГҐr'
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : austrian german (de-at)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensГєle: https://github.com/Oire
// author : Martin Groller : https://github.com/MadMG

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                'm': ['eine Minute', 'einer Minute'],
                'h': ['eine Stunde', 'einer Stunde'],
                'd': ['ein Tag', 'einem Tag'],
                'dd': [number + ' Tage', number + ' Tagen'],
                'M': ['ein Monat', 'einem Monat'],
                'MM': [number + ' Monate', number + ' Monaten'],
                'y': ['ein Jahr', 'einem Jahr'],
                'yy': [number + ' Jahre', number + ' Jahren']
            };
            return withoutSuffix ? format[key][0] : format[key][1];
        }

        return moment.defineLocale('de-at', {
            months : 'JГ¤nner_Februar_MГ¤rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
            monthsShort : 'JГ¤n._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
            weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
            weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
            weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
            longDateFormat : {
                LT: 'HH:mm',
                LTS: 'HH:mm:ss',
                L : 'DD.MM.YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd, D. MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[Heute um] LT [Uhr]',
                sameElse: 'L',
                nextDay: '[Morgen um] LT [Uhr]',
                nextWeek: 'dddd [um] LT [Uhr]',
                lastDay: '[Gestern um] LT [Uhr]',
                lastWeek: '[letzten] dddd [um] LT [Uhr]'
            },
            relativeTime : {
                future : 'in %s',
                past : 'vor %s',
                s : 'ein paar Sekunden',
                m : processRelativeTime,
                mm : '%d Minuten',
                h : processRelativeTime,
                hh : '%d Stunden',
                d : processRelativeTime,
                dd : processRelativeTime,
                M : processRelativeTime,
                MM : processRelativeTime,
                y : processRelativeTime,
                yy : processRelativeTime
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : german (de)
// author : lluchs : https://github.com/lluchs
// author: Menelion ElensГєle: https://github.com/Oire

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                'm': ['eine Minute', 'einer Minute'],
                'h': ['eine Stunde', 'einer Stunde'],
                'd': ['ein Tag', 'einem Tag'],
                'dd': [number + ' Tage', number + ' Tagen'],
                'M': ['ein Monat', 'einem Monat'],
                'MM': [number + ' Monate', number + ' Monaten'],
                'y': ['ein Jahr', 'einem Jahr'],
                'yy': [number + ' Jahre', number + ' Jahren']
            };
            return withoutSuffix ? format[key][0] : format[key][1];
        }

        return moment.defineLocale('de', {
            months : 'Januar_Februar_MГ¤rz_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
            monthsShort : 'Jan._Febr._Mrz._Apr._Mai_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
            weekdays : 'Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag'.split('_'),
            weekdaysShort : 'So._Mo._Di._Mi._Do._Fr._Sa.'.split('_'),
            weekdaysMin : 'So_Mo_Di_Mi_Do_Fr_Sa'.split('_'),
            longDateFormat : {
                LT: 'HH:mm',
                LTS: 'HH:mm:ss',
                L : 'DD.MM.YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd, D. MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[Heute um] LT [Uhr]',
                sameElse: 'L',
                nextDay: '[Morgen um] LT [Uhr]',
                nextWeek: 'dddd [um] LT [Uhr]',
                lastDay: '[Gestern um] LT [Uhr]',
                lastWeek: '[letzten] dddd [um] LT [Uhr]'
            },
            relativeTime : {
                future : 'in %s',
                past : 'vor %s',
                s : 'ein paar Sekunden',
                m : processRelativeTime,
                mm : '%d Minuten',
                h : processRelativeTime,
                hh : '%d Stunden',
                d : processRelativeTime,
                dd : processRelativeTime,
                M : processRelativeTime,
                MM : processRelativeTime,
                y : processRelativeTime,
                yy : processRelativeTime
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : modern greek (el)
// author : Aggelos Karalias : https://github.com/mehiel

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('el', {
            monthsNominativeEl : 'О™О±ОЅОїП…О¬ПЃО№ОїП‚_О¦ОµОІПЃОїП…О¬ПЃО№ОїП‚_ОњО¬ПЃП„О№ОїП‚_О‘ПЂПЃОЇО»О№ОїП‚_ОњО¬О№ОїП‚_О™ОїПЌОЅО№ОїП‚_О™ОїПЌО»О№ОїП‚_О‘ПЌОіОїП…ПѓП„ОїП‚_ОЈОµПЂП„О­ОјОІПЃО№ОїП‚_ОџОєП„ПЋОІПЃО№ОїП‚_ОќОїО­ОјОІПЃО№ОїП‚_О”ОµОєО­ОјОІПЃО№ОїП‚'.split('_'),
            monthsGenitiveEl : 'О™О±ОЅОїП…О±ПЃОЇОїП…_О¦ОµОІПЃОїП…О±ПЃОЇОїП…_ОњО±ПЃП„ОЇОїП…_О‘ПЂПЃО№О»ОЇОїП…_ОњО±ОђОїП…_О™ОїП…ОЅОЇОїП…_О™ОїП…О»ОЇОїП…_О‘П…ОіОїПЌПѓП„ОїП…_ОЈОµПЂП„ОµОјОІПЃОЇОїП…_ОџОєП„П‰ОІПЃОЇОїП…_ОќОїОµОјОІПЃОЇОїП…_О”ОµОєОµОјОІПЃОЇОїП…'.split('_'),
            months : function (momentToFormat, format) {
                if (/D/.test(format.substring(0, format.indexOf('MMMM')))) { // if there is a day number before 'MMMM'
                    return this._monthsGenitiveEl[momentToFormat.month()];
                } else {
                    return this._monthsNominativeEl[momentToFormat.month()];
                }
            },
            monthsShort : 'О™О±ОЅ_О¦ОµОІ_ОњО±ПЃ_О‘ПЂПЃ_ОњО±ПЉ_О™ОїП…ОЅ_О™ОїП…О»_О‘П…Оі_ОЈОµПЂ_ОџОєП„_ОќОїОµ_О”ОµОє'.split('_'),
            weekdays : 'ОљП…ПЃО№О±ОєО®_О”ОµП…П„О­ПЃО±_О¤ПЃОЇП„О·_О¤ОµП„О¬ПЃП„О·_О О­ОјПЂП„О·_О О±ПЃО±ПѓОєОµП…О®_ОЈО¬ОІОІО±П„Ої'.split('_'),
            weekdaysShort : 'ОљП…ПЃ_О”ОµП…_О¤ПЃО№_О¤ОµП„_О ОµОј_О О±ПЃ_ОЈО±ОІ'.split('_'),
            weekdaysMin : 'ОљП…_О”Оµ_О¤ПЃ_О¤Оµ_О Оµ_О О±_ОЈО±'.split('_'),
            meridiem : function (hours, minutes, isLower) {
                if (hours > 11) {
                    return isLower ? 'ОјОј' : 'ОњОњ';
                } else {
                    return isLower ? 'ПЂОј' : 'О Оњ';
                }
            },
            isPM : function (input) {
                return ((input + '').toLowerCase()[0] === 'Ој');
            },
            meridiemParse : /[О Оњ]\.?Оњ?\.?/i,
            longDateFormat : {
                LT : 'h:mm A',
                LTS : 'h:mm:ss A',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendarEl : {
                sameDay : '[ОЈО®ОјОµПЃО± {}] LT',
                nextDay : '[О‘ПЌПЃО№Ої {}] LT',
                nextWeek : 'dddd [{}] LT',
                lastDay : '[О§ОёОµП‚ {}] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 6:
                            return '[П„Ої ПЂПЃОїО·ОіОїПЌОјОµОЅОї] dddd [{}] LT';
                        default:
                            return '[П„О·ОЅ ПЂПЃОїО·ОіОїПЌОјОµОЅО·] dddd [{}] LT';
                    }
                },
                sameElse : 'L'
            },
            calendar : function (key, mom) {
                var output = this._calendarEl[key],
                    hours = mom && mom.hours();

                if (typeof output === 'function') {
                    output = output.apply(mom);
                }

                return output.replace('{}', (hours % 12 === 1 ? 'ПѓП„О·' : 'ПѓП„О№П‚'));
            },
            relativeTime : {
                future : 'ПѓОµ %s',
                past : '%s ПЂПЃО№ОЅ',
                s : 'О»ОЇОіО± ОґОµП…П„ОµПЃПЊО»ОµПЂП„О±',
                m : 'О­ОЅО± О»ОµПЂП„ПЊ',
                mm : '%d О»ОµПЂП„О¬',
                h : 'ОјОЇО± ПЋПЃО±',
                hh : '%d ПЋПЃОµП‚',
                d : 'ОјОЇО± ОјО­ПЃО±',
                dd : '%d ОјО­ПЃОµП‚',
                M : 'О­ОЅО±П‚ ОјО®ОЅО±П‚',
                MM : '%d ОјО®ОЅОµП‚',
                y : 'О­ОЅО±П‚ П‡ПЃПЊОЅОїП‚',
                yy : '%d П‡ПЃПЊОЅО№О±'
            },
            ordinalParse: /\d{1,2}О·/,
            ordinal: '%dО·',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : australian english (en-au)

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('en-au', {
            months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat : {
                LT : 'h:mm A',
                LTS : 'h:mm:ss A',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[Today at] LT',
                nextDay : '[Tomorrow at] LT',
                nextWeek : 'dddd [at] LT',
                lastDay : '[Yesterday at] LT',
                lastWeek : '[Last] dddd [at] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'in %s',
                past : '%s ago',
                s : 'a few seconds',
                m : 'a minute',
                mm : '%d minutes',
                h : 'an hour',
                hh : '%d hours',
                d : 'a day',
                dd : '%d days',
                M : 'a month',
                MM : '%d months',
                y : 'a year',
                yy : '%d years'
            },
            ordinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~(number % 100 / 10) === 1) ? 'th' :
                        (b === 1) ? 'st' :
                            (b === 2) ? 'nd' :
                                (b === 3) ? 'rd' : 'th';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : canadian english (en-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('en-ca', {
            months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat : {
                LT : 'h:mm A',
                LTS : 'h:mm:ss A',
                L : 'YYYY-MM-DD',
                LL : 'D MMMM, YYYY',
                LLL : 'D MMMM, YYYY LT',
                LLLL : 'dddd, D MMMM, YYYY LT'
            },
            calendar : {
                sameDay : '[Today at] LT',
                nextDay : '[Tomorrow at] LT',
                nextWeek : 'dddd [at] LT',
                lastDay : '[Yesterday at] LT',
                lastWeek : '[Last] dddd [at] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'in %s',
                past : '%s ago',
                s : 'a few seconds',
                m : 'a minute',
                mm : '%d minutes',
                h : 'an hour',
                hh : '%d hours',
                d : 'a day',
                dd : '%d days',
                M : 'a month',
                MM : '%d months',
                y : 'a year',
                yy : '%d years'
            },
            ordinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~(number % 100 / 10) === 1) ? 'th' :
                        (b === 1) ? 'st' :
                            (b === 2) ? 'nd' :
                                (b === 3) ? 'rd' : 'th';
                return number + output;
            }
        });
    }));
// moment.js locale configuration
// locale : great britain english (en-gb)
// author : Chris Gedrim : https://github.com/chrisgedrim

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('en-gb', {
            months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
            monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
            weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
            weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
            weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'HH:mm:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[Today at] LT',
                nextDay : '[Tomorrow at] LT',
                nextWeek : 'dddd [at] LT',
                lastDay : '[Yesterday at] LT',
                lastWeek : '[Last] dddd [at] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'in %s',
                past : '%s ago',
                s : 'a few seconds',
                m : 'a minute',
                mm : '%d minutes',
                h : 'an hour',
                hh : '%d hours',
                d : 'a day',
                dd : '%d days',
                M : 'a month',
                MM : '%d months',
                y : 'a year',
                yy : '%d years'
            },
            ordinalParse: /\d{1,2}(st|nd|rd|th)/,
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~(number % 100 / 10) === 1) ? 'th' :
                        (b === 1) ? 'st' :
                            (b === 2) ? 'nd' :
                                (b === 3) ? 'rd' : 'th';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : esperanto (eo)
// author : Colin Dean : https://github.com/colindean
// komento: Mi estas malcerta se mi korekte traktis akuzativojn en tiu traduko.
//          Se ne, bonvolu korekti kaj avizi min por ke mi povas lerni!

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('eo', {
            months : 'januaro_februaro_marto_aprilo_majo_junio_julio_aЕ­gusto_septembro_oktobro_novembro_decembro'.split('_'),
            monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aЕ­g_sep_okt_nov_dec'.split('_'),
            weekdays : 'DimanД‰o_Lundo_Mardo_Merkredo_ДґaЕ­do_Vendredo_Sabato'.split('_'),
            weekdaysShort : 'Dim_Lun_Mard_Merk_ДґaЕ­_Ven_Sab'.split('_'),
            weekdaysMin : 'Di_Lu_Ma_Me_Дґa_Ve_Sa'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'YYYY-MM-DD',
                LL : 'D[-an de] MMMM, YYYY',
                LLL : 'D[-an de] MMMM, YYYY LT',
                LLLL : 'dddd, [la] D[-an de] MMMM, YYYY LT'
            },
            meridiemParse: /[ap]\.t\.m/i,
            isPM: function (input) {
                return input.charAt(0).toLowerCase() === 'p';
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours > 11) {
                    return isLower ? 'p.t.m.' : 'P.T.M.';
                } else {
                    return isLower ? 'a.t.m.' : 'A.T.M.';
                }
            },
            calendar : {
                sameDay : '[HodiaЕ­ je] LT',
                nextDay : '[MorgaЕ­ je] LT',
                nextWeek : 'dddd [je] LT',
                lastDay : '[HieraЕ­ je] LT',
                lastWeek : '[pasinta] dddd [je] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'je %s',
                past : 'antaЕ­ %s',
                s : 'sekundoj',
                m : 'minuto',
                mm : '%d minutoj',
                h : 'horo',
                hh : '%d horoj',
                d : 'tago',//ne 'diurno', Д‰ar estas uzita por proksimumo
                dd : '%d tagoj',
                M : 'monato',
                MM : '%d monatoj',
                y : 'jaro',
                yy : '%d jaroj'
            },
            ordinalParse: /\d{1,2}a/,
            ordinal : '%da',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : spanish (es)
// author : Julio NapurГ­ : https://github.com/julionc

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var monthsShortDot = 'ene._feb._mar._abr._may._jun._jul._ago._sep._oct._nov._dic.'.split('_'),
            monthsShort = 'ene_feb_mar_abr_may_jun_jul_ago_sep_oct_nov_dic'.split('_');

        return moment.defineLocale('es', {
            months : 'enero_febrero_marzo_abril_mayo_junio_julio_agosto_septiembre_octubre_noviembre_diciembre'.split('_'),
            monthsShort : function (m, format) {
                if (/-MMM-/.test(format)) {
                    return monthsShort[m.month()];
                } else {
                    return monthsShortDot[m.month()];
                }
            },
            weekdays : 'domingo_lunes_martes_miГ©rcoles_jueves_viernes_sГЎbado'.split('_'),
            weekdaysShort : 'dom._lun._mar._miГ©._jue._vie._sГЎb.'.split('_'),
            weekdaysMin : 'Do_Lu_Ma_Mi_Ju_Vi_SГЎ'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D [de] MMMM [de] YYYY',
                LLL : 'D [de] MMMM [de] YYYY LT',
                LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
            },
            calendar : {
                sameDay : function () {
                    return '[hoy a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                nextDay : function () {
                    return '[maГ±ana a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                nextWeek : function () {
                    return 'dddd [a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                lastDay : function () {
                    return '[ayer a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                lastWeek : function () {
                    return '[el] dddd [pasado a la' + ((this.hours() !== 1) ? 's' : '') + '] LT';
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'en %s',
                past : 'hace %s',
                s : 'unos segundos',
                m : 'un minuto',
                mm : '%d minutos',
                h : 'una hora',
                hh : '%d horas',
                d : 'un dГ­a',
                dd : '%d dГ­as',
                M : 'un mes',
                MM : '%d meses',
                y : 'un aГ±o',
                yy : '%d aГ±os'
            },
            ordinalParse : /\d{1,2}Вє/,
            ordinal : '%dВє',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : estonian (et)
// author : Henry Kehlmann : https://github.com/madhenry
// improvements : Illimar Tambek : https://github.com/ragulka

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                's' : ['mГµne sekundi', 'mГµni sekund', 'paar sekundit'],
                'm' : ['Гјhe minuti', 'Гјks minut'],
                'mm': [number + ' minuti', number + ' minutit'],
                'h' : ['Гјhe tunni', 'tund aega', 'Гјks tund'],
                'hh': [number + ' tunni', number + ' tundi'],
                'd' : ['Гјhe pГ¤eva', 'Гјks pГ¤ev'],
                'M' : ['kuu aja', 'kuu aega', 'Гјks kuu'],
                'MM': [number + ' kuu', number + ' kuud'],
                'y' : ['Гјhe aasta', 'aasta', 'Гјks aasta'],
                'yy': [number + ' aasta', number + ' aastat']
            };
            if (withoutSuffix) {
                return format[key][2] ? format[key][2] : format[key][1];
            }
            return isFuture ? format[key][0] : format[key][1];
        }

        return moment.defineLocale('et', {
            months        : 'jaanuar_veebruar_mГ¤rts_aprill_mai_juuni_juuli_august_september_oktoober_november_detsember'.split('_'),
            monthsShort   : 'jaan_veebr_mГ¤rts_apr_mai_juuni_juuli_aug_sept_okt_nov_dets'.split('_'),
            weekdays      : 'pГјhapГ¤ev_esmaspГ¤ev_teisipГ¤ev_kolmapГ¤ev_neljapГ¤ev_reede_laupГ¤ev'.split('_'),
            weekdaysShort : 'P_E_T_K_N_R_L'.split('_'),
            weekdaysMin   : 'P_E_T_K_N_R_L'.split('_'),
            longDateFormat : {
                LT   : 'H:mm',
                LTS : 'LT:ss',
                L    : 'DD.MM.YYYY',
                LL   : 'D. MMMM YYYY',
                LLL  : 'D. MMMM YYYY LT',
                LLLL : 'dddd, D. MMMM YYYY LT'
            },
            calendar : {
                sameDay  : '[TГ¤na,] LT',
                nextDay  : '[Homme,] LT',
                nextWeek : '[JГ¤rgmine] dddd LT',
                lastDay  : '[Eile,] LT',
                lastWeek : '[Eelmine] dddd LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s pГ¤rast',
                past   : '%s tagasi',
                s      : processRelativeTime,
                m      : processRelativeTime,
                mm     : processRelativeTime,
                h      : processRelativeTime,
                hh     : processRelativeTime,
                d      : processRelativeTime,
                dd     : '%d pГ¤eva',
                M      : processRelativeTime,
                MM     : processRelativeTime,
                y      : processRelativeTime,
                yy     : processRelativeTime
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : euskara (eu)
// author : Eneko Illarramendi : https://github.com/eillarra

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('eu', {
            months : 'urtarrila_otsaila_martxoa_apirila_maiatza_ekaina_uztaila_abuztua_iraila_urria_azaroa_abendua'.split('_'),
            monthsShort : 'urt._ots._mar._api._mai._eka._uzt._abu._ira._urr._aza._abe.'.split('_'),
            weekdays : 'igandea_astelehena_asteartea_asteazkena_osteguna_ostirala_larunbata'.split('_'),
            weekdaysShort : 'ig._al._ar._az._og._ol._lr.'.split('_'),
            weekdaysMin : 'ig_al_ar_az_og_ol_lr'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'YYYY-MM-DD',
                LL : 'YYYY[ko] MMMM[ren] D[a]',
                LLL : 'YYYY[ko] MMMM[ren] D[a] LT',
                LLLL : 'dddd, YYYY[ko] MMMM[ren] D[a] LT',
                l : 'YYYY-M-D',
                ll : 'YYYY[ko] MMM D[a]',
                lll : 'YYYY[ko] MMM D[a] LT',
                llll : 'ddd, YYYY[ko] MMM D[a] LT'
            },
            calendar : {
                sameDay : '[gaur] LT[etan]',
                nextDay : '[bihar] LT[etan]',
                nextWeek : 'dddd LT[etan]',
                lastDay : '[atzo] LT[etan]',
                lastWeek : '[aurreko] dddd LT[etan]',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s barru',
                past : 'duela %s',
                s : 'segundo batzuk',
                m : 'minutu bat',
                mm : '%d minutu',
                h : 'ordu bat',
                hh : '%d ordu',
                d : 'egun bat',
                dd : '%d egun',
                M : 'hilabete bat',
                MM : '%d hilabete',
                y : 'urte bat',
                yy : '%d urte'
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Persian (fa)
// author : Ebrahim Byagowi : https://github.com/ebraminio

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
            '1': 'Ы±',
            '2': 'ЫІ',
            '3': 'Ыі',
            '4': 'Ыґ',
            '5': 'Ыµ',
            '6': 'Ы¶',
            '7': 'Ы·',
            '8': 'Ыё',
            '9': 'Ы№',
            '0': 'Ы°'
        }, numberMap = {
            'Ы±': '1',
            'ЫІ': '2',
            'Ыі': '3',
            'Ыґ': '4',
            'Ыµ': '5',
            'Ы¶': '6',
            'Ы·': '7',
            'Ыё': '8',
            'Ы№': '9',
            'Ы°': '0'
        };

        return moment.defineLocale('fa', {
            months : 'ЪШ§Щ†Щ€ЫЊЩ‡_ЩЃЩ€Ш±ЫЊЩ‡_Щ…Ш§Ш±Ші_ШўЩ€Ш±ЫЊЩ„_Щ…Щ‡_ЪЩ€Ш¦Щ†_ЪЩ€Ш¦ЫЊЩ‡_Ш§Щ€ШЄ_ШіЩѕШЄШ§Щ…ШЁШ±_Ш§Ъ©ШЄШЁШ±_Щ†Щ€Ш§Щ…ШЁШ±_ШЇШіШ§Щ…ШЁШ±'.split('_'),
            monthsShort : 'ЪШ§Щ†Щ€ЫЊЩ‡_ЩЃЩ€Ш±ЫЊЩ‡_Щ…Ш§Ш±Ші_ШўЩ€Ш±ЫЊЩ„_Щ…Щ‡_ЪЩ€Ш¦Щ†_ЪЩ€Ш¦ЫЊЩ‡_Ш§Щ€ШЄ_ШіЩѕШЄШ§Щ…ШЁШ±_Ш§Ъ©ШЄШЁШ±_Щ†Щ€Ш§Щ…ШЁШ±_ШЇШіШ§Щ…ШЁШ±'.split('_'),
            weekdays : 'ЫЊЪ©\u200cШґЩ†ШЁЩ‡_ШЇЩ€ШґЩ†ШЁЩ‡_ШіЩ‡\u200cШґЩ†ШЁЩ‡_Ъ†Щ‡Ш§Ш±ШґЩ†ШЁЩ‡_ЩѕЩ†Ш¬\u200cШґЩ†ШЁЩ‡_Ш¬Щ…Ш№Щ‡_ШґЩ†ШЁЩ‡'.split('_'),
            weekdaysShort : 'ЫЊЪ©\u200cШґЩ†ШЁЩ‡_ШЇЩ€ШґЩ†ШЁЩ‡_ШіЩ‡\u200cШґЩ†ШЁЩ‡_Ъ†Щ‡Ш§Ш±ШґЩ†ШЁЩ‡_ЩѕЩ†Ш¬\u200cШґЩ†ШЁЩ‡_Ш¬Щ…Ш№Щ‡_ШґЩ†ШЁЩ‡'.split('_'),
            weekdaysMin : 'ЫЊ_ШЇ_Ші_Ъ†_Щѕ_Ш¬_Шґ'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            meridiemParse: /Щ‚ШЁЩ„ Ш§ШІ ШёЩ‡Ш±|ШЁШ№ШЇ Ш§ШІ ШёЩ‡Ш±/,
            isPM: function (input) {
                return /ШЁШ№ШЇ Ш§ШІ ШёЩ‡Ш±/.test(input);
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return 'Щ‚ШЁЩ„ Ш§ШІ ШёЩ‡Ш±';
                } else {
                    return 'ШЁШ№ШЇ Ш§ШІ ШёЩ‡Ш±';
                }
            },
            calendar : {
                sameDay : '[Ш§Щ…Ш±Щ€ШІ ШіШ§Ш№ШЄ] LT',
                nextDay : '[ЩЃШ±ШЇШ§ ШіШ§Ш№ШЄ] LT',
                nextWeek : 'dddd [ШіШ§Ш№ШЄ] LT',
                lastDay : '[ШЇЫЊШ±Щ€ШІ ШіШ§Ш№ШЄ] LT',
                lastWeek : 'dddd [ЩѕЫЊШґ] [ШіШ§Ш№ШЄ] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'ШЇШ± %s',
                past : '%s ЩѕЫЊШґ',
                s : 'Ъ†Щ†ШЇЫЊЩ† Ш«Ш§Щ†ЫЊЩ‡',
                m : 'ЫЊЪ© ШЇЩ‚ЫЊЩ‚Щ‡',
                mm : '%d ШЇЩ‚ЫЊЩ‚Щ‡',
                h : 'ЫЊЪ© ШіШ§Ш№ШЄ',
                hh : '%d ШіШ§Ш№ШЄ',
                d : 'ЫЊЪ© Ш±Щ€ШІ',
                dd : '%d Ш±Щ€ШІ',
                M : 'ЫЊЪ© Щ…Ш§Щ‡',
                MM : '%d Щ…Ш§Щ‡',
                y : 'ЫЊЪ© ШіШ§Щ„',
                yy : '%d ШіШ§Щ„'
            },
            preparse: function (string) {
                return string.replace(/[Ы°-Ы№]/g, function (match) {
                    return numberMap[match];
                }).replace(/ШЊ/g, ',');
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                }).replace(/,/g, 'ШЊ');
            },
            ordinalParse: /\d{1,2}Щ…/,
            ordinal : '%dЩ…',
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12 // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : finnish (fi)
// author : Tarmo Aidantausta : https://github.com/bleadof

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var numbersPast = 'nolla yksi kaksi kolme neljГ¤ viisi kuusi seitsemГ¤n kahdeksan yhdeksГ¤n'.split(' '),
            numbersFuture = [
                'nolla', 'yhden', 'kahden', 'kolmen', 'neljГ¤n', 'viiden', 'kuuden',
                numbersPast[7], numbersPast[8], numbersPast[9]
            ];

        function translate(number, withoutSuffix, key, isFuture) {
            var result = '';
            switch (key) {
                case 's':
                    return isFuture ? 'muutaman sekunnin' : 'muutama sekunti';
                case 'm':
                    return isFuture ? 'minuutin' : 'minuutti';
                case 'mm':
                    result = isFuture ? 'minuutin' : 'minuuttia';
                    break;
                case 'h':
                    return isFuture ? 'tunnin' : 'tunti';
                case 'hh':
                    result = isFuture ? 'tunnin' : 'tuntia';
                    break;
                case 'd':
                    return isFuture ? 'pГ¤ivГ¤n' : 'pГ¤ivГ¤';
                case 'dd':
                    result = isFuture ? 'pГ¤ivГ¤n' : 'pГ¤ivГ¤Г¤';
                    break;
                case 'M':
                    return isFuture ? 'kuukauden' : 'kuukausi';
                case 'MM':
                    result = isFuture ? 'kuukauden' : 'kuukautta';
                    break;
                case 'y':
                    return isFuture ? 'vuoden' : 'vuosi';
                case 'yy':
                    result = isFuture ? 'vuoden' : 'vuotta';
                    break;
            }
            result = verbalNumber(number, isFuture) + ' ' + result;
            return result;
        }

        function verbalNumber(number, isFuture) {
            return number < 10 ? (isFuture ? numbersFuture[number] : numbersPast[number]) : number;
        }

        return moment.defineLocale('fi', {
            months : 'tammikuu_helmikuu_maaliskuu_huhtikuu_toukokuu_kesГ¤kuu_heinГ¤kuu_elokuu_syyskuu_lokakuu_marraskuu_joulukuu'.split('_'),
            monthsShort : 'tammi_helmi_maalis_huhti_touko_kesГ¤_heinГ¤_elo_syys_loka_marras_joulu'.split('_'),
            weekdays : 'sunnuntai_maanantai_tiistai_keskiviikko_torstai_perjantai_lauantai'.split('_'),
            weekdaysShort : 'su_ma_ti_ke_to_pe_la'.split('_'),
            weekdaysMin : 'su_ma_ti_ke_to_pe_la'.split('_'),
            longDateFormat : {
                LT : 'HH.mm',
                LTS : 'HH.mm.ss',
                L : 'DD.MM.YYYY',
                LL : 'Do MMMM[ta] YYYY',
                LLL : 'Do MMMM[ta] YYYY, [klo] LT',
                LLLL : 'dddd, Do MMMM[ta] YYYY, [klo] LT',
                l : 'D.M.YYYY',
                ll : 'Do MMM YYYY',
                lll : 'Do MMM YYYY, [klo] LT',
                llll : 'ddd, Do MMM YYYY, [klo] LT'
            },
            calendar : {
                sameDay : '[tГ¤nГ¤Г¤n] [klo] LT',
                nextDay : '[huomenna] [klo] LT',
                nextWeek : 'dddd [klo] LT',
                lastDay : '[eilen] [klo] LT',
                lastWeek : '[viime] dddd[na] [klo] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s pГ¤Г¤stГ¤',
                past : '%s sitten',
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : faroese (fo)
// author : Ragnar Johannesen : https://github.com/ragnar123

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('fo', {
            months : 'januar_februar_mars_aprГ­l_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
            monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
            weekdays : 'sunnudagur_mГЎnadagur_tГЅsdagur_mikudagur_hГіsdagur_frГ­ggjadagur_leygardagur'.split('_'),
            weekdaysShort : 'sun_mГЎn_tГЅs_mik_hГіs_frГ­_ley'.split('_'),
            weekdaysMin : 'su_mГЎ_tГЅ_mi_hГі_fr_le'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D. MMMM, YYYY LT'
            },
            calendar : {
                sameDay : '[ГЌ dag kl.] LT',
                nextDay : '[ГЌ morgin kl.] LT',
                nextWeek : 'dddd [kl.] LT',
                lastDay : '[ГЌ gjГЎr kl.] LT',
                lastWeek : '[sГ­Г°stu] dddd [kl] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'um %s',
                past : '%s sГ­Г°ani',
                s : 'fГЎ sekund',
                m : 'ein minutt',
                mm : '%d minuttir',
                h : 'ein tГ­mi',
                hh : '%d tГ­mar',
                d : 'ein dagur',
                dd : '%d dagar',
                M : 'ein mГЎnaГ°i',
                MM : '%d mГЎnaГ°ir',
                y : 'eitt ГЎr',
                yy : '%d ГЎr'
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : canadian french (fr-ca)
// author : Jonathan Abourbih : https://github.com/jonbca

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('fr-ca', {
            months : 'janvier_fГ©vrier_mars_avril_mai_juin_juillet_aoГ»t_septembre_octobre_novembre_dГ©cembre'.split('_'),
            monthsShort : 'janv._fГ©vr._mars_avr._mai_juin_juil._aoГ»t_sept._oct._nov._dГ©c.'.split('_'),
            weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
            weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
            weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'YYYY-MM-DD',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[Aujourd\'hui Г ] LT',
                nextDay: '[Demain Г ] LT',
                nextWeek: 'dddd [Г ] LT',
                lastDay: '[Hier Г ] LT',
                lastWeek: 'dddd [dernier Г ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'dans %s',
                past : 'il y a %s',
                s : 'quelques secondes',
                m : 'une minute',
                mm : '%d minutes',
                h : 'une heure',
                hh : '%d heures',
                d : 'un jour',
                dd : '%d jours',
                M : 'un mois',
                MM : '%d mois',
                y : 'un an',
                yy : '%d ans'
            },
            ordinalParse: /\d{1,2}(er|)/,
            ordinal : function (number) {
                return number + (number === 1 ? 'er' : '');
            }
        });
    }));
// moment.js locale configuration
// locale : french (fr)
// author : John Fischer : https://github.com/jfroffice

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('fr', {
            months : 'janvier_fГ©vrier_mars_avril_mai_juin_juillet_aoГ»t_septembre_octobre_novembre_dГ©cembre'.split('_'),
            monthsShort : 'janv._fГ©vr._mars_avr._mai_juin_juil._aoГ»t_sept._oct._nov._dГ©c.'.split('_'),
            weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
            weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
            weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[Aujourd\'hui Г ] LT',
                nextDay: '[Demain Г ] LT',
                nextWeek: 'dddd [Г ] LT',
                lastDay: '[Hier Г ] LT',
                lastWeek: 'dddd [dernier Г ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'dans %s',
                past : 'il y a %s',
                s : 'quelques secondes',
                m : 'une minute',
                mm : '%d minutes',
                h : 'une heure',
                hh : '%d heures',
                d : 'un jour',
                dd : '%d jours',
                M : 'un mois',
                MM : '%d mois',
                y : 'un an',
                yy : '%d ans'
            },
            ordinalParse: /\d{1,2}(er|)/,
            ordinal : function (number) {
                return number + (number === 1 ? 'er' : '');
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : frisian (fy)
// author : Robin van der Vliet : https://github.com/robin0van0der0v

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var monthsShortWithDots = 'jan._feb._mrt._apr._mai_jun._jul._aug._sep._okt._nov._des.'.split('_'),
            monthsShortWithoutDots = 'jan_feb_mrt_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_');

        return moment.defineLocale('fy', {
            months : 'jannewaris_febrewaris_maart_april_maaie_juny_july_augustus_septimber_oktober_novimber_desimber'.split('_'),
            monthsShort : function (m, format) {
                if (/-MMM-/.test(format)) {
                    return monthsShortWithoutDots[m.month()];
                } else {
                    return monthsShortWithDots[m.month()];
                }
            },
            weekdays : 'snein_moandei_tiisdei_woansdei_tongersdei_freed_sneon'.split('_'),
            weekdaysShort : 'si._mo._ti._wo._to._fr._so.'.split('_'),
            weekdaysMin : 'Si_Mo_Ti_Wo_To_Fr_So'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD-MM-YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[hjoed om] LT',
                nextDay: '[moarn om] LT',
                nextWeek: 'dddd [om] LT',
                lastDay: '[juster om] LT',
                lastWeek: '[ГґfrГ»ne] dddd [om] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'oer %s',
                past : '%s lyn',
                s : 'in pear sekonden',
                m : 'ien minГєt',
                mm : '%d minuten',
                h : 'ien oere',
                hh : '%d oeren',
                d : 'ien dei',
                dd : '%d dagen',
                M : 'ien moanne',
                MM : '%d moannen',
                y : 'ien jier',
                yy : '%d jierren'
            },
            ordinalParse: /\d{1,2}(ste|de)/,
            ordinal : function (number) {
                return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : galician (gl)
// author : Juan G. Hurtado : https://github.com/juanghurtado

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('gl', {
            months : 'Xaneiro_Febreiro_Marzo_Abril_Maio_XuГ±o_Xullo_Agosto_Setembro_Outubro_Novembro_Decembro'.split('_'),
            monthsShort : 'Xan._Feb._Mar._Abr._Mai._XuГ±._Xul._Ago._Set._Out._Nov._Dec.'.split('_'),
            weekdays : 'Domingo_Luns_Martes_MГ©rcores_Xoves_Venres_SГЎbado'.split('_'),
            weekdaysShort : 'Dom._Lun._Mar._MГ©r._Xov._Ven._SГЎb.'.split('_'),
            weekdaysMin : 'Do_Lu_Ma_MГ©_Xo_Ve_SГЎ'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay : function () {
                    return '[hoxe ' + ((this.hours() !== 1) ? 'ГЎs' : 'ГЎ') + '] LT';
                },
                nextDay : function () {
                    return '[maГ±ГЎ ' + ((this.hours() !== 1) ? 'ГЎs' : 'ГЎ') + '] LT';
                },
                nextWeek : function () {
                    return 'dddd [' + ((this.hours() !== 1) ? 'ГЎs' : 'a') + '] LT';
                },
                lastDay : function () {
                    return '[onte ' + ((this.hours() !== 1) ? 'ГЎ' : 'a') + '] LT';
                },
                lastWeek : function () {
                    return '[o] dddd [pasado ' + ((this.hours() !== 1) ? 'ГЎs' : 'a') + '] LT';
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : function (str) {
                    if (str === 'uns segundos') {
                        return 'nuns segundos';
                    }
                    return 'en ' + str;
                },
                past : 'hai %s',
                s : 'uns segundos',
                m : 'un minuto',
                mm : '%d minutos',
                h : 'unha hora',
                hh : '%d horas',
                d : 'un dГ­a',
                dd : '%d dГ­as',
                M : 'un mes',
                MM : '%d meses',
                y : 'un ano',
                yy : '%d anos'
            },
            ordinalParse : /\d{1,2}Вє/,
            ordinal : '%dВє',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Hebrew (he)
// author : Tomer Cohen : https://github.com/tomer
// author : Moshe Simantov : https://github.com/DevelopmentIL
// author : Tal Ater : https://github.com/TalAter

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('he', {
            months : 'Ч™Ч Ч•ЧђЧЁ_Ч¤Ч‘ЧЁЧ•ЧђЧЁ_ЧћЧЁЧҐ_ЧђЧ¤ЧЁЧ™Чњ_ЧћЧђЧ™_Ч™Ч•Ч Ч™_Ч™Ч•ЧњЧ™_ЧђЧ•Ч’Ч•ЧЎЧ_ЧЎЧ¤ЧЧћЧ‘ЧЁ_ЧђЧ•Ч§ЧЧ•Ч‘ЧЁ_Ч Ч•Ч‘ЧћЧ‘ЧЁ_Ч“Ч¦ЧћЧ‘ЧЁ'.split('_'),
            monthsShort : 'Ч™Ч Ч•Чі_Ч¤Ч‘ЧЁЧі_ЧћЧЁЧҐ_ЧђЧ¤ЧЁЧі_ЧћЧђЧ™_Ч™Ч•Ч Ч™_Ч™Ч•ЧњЧ™_ЧђЧ•Ч’Чі_ЧЎЧ¤ЧЧі_ЧђЧ•Ч§Чі_Ч Ч•Ч‘Чі_Ч“Ч¦ЧћЧі'.split('_'),
            weekdays : 'ЧЁЧђЧ©Ч•Чџ_Ч©Ч Ч™_Ч©ЧњЧ™Ч©Ч™_ЧЁЧ‘Ч™ЧўЧ™_Ч—ЧћЧ™Ч©Ч™_Ч©Ч™Ч©Ч™_Ч©Ч‘ЧЄ'.split('_'),
            weekdaysShort : 'ЧђЧі_Ч‘Чі_Ч’Чі_Ч“Чі_Ч”Чі_Ч•Чі_Ч©Чі'.split('_'),
            weekdaysMin : 'Чђ_Ч‘_Ч’_Ч“_Ч”_Ч•_Ч©'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D [Ч‘]MMMM YYYY',
                LLL : 'D [Ч‘]MMMM YYYY LT',
                LLLL : 'dddd, D [Ч‘]MMMM YYYY LT',
                l : 'D/M/YYYY',
                ll : 'D MMM YYYY',
                lll : 'D MMM YYYY LT',
                llll : 'ddd, D MMM YYYY LT'
            },
            calendar : {
                sameDay : '[Ч”Ч™Ч•Чќ Ч‘Цѕ]LT',
                nextDay : '[ЧћЧ—ЧЁ Ч‘Цѕ]LT',
                nextWeek : 'dddd [Ч‘Ч©ЧўЧ”] LT',
                lastDay : '[ЧђЧЄЧћЧ•Чњ Ч‘Цѕ]LT',
                lastWeek : '[Ч‘Ч™Ч•Чќ] dddd [Ч”ЧђЧ—ЧЁЧ•Чџ Ч‘Ч©ЧўЧ”] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'Ч‘ЧўЧ•Ч“ %s',
                past : 'ЧњЧ¤Ч Ч™ %s',
                s : 'ЧћЧЎЧ¤ЧЁ Ч©Ч Ч™Ч•ЧЄ',
                m : 'Ч“Ч§Ч”',
                mm : '%d Ч“Ч§Ч•ЧЄ',
                h : 'Ч©ЧўЧ”',
                hh : function (number) {
                    if (number === 2) {
                        return 'Ч©ЧўЧЄЧ™Ч™Чќ';
                    }
                    return number + ' Ч©ЧўЧ•ЧЄ';
                },
                d : 'Ч™Ч•Чќ',
                dd : function (number) {
                    if (number === 2) {
                        return 'Ч™Ч•ЧћЧ™Ч™Чќ';
                    }
                    return number + ' Ч™ЧћЧ™Чќ';
                },
                M : 'Ч—Ч•Ч“Ч©',
                MM : function (number) {
                    if (number === 2) {
                        return 'Ч—Ч•Ч“Ч©Ч™Ч™Чќ';
                    }
                    return number + ' Ч—Ч•Ч“Ч©Ч™Чќ';
                },
                y : 'Ч©Ч Ч”',
                yy : function (number) {
                    if (number === 2) {
                        return 'Ч©Ч ЧЄЧ™Ч™Чќ';
                    } else if (number % 10 === 0 && number !== 10) {
                        return number + ' Ч©Ч Ч”';
                    }
                    return number + ' Ч©Ч Ч™Чќ';
                }
            }
        });
    }));
// moment.js locale configuration
// locale : hindi (hi)
// author : Mayank Singhal : https://github.com/mayanksinghal

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'аҐ§',
                '2': 'аҐЁ',
                '3': 'аҐ©',
                '4': 'аҐЄ',
                '5': 'аҐ«',
                '6': 'аҐ¬',
                '7': 'аҐ­',
                '8': 'аҐ®',
                '9': 'аҐЇ',
                '0': 'аҐ¦'
            },
            numberMap = {
                'аҐ§': '1',
                'аҐЁ': '2',
                'аҐ©': '3',
                'аҐЄ': '4',
                'аҐ«': '5',
                'аҐ¬': '6',
                'аҐ­': '7',
                'аҐ®': '8',
                'аҐЇ': '9',
                'аҐ¦': '0'
            };

        return moment.defineLocale('hi', {
            months : 'а¤ња¤Ёа¤µа¤°аҐЂ_а¤«а¤ја¤°а¤µа¤°аҐЂ_а¤®а¤ѕа¤°аҐЌа¤љ_а¤…а¤ЄаҐЌа¤°аҐ€а¤І_а¤®а¤€_а¤њаҐ‚а¤Ё_а¤њаҐЃа¤Іа¤ѕа¤€_а¤…а¤—а¤ёаҐЌа¤¤_а¤ёа¤їа¤¤а¤®аҐЌа¤¬а¤°_а¤…а¤•аҐЌа¤џаҐ‚а¤¬а¤°_а¤Ёа¤µа¤®аҐЌа¤¬а¤°_а¤¦а¤їа¤ёа¤®аҐЌа¤¬а¤°'.split('_'),
            monthsShort : 'а¤ња¤Ё._а¤«а¤ја¤°._а¤®а¤ѕа¤°аҐЌа¤љ_а¤…а¤ЄаҐЌа¤°аҐ€._а¤®а¤€_а¤њаҐ‚а¤Ё_а¤њаҐЃа¤І._а¤…а¤—._а¤ёа¤їа¤¤._а¤…а¤•аҐЌа¤џаҐ‚._а¤Ёа¤µ._а¤¦а¤їа¤ё.'.split('_'),
            weekdays : 'а¤°а¤µа¤їа¤µа¤ѕа¤°_а¤ёаҐ‹а¤®а¤µа¤ѕа¤°_а¤®а¤‚а¤—а¤Іа¤µа¤ѕа¤°_а¤¬аҐЃа¤§а¤µа¤ѕа¤°_а¤—аҐЃа¤°аҐ‚а¤µа¤ѕа¤°_а¤¶аҐЃа¤•аҐЌа¤°а¤µа¤ѕа¤°_а¤¶а¤Ёа¤їа¤µа¤ѕа¤°'.split('_'),
            weekdaysShort : 'а¤°а¤µа¤ї_а¤ёаҐ‹а¤®_а¤®а¤‚а¤—а¤І_а¤¬аҐЃа¤§_а¤—аҐЃа¤°аҐ‚_а¤¶аҐЃа¤•аҐЌа¤°_а¤¶а¤Ёа¤ї'.split('_'),
            weekdaysMin : 'а¤°_а¤ёаҐ‹_а¤®а¤‚_а¤¬аҐЃ_а¤—аҐЃ_а¤¶аҐЃ_а¤¶'.split('_'),
            longDateFormat : {
                LT : 'A h:mm а¤¬а¤њаҐ‡',
                LTS : 'A h:mm:ss а¤¬а¤њаҐ‡',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY, LT',
                LLLL : 'dddd, D MMMM YYYY, LT'
            },
            calendar : {
                sameDay : '[а¤†а¤њ] LT',
                nextDay : '[а¤•а¤І] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[а¤•а¤І] LT',
                lastWeek : '[а¤Єа¤їа¤›а¤ІаҐ‡] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s а¤®аҐ‡а¤‚',
                past : '%s а¤Єа¤№а¤ІаҐ‡',
                s : 'а¤•аҐЃа¤› а¤№аҐЂ а¤•аҐЌа¤·а¤Ј',
                m : 'а¤Џа¤• а¤®а¤їа¤Ёа¤џ',
                mm : '%d а¤®а¤їа¤Ёа¤џ',
                h : 'а¤Џа¤• а¤а¤‚а¤џа¤ѕ',
                hh : '%d а¤а¤‚а¤џаҐ‡',
                d : 'а¤Џа¤• а¤¦а¤їа¤Ё',
                dd : '%d а¤¦а¤їа¤Ё',
                M : 'а¤Џа¤• а¤®а¤№аҐЂа¤ЁаҐ‡',
                MM : '%d а¤®а¤№аҐЂа¤ЁаҐ‡',
                y : 'а¤Џа¤• а¤µа¤°аҐЌа¤·',
                yy : '%d а¤µа¤°аҐЌа¤·'
            },
            preparse: function (string) {
                return string.replace(/[аҐ§аҐЁаҐ©аҐЄаҐ«аҐ¬аҐ­аҐ®аҐЇаҐ¦]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            // Hindi notation for meridiems are quite fuzzy in practice. While there exists
            // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
            meridiemParse: /а¤°а¤ѕа¤¤|а¤ёаҐЃа¤¬а¤№|а¤¦аҐ‹а¤Єа¤№а¤°|а¤¶а¤ѕа¤®/,
            meridiemHour : function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'а¤°а¤ѕа¤¤') {
                    return hour < 4 ? hour : hour + 12;
                } else if (meridiem === 'а¤ёаҐЃа¤¬а¤№') {
                    return hour;
                } else if (meridiem === 'а¤¦аҐ‹а¤Єа¤№а¤°') {
                    return hour >= 10 ? hour : hour + 12;
                } else if (meridiem === 'а¤¶а¤ѕа¤®') {
                    return hour + 12;
                }
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'а¤°а¤ѕа¤¤';
                } else if (hour < 10) {
                    return 'а¤ёаҐЃа¤¬а¤№';
                } else if (hour < 17) {
                    return 'а¤¦аҐ‹а¤Єа¤№а¤°';
                } else if (hour < 20) {
                    return 'а¤¶а¤ѕа¤®';
                } else {
                    return 'а¤°а¤ѕа¤¤';
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : hrvatski (hr)
// author : Bojan MarkoviД‡ : https://github.com/bmarkovic

// based on (sl) translation by Robert SedovЕЎek

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function translate(number, withoutSuffix, key) {
            var result = number + ' ';
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'jedna minuta' : 'jedne minute';
                case 'mm':
                    if (number === 1) {
                        result += 'minuta';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'minute';
                    } else {
                        result += 'minuta';
                    }
                    return result;
                case 'h':
                    return withoutSuffix ? 'jedan sat' : 'jednog sata';
                case 'hh':
                    if (number === 1) {
                        result += 'sat';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'sata';
                    } else {
                        result += 'sati';
                    }
                    return result;
                case 'dd':
                    if (number === 1) {
                        result += 'dan';
                    } else {
                        result += 'dana';
                    }
                    return result;
                case 'MM':
                    if (number === 1) {
                        result += 'mjesec';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'mjeseca';
                    } else {
                        result += 'mjeseci';
                    }
                    return result;
                case 'yy':
                    if (number === 1) {
                        result += 'godina';
                    } else if (number === 2 || number === 3 || number === 4) {
                        result += 'godine';
                    } else {
                        result += 'godina';
                    }
                    return result;
            }
        }

        return moment.defineLocale('hr', {
            months : 'sjeДЌanj_veljaДЌa_oЕѕujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split('_'),
            monthsShort : 'sje._vel._oЕѕu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split('_'),
            weekdays : 'nedjelja_ponedjeljak_utorak_srijeda_ДЌetvrtak_petak_subota'.split('_'),
            weekdaysShort : 'ned._pon._uto._sri._ДЌet._pet._sub.'.split('_'),
            weekdaysMin : 'ne_po_ut_sr_ДЌe_pe_su'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD. MM. YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd, D. MMMM YYYY LT'
            },
            calendar : {
                sameDay  : '[danas u] LT',
                nextDay  : '[sutra u] LT',

                nextWeek : function () {
                    switch (this.day()) {
                        case 0:
                            return '[u] [nedjelju] [u] LT';
                        case 3:
                            return '[u] [srijedu] [u] LT';
                        case 6:
                            return '[u] [subotu] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[u] dddd [u] LT';
                    }
                },
                lastDay  : '[juДЌer u] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                            return '[proЕЎlu] dddd [u] LT';
                        case 6:
                            return '[proЕЎle] [subote] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[proЕЎli] dddd [u] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'za %s',
                past   : 'prije %s',
                s      : 'par sekundi',
                m      : translate,
                mm     : translate,
                h      : translate,
                hh     : translate,
                d      : 'dan',
                dd     : translate,
                M      : 'mjesec',
                MM     : translate,
                y      : 'godinu',
                yy     : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : hungarian (hu)
// author : Adam Brunner : https://github.com/adambrunner

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var weekEndings = 'vasГЎrnap hГ©tfЕ‘n kedden szerdГЎn csГјtГ¶rtГ¶kГ¶n pГ©nteken szombaton'.split(' ');

        function translate(number, withoutSuffix, key, isFuture) {
            var num = number,
                suffix;

            switch (key) {
                case 's':
                    return (isFuture || withoutSuffix) ? 'nГ©hГЎny mГЎsodperc' : 'nГ©hГЎny mГЎsodperce';
                case 'm':
                    return 'egy' + (isFuture || withoutSuffix ? ' perc' : ' perce');
                case 'mm':
                    return num + (isFuture || withoutSuffix ? ' perc' : ' perce');
                case 'h':
                    return 'egy' + (isFuture || withoutSuffix ? ' Гіra' : ' ГіrГЎja');
                case 'hh':
                    return num + (isFuture || withoutSuffix ? ' Гіra' : ' ГіrГЎja');
                case 'd':
                    return 'egy' + (isFuture || withoutSuffix ? ' nap' : ' napja');
                case 'dd':
                    return num + (isFuture || withoutSuffix ? ' nap' : ' napja');
                case 'M':
                    return 'egy' + (isFuture || withoutSuffix ? ' hГіnap' : ' hГіnapja');
                case 'MM':
                    return num + (isFuture || withoutSuffix ? ' hГіnap' : ' hГіnapja');
                case 'y':
                    return 'egy' + (isFuture || withoutSuffix ? ' Г©v' : ' Г©ve');
                case 'yy':
                    return num + (isFuture || withoutSuffix ? ' Г©v' : ' Г©ve');
            }

            return '';
        }

        function week(isFuture) {
            return (isFuture ? '' : '[mГєlt] ') + '[' + weekEndings[this.day()] + '] LT[-kor]';
        }

        return moment.defineLocale('hu', {
            months : 'januГЎr_februГЎr_mГЎrcius_ГЎprilis_mГЎjus_jГєnius_jГєlius_augusztus_szeptember_oktГіber_november_december'.split('_'),
            monthsShort : 'jan_feb_mГЎrc_ГЎpr_mГЎj_jГєn_jГєl_aug_szept_okt_nov_dec'.split('_'),
            weekdays : 'vasГЎrnap_hГ©tfЕ‘_kedd_szerda_csГјtГ¶rtГ¶k_pГ©ntek_szombat'.split('_'),
            weekdaysShort : 'vas_hГ©t_kedd_sze_csГјt_pГ©n_szo'.split('_'),
            weekdaysMin : 'v_h_k_sze_cs_p_szo'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'YYYY.MM.DD.',
                LL : 'YYYY. MMMM D.',
                LLL : 'YYYY. MMMM D., LT',
                LLLL : 'YYYY. MMMM D., dddd LT'
            },
            meridiemParse: /de|du/i,
            isPM: function (input) {
                return input.charAt(1).toLowerCase() === 'u';
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours < 12) {
                    return isLower === true ? 'de' : 'DE';
                } else {
                    return isLower === true ? 'du' : 'DU';
                }
            },
            calendar : {
                sameDay : '[ma] LT[-kor]',
                nextDay : '[holnap] LT[-kor]',
                nextWeek : function () {
                    return week.call(this, true);
                },
                lastDay : '[tegnap] LT[-kor]',
                lastWeek : function () {
                    return week.call(this, false);
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s mГєlva',
                past : '%s',
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Armenian (hy-am)
// author : Armendarabyan : https://github.com/armendarabyan

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'Х°ХёЦ‚Х¶ХѕХЎЦЂ_ЦѓХҐХїЦЂХѕХЎЦЂ_ХґХЎЦЂХї_ХЎХєЦЂХ«Х¬_ХґХЎХµХ«ХЅ_Х°ХёЦ‚Х¶Х«ХЅ_Х°ХёЦ‚Х¬Х«ХЅ_Ц…ХЈХёХЅХїХёХЅ_ХЅХҐХєХїХҐХґХўХҐЦЂ_Х°ХёХЇХїХҐХґХўХҐЦЂ_Х¶ХёХµХҐХґХўХҐЦЂ_Х¤ХҐХЇХїХҐХґХўХҐЦЂ'.split('_'),
                    'accusative': 'Х°ХёЦ‚Х¶ХѕХЎЦЂХ«_ЦѓХҐХїЦЂХѕХЎЦЂХ«_ХґХЎЦЂХїХ«_ХЎХєЦЂХ«Х¬Х«_ХґХЎХµХ«ХЅХ«_Х°ХёЦ‚Х¶Х«ХЅХ«_Х°ХёЦ‚Х¬Х«ХЅХ«_Ц…ХЈХёХЅХїХёХЅХ«_ХЅХҐХєХїХҐХґХўХҐЦЂХ«_Х°ХёХЇХїХҐХґХўХҐЦЂХ«_Х¶ХёХµХҐХґХўХҐЦЂХ«_Х¤ХҐХЇХїХҐХґХўХҐЦЂХ«'.split('_')
                },

                nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function monthsShortCaseReplace(m, format) {
            var monthsShort = 'Х°Х¶Хѕ_ЦѓХїЦЂ_ХґЦЂХї_ХЎХєЦЂ_ХґХµХЅ_Х°Х¶ХЅ_Х°Х¬ХЅ_Ц…ХЈХЅ_ХЅХєХї_Х°ХЇХї_Х¶ХґХў_Х¤ХЇХї'.split('_');

            return monthsShort[m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = 'ХЇХ«ЦЂХЎХЇХ«_ХҐЦЂХЇХёЦ‚Х·ХЎХўХ©Х«_ХҐЦЂХҐЦ„Х·ХЎХўХ©Х«_Х№ХёЦЂХҐЦ„Х·ХЎХўХ©Х«_Х°Х«Х¶ХЈХ·ХЎХўХ©Х«_ХёЦ‚ЦЂХўХЎХ©_Х·ХЎХўХЎХ©'.split('_');

            return weekdays[m.day()];
        }

        return moment.defineLocale('hy-am', {
            months : monthsCaseReplace,
            monthsShort : monthsShortCaseReplace,
            weekdays : weekdaysCaseReplace,
            weekdaysShort : 'ХЇЦЂХЇ_ХҐЦЂХЇ_ХҐЦЂЦ„_Х№ЦЂЦ„_Х°Х¶ХЈ_ХёЦ‚ЦЂХў_Х·ХўХ©'.split('_'),
            weekdaysMin : 'ХЇЦЂХЇ_ХҐЦЂХЇ_ХҐЦЂЦ„_Х№ЦЂЦ„_Х°Х¶ХЈ_ХёЦ‚ЦЂХў_Х·ХўХ©'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY Х©.',
                LLL : 'D MMMM YYYY Х©., LT',
                LLLL : 'dddd, D MMMM YYYY Х©., LT'
            },
            calendar : {
                sameDay: '[ХЎХµХЅЦ…ЦЂ] LT',
                nextDay: '[ХѕХЎХІХЁ] LT',
                lastDay: '[ХҐЦЂХҐХЇ] LT',
                nextWeek: function () {
                    return 'dddd [Ц…ЦЂХЁ ХЄХЎХґХЁ] LT';
                },
                lastWeek: function () {
                    return '[ХЎХ¶ЦЃХЎХ®] dddd [Ц…ЦЂХЁ ХЄХЎХґХЁ] LT';
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : '%s Х°ХҐХїХё',
                past : '%s ХЎХјХЎХ»',
                s : 'ХґХ« Ц„ХЎХ¶Х« ХѕХЎХµЦЂХЇХµХЎХ¶',
                m : 'ЦЂХёХєХҐ',
                mm : '%d ЦЂХёХєХҐ',
                h : 'ХЄХЎХґ',
                hh : '%d ХЄХЎХґ',
                d : 'Ц…ЦЂ',
                dd : '%d Ц…ЦЂ',
                M : 'ХЎХґХ«ХЅ',
                MM : '%d ХЎХґХ«ХЅ',
                y : 'ХїХЎЦЂХ«',
                yy : '%d ХїХЎЦЂХ«'
            },

            meridiemParse: /ХЈХ«Х·ХҐЦЂХѕХЎ|ХЎХјХЎХѕХёХїХѕХЎ|ЦЃХҐЦЂХҐХЇХѕХЎ|ХҐЦЂХҐХЇХёХµХЎХ¶/,
            isPM: function (input) {
                return /^(ЦЃХҐЦЂХҐХЇХѕХЎ|ХҐЦЂХҐХЇХёХµХЎХ¶)$/.test(input);
            },
            meridiem : function (hour) {
                if (hour < 4) {
                    return 'ХЈХ«Х·ХҐЦЂХѕХЎ';
                } else if (hour < 12) {
                    return 'ХЎХјХЎХѕХёХїХѕХЎ';
                } else if (hour < 17) {
                    return 'ЦЃХҐЦЂХҐХЇХѕХЎ';
                } else {
                    return 'ХҐЦЂХҐХЇХёХµХЎХ¶';
                }
            },

            ordinalParse: /\d{1,2}|\d{1,2}-(Х«Х¶|ЦЂХ¤)/,
            ordinal: function (number, period) {
                switch (period) {
                    case 'DDD':
                    case 'w':
                    case 'W':
                    case 'DDDo':
                        if (number === 1) {
                            return number + '-Х«Х¶';
                        }
                        return number + '-ЦЂХ¤';
                    default:
                        return number;
                }
            },

            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Bahasa Indonesia (id)
// author : Mohammad Satrio Utomo : https://github.com/tyok
// reference: http://id.wikisource.org/wiki/Pedoman_Umum_Ejaan_Bahasa_Indonesia_yang_Disempurnakan

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('id', {
            months : 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split('_'),
            monthsShort : 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des'.split('_'),
            weekdays : 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
            weekdaysShort : 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
            weekdaysMin : 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
            longDateFormat : {
                LT : 'HH.mm',
                LTS : 'LT.ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY [pukul] LT',
                LLLL : 'dddd, D MMMM YYYY [pukul] LT'
            },
            meridiemParse: /pagi|siang|sore|malam/,
            meridiemHour : function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'pagi') {
                    return hour;
                } else if (meridiem === 'siang') {
                    return hour >= 11 ? hour : hour + 12;
                } else if (meridiem === 'sore' || meridiem === 'malam') {
                    return hour + 12;
                }
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours < 11) {
                    return 'pagi';
                } else if (hours < 15) {
                    return 'siang';
                } else if (hours < 19) {
                    return 'sore';
                } else {
                    return 'malam';
                }
            },
            calendar : {
                sameDay : '[Hari ini pukul] LT',
                nextDay : '[Besok pukul] LT',
                nextWeek : 'dddd [pukul] LT',
                lastDay : '[Kemarin pukul] LT',
                lastWeek : 'dddd [lalu pukul] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'dalam %s',
                past : '%s yang lalu',
                s : 'beberapa detik',
                m : 'semenit',
                mm : '%d menit',
                h : 'sejam',
                hh : '%d jam',
                d : 'sehari',
                dd : '%d hari',
                M : 'sebulan',
                MM : '%d bulan',
                y : 'setahun',
                yy : '%d tahun'
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : icelandic (is)
// author : Hinrik Г–rn SigurГ°sson : https://github.com/hinrik

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function plural(n) {
            if (n % 100 === 11) {
                return true;
            } else if (n % 10 === 1) {
                return false;
            }
            return true;
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + ' ';
            switch (key) {
                case 's':
                    return withoutSuffix || isFuture ? 'nokkrar sekГєndur' : 'nokkrum sekГєndum';
                case 'm':
                    return withoutSuffix ? 'mГ­nГєta' : 'mГ­nГєtu';
                case 'mm':
                    if (plural(number)) {
                        return result + (withoutSuffix || isFuture ? 'mГ­nГєtur' : 'mГ­nГєtum');
                    } else if (withoutSuffix) {
                        return result + 'mГ­nГєta';
                    }
                    return result + 'mГ­nГєtu';
                case 'hh':
                    if (plural(number)) {
                        return result + (withoutSuffix || isFuture ? 'klukkustundir' : 'klukkustundum');
                    }
                    return result + 'klukkustund';
                case 'd':
                    if (withoutSuffix) {
                        return 'dagur';
                    }
                    return isFuture ? 'dag' : 'degi';
                case 'dd':
                    if (plural(number)) {
                        if (withoutSuffix) {
                            return result + 'dagar';
                        }
                        return result + (isFuture ? 'daga' : 'dГ¶gum');
                    } else if (withoutSuffix) {
                        return result + 'dagur';
                    }
                    return result + (isFuture ? 'dag' : 'degi');
                case 'M':
                    if (withoutSuffix) {
                        return 'mГЎnuГ°ur';
                    }
                    return isFuture ? 'mГЎnuГ°' : 'mГЎnuГ°i';
                case 'MM':
                    if (plural(number)) {
                        if (withoutSuffix) {
                            return result + 'mГЎnuГ°ir';
                        }
                        return result + (isFuture ? 'mГЎnuГ°i' : 'mГЎnuГ°um');
                    } else if (withoutSuffix) {
                        return result + 'mГЎnuГ°ur';
                    }
                    return result + (isFuture ? 'mГЎnuГ°' : 'mГЎnuГ°i');
                case 'y':
                    return withoutSuffix || isFuture ? 'ГЎr' : 'ГЎri';
                case 'yy':
                    if (plural(number)) {
                        return result + (withoutSuffix || isFuture ? 'ГЎr' : 'ГЎrum');
                    }
                    return result + (withoutSuffix || isFuture ? 'ГЎr' : 'ГЎri');
            }
        }

        return moment.defineLocale('is', {
            months : 'janГєar_febrГєar_mars_aprГ­l_maГ­_jГєnГ­_jГєlГ­_ГЎgГєst_september_oktГіber_nГіvember_desember'.split('_'),
            monthsShort : 'jan_feb_mar_apr_maГ­_jГєn_jГєl_ГЎgГє_sep_okt_nГіv_des'.split('_'),
            weekdays : 'sunnudagur_mГЎnudagur_ГѕriГ°judagur_miГ°vikudagur_fimmtudagur_fГ¶studagur_laugardagur'.split('_'),
            weekdaysShort : 'sun_mГЎn_Гѕri_miГ°_fim_fГ¶s_lau'.split('_'),
            weekdaysMin : 'Su_MГЎ_Гћr_Mi_Fi_FГ¶_La'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY [kl.] LT',
                LLLL : 'dddd, D. MMMM YYYY [kl.] LT'
            },
            calendar : {
                sameDay : '[Г­ dag kl.] LT',
                nextDay : '[ГЎ morgun kl.] LT',
                nextWeek : 'dddd [kl.] LT',
                lastDay : '[Г­ gГ¦r kl.] LT',
                lastWeek : '[sГ­Г°asta] dddd [kl.] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'eftir %s',
                past : 'fyrir %s sГ­Г°an',
                s : translate,
                m : translate,
                mm : translate,
                h : 'klukkustund',
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : italian (it)
// author : Lorenzo : https://github.com/aliem
// author: Mattia Larentis: https://github.com/nostalgiaz

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('it', {
            months : 'gennaio_febbraio_marzo_aprile_maggio_giugno_luglio_agosto_settembre_ottobre_novembre_dicembre'.split('_'),
            monthsShort : 'gen_feb_mar_apr_mag_giu_lug_ago_set_ott_nov_dic'.split('_'),
            weekdays : 'Domenica_LunedГ¬_MartedГ¬_MercoledГ¬_GiovedГ¬_VenerdГ¬_Sabato'.split('_'),
            weekdaysShort : 'Dom_Lun_Mar_Mer_Gio_Ven_Sab'.split('_'),
            weekdaysMin : 'D_L_Ma_Me_G_V_S'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[Oggi alle] LT',
                nextDay: '[Domani alle] LT',
                nextWeek: 'dddd [alle] LT',
                lastDay: '[Ieri alle] LT',
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[la scorsa] dddd [alle] LT';
                        default:
                            return '[lo scorso] dddd [alle] LT';
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : function (s) {
                    return ((/^[0-9].+$/).test(s) ? 'tra' : 'in') + ' ' + s;
                },
                past : '%s fa',
                s : 'alcuni secondi',
                m : 'un minuto',
                mm : '%d minuti',
                h : 'un\'ora',
                hh : '%d ore',
                d : 'un giorno',
                dd : '%d giorni',
                M : 'un mese',
                MM : '%d mesi',
                y : 'un anno',
                yy : '%d anni'
            },
            ordinalParse : /\d{1,2}Вє/,
            ordinal: '%dВє',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : japanese (ja)
// author : LI Long : https://github.com/baryon

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('ja', {
            months : '1жњ€_2жњ€_3жњ€_4жњ€_5жњ€_6жњ€_7жњ€_8жњ€_9жњ€_10жњ€_11жњ€_12жњ€'.split('_'),
            monthsShort : '1жњ€_2жњ€_3жњ€_4жњ€_5жњ€_6жњ€_7жњ€_8жњ€_9жњ€_10жњ€_11жњ€_12жњ€'.split('_'),
            weekdays : 'ж—Ґж›њж—Ґ_жњ€ж›њж—Ґ_зЃ«ж›њж—Ґ_ж°ґж›њж—Ґ_жњЁж›њж—Ґ_й‡‘ж›њж—Ґ_ењџж›њж—Ґ'.split('_'),
            weekdaysShort : 'ж—Ґ_жњ€_зЃ«_ж°ґ_жњЁ_й‡‘_ењџ'.split('_'),
            weekdaysMin : 'ж—Ґ_жњ€_зЃ«_ж°ґ_жњЁ_й‡‘_ењџ'.split('_'),
            longDateFormat : {
                LT : 'Ahж™‚mе€†',
                LTS : 'LTsз§’',
                L : 'YYYY/MM/DD',
                LL : 'YYYYе№ґMжњ€Dж—Ґ',
                LLL : 'YYYYе№ґMжњ€Dж—ҐLT',
                LLLL : 'YYYYе№ґMжњ€Dж—ҐLT dddd'
            },
            meridiemParse: /еЌ€е‰Ќ|еЌ€еѕЊ/i,
            isPM : function (input) {
                return input === 'еЌ€еѕЊ';
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return 'еЌ€е‰Ќ';
                } else {
                    return 'еЌ€еѕЊ';
                }
            },
            calendar : {
                sameDay : '[д»Љж—Ґ] LT',
                nextDay : '[жЋж—Ґ] LT',
                nextWeek : '[жќҐйЂ±]dddd LT',
                lastDay : '[жЁж—Ґ] LT',
                lastWeek : '[е‰ЌйЂ±]dddd LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%sеѕЊ',
                past : '%sе‰Ќ',
                s : 'ж•°з§’',
                m : '1е€†',
                mm : '%dе€†',
                h : '1ж™‚й–“',
                hh : '%dж™‚й–“',
                d : '1ж—Ґ',
                dd : '%dж—Ґ',
                M : '1гѓ¶жњ€',
                MM : '%dгѓ¶жњ€',
                y : '1е№ґ',
                yy : '%dе№ґ'
            }
        });
    }));
// moment.js locale configuration
// locale : Georgian (ka)
// author : Irakli Janiashvili : https://github.com/irakli-janiashvili

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'бѓбѓђбѓњбѓ•бѓђбѓ бѓ_бѓ—бѓ”бѓ‘бѓ”бѓ бѓ•бѓђбѓљбѓ_бѓ›бѓђбѓ бѓўбѓ_бѓђбѓћбѓ бѓбѓљбѓ_бѓ›бѓђбѓбѓЎбѓ_бѓбѓ•бѓњбѓбѓЎбѓ_бѓбѓ•бѓљбѓбѓЎбѓ_бѓђбѓ’бѓ•бѓбѓЎбѓўбѓќ_бѓЎбѓ”бѓҐбѓўбѓ”бѓ›бѓ‘бѓ”бѓ бѓ_бѓќбѓҐбѓўбѓќбѓ›бѓ‘бѓ”бѓ бѓ_бѓњбѓќбѓ”бѓ›бѓ‘бѓ”бѓ бѓ_бѓ“бѓ”бѓ™бѓ”бѓ›бѓ‘бѓ”бѓ бѓ'.split('_'),
                    'accusative': 'бѓбѓђбѓњбѓ•бѓђбѓ бѓЎ_бѓ—бѓ”бѓ‘бѓ”бѓ бѓ•бѓђбѓљбѓЎ_бѓ›бѓђбѓ бѓўбѓЎ_бѓђбѓћбѓ бѓбѓљбѓбѓЎ_бѓ›бѓђбѓбѓЎбѓЎ_бѓбѓ•бѓњбѓбѓЎбѓЎ_бѓбѓ•бѓљбѓбѓЎбѓЎ_бѓђбѓ’бѓ•бѓбѓЎбѓўбѓЎ_бѓЎбѓ”бѓҐбѓўбѓ”бѓ›бѓ‘бѓ”бѓ бѓЎ_бѓќбѓҐбѓўбѓќбѓ›бѓ‘бѓ”бѓ бѓЎ_бѓњбѓќбѓ”бѓ›бѓ‘бѓ”бѓ бѓЎ_бѓ“бѓ”бѓ™бѓ”бѓ›бѓ‘бѓ”бѓ бѓЎ'.split('_')
                },

                nounCase = (/D[oD] *MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = {
                    'nominative': 'бѓ™бѓ•бѓбѓ бѓђ_бѓќбѓ бѓЁбѓђбѓ‘бѓђбѓ—бѓ_бѓЎбѓђбѓ›бѓЁбѓђбѓ‘бѓђбѓ—бѓ_бѓќбѓ—бѓ®бѓЁбѓђбѓ‘бѓђбѓ—бѓ_бѓ®бѓЈбѓ—бѓЁбѓђбѓ‘бѓђбѓ—бѓ_бѓћбѓђбѓ бѓђбѓЎбѓ™бѓ”бѓ•бѓ_бѓЁбѓђбѓ‘бѓђбѓ—бѓ'.split('_'),
                    'accusative': 'бѓ™бѓ•бѓбѓ бѓђбѓЎ_бѓќбѓ бѓЁбѓђбѓ‘бѓђбѓ—бѓЎ_бѓЎбѓђбѓ›бѓЁбѓђбѓ‘бѓђбѓ—бѓЎ_бѓќбѓ—бѓ®бѓЁбѓђбѓ‘бѓђбѓ—бѓЎ_бѓ®бѓЈбѓ—бѓЁбѓђбѓ‘бѓђбѓ—бѓЎ_бѓћбѓђбѓ бѓђбѓЎбѓ™бѓ”бѓ•бѓЎ_бѓЁбѓђбѓ‘бѓђбѓ—бѓЎ'.split('_')
                },

                nounCase = (/(бѓ¬бѓбѓњбѓђ|бѓЁбѓ”бѓ›бѓ“бѓ”бѓ’)/).test(format) ?
                    'accusative' :
                    'nominative';

            return weekdays[nounCase][m.day()];
        }

        return moment.defineLocale('ka', {
            months : monthsCaseReplace,
            monthsShort : 'бѓбѓђбѓњ_бѓ—бѓ”бѓ‘_бѓ›бѓђбѓ _бѓђбѓћбѓ _бѓ›бѓђбѓ_бѓбѓ•бѓњ_бѓбѓ•бѓљ_бѓђбѓ’бѓ•_бѓЎбѓ”бѓҐ_бѓќбѓҐбѓў_бѓњбѓќбѓ”_бѓ“бѓ”бѓ™'.split('_'),
            weekdays : weekdaysCaseReplace,
            weekdaysShort : 'бѓ™бѓ•бѓ_бѓќбѓ бѓЁ_бѓЎбѓђбѓ›_бѓќбѓ—бѓ®_бѓ®бѓЈбѓ—_бѓћбѓђбѓ _бѓЁбѓђбѓ‘'.split('_'),
            weekdaysMin : 'бѓ™бѓ•_бѓќбѓ _бѓЎбѓђ_бѓќбѓ—_бѓ®бѓЈ_бѓћбѓђ_бѓЁбѓђ'.split('_'),
            longDateFormat : {
                LT : 'h:mm A',
                LTS : 'h:mm:ss A',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[бѓ“бѓ¦бѓ”бѓЎ] LT[-бѓ–бѓ”]',
                nextDay : '[бѓ®бѓ•бѓђбѓљ] LT[-бѓ–бѓ”]',
                lastDay : '[бѓ’бѓЈбѓЁбѓбѓњ] LT[-бѓ–бѓ”]',
                nextWeek : '[бѓЁбѓ”бѓ›бѓ“бѓ”бѓ’] dddd LT[-бѓ–бѓ”]',
                lastWeek : '[бѓ¬бѓбѓњбѓђ] dddd LT-бѓ–бѓ”',
                sameElse : 'L'
            },
            relativeTime : {
                future : function (s) {
                    return (/(бѓ¬бѓђбѓ›бѓ|бѓ¬бѓЈбѓ—бѓ|бѓЎбѓђбѓђбѓ—бѓ|бѓ¬бѓ”бѓљбѓ)/).test(s) ?
                        s.replace(/бѓ$/, 'бѓЁбѓ') :
                        s + 'бѓЁбѓ';
                },
                past : function (s) {
                    if ((/(бѓ¬бѓђбѓ›бѓ|бѓ¬бѓЈбѓ—бѓ|бѓЎбѓђбѓђбѓ—бѓ|бѓ“бѓ¦бѓ”|бѓ—бѓ•бѓ”)/).test(s)) {
                        return s.replace(/(бѓ|бѓ”)$/, 'бѓбѓЎ бѓ¬бѓбѓњ');
                    }
                    if ((/бѓ¬бѓ”бѓљбѓ/).test(s)) {
                        return s.replace(/бѓ¬бѓ”бѓљбѓ$/, 'бѓ¬бѓљбѓбѓЎ бѓ¬бѓбѓњ');
                    }
                },
                s : 'бѓ бѓђбѓ›бѓ“бѓ”бѓњбѓбѓ›бѓ” бѓ¬бѓђбѓ›бѓ',
                m : 'бѓ¬бѓЈбѓ—бѓ',
                mm : '%d бѓ¬бѓЈбѓ—бѓ',
                h : 'бѓЎбѓђбѓђбѓ—бѓ',
                hh : '%d бѓЎбѓђбѓђбѓ—бѓ',
                d : 'бѓ“бѓ¦бѓ”',
                dd : '%d бѓ“бѓ¦бѓ”',
                M : 'бѓ—бѓ•бѓ”',
                MM : '%d бѓ—бѓ•бѓ”',
                y : 'бѓ¬бѓ”бѓљбѓ',
                yy : '%d бѓ¬бѓ”бѓљбѓ'
            },
            ordinalParse: /0|1-бѓљбѓ|бѓ›бѓ”-\d{1,2}|\d{1,2}-бѓ”/,
            ordinal : function (number) {
                if (number === 0) {
                    return number;
                }

                if (number === 1) {
                    return number + '-бѓљбѓ';
                }

                if ((number < 20) || (number <= 100 && (number % 20 === 0)) || (number % 100 === 0)) {
                    return 'бѓ›бѓ”-' + number;
                }

                return number + '-бѓ”';
            },
            week : {
                dow : 1,
                doy : 7
            }
        });
    }));
// moment.js locale configuration
// locale : khmer (km)
// author : Kruy Vanna : https://github.com/kruyvanna

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('km', {
            months: 'бћбћЂбћљбћ¶_бћЂбћ»бћбџ’бћ—бџ€_бћбћ·бћ“бћ¶_бћбџЃбћџбћ¶_бћ§бћџбћ—бћ¶_бћбћ·бћђбћ»бћ“бћ¶_бћЂбћЂбџ’бћЂбћЉбћ¶_бћџбћёбћ бћ¶_бћЂбћ‰бџ’бћ‰бћ¶_бћЏбћ»бћ›бћ¶_бћњбћ·бћ…бџ’бћ†бћ·бћЂбћ¶_бћ’бџ’бћ“бћј'.split('_'),
            monthsShort: 'бћбћЂбћљбћ¶_бћЂбћ»бћбџ’бћ—бџ€_бћбћ·бћ“бћ¶_бћбџЃбћџбћ¶_бћ§бћџбћ—бћ¶_бћбћ·бћђбћ»бћ“бћ¶_бћЂбћЂбџ’бћЂбћЉбћ¶_бћџбћёбћ бћ¶_бћЂбћ‰бџ’бћ‰бћ¶_бћЏбћ»бћ›бћ¶_бћњбћ·бћ…бџ’бћ†бћ·бћЂбћ¶_бћ’бџ’бћ“бћј'.split('_'),
            weekdays: 'бћўбћ¶бћ‘бћ·бћЏбџ’бћ™_бћ…бџђбћ“бџ’бћ‘_бћўбћ„бџ’бћ‚бћ¶бћљ_бћ–бћ»бћ’_бћ–бџ’бћљбћ бћџбџ’бћ”бћЏбћ·бџЌ_бћџбћ»бћЂбџ’бћљ_бћџбџ…бћљбџЌ'.split('_'),
            weekdaysShort: 'бћўбћ¶бћ‘бћ·бћЏбџ’бћ™_бћ…бџђбћ“бџ’бћ‘_бћўбћ„бџ’бћ‚бћ¶бћљ_бћ–бћ»бћ’_бћ–бџ’бћљбћ бћџбџ’бћ”бћЏбћ·бџЌ_бћџбћ»бћЂбџ’бћљ_бћџбџ…бћљбџЌ'.split('_'),
            weekdaysMin: 'бћўбћ¶бћ‘бћ·бћЏбџ’бћ™_бћ…бџђбћ“бџ’бћ‘_бћўбћ„бџ’бћ‚бћ¶бћљ_бћ–бћ»бћ’_бћ–бџ’бћљбћ бћџбџ’бћ”бћЏбћ·бџЌ_бћџбћ»бћЂбџ’бћљ_бћџбџ…бћљбџЌ'.split('_'),
            longDateFormat: {
                LT: 'HH:mm',
                LTS : 'LT:ss',
                L: 'DD/MM/YYYY',
                LL: 'D MMMM YYYY',
                LLL: 'D MMMM YYYY LT',
                LLLL: 'dddd, D MMMM YYYY LT'
            },
            calendar: {
                sameDay: '[бћђбџ’бћ„бџѓбћ“бџ€ бћбџ‰бџ„бћ„] LT',
                nextDay: '[бћџбџ’бћўбџ‚бћЂ бћбџ‰бџ„бћ„] LT',
                nextWeek: 'dddd [бћбџ‰бџ„бћ„] LT',
                lastDay: '[бћбџ’бћџбћ·бћ›бћбћ·бћ‰ бћбџ‰бџ„бћ„] LT',
                lastWeek: 'dddd [бћџбћ”бџ’бћЏбћ¶бћ бџЌбћбћ»бћ“] [бћбџ‰бџ„бћ„] LT',
                sameElse: 'L'
            },
            relativeTime: {
                future: '%sбћ‘бџЂбћЏ',
                past: '%sбћбћ»бћ“',
                s: 'бћ”бџ‰бћ»бћ“бџ’бћбћ¶бћ“бћњбћ·бћ“бћ¶бћ‘бћё',
                m: 'бћбћЅбћ™бћ“бћ¶бћ‘бћё',
                mm: '%d бћ“бћ¶бћ‘бћё',
                h: 'бћбћЅбћ™бћбџ‰бџ„бћ„',
                hh: '%d бћбџ‰бџ„бћ„',
                d: 'бћбћЅбћ™бћђбџ’бћ„бџѓ',
                dd: '%d бћђбџ’бћ„бџѓ',
                M: 'бћбћЅбћ™бћЃбџ‚',
                MM: '%d бћЃбџ‚',
                y: 'бћбћЅбћ™бћ†бџ’бћ“бћ¶бџ†',
                yy: '%d бћ†бџ’бћ“бћ¶бџ†'
            },
            week: {
                dow: 1, // Monday is the first day of the week.
                doy: 4 // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : korean (ko)
//
// authors
//
// - Kyungwook, Park : https://github.com/kyungw00k
// - Jeeeyul Lee <jeeeyul@gmail.com>
    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('ko', {
            months : '1м›”_2м›”_3м›”_4м›”_5м›”_6м›”_7м›”_8м›”_9м›”_10м›”_11м›”_12м›”'.split('_'),
            monthsShort : '1м›”_2м›”_3м›”_4м›”_5м›”_6м›”_7м›”_8м›”_9м›”_10м›”_11м›”_12м›”'.split('_'),
            weekdays : 'мќјмљ”мќј_м›”мљ”мќј_н™”мљ”мќј_м€мљ”мќј_лЄ©мљ”мќј_кё€мљ”мќј_н† мљ”мќј'.split('_'),
            weekdaysShort : 'мќј_м›”_н™”_м€_лЄ©_кё€_н† '.split('_'),
            weekdaysMin : 'мќј_м›”_н™”_м€_лЄ©_кё€_н† '.split('_'),
            longDateFormat : {
                LT : 'A hм‹њ mл¶„',
                LTS : 'A hм‹њ mл¶„ sмґ€',
                L : 'YYYY.MM.DD',
                LL : 'YYYYл…„ MMMM Dмќј',
                LLL : 'YYYYл…„ MMMM Dмќј LT',
                LLLL : 'YYYYл…„ MMMM Dмќј dddd LT'
            },
            calendar : {
                sameDay : 'м¤лЉ LT',
                nextDay : 'л‚ґмќј LT',
                nextWeek : 'dddd LT',
                lastDay : 'м–ґм њ LT',
                lastWeek : 'м§Ђл‚њмЈј dddd LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s н›„',
                past : '%s м „',
                s : 'лЄ‡мґ€',
                ss : '%dмґ€',
                m : 'мќјл¶„',
                mm : '%dл¶„',
                h : 'н•њм‹њк°„',
                hh : '%dм‹њк°„',
                d : 'н•лЈЁ',
                dd : '%dмќј',
                M : 'н•њл‹¬',
                MM : '%dл‹¬',
                y : 'мќјл…„',
                yy : '%dл…„'
            },
            ordinalParse : /\d{1,2}мќј/,
            ordinal : '%dмќј',
            meridiemParse : /м¤м „|м¤н›„/,
            isPM : function (token) {
                return token === 'м¤н›„';
            },
            meridiem : function (hour, minute, isUpper) {
                return hour < 12 ? 'м¤м „' : 'м¤н›„';
            }
        });
    }));
// moment.js locale configuration
// locale : Luxembourgish (lb)
// author : mweimerskirch : https://github.com/mweimerskirch, David Raison : https://github.com/kwisatz

// Note: Luxembourgish has a very particular phonological rule ('Eifeler Regel') that causes the
// deletion of the final 'n' in certain contexts. That's what the 'eifelerRegelAppliesToWeekday'
// and 'eifelerRegelAppliesToNumber' methods are meant for

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function processRelativeTime(number, withoutSuffix, key, isFuture) {
            var format = {
                'm': ['eng Minutt', 'enger Minutt'],
                'h': ['eng Stonn', 'enger Stonn'],
                'd': ['een Dag', 'engem Dag'],
                'M': ['ee Mount', 'engem Mount'],
                'y': ['ee Joer', 'engem Joer']
            };
            return withoutSuffix ? format[key][0] : format[key][1];
        }

        function processFutureTime(string) {
            var number = string.substr(0, string.indexOf(' '));
            if (eifelerRegelAppliesToNumber(number)) {
                return 'a ' + string;
            }
            return 'an ' + string;
        }

        function processPastTime(string) {
            var number = string.substr(0, string.indexOf(' '));
            if (eifelerRegelAppliesToNumber(number)) {
                return 'viru ' + string;
            }
            return 'virun ' + string;
        }

        /**
         * Returns true if the word before the given number loses the '-n' ending.
         * e.g. 'an 10 Deeg' but 'a 5 Deeg'
         *
         * @param number {integer}
         * @returns {boolean}
         */
        function eifelerRegelAppliesToNumber(number) {
            number = parseInt(number, 10);
            if (isNaN(number)) {
                return false;
            }
            if (number < 0) {
                // Negative Number --> always true
                return true;
            } else if (number < 10) {
                // Only 1 digit
                if (4 <= number && number <= 7) {
                    return true;
                }
                return false;
            } else if (number < 100) {
                // 2 digits
                var lastDigit = number % 10, firstDigit = number / 10;
                if (lastDigit === 0) {
                    return eifelerRegelAppliesToNumber(firstDigit);
                }
                return eifelerRegelAppliesToNumber(lastDigit);
            } else if (number < 10000) {
                // 3 or 4 digits --> recursively check first digit
                while (number >= 10) {
                    number = number / 10;
                }
                return eifelerRegelAppliesToNumber(number);
            } else {
                // Anything larger than 4 digits: recursively check first n-3 digits
                number = number / 1000;
                return eifelerRegelAppliesToNumber(number);
            }
        }

        return moment.defineLocale('lb', {
            months: 'Januar_Februar_MГ¤erz_AbrГ«ll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split('_'),
            monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split('_'),
            weekdays: 'Sonndeg_MГ©indeg_DГ«nschdeg_MГ«ttwoch_Donneschdeg_Freideg_Samschdeg'.split('_'),
            weekdaysShort: 'So._MГ©._DГ«._MГ«._Do._Fr._Sa.'.split('_'),
            weekdaysMin: 'So_MГ©_DГ«_MГ«_Do_Fr_Sa'.split('_'),
            longDateFormat: {
                LT: 'H:mm [Auer]',
                LTS: 'H:mm:ss [Auer]',
                L: 'DD.MM.YYYY',
                LL: 'D. MMMM YYYY',
                LLL: 'D. MMMM YYYY LT',
                LLLL: 'dddd, D. MMMM YYYY LT'
            },
            calendar: {
                sameDay: '[Haut um] LT',
                sameElse: 'L',
                nextDay: '[Muer um] LT',
                nextWeek: 'dddd [um] LT',
                lastDay: '[GГ«schter um] LT',
                lastWeek: function () {
                    // Different date string for 'DГ«nschdeg' (Tuesday) and 'Donneschdeg' (Thursday) due to phonological rule
                    switch (this.day()) {
                        case 2:
                        case 4:
                            return '[Leschten] dddd [um] LT';
                        default:
                            return '[Leschte] dddd [um] LT';
                    }
                }
            },
            relativeTime : {
                future : processFutureTime,
                past : processPastTime,
                s : 'e puer Sekonnen',
                m : processRelativeTime,
                mm : '%d Minutten',
                h : processRelativeTime,
                hh : '%d Stonnen',
                d : processRelativeTime,
                dd : '%d Deeg',
                M : processRelativeTime,
                MM : '%d MГ©int',
                y : processRelativeTime,
                yy : '%d Joer'
            },
            ordinalParse: /\d{1,2}\./,
            ordinal: '%d.',
            week: {
                dow: 1, // Monday is the first day of the week.
                doy: 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Lithuanian (lt)
// author : Mindaugas MozЕ«ras : https://github.com/mmozuras

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var units = {
                'm' : 'minutД—_minutД—s_minutД™',
                'mm': 'minutД—s_minuДЌiЕі_minutes',
                'h' : 'valanda_valandos_valandД…',
                'hh': 'valandos_valandЕі_valandas',
                'd' : 'diena_dienos_dienД…',
                'dd': 'dienos_dienЕі_dienas',
                'M' : 'mД—nuo_mД—nesio_mД—nesДЇ',
                'MM': 'mД—nesiai_mД—nesiЕі_mД—nesius',
                'y' : 'metai_metЕі_metus',
                'yy': 'metai_metЕі_metus'
            },
            weekDays = 'sekmadienis_pirmadienis_antradienis_treДЌiadienis_ketvirtadienis_penktadienis_ЕЎeЕЎtadienis'.split('_');

        function translateSeconds(number, withoutSuffix, key, isFuture) {
            if (withoutSuffix) {
                return 'kelios sekundД—s';
            } else {
                return isFuture ? 'keliЕі sekundЕѕiЕі' : 'kelias sekundes';
            }
        }

        function translateSingular(number, withoutSuffix, key, isFuture) {
            return withoutSuffix ? forms(key)[0] : (isFuture ? forms(key)[1] : forms(key)[2]);
        }

        function special(number) {
            return number % 10 === 0 || (number > 10 && number < 20);
        }

        function forms(key) {
            return units[key].split('_');
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + ' ';
            if (number === 1) {
                return result + translateSingular(number, withoutSuffix, key[0], isFuture);
            } else if (withoutSuffix) {
                return result + (special(number) ? forms(key)[1] : forms(key)[0]);
            } else {
                if (isFuture) {
                    return result + forms(key)[1];
                } else {
                    return result + (special(number) ? forms(key)[1] : forms(key)[2]);
                }
            }
        }

        function relativeWeekDay(moment, format) {
            var nominative = format.indexOf('dddd HH:mm') === -1,
                weekDay = weekDays[moment.day()];

            return nominative ? weekDay : weekDay.substring(0, weekDay.length - 2) + 'ДЇ';
        }

        return moment.defineLocale('lt', {
            months : 'sausio_vasario_kovo_balandЕѕio_geguЕѕД—s_birЕѕelio_liepos_rugpjЕ«ДЌio_rugsД—jo_spalio_lapkriДЌio_gruodЕѕio'.split('_'),
            monthsShort : 'sau_vas_kov_bal_geg_bir_lie_rgp_rgs_spa_lap_grd'.split('_'),
            weekdays : relativeWeekDay,
            weekdaysShort : 'Sek_Pir_Ant_Tre_Ket_Pen_Е eЕЎ'.split('_'),
            weekdaysMin : 'S_P_A_T_K_Pn_Е '.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'YYYY-MM-DD',
                LL : 'YYYY [m.] MMMM D [d.]',
                LLL : 'YYYY [m.] MMMM D [d.], LT [val.]',
                LLLL : 'YYYY [m.] MMMM D [d.], dddd, LT [val.]',
                l : 'YYYY-MM-DD',
                ll : 'YYYY [m.] MMMM D [d.]',
                lll : 'YYYY [m.] MMMM D [d.], LT [val.]',
                llll : 'YYYY [m.] MMMM D [d.], ddd, LT [val.]'
            },
            calendar : {
                sameDay : '[Е iandien] LT',
                nextDay : '[Rytoj] LT',
                nextWeek : 'dddd LT',
                lastDay : '[Vakar] LT',
                lastWeek : '[PraД—jusДЇ] dddd LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'po %s',
                past : 'prieЕЎ %s',
                s : translateSeconds,
                m : translateSingular,
                mm : translate,
                h : translateSingular,
                hh : translate,
                d : translateSingular,
                dd : translate,
                M : translateSingular,
                MM : translate,
                y : translateSingular,
                yy : translate
            },
            ordinalParse: /\d{1,2}-oji/,
            ordinal : function (number) {
                return number + '-oji';
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : latvian (lv)
// author : Kristaps Karlsons : https://github.com/skakri

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var units = {
            'mm': 'minЕ«ti_minЕ«tes_minЕ«te_minЕ«tes',
            'hh': 'stundu_stundas_stunda_stundas',
            'dd': 'dienu_dienas_diena_dienas',
            'MM': 'mД“nesi_mД“neЕЎus_mД“nesis_mД“neЕЎi',
            'yy': 'gadu_gadus_gads_gadi'
        };

        function format(word, number, withoutSuffix) {
            var forms = word.split('_');
            if (withoutSuffix) {
                return number % 10 === 1 && number !== 11 ? forms[2] : forms[3];
            } else {
                return number % 10 === 1 && number !== 11 ? forms[0] : forms[1];
            }
        }

        function relativeTimeWithPlural(number, withoutSuffix, key) {
            return number + ' ' + format(units[key], number, withoutSuffix);
        }

        return moment.defineLocale('lv', {
            months : 'janvДЃris_februДЃris_marts_aprД«lis_maijs_jЕ«nijs_jЕ«lijs_augusts_septembris_oktobris_novembris_decembris'.split('_'),
            monthsShort : 'jan_feb_mar_apr_mai_jЕ«n_jЕ«l_aug_sep_okt_nov_dec'.split('_'),
            weekdays : 'svД“tdiena_pirmdiena_otrdiena_treЕЎdiena_ceturtdiena_piektdiena_sestdiena'.split('_'),
            weekdaysShort : 'Sv_P_O_T_C_Pk_S'.split('_'),
            weekdaysMin : 'Sv_P_O_T_C_Pk_S'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'YYYY. [gada] D. MMMM',
                LLL : 'YYYY. [gada] D. MMMM, LT',
                LLLL : 'YYYY. [gada] D. MMMM, dddd, LT'
            },
            calendar : {
                sameDay : '[Е odien pulksten] LT',
                nextDay : '[RД«t pulksten] LT',
                nextWeek : 'dddd [pulksten] LT',
                lastDay : '[Vakar pulksten] LT',
                lastWeek : '[PagДЃjuЕЎДЃ] dddd [pulksten] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s vД“lДЃk',
                past : '%s agrДЃk',
                s : 'daЕѕas sekundes',
                m : 'minЕ«ti',
                mm : relativeTimeWithPlural,
                h : 'stundu',
                hh : relativeTimeWithPlural,
                d : 'dienu',
                dd : relativeTimeWithPlural,
                M : 'mД“nesi',
                MM : relativeTimeWithPlural,
                y : 'gadu',
                yy : relativeTimeWithPlural
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : macedonian (mk)
// author : Borislav Mickov : https://github.com/B0k0

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('mk', {
            months : 'СР°РЅСѓР°СЂРё_С„РµРІСЂСѓР°СЂРё_РјР°СЂС‚_Р°РїСЂРёР»_РјР°С_ССѓРЅРё_ССѓР»Рё_Р°РІРіСѓСЃС‚_СЃРµРїС‚РµРјРІСЂРё_РѕРєС‚РѕРјРІСЂРё_РЅРѕРµРјРІСЂРё_РґРµРєРµРјРІСЂРё'.split('_'),
            monthsShort : 'СР°РЅ_С„РµРІ_РјР°СЂ_Р°РїСЂ_РјР°С_ССѓРЅ_ССѓР»_Р°РІРі_СЃРµРї_РѕРєС‚_РЅРѕРµ_РґРµРє'.split('_'),
            weekdays : 'РЅРµРґРµР»Р°_РїРѕРЅРµРґРµР»РЅРёРє_РІС‚РѕСЂРЅРёРє_СЃСЂРµРґР°_С‡РµС‚РІСЂС‚РѕРє_РїРµС‚РѕРє_СЃР°Р±РѕС‚Р°'.split('_'),
            weekdaysShort : 'РЅРµРґ_РїРѕРЅ_РІС‚Рѕ_СЃСЂРµ_С‡РµС‚_РїРµС‚_СЃР°Р±'.split('_'),
            weekdaysMin : 'РЅe_Рїo_РІС‚_СЃСЂ_С‡Рµ_РїРµ_СЃa'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'D.MM.YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[Р”РµРЅРµСЃ РІРѕ] LT',
                nextDay : '[РЈС‚СЂРµ РІРѕ] LT',
                nextWeek : 'dddd [РІРѕ] LT',
                lastDay : '[Р’С‡РµСЂР° РІРѕ] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 6:
                            return '[Р’Рѕ РёР·РјРёРЅР°С‚Р°С‚Р°] dddd [РІРѕ] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[Р’Рѕ РёР·РјРёРЅР°С‚РёРѕС‚] dddd [РІРѕ] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'РїРѕСЃР»Рµ %s',
                past : 'РїСЂРµРґ %s',
                s : 'РЅРµРєРѕР»РєСѓ СЃРµРєСѓРЅРґРё',
                m : 'РјРёРЅСѓС‚Р°',
                mm : '%d РјРёРЅСѓС‚Рё',
                h : 'С‡Р°СЃ',
                hh : '%d С‡Р°СЃР°',
                d : 'РґРµРЅ',
                dd : '%d РґРµРЅР°',
                M : 'РјРµСЃРµС†',
                MM : '%d РјРµСЃРµС†Рё',
                y : 'РіРѕРґРёРЅР°',
                yy : '%d РіРѕРґРёРЅРё'
            },
            ordinalParse: /\d{1,2}-(РµРІ|РµРЅ|С‚Рё|РІРё|СЂРё|РјРё)/,
            ordinal : function (number) {
                var lastDigit = number % 10,
                    last2Digits = number % 100;
                if (number === 0) {
                    return number + '-РµРІ';
                } else if (last2Digits === 0) {
                    return number + '-РµРЅ';
                } else if (last2Digits > 10 && last2Digits < 20) {
                    return number + '-С‚Рё';
                } else if (lastDigit === 1) {
                    return number + '-РІРё';
                } else if (lastDigit === 2) {
                    return number + '-СЂРё';
                } else if (lastDigit === 7 || lastDigit === 8) {
                    return number + '-РјРё';
                } else {
                    return number + '-С‚Рё';
                }
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : malayalam (ml)
// author : Floyd Pink : https://github.com/floydpink

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('ml', {
            months : 'аґњаґЁаµЃаґµаґ°аґї_аґ«аµ†аґ¬аµЌаґ°аµЃаґµаґ°аґї_аґ®аґѕаµјаґљаµЌаґљаµЌ_аґЏаґЄаµЌаґ°аґїаµЅ_аґ®аµ‡аґЇаµЌ_аґњаµ‚аµє_аґњаµ‚аґІаµ€_аґ“аґ—аґёаµЌаґ±аµЌаґ±аµЌ_аґёаµ†аґЄаµЌаґ±аµЌаґ±аґ‚аґ¬аµј_аґ’аґ•аµЌаґџаµ‹аґ¬аµј_аґЁаґµаґ‚аґ¬аµј_аґЎаґїаґёаґ‚аґ¬аµј'.split('_'),
            monthsShort : 'аґњаґЁаµЃ._аґ«аµ†аґ¬аµЌаґ°аµЃ._аґ®аґѕаµј._аґЏаґЄаµЌаґ°аґї._аґ®аµ‡аґЇаµЌ_аґњаµ‚аµє_аґњаµ‚аґІаµ€._аґ“аґ—._аґёаµ†аґЄаµЌаґ±аµЌаґ±._аґ’аґ•аµЌаґџаµ‹._аґЁаґµаґ‚._аґЎаґїаґёаґ‚.'.split('_'),
            weekdays : 'аґћаґѕаґЇаґ±аґѕаґґаµЌаґљ_аґ¤аґїаґ™аµЌаґ•аґіаґѕаґґаµЌаґљ_аґљаµЉаґµаµЌаґµаґѕаґґаµЌаґљ_аґ¬аµЃаґ§аґЁаґѕаґґаµЌаґљ_аґµаµЌаґЇаґѕаґґаґѕаґґаµЌаґљ_аґµаµ†аґіаµЌаґіаґїаґЇаґѕаґґаµЌаґљ_аґ¶аґЁаґїаґЇаґѕаґґаµЌаґљ'.split('_'),
            weekdaysShort : 'аґћаґѕаґЇаµј_аґ¤аґїаґ™аµЌаґ•аµѕ_аґљаµЉаґµаµЌаґµ_аґ¬аµЃаґ§аµ»_аґµаµЌаґЇаґѕаґґаґ‚_аґµаµ†аґіаµЌаґіаґї_аґ¶аґЁаґї'.split('_'),
            weekdaysMin : 'аґћаґѕ_аґ¤аґї_аґљаµЉ_аґ¬аµЃ_аґµаµЌаґЇаґѕ_аґµаµ†_аґ¶'.split('_'),
            longDateFormat : {
                LT : 'A h:mm -аґЁаµЃ',
                LTS : 'A h:mm:ss -аґЁаµЃ',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY, LT',
                LLLL : 'dddd, D MMMM YYYY, LT'
            },
            calendar : {
                sameDay : '[аґ‡аґЁаµЌаґЁаµЌ] LT',
                nextDay : '[аґЁаґѕаґіаµ†] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[аґ‡аґЁаµЌаґЁаґІаµ†] LT',
                lastWeek : '[аґ•аґґаґїаґћаµЌаґћ] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s аґ•аґґаґїаґћаµЌаґћаµЌ',
                past : '%s аґ®аµЃаµ»аґЄаµЌ',
                s : 'аґ…аµЅаґЄ аґЁаґїаґ®аґїаґ·аґ™аµЌаґ™аµѕ',
                m : 'аґ’аґ°аµЃ аґ®аґїаґЁаґїаґ±аµЌаґ±аµЌ',
                mm : '%d аґ®аґїаґЁаґїаґ±аµЌаґ±аµЌ',
                h : 'аґ’аґ°аµЃ аґ®аґЈаґїаґ•аµЌаґ•аµ‚аµј',
                hh : '%d аґ®аґЈаґїаґ•аµЌаґ•аµ‚аµј',
                d : 'аґ’аґ°аµЃ аґ¦аґїаґµаґёаґ‚',
                dd : '%d аґ¦аґїаґµаґёаґ‚',
                M : 'аґ’аґ°аµЃ аґ®аґѕаґёаґ‚',
                MM : '%d аґ®аґѕаґёаґ‚',
                y : 'аґ’аґ°аµЃ аґµаµјаґ·аґ‚',
                yy : '%d аґµаµјаґ·аґ‚'
            },
            meridiemParse: /аґ°аґѕаґ¤аµЌаґ°аґї|аґ°аґѕаґµаґїаґІаµ†|аґ‰аґљаµЌаґљ аґ•аґґаґїаґћаµЌаґћаµЌ|аґµаµ€аґ•аµЃаґЁаµЌаґЁаµ‡аґ°аґ‚|аґ°аґѕаґ¤аµЌаґ°аґї/i,
            isPM : function (input) {
                return /^(аґ‰аґљаµЌаґљ аґ•аґґаґїаґћаµЌаґћаµЌ|аґµаµ€аґ•аµЃаґЁаµЌаґЁаµ‡аґ°аґ‚|аґ°аґѕаґ¤аµЌаґ°аґї)$/.test(input);
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'аґ°аґѕаґ¤аµЌаґ°аґї';
                } else if (hour < 12) {
                    return 'аґ°аґѕаґµаґїаґІаµ†';
                } else if (hour < 17) {
                    return 'аґ‰аґљаµЌаґљ аґ•аґґаґїаґћаµЌаґћаµЌ';
                } else if (hour < 20) {
                    return 'аґµаµ€аґ•аµЃаґЁаµЌаґЁаµ‡аґ°аґ‚';
                } else {
                    return 'аґ°аґѕаґ¤аµЌаґ°аґї';
                }
            }
        });
    }));
// moment.js locale configuration
// locale : Marathi (mr)
// author : Harshad Kale : https://github.com/kalehv

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'аҐ§',
                '2': 'аҐЁ',
                '3': 'аҐ©',
                '4': 'аҐЄ',
                '5': 'аҐ«',
                '6': 'аҐ¬',
                '7': 'аҐ­',
                '8': 'аҐ®',
                '9': 'аҐЇ',
                '0': 'аҐ¦'
            },
            numberMap = {
                'аҐ§': '1',
                'аҐЁ': '2',
                'аҐ©': '3',
                'аҐЄ': '4',
                'аҐ«': '5',
                'аҐ¬': '6',
                'аҐ­': '7',
                'аҐ®': '8',
                'аҐЇ': '9',
                'аҐ¦': '0'
            };

        return moment.defineLocale('mr', {
            months : 'а¤ња¤ѕа¤ЁаҐ‡а¤µа¤ѕа¤°аҐЂ_а¤«аҐ‡а¤¬аҐЌа¤°аҐЃа¤µа¤ѕа¤°аҐЂ_а¤®а¤ѕа¤°аҐЌа¤љ_а¤Џа¤ЄаҐЌа¤°а¤їа¤І_а¤®аҐ‡_а¤њаҐ‚а¤Ё_а¤њаҐЃа¤ІаҐ€_а¤‘а¤—а¤ёаҐЌа¤џ_а¤ёа¤ЄаҐЌа¤џаҐ‡а¤‚а¤¬а¤°_а¤‘а¤•аҐЌа¤џаҐ‹а¤¬а¤°_а¤ЁаҐ‹а¤µаҐЌа¤№аҐ‡а¤‚а¤¬а¤°_а¤Ўа¤їа¤ёаҐ‡а¤‚а¤¬а¤°'.split('_'),
            monthsShort: 'а¤ња¤ѕа¤ЁаҐ‡._а¤«аҐ‡а¤¬аҐЌа¤°аҐЃ._а¤®а¤ѕа¤°аҐЌа¤љ._а¤Џа¤ЄаҐЌа¤°а¤ї._а¤®аҐ‡._а¤њаҐ‚а¤Ё._а¤њаҐЃа¤ІаҐ€._а¤‘а¤—._а¤ёа¤ЄаҐЌа¤џаҐ‡а¤‚._а¤‘а¤•аҐЌа¤џаҐ‹._а¤ЁаҐ‹а¤µаҐЌа¤№аҐ‡а¤‚._а¤Ўа¤їа¤ёаҐ‡а¤‚.'.split('_'),
            weekdays : 'а¤°а¤µа¤їа¤µа¤ѕа¤°_а¤ёаҐ‹а¤®а¤µа¤ѕа¤°_а¤®а¤‚а¤—а¤іа¤µа¤ѕа¤°_а¤¬аҐЃа¤§а¤µа¤ѕа¤°_а¤—аҐЃа¤°аҐ‚а¤µа¤ѕа¤°_а¤¶аҐЃа¤•аҐЌа¤°а¤µа¤ѕа¤°_а¤¶а¤Ёа¤їа¤µа¤ѕа¤°'.split('_'),
            weekdaysShort : 'а¤°а¤µа¤ї_а¤ёаҐ‹а¤®_а¤®а¤‚а¤—а¤і_а¤¬аҐЃа¤§_а¤—аҐЃа¤°аҐ‚_а¤¶аҐЃа¤•аҐЌа¤°_а¤¶а¤Ёа¤ї'.split('_'),
            weekdaysMin : 'а¤°_а¤ёаҐ‹_а¤®а¤‚_а¤¬аҐЃ_а¤—аҐЃ_а¤¶аҐЃ_а¤¶'.split('_'),
            longDateFormat : {
                LT : 'A h:mm а¤µа¤ѕа¤ња¤¤а¤ѕ',
                LTS : 'A h:mm:ss а¤µа¤ѕа¤ња¤¤а¤ѕ',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY, LT',
                LLLL : 'dddd, D MMMM YYYY, LT'
            },
            calendar : {
                sameDay : '[а¤†а¤њ] LT',
                nextDay : '[а¤‰а¤¦аҐЌа¤Їа¤ѕ] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[а¤•а¤ѕа¤І] LT',
                lastWeek: '[а¤®а¤ѕа¤—аҐЂа¤І] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s а¤Ёа¤‚а¤¤а¤°',
                past : '%s а¤ЄаҐ‚а¤°аҐЌа¤µаҐЂ',
                s : 'а¤ёаҐ‡а¤•а¤‚а¤¦',
                m: 'а¤Џа¤• а¤®а¤їа¤Ёа¤їа¤џ',
                mm: '%d а¤®а¤їа¤Ёа¤їа¤џаҐ‡',
                h : 'а¤Џа¤• а¤¤а¤ѕа¤ё',
                hh : '%d а¤¤а¤ѕа¤ё',
                d : 'а¤Џа¤• а¤¦а¤їа¤µа¤ё',
                dd : '%d а¤¦а¤їа¤µа¤ё',
                M : 'а¤Џа¤• а¤®а¤№а¤їа¤Ёа¤ѕ',
                MM : '%d а¤®а¤№а¤їа¤ЁаҐ‡',
                y : 'а¤Џа¤• а¤µа¤°аҐЌа¤·',
                yy : '%d а¤µа¤°аҐЌа¤·аҐ‡'
            },
            preparse: function (string) {
                return string.replace(/[аҐ§аҐЁаҐ©аҐЄаҐ«аҐ¬аҐ­аҐ®аҐЇаҐ¦]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            meridiemParse: /а¤°а¤ѕа¤¤аҐЌа¤°аҐЂ|а¤ёа¤•а¤ѕа¤іаҐЂ|а¤¦аҐЃа¤Єа¤ѕа¤°аҐЂ|а¤ёа¤ѕа¤Їа¤‚а¤•а¤ѕа¤іаҐЂ/,
            meridiemHour : function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'а¤°а¤ѕа¤¤аҐЌа¤°аҐЂ') {
                    return hour < 4 ? hour : hour + 12;
                } else if (meridiem === 'а¤ёа¤•а¤ѕа¤іаҐЂ') {
                    return hour;
                } else if (meridiem === 'а¤¦аҐЃа¤Єа¤ѕа¤°аҐЂ') {
                    return hour >= 10 ? hour : hour + 12;
                } else if (meridiem === 'а¤ёа¤ѕа¤Їа¤‚а¤•а¤ѕа¤іаҐЂ') {
                    return hour + 12;
                }
            },
            meridiem: function (hour, minute, isLower)
            {
                if (hour < 4) {
                    return 'а¤°а¤ѕа¤¤аҐЌа¤°аҐЂ';
                } else if (hour < 10) {
                    return 'а¤ёа¤•а¤ѕа¤іаҐЂ';
                } else if (hour < 17) {
                    return 'а¤¦аҐЃа¤Єа¤ѕа¤°аҐЂ';
                } else if (hour < 20) {
                    return 'а¤ёа¤ѕа¤Їа¤‚а¤•а¤ѕа¤іаҐЂ';
                } else {
                    return 'а¤°а¤ѕа¤¤аҐЌа¤°аҐЂ';
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Bahasa Malaysia (ms-MY)
// author : Weldan Jamili : https://github.com/weldan

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('ms-my', {
            months : 'Januari_Februari_Mac_April_Mei_Jun_Julai_Ogos_September_Oktober_November_Disember'.split('_'),
            monthsShort : 'Jan_Feb_Mac_Apr_Mei_Jun_Jul_Ogs_Sep_Okt_Nov_Dis'.split('_'),
            weekdays : 'Ahad_Isnin_Selasa_Rabu_Khamis_Jumaat_Sabtu'.split('_'),
            weekdaysShort : 'Ahd_Isn_Sel_Rab_Kha_Jum_Sab'.split('_'),
            weekdaysMin : 'Ah_Is_Sl_Rb_Km_Jm_Sb'.split('_'),
            longDateFormat : {
                LT : 'HH.mm',
                LTS : 'LT.ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY [pukul] LT',
                LLLL : 'dddd, D MMMM YYYY [pukul] LT'
            },
            meridiemParse: /pagi|tengahari|petang|malam/,
            meridiemHour: function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'pagi') {
                    return hour;
                } else if (meridiem === 'tengahari') {
                    return hour >= 11 ? hour : hour + 12;
                } else if (meridiem === 'petang' || meridiem === 'malam') {
                    return hour + 12;
                }
            },
            meridiem : function (hours, minutes, isLower) {
                if (hours < 11) {
                    return 'pagi';
                } else if (hours < 15) {
                    return 'tengahari';
                } else if (hours < 19) {
                    return 'petang';
                } else {
                    return 'malam';
                }
            },
            calendar : {
                sameDay : '[Hari ini pukul] LT',
                nextDay : '[Esok pukul] LT',
                nextWeek : 'dddd [pukul] LT',
                lastDay : '[Kelmarin pukul] LT',
                lastWeek : 'dddd [lepas pukul] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'dalam %s',
                past : '%s yang lepas',
                s : 'beberapa saat',
                m : 'seminit',
                mm : '%d minit',
                h : 'sejam',
                hh : '%d jam',
                d : 'sehari',
                dd : '%d hari',
                M : 'sebulan',
                MM : '%d bulan',
                y : 'setahun',
                yy : '%d tahun'
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Burmese (my)
// author : Squar team, mysquar.com

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
            '1': 'бЃЃ',
            '2': 'бЃ‚',
            '3': 'бЃѓ',
            '4': 'бЃ„',
            '5': 'бЃ…',
            '6': 'бЃ†',
            '7': 'бЃ‡',
            '8': 'бЃ€',
            '9': 'бЃ‰',
            '0': 'бЃЂ'
        }, numberMap = {
            'бЃЃ': '1',
            'бЃ‚': '2',
            'бЃѓ': '3',
            'бЃ„': '4',
            'бЃ…': '5',
            'бЃ†': '6',
            'бЃ‡': '7',
            'бЃ€': '8',
            'бЃ‰': '9',
            'бЃЂ': '0'
        };
        return moment.defineLocale('my', {
            months: 'бЂ‡бЂ”бЂєбЂ”бЂќбЂ«бЂ›бЂ®_бЂ–бЂ±бЂ–бЂ±бЂ¬бЂєбЂќбЂ«бЂ›бЂ®_бЂ™бЂђбЂє_бЂ§бЂ•бЂјбЂ®_бЂ™бЂ±_бЂ‡бЂЅбЂ”бЂє_бЂ‡бЂ°бЂњбЂ­бЂЇбЂ„бЂє_бЂћбЂјбЂ‚бЂЇбЂђбЂє_бЂ…бЂЂбЂєбЂђбЂ„бЂєбЂбЂ¬_бЂЎбЂ±бЂ¬бЂЂбЂєбЂђбЂ­бЂЇбЂбЂ¬_бЂ”бЂ­бЂЇбЂќбЂ„бЂєбЂбЂ¬_бЂ’бЂ®бЂ‡бЂ„бЂєбЂбЂ¬'.split('_'),
            monthsShort: 'бЂ‡бЂ”бЂє_бЂ–бЂ±_бЂ™бЂђбЂє_бЂ•бЂјбЂ®_бЂ™бЂ±_бЂ‡бЂЅбЂ”бЂє_бЂњбЂ­бЂЇбЂ„бЂє_бЂћбЂј_бЂ…бЂЂбЂє_бЂЎбЂ±бЂ¬бЂЂбЂє_бЂ”бЂ­бЂЇ_бЂ’бЂ®'.split('_'),
            weekdays: 'бЂђбЂ”бЂ„бЂєбЂ№бЂ‚бЂ”бЂЅбЂ±_бЂђбЂ”бЂ„бЂєбЂ№бЂњбЂ¬_бЂЎбЂ„бЂєбЂ№бЂ‚бЂ«_бЂ—бЂЇбЂ’бЂ№бЂ“бЂџбЂ°бЂё_бЂЂбЂјбЂ¬бЂћбЂ•бЂђбЂ±бЂё_бЂћбЂ±бЂ¬бЂЂбЂјбЂ¬_бЂ…бЂ”бЂ±'.split('_'),
            weekdaysShort: 'бЂ”бЂЅбЂ±_бЂњбЂ¬_бЂ„бЂєбЂ№бЂ‚бЂ«_бЂџбЂ°бЂё_бЂЂбЂјбЂ¬_бЂћбЂ±бЂ¬_бЂ”бЂ±'.split('_'),
            weekdaysMin: 'бЂ”бЂЅбЂ±_бЂњбЂ¬_бЂ„бЂєбЂ№бЂ‚бЂ«_бЂџбЂ°бЂё_бЂЂбЂјбЂ¬_бЂћбЂ±бЂ¬_бЂ”бЂ±'.split('_'),
            longDateFormat: {
                LT: 'HH:mm',
                LTS: 'HH:mm:ss',
                L: 'DD/MM/YYYY',
                LL: 'D MMMM YYYY',
                LLL: 'D MMMM YYYY LT',
                LLLL: 'dddd D MMMM YYYY LT'
            },
            calendar: {
                sameDay: '[бЂљбЂ”бЂ±.] LT [бЂ™бЂѕбЂ¬]',
                nextDay: '[бЂ™бЂ”бЂЂбЂєбЂ–бЂјбЂ”бЂє] LT [бЂ™бЂѕбЂ¬]',
                nextWeek: 'dddd LT [бЂ™бЂѕбЂ¬]',
                lastDay: '[бЂ™бЂ”бЂ±.бЂЂ] LT [бЂ™бЂѕбЂ¬]',
                lastWeek: '[бЂ•бЂјбЂ®бЂёбЂЃбЂІбЂ·бЂћбЂ±бЂ¬] dddd LT [бЂ™бЂѕбЂ¬]',
                sameElse: 'L'
            },
            relativeTime: {
                future: 'бЂњбЂ¬бЂ™бЂЉбЂєбЂ· %s бЂ™бЂѕбЂ¬',
                past: 'бЂњбЂЅбЂ”бЂєбЂЃбЂІбЂ·бЂћбЂ±бЂ¬ %s бЂЂ',
                s: 'бЂ…бЂЂбЂ№бЂЂбЂ”бЂє.бЂЎбЂ”бЂЉбЂєбЂёбЂ„бЂљбЂє',
                m: 'бЂђбЂ…бЂєбЂ™бЂ­бЂ”бЂ…бЂє',
                mm: '%d бЂ™бЂ­бЂ”бЂ…бЂє',
                h: 'бЂђбЂ…бЂєбЂ”бЂ¬бЂ›бЂ®',
                hh: '%d бЂ”бЂ¬бЂ›бЂ®',
                d: 'бЂђбЂ…бЂєбЂ›бЂЂбЂє',
                dd: '%d бЂ›бЂЂбЂє',
                M: 'бЂђбЂ…бЂєбЂњ',
                MM: '%d бЂњ',
                y: 'бЂђбЂ…бЂєбЂ”бЂѕбЂ…бЂє',
                yy: '%d бЂ”бЂѕбЂ…бЂє'
            },
            preparse: function (string) {
                return string.replace(/[бЃЃбЃ‚бЃѓбЃ„бЃ…бЃ†бЃ‡бЃ€бЃ‰бЃЂ]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            week: {
                dow: 1, // Monday is the first day of the week.
                doy: 4 // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : norwegian bokmГҐl (nb)
// authors : Espen Hovlandsdal : https://github.com/rexxars
//           Sigurd Gartmann : https://github.com/sigurdga

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('nb', {
            months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
            monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
            weekdays : 'sГёndag_mandag_tirsdag_onsdag_torsdag_fredag_lГёrdag'.split('_'),
            weekdaysShort : 'sГёn_man_tirs_ons_tors_fre_lГёr'.split('_'),
            weekdaysMin : 'sГё_ma_ti_on_to_fr_lГё'.split('_'),
            longDateFormat : {
                LT : 'H.mm',
                LTS : 'LT.ss',
                L : 'DD.MM.YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY [kl.] LT',
                LLLL : 'dddd D. MMMM YYYY [kl.] LT'
            },
            calendar : {
                sameDay: '[i dag kl.] LT',
                nextDay: '[i morgen kl.] LT',
                nextWeek: 'dddd [kl.] LT',
                lastDay: '[i gГҐr kl.] LT',
                lastWeek: '[forrige] dddd [kl.] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'om %s',
                past : 'for %s siden',
                s : 'noen sekunder',
                m : 'ett minutt',
                mm : '%d minutter',
                h : 'en time',
                hh : '%d timer',
                d : 'en dag',
                dd : '%d dager',
                M : 'en mГҐned',
                MM : '%d mГҐneder',
                y : 'ett ГҐr',
                yy : '%d ГҐr'
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : nepali/nepalese
// author : suvash : https://github.com/suvash

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var symbolMap = {
                '1': 'аҐ§',
                '2': 'аҐЁ',
                '3': 'аҐ©',
                '4': 'аҐЄ',
                '5': 'аҐ«',
                '6': 'аҐ¬',
                '7': 'аҐ­',
                '8': 'аҐ®',
                '9': 'аҐЇ',
                '0': 'аҐ¦'
            },
            numberMap = {
                'аҐ§': '1',
                'аҐЁ': '2',
                'аҐ©': '3',
                'аҐЄ': '4',
                'аҐ«': '5',
                'аҐ¬': '6',
                'аҐ­': '7',
                'аҐ®': '8',
                'аҐЇ': '9',
                'аҐ¦': '0'
            };

        return moment.defineLocale('ne', {
            months : 'а¤ња¤Ёа¤µа¤°аҐЂ_а¤«аҐ‡а¤¬аҐЌа¤°аҐЃа¤µа¤°аҐЂ_а¤®а¤ѕа¤°аҐЌа¤љ_а¤…а¤ЄаҐЌа¤°а¤їа¤І_а¤®а¤€_а¤њаҐЃа¤Ё_а¤њаҐЃа¤Іа¤ѕа¤€_а¤…а¤—а¤·аҐЌа¤џ_а¤ёаҐ‡а¤ЄаҐЌа¤џаҐ‡а¤®аҐЌа¤¬а¤°_а¤…а¤•аҐЌа¤џаҐ‹а¤¬а¤°_а¤ЁаҐ‹а¤­аҐ‡а¤®аҐЌа¤¬а¤°_а¤Ўа¤їа¤ёаҐ‡а¤®аҐЌа¤¬а¤°'.split('_'),
            monthsShort : 'а¤ња¤Ё._а¤«аҐ‡а¤¬аҐЌа¤°аҐЃ._а¤®а¤ѕа¤°аҐЌа¤љ_а¤…а¤ЄаҐЌа¤°а¤ї._а¤®а¤€_а¤њаҐЃа¤Ё_а¤њаҐЃа¤Іа¤ѕа¤€._а¤…а¤—._а¤ёаҐ‡а¤ЄаҐЌа¤џ._а¤…а¤•аҐЌа¤џаҐ‹._а¤ЁаҐ‹а¤­аҐ‡._а¤Ўа¤їа¤ёаҐ‡.'.split('_'),
            weekdays : 'а¤†а¤‡а¤¤а¤¬а¤ѕа¤°_а¤ёаҐ‹а¤®а¤¬а¤ѕа¤°_а¤®а¤™аҐЌа¤—а¤Іа¤¬а¤ѕа¤°_а¤¬аҐЃа¤§а¤¬а¤ѕа¤°_а¤¬а¤їа¤№а¤їа¤¬а¤ѕа¤°_а¤¶аҐЃа¤•аҐЌа¤°а¤¬а¤ѕа¤°_а¤¶а¤Ёа¤їа¤¬а¤ѕа¤°'.split('_'),
            weekdaysShort : 'а¤†а¤‡а¤¤._а¤ёаҐ‹а¤®._а¤®а¤™аҐЌа¤—а¤І._а¤¬аҐЃа¤§._а¤¬а¤їа¤№а¤ї._а¤¶аҐЃа¤•аҐЌа¤°._а¤¶а¤Ёа¤ї.'.split('_'),
            weekdaysMin : 'а¤†а¤‡._а¤ёаҐ‹._а¤®а¤™аҐЌ_а¤¬аҐЃ._а¤¬а¤ї._а¤¶аҐЃ._а¤¶.'.split('_'),
            longDateFormat : {
                LT : 'Aа¤•аҐ‹ h:mm а¤¬а¤њаҐ‡',
                LTS : 'Aа¤•аҐ‹ h:mm:ss а¤¬а¤њаҐ‡',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY, LT',
                LLLL : 'dddd, D MMMM YYYY, LT'
            },
            preparse: function (string) {
                return string.replace(/[аҐ§аҐЁаҐ©аҐЄаҐ«аҐ¬аҐ­аҐ®аҐЇаҐ¦]/g, function (match) {
                    return numberMap[match];
                });
            },
            postformat: function (string) {
                return string.replace(/\d/g, function (match) {
                    return symbolMap[match];
                });
            },
            meridiemParse: /а¤°а¤ѕа¤¤аҐЂ|а¤¬а¤їа¤№а¤ѕа¤Ё|а¤¦а¤їа¤‰а¤Ѓа¤ёаҐ‹|а¤¬аҐ‡а¤ІаҐЃа¤•а¤ѕ|а¤ёа¤ѕа¤Ѓа¤ќ|а¤°а¤ѕа¤¤аҐЂ/,
            meridiemHour : function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'а¤°а¤ѕа¤¤аҐЂ') {
                    return hour < 3 ? hour : hour + 12;
                } else if (meridiem === 'а¤¬а¤їа¤№а¤ѕа¤Ё') {
                    return hour;
                } else if (meridiem === 'а¤¦а¤їа¤‰а¤Ѓа¤ёаҐ‹') {
                    return hour >= 10 ? hour : hour + 12;
                } else if (meridiem === 'а¤¬аҐ‡а¤ІаҐЃа¤•а¤ѕ' || meridiem === 'а¤ёа¤ѕа¤Ѓа¤ќ') {
                    return hour + 12;
                }
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 3) {
                    return 'а¤°а¤ѕа¤¤аҐЂ';
                } else if (hour < 10) {
                    return 'а¤¬а¤їа¤№а¤ѕа¤Ё';
                } else if (hour < 15) {
                    return 'а¤¦а¤їа¤‰а¤Ѓа¤ёаҐ‹';
                } else if (hour < 18) {
                    return 'а¤¬аҐ‡а¤ІаҐЃа¤•а¤ѕ';
                } else if (hour < 20) {
                    return 'а¤ёа¤ѕа¤Ѓа¤ќ';
                } else {
                    return 'а¤°а¤ѕа¤¤аҐЂ';
                }
            },
            calendar : {
                sameDay : '[а¤†а¤њ] LT',
                nextDay : '[а¤­аҐ‹а¤ІаҐЂ] LT',
                nextWeek : '[а¤†а¤‰а¤Ѓа¤¦аҐ‹] dddd[,] LT',
                lastDay : '[а¤№а¤їа¤њаҐ‹] LT',
                lastWeek : '[а¤—а¤Џа¤•аҐ‹] dddd[,] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%sа¤®а¤ѕ',
                past : '%s а¤…а¤—а¤ѕа¤ЎаҐЂ',
                s : 'а¤•аҐ‡а¤№аҐЂ а¤ёа¤®а¤Ї',
                m : 'а¤Џа¤• а¤®а¤їа¤ЁаҐ‡а¤џ',
                mm : '%d а¤®а¤їа¤ЁаҐ‡а¤џ',
                h : 'а¤Џа¤• а¤а¤ЈаҐЌа¤џа¤ѕ',
                hh : '%d а¤а¤ЈаҐЌа¤џа¤ѕ',
                d : 'а¤Џа¤• а¤¦а¤їа¤Ё',
                dd : '%d а¤¦а¤їа¤Ё',
                M : 'а¤Џа¤• а¤®а¤№а¤їа¤Ёа¤ѕ',
                MM : '%d а¤®а¤№а¤їа¤Ёа¤ѕ',
                y : 'а¤Џа¤• а¤¬а¤°аҐЌа¤·',
                yy : '%d а¤¬а¤°аҐЌа¤·'
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : dutch (nl)
// author : Joris RГ¶ling : https://github.com/jjupiter

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var monthsShortWithDots = 'jan._feb._mrt._apr._mei_jun._jul._aug._sep._okt._nov._dec.'.split('_'),
            monthsShortWithoutDots = 'jan_feb_mrt_apr_mei_jun_jul_aug_sep_okt_nov_dec'.split('_');

        return moment.defineLocale('nl', {
            months : 'januari_februari_maart_april_mei_juni_juli_augustus_september_oktober_november_december'.split('_'),
            monthsShort : function (m, format) {
                if (/-MMM-/.test(format)) {
                    return monthsShortWithoutDots[m.month()];
                } else {
                    return monthsShortWithDots[m.month()];
                }
            },
            weekdays : 'zondag_maandag_dinsdag_woensdag_donderdag_vrijdag_zaterdag'.split('_'),
            weekdaysShort : 'zo._ma._di._wo._do._vr._za.'.split('_'),
            weekdaysMin : 'Zo_Ma_Di_Wo_Do_Vr_Za'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD-MM-YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[vandaag om] LT',
                nextDay: '[morgen om] LT',
                nextWeek: 'dddd [om] LT',
                lastDay: '[gisteren om] LT',
                lastWeek: '[afgelopen] dddd [om] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'over %s',
                past : '%s geleden',
                s : 'een paar seconden',
                m : 'Г©Г©n minuut',
                mm : '%d minuten',
                h : 'Г©Г©n uur',
                hh : '%d uur',
                d : 'Г©Г©n dag',
                dd : '%d dagen',
                M : 'Г©Г©n maand',
                MM : '%d maanden',
                y : 'Г©Г©n jaar',
                yy : '%d jaar'
            },
            ordinalParse: /\d{1,2}(ste|de)/,
            ordinal : function (number) {
                return number + ((number === 1 || number === 8 || number >= 20) ? 'ste' : 'de');
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : norwegian nynorsk (nn)
// author : https://github.com/mechuwind

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('nn', {
            months : 'januar_februar_mars_april_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
            monthsShort : 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
            weekdays : 'sundag_mГҐndag_tysdag_onsdag_torsdag_fredag_laurdag'.split('_'),
            weekdaysShort : 'sun_mГҐn_tys_ons_tor_fre_lau'.split('_'),
            weekdaysMin : 'su_mГҐ_ty_on_to_fr_lГё'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[I dag klokka] LT',
                nextDay: '[I morgon klokka] LT',
                nextWeek: 'dddd [klokka] LT',
                lastDay: '[I gГҐr klokka] LT',
                lastWeek: '[FГёregГҐande] dddd [klokka] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'om %s',
                past : 'for %s sidan',
                s : 'nokre sekund',
                m : 'eit minutt',
                mm : '%d minutt',
                h : 'ein time',
                hh : '%d timar',
                d : 'ein dag',
                dd : '%d dagar',
                M : 'ein mГҐnad',
                MM : '%d mГҐnader',
                y : 'eit ГҐr',
                yy : '%d ГҐr'
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : polish (pl)
// author : Rafal Hirsz : https://github.com/evoL

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var monthsNominative = 'styczeЕ„_luty_marzec_kwiecieЕ„_maj_czerwiec_lipiec_sierpieЕ„_wrzesieЕ„_paЕєdziernik_listopad_grudzieЕ„'.split('_'),
            monthsSubjective = 'stycznia_lutego_marca_kwietnia_maja_czerwca_lipca_sierpnia_wrzeЕ›nia_paЕєdziernika_listopada_grudnia'.split('_');

        function plural(n) {
            return (n % 10 < 5) && (n % 10 > 1) && ((~~(n / 10) % 10) !== 1);
        }

        function translate(number, withoutSuffix, key) {
            var result = number + ' ';
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'minuta' : 'minutД™';
                case 'mm':
                    return result + (plural(number) ? 'minuty' : 'minut');
                case 'h':
                    return withoutSuffix  ? 'godzina'  : 'godzinД™';
                case 'hh':
                    return result + (plural(number) ? 'godziny' : 'godzin');
                case 'MM':
                    return result + (plural(number) ? 'miesiД…ce' : 'miesiД™cy');
                case 'yy':
                    return result + (plural(number) ? 'lata' : 'lat');
            }
        }

        return moment.defineLocale('pl', {
            months : function (momentToFormat, format) {
                if (/D MMMM/.test(format)) {
                    return monthsSubjective[momentToFormat.month()];
                } else {
                    return monthsNominative[momentToFormat.month()];
                }
            },
            monthsShort : 'sty_lut_mar_kwi_maj_cze_lip_sie_wrz_paЕє_lis_gru'.split('_'),
            weekdays : 'niedziela_poniedziaЕ‚ek_wtorek_Е›roda_czwartek_piД…tek_sobota'.split('_'),
            weekdaysShort : 'nie_pon_wt_Е›r_czw_pt_sb'.split('_'),
            weekdaysMin : 'N_Pn_Wt_Ељr_Cz_Pt_So'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[DziЕ› o] LT',
                nextDay: '[Jutro o] LT',
                nextWeek: '[W] dddd [o] LT',
                lastDay: '[Wczoraj o] LT',
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[W zeszЕ‚Д… niedzielД™ o] LT';
                        case 3:
                            return '[W zeszЕ‚Д… Е›rodД™ o] LT';
                        case 6:
                            return '[W zeszЕ‚Д… sobotД™ o] LT';
                        default:
                            return '[W zeszЕ‚y] dddd [o] LT';
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'za %s',
                past : '%s temu',
                s : 'kilka sekund',
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : '1 dzieЕ„',
                dd : '%d dni',
                M : 'miesiД…c',
                MM : translate,
                y : 'rok',
                yy : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : brazilian portuguese (pt-br)
// author : Caio Ribeiro Pereira : https://github.com/caio-ribeiro-pereira

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('pt-br', {
            months : 'janeiro_fevereiro_marГ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
            monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
            weekdays : 'domingo_segunda-feira_terГ§a-feira_quarta-feira_quinta-feira_sexta-feira_sГЎbado'.split('_'),
            weekdaysShort : 'dom_seg_ter_qua_qui_sex_sГЎb'.split('_'),
            weekdaysMin : 'dom_2ВЄ_3ВЄ_4ВЄ_5ВЄ_6ВЄ_sГЎb'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D [de] MMMM [de] YYYY',
                LLL : 'D [de] MMMM [de] YYYY [Г s] LT',
                LLLL : 'dddd, D [de] MMMM [de] YYYY [Г s] LT'
            },
            calendar : {
                sameDay: '[Hoje Г s] LT',
                nextDay: '[AmanhГЈ Г s] LT',
                nextWeek: 'dddd [Г s] LT',
                lastDay: '[Ontem Г s] LT',
                lastWeek: function () {
                    return (this.day() === 0 || this.day() === 6) ?
                        '[Гљltimo] dddd [Г s] LT' : // Saturday + Sunday
                        '[Гљltima] dddd [Г s] LT'; // Monday - Friday
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'em %s',
                past : '%s atrГЎs',
                s : 'segundos',
                m : 'um minuto',
                mm : '%d minutos',
                h : 'uma hora',
                hh : '%d horas',
                d : 'um dia',
                dd : '%d dias',
                M : 'um mГЄs',
                MM : '%d meses',
                y : 'um ano',
                yy : '%d anos'
            },
            ordinalParse: /\d{1,2}Вє/,
            ordinal : '%dВє'
        });
    }));
// moment.js locale configuration
// locale : portuguese (pt)
// author : Jefferson : https://github.com/jalex79

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('pt', {
            months : 'janeiro_fevereiro_marГ§o_abril_maio_junho_julho_agosto_setembro_outubro_novembro_dezembro'.split('_'),
            monthsShort : 'jan_fev_mar_abr_mai_jun_jul_ago_set_out_nov_dez'.split('_'),
            weekdays : 'domingo_segunda-feira_terГ§a-feira_quarta-feira_quinta-feira_sexta-feira_sГЎbado'.split('_'),
            weekdaysShort : 'dom_seg_ter_qua_qui_sex_sГЎb'.split('_'),
            weekdaysMin : 'dom_2ВЄ_3ВЄ_4ВЄ_5ВЄ_6ВЄ_sГЎb'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D [de] MMMM [de] YYYY',
                LLL : 'D [de] MMMM [de] YYYY LT',
                LLLL : 'dddd, D [de] MMMM [de] YYYY LT'
            },
            calendar : {
                sameDay: '[Hoje Г s] LT',
                nextDay: '[AmanhГЈ Г s] LT',
                nextWeek: 'dddd [Г s] LT',
                lastDay: '[Ontem Г s] LT',
                lastWeek: function () {
                    return (this.day() === 0 || this.day() === 6) ?
                        '[Гљltimo] dddd [Г s] LT' : // Saturday + Sunday
                        '[Гљltima] dddd [Г s] LT'; // Monday - Friday
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'em %s',
                past : 'hГЎ %s',
                s : 'segundos',
                m : 'um minuto',
                mm : '%d minutos',
                h : 'uma hora',
                hh : '%d horas',
                d : 'um dia',
                dd : '%d dias',
                M : 'um mГЄs',
                MM : '%d meses',
                y : 'um ano',
                yy : '%d anos'
            },
            ordinalParse: /\d{1,2}Вє/,
            ordinal : '%dВє',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : romanian (ro)
// author : Vlad Gurdiga : https://github.com/gurdiga
// author : Valentin Agachi : https://github.com/avaly

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function relativeTimeWithPlural(number, withoutSuffix, key) {
            var format = {
                    'mm': 'minute',
                    'hh': 'ore',
                    'dd': 'zile',
                    'MM': 'luni',
                    'yy': 'ani'
                },
                separator = ' ';
            if (number % 100 >= 20 || (number >= 100 && number % 100 === 0)) {
                separator = ' de ';
            }

            return number + separator + format[key];
        }

        return moment.defineLocale('ro', {
            months : 'ianuarie_februarie_martie_aprilie_mai_iunie_iulie_august_septembrie_octombrie_noiembrie_decembrie'.split('_'),
            monthsShort : 'ian._febr._mart._apr._mai_iun._iul._aug._sept._oct._nov._dec.'.split('_'),
            weekdays : 'duminicДѓ_luni_marИ›i_miercuri_joi_vineri_sГўmbДѓtДѓ'.split('_'),
            weekdaysShort : 'Dum_Lun_Mar_Mie_Joi_Vin_SГўm'.split('_'),
            weekdaysMin : 'Du_Lu_Ma_Mi_Jo_Vi_SГў'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY H:mm',
                LLLL : 'dddd, D MMMM YYYY H:mm'
            },
            calendar : {
                sameDay: '[azi la] LT',
                nextDay: '[mГўine la] LT',
                nextWeek: 'dddd [la] LT',
                lastDay: '[ieri la] LT',
                lastWeek: '[fosta] dddd [la] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'peste %s',
                past : '%s Г®n urmДѓ',
                s : 'cГўteva secunde',
                m : 'un minut',
                mm : relativeTimeWithPlural,
                h : 'o orДѓ',
                hh : relativeTimeWithPlural,
                d : 'o zi',
                dd : relativeTimeWithPlural,
                M : 'o lunДѓ',
                MM : relativeTimeWithPlural,
                y : 'un an',
                yy : relativeTimeWithPlural
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : russian (ru)
// author : Viktorminator : https://github.com/Viktorminator
// Author : Menelion ElensГєle : https://github.com/Oire

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function plural(word, num) {
            var forms = word.split('_');
            return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
        }

        function relativeTimeWithPlural(number, withoutSuffix, key) {
            var format = {
                'mm': withoutSuffix ? 'РјРёРЅСѓС‚Р°_РјРёРЅСѓС‚С‹_РјРёРЅСѓС‚' : 'РјРёРЅСѓС‚Сѓ_РјРёРЅСѓС‚С‹_РјРёРЅСѓС‚',
                'hh': 'С‡Р°СЃ_С‡Р°СЃР°_С‡Р°СЃРѕРІ',
                'dd': 'РґРµРЅСЊ_РґРЅСЏ_РґРЅРµР№',
                'MM': 'РјРµСЃСЏС†_РјРµСЃСЏС†Р°_РјРµСЃСЏС†РµРІ',
                'yy': 'РіРѕРґ_РіРѕРґР°_Р»РµС‚'
            };
            if (key === 'm') {
                return withoutSuffix ? 'РјРёРЅСѓС‚Р°' : 'РјРёРЅСѓС‚Сѓ';
            }
            else {
                return number + ' ' + plural(format[key], +number);
            }
        }

        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'СЏРЅРІР°СЂСЊ_С„РµРІСЂР°Р»СЊ_РјР°СЂС‚_Р°РїСЂРµР»СЊ_РјР°Р№_РёСЋРЅСЊ_РёСЋР»СЊ_Р°РІРіСѓСЃС‚_СЃРµРЅС‚СЏР±СЂСЊ_РѕРєС‚СЏР±СЂСЊ_РЅРѕСЏР±СЂСЊ_РґРµРєР°Р±СЂСЊ'.split('_'),
                    'accusative': 'СЏРЅРІР°СЂСЏ_С„РµРІСЂР°Р»СЏ_РјР°СЂС‚Р°_Р°РїСЂРµР»СЏ_РјР°СЏ_РёСЋРЅСЏ_РёСЋР»СЏ_Р°РІРіСѓСЃС‚Р°_СЃРµРЅС‚СЏР±СЂСЏ_РѕРєС‚СЏР±СЂСЏ_РЅРѕСЏР±СЂСЏ_РґРµРєР°Р±СЂСЏ'.split('_')
                },

                nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function monthsShortCaseReplace(m, format) {
            var monthsShort = {
                    'nominative': 'СЏРЅРІ_С„РµРІ_РјР°СЂС‚_Р°РїСЂ_РјР°Р№_РёСЋРЅСЊ_РёСЋР»СЊ_Р°РІРі_СЃРµРЅ_РѕРєС‚_РЅРѕСЏ_РґРµРє'.split('_'),
                    'accusative': 'СЏРЅРІ_С„РµРІ_РјР°СЂ_Р°РїСЂ_РјР°СЏ_РёСЋРЅСЏ_РёСЋР»СЏ_Р°РІРі_СЃРµРЅ_РѕРєС‚_РЅРѕСЏ_РґРµРє'.split('_')
                },

                nounCase = (/D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return monthsShort[nounCase][m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = {
                    'nominative': 'РІРѕСЃРєСЂРµСЃРµРЅСЊРµ_РїРѕРЅРµРґРµР»СЊРЅРёРє_РІС‚РѕСЂРЅРёРє_СЃСЂРµРґР°_С‡РµС‚РІРµСЂРі_РїСЏС‚РЅРёС†Р°_СЃСѓР±Р±РѕС‚Р°'.split('_'),
                    'accusative': 'РІРѕСЃРєСЂРµСЃРµРЅСЊРµ_РїРѕРЅРµРґРµР»СЊРЅРёРє_РІС‚РѕСЂРЅРёРє_СЃСЂРµРґСѓ_С‡РµС‚РІРµСЂРі_РїСЏС‚РЅРёС†Сѓ_СЃСѓР±Р±РѕС‚Сѓ'.split('_')
                },

                nounCase = (/\[ ?[Р’РІ] ?(?:РїСЂРѕС€Р»СѓСЋ|СЃР»РµРґСѓСЋС‰СѓСЋ|СЌС‚Сѓ)? ?\] ?dddd/).test(format) ?
                    'accusative' :
                    'nominative';

            return weekdays[nounCase][m.day()];
        }

        return moment.defineLocale('ru', {
            months : monthsCaseReplace,
            monthsShort : monthsShortCaseReplace,
            weekdays : weekdaysCaseReplace,
            weekdaysShort : 'РІСЃ_РїРЅ_РІС‚_СЃСЂ_С‡С‚_РїС‚_СЃР±'.split('_'),
            weekdaysMin : 'РІСЃ_РїРЅ_РІС‚_СЃСЂ_С‡С‚_РїС‚_СЃР±'.split('_'),
            monthsParse : [/^СЏРЅРІ/i, /^С„РµРІ/i, /^РјР°СЂ/i, /^Р°РїСЂ/i, /^РјР°[Р№|СЏ]/i, /^РёСЋРЅ/i, /^РёСЋР»/i, /^Р°РІРі/i, /^СЃРµРЅ/i, /^РѕРєС‚/i, /^РЅРѕСЏ/i, /^РґРµРє/i],
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY Рі.',
                LLL : 'D MMMM YYYY Рі., LT',
                LLLL : 'dddd, D MMMM YYYY Рі., LT'
            },
            calendar : {
                sameDay: '[РЎРµРіРѕРґРЅСЏ РІ] LT',
                nextDay: '[Р—Р°РІС‚СЂР° РІ] LT',
                lastDay: '[Р’С‡РµСЂР° РІ] LT',
                nextWeek: function () {
                    return this.day() === 2 ? '[Р’Рѕ] dddd [РІ] LT' : '[Р’] dddd [РІ] LT';
                },
                lastWeek: function (now) {
                    if (now.week() !== this.week()) {
                        switch (this.day()) {
                            case 0:
                                return '[Р’ РїСЂРѕС€Р»РѕРµ] dddd [РІ] LT';
                            case 1:
                            case 2:
                            case 4:
                                return '[Р’ РїСЂРѕС€Р»С‹Р№] dddd [РІ] LT';
                            case 3:
                            case 5:
                            case 6:
                                return '[Р’ РїСЂРѕС€Р»СѓСЋ] dddd [РІ] LT';
                        }
                    } else {
                        if (this.day() === 2) {
                            return '[Р’Рѕ] dddd [РІ] LT';
                        } else {
                            return '[Р’] dddd [РІ] LT';
                        }
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'С‡РµСЂРµР· %s',
                past : '%s РЅР°Р·Р°Рґ',
                s : 'РЅРµСЃРєРѕР»СЊРєРѕ СЃРµРєСѓРЅРґ',
                m : relativeTimeWithPlural,
                mm : relativeTimeWithPlural,
                h : 'С‡Р°СЃ',
                hh : relativeTimeWithPlural,
                d : 'РґРµРЅСЊ',
                dd : relativeTimeWithPlural,
                M : 'РјРµСЃСЏС†',
                MM : relativeTimeWithPlural,
                y : 'РіРѕРґ',
                yy : relativeTimeWithPlural
            },

            meridiemParse: /РЅРѕС‡Рё|СѓС‚СЂР°|РґРЅСЏ|РІРµС‡РµСЂР°/i,
            isPM : function (input) {
                return /^(РґРЅСЏ|РІРµС‡РµСЂР°)$/.test(input);
            },

            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'РЅРѕС‡Рё';
                } else if (hour < 12) {
                    return 'СѓС‚СЂР°';
                } else if (hour < 17) {
                    return 'РґРЅСЏ';
                } else {
                    return 'РІРµС‡РµСЂР°';
                }
            },

            ordinalParse: /\d{1,2}-(Р№|РіРѕ|СЏ)/,
            ordinal: function (number, period) {
                switch (period) {
                    case 'M':
                    case 'd':
                    case 'DDD':
                        return number + '-Р№';
                    case 'D':
                        return number + '-РіРѕ';
                    case 'w':
                    case 'W':
                        return number + '-СЏ';
                    default:
                        return number;
                }
            },

            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : slovak (sk)
// author : Martin Minka : https://github.com/k2s
// based on work of petrbela : https://github.com/petrbela

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var months = 'januГЎr_februГЎr_marec_aprГ­l_mГЎj_jГєn_jГєl_august_september_oktГіber_november_december'.split('_'),
            monthsShort = 'jan_feb_mar_apr_mГЎj_jГєn_jГєl_aug_sep_okt_nov_dec'.split('_');

        function plural(n) {
            return (n > 1) && (n < 5);
        }

        function translate(number, withoutSuffix, key, isFuture) {
            var result = number + ' ';
            switch (key) {
                case 's':  // a few seconds / in a few seconds / a few seconds ago
                    return (withoutSuffix || isFuture) ? 'pГЎr sekГєnd' : 'pГЎr sekundami';
                case 'm':  // a minute / in a minute / a minute ago
                    return withoutSuffix ? 'minГєta' : (isFuture ? 'minГєtu' : 'minГєtou');
                case 'mm': // 9 minutes / in 9 minutes / 9 minutes ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'minГєty' : 'minГєt');
                    } else {
                        return result + 'minГєtami';
                    }
                    break;
                case 'h':  // an hour / in an hour / an hour ago
                    return withoutSuffix ? 'hodina' : (isFuture ? 'hodinu' : 'hodinou');
                case 'hh': // 9 hours / in 9 hours / 9 hours ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'hodiny' : 'hodГ­n');
                    } else {
                        return result + 'hodinami';
                    }
                    break;
                case 'd':  // a day / in a day / a day ago
                    return (withoutSuffix || isFuture) ? 'deЕ€' : 'dЕ€om';
                case 'dd': // 9 days / in 9 days / 9 days ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'dni' : 'dnГ­');
                    } else {
                        return result + 'dЕ€ami';
                    }
                    break;
                case 'M':  // a month / in a month / a month ago
                    return (withoutSuffix || isFuture) ? 'mesiac' : 'mesiacom';
                case 'MM': // 9 months / in 9 months / 9 months ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'mesiace' : 'mesiacov');
                    } else {
                        return result + 'mesiacmi';
                    }
                    break;
                case 'y':  // a year / in a year / a year ago
                    return (withoutSuffix || isFuture) ? 'rok' : 'rokom';
                case 'yy': // 9 years / in 9 years / 9 years ago
                    if (withoutSuffix || isFuture) {
                        return result + (plural(number) ? 'roky' : 'rokov');
                    } else {
                        return result + 'rokmi';
                    }
                    break;
            }
        }

        return moment.defineLocale('sk', {
            months : months,
            monthsShort : monthsShort,
            monthsParse : (function (months, monthsShort) {
                var i, _monthsParse = [];
                for (i = 0; i < 12; i++) {
                    // use custom parser to solve problem with July (ДЌervenec)
                    _monthsParse[i] = new RegExp('^' + months[i] + '$|^' + monthsShort[i] + '$', 'i');
                }
                return _monthsParse;
            }(months, monthsShort)),
            weekdays : 'nedeДѕa_pondelok_utorok_streda_ЕЎtvrtok_piatok_sobota'.split('_'),
            weekdaysShort : 'ne_po_ut_st_ЕЎt_pi_so'.split('_'),
            weekdaysMin : 'ne_po_ut_st_ЕЎt_pi_so'.split('_'),
            longDateFormat : {
                LT: 'H:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd D. MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[dnes o] LT',
                nextDay: '[zajtra o] LT',
                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[v nedeДѕu o] LT';
                        case 1:
                        case 2:
                            return '[v] dddd [o] LT';
                        case 3:
                            return '[v stredu o] LT';
                        case 4:
                            return '[vo ЕЎtvrtok o] LT';
                        case 5:
                            return '[v piatok o] LT';
                        case 6:
                            return '[v sobotu o] LT';
                    }
                },
                lastDay: '[vДЌera o] LT',
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[minulГє nedeДѕu o] LT';
                        case 1:
                        case 2:
                            return '[minulГЅ] dddd [o] LT';
                        case 3:
                            return '[minulГє stredu o] LT';
                        case 4:
                        case 5:
                            return '[minulГЅ] dddd [o] LT';
                        case 6:
                            return '[minulГє sobotu o] LT';
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'za %s',
                past : 'pred %s',
                s : translate,
                m : translate,
                mm : translate,
                h : translate,
                hh : translate,
                d : translate,
                dd : translate,
                M : translate,
                MM : translate,
                y : translate,
                yy : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : slovenian (sl)
// author : Robert SedovЕЎek : https://github.com/sedovsek

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function translate(number, withoutSuffix, key) {
            var result = number + ' ';
            switch (key) {
                case 'm':
                    return withoutSuffix ? 'ena minuta' : 'eno minuto';
                case 'mm':
                    if (number === 1) {
                        result += 'minuta';
                    } else if (number === 2) {
                        result += 'minuti';
                    } else if (number === 3 || number === 4) {
                        result += 'minute';
                    } else {
                        result += 'minut';
                    }
                    return result;
                case 'h':
                    return withoutSuffix ? 'ena ura' : 'eno uro';
                case 'hh':
                    if (number === 1) {
                        result += 'ura';
                    } else if (number === 2) {
                        result += 'uri';
                    } else if (number === 3 || number === 4) {
                        result += 'ure';
                    } else {
                        result += 'ur';
                    }
                    return result;
                case 'dd':
                    if (number === 1) {
                        result += 'dan';
                    } else {
                        result += 'dni';
                    }
                    return result;
                case 'MM':
                    if (number === 1) {
                        result += 'mesec';
                    } else if (number === 2) {
                        result += 'meseca';
                    } else if (number === 3 || number === 4) {
                        result += 'mesece';
                    } else {
                        result += 'mesecev';
                    }
                    return result;
                case 'yy':
                    if (number === 1) {
                        result += 'leto';
                    } else if (number === 2) {
                        result += 'leti';
                    } else if (number === 3 || number === 4) {
                        result += 'leta';
                    } else {
                        result += 'let';
                    }
                    return result;
            }
        }

        return moment.defineLocale('sl', {
            months : 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split('_'),
            monthsShort : 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split('_'),
            weekdays : 'nedelja_ponedeljek_torek_sreda_ДЌetrtek_petek_sobota'.split('_'),
            weekdaysShort : 'ned._pon._tor._sre._ДЌet._pet._sob.'.split('_'),
            weekdaysMin : 'ne_po_to_sr_ДЌe_pe_so'.split('_'),
            longDateFormat : {
                LT : 'H:mm',
                LTS : 'LT:ss',
                L : 'DD. MM. YYYY',
                LL : 'D. MMMM YYYY',
                LLL : 'D. MMMM YYYY LT',
                LLLL : 'dddd, D. MMMM YYYY LT'
            },
            calendar : {
                sameDay  : '[danes ob] LT',
                nextDay  : '[jutri ob] LT',

                nextWeek : function () {
                    switch (this.day()) {
                        case 0:
                            return '[v] [nedeljo] [ob] LT';
                        case 3:
                            return '[v] [sredo] [ob] LT';
                        case 6:
                            return '[v] [soboto] [ob] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[v] dddd [ob] LT';
                    }
                },
                lastDay  : '[vДЌeraj ob] LT',
                lastWeek : function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 6:
                            return '[prejЕЎnja] dddd [ob] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[prejЕЎnji] dddd [ob] LT';
                    }
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'ДЌez %s',
                past   : '%s nazaj',
                s      : 'nekaj sekund',
                m      : translate,
                mm     : translate,
                h      : translate,
                hh     : translate,
                d      : 'en dan',
                dd     : translate,
                M      : 'en mesec',
                MM     : translate,
                y      : 'eno leto',
                yy     : translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Albanian (sq)
// author : FlakГ«rim Ismani : https://github.com/flakerimi
// author: Menelion ElensГєle: https://github.com/Oire (tests)
// author : Oerd Cukalla : https://github.com/oerd (fixes)

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('sq', {
            months : 'Janar_Shkurt_Mars_Prill_Maj_Qershor_Korrik_Gusht_Shtator_Tetor_NГ«ntor_Dhjetor'.split('_'),
            monthsShort : 'Jan_Shk_Mar_Pri_Maj_Qer_Kor_Gus_Sht_Tet_NГ«n_Dhj'.split('_'),
            weekdays : 'E Diel_E HГ«nГ«_E MartГ«_E MГ«rkurГ«_E Enjte_E Premte_E ShtunГ«'.split('_'),
            weekdaysShort : 'Die_HГ«n_Mar_MГ«r_Enj_Pre_Sht'.split('_'),
            weekdaysMin : 'D_H_Ma_MГ«_E_P_Sh'.split('_'),
            meridiemParse: /PD|MD/,
            isPM: function (input) {
                return input.charAt(0) === 'M';
            },
            meridiem : function (hours, minutes, isLower) {
                return hours < 12 ? 'PD' : 'MD';
            },
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[Sot nГ«] LT',
                nextDay : '[NesГ«r nГ«] LT',
                nextWeek : 'dddd [nГ«] LT',
                lastDay : '[Dje nГ«] LT',
                lastWeek : 'dddd [e kaluar nГ«] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'nГ« %s',
                past : '%s mГ« parГ«',
                s : 'disa sekonda',
                m : 'njГ« minutГ«',
                mm : '%d minuta',
                h : 'njГ« orГ«',
                hh : '%d orГ«',
                d : 'njГ« ditГ«',
                dd : '%d ditГ«',
                M : 'njГ« muaj',
                MM : '%d muaj',
                y : 'njГ« vit',
                yy : '%d vite'
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Serbian-cyrillic (sr-cyrl)
// author : Milan JanaДЌkoviД‡<milanjanackovic@gmail.com> : https://github.com/milan-j

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var translator = {
            words: { //Different grammatical cases
                m: ['СРµРґР°РЅ РјРёРЅСѓС‚', 'СРµРґРЅРµ РјРёРЅСѓС‚Рµ'],
                mm: ['РјРёРЅСѓС‚', 'РјРёРЅСѓС‚Рµ', 'РјРёРЅСѓС‚Р°'],
                h: ['СРµРґР°РЅ СЃР°С‚', 'СРµРґРЅРѕРі СЃР°С‚Р°'],
                hh: ['СЃР°С‚', 'СЃР°С‚Р°', 'СЃР°С‚Рё'],
                dd: ['РґР°РЅ', 'РґР°РЅР°', 'РґР°РЅР°'],
                MM: ['РјРµСЃРµС†', 'РјРµСЃРµС†Р°', 'РјРµСЃРµС†Рё'],
                yy: ['РіРѕРґРёРЅР°', 'РіРѕРґРёРЅРµ', 'РіРѕРґРёРЅР°']
            },
            correctGrammaticalCase: function (number, wordKey) {
                return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
            },
            translate: function (number, withoutSuffix, key) {
                var wordKey = translator.words[key];
                if (key.length === 1) {
                    return withoutSuffix ? wordKey[0] : wordKey[1];
                } else {
                    return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
                }
            }
        };

        return moment.defineLocale('sr-cyrl', {
            months: ['СР°РЅСѓР°СЂ', 'С„РµР±СЂСѓР°СЂ', 'РјР°СЂС‚', 'Р°РїСЂРёР»', 'РјР°С', 'ССѓРЅ', 'ССѓР»', 'Р°РІРіСѓСЃС‚', 'СЃРµРїС‚РµРјР±Р°СЂ', 'РѕРєС‚РѕР±Р°СЂ', 'РЅРѕРІРµРјР±Р°СЂ', 'РґРµС†РµРјР±Р°СЂ'],
            monthsShort: ['СР°РЅ.', 'С„РµР±.', 'РјР°СЂ.', 'Р°РїСЂ.', 'РјР°С', 'ССѓРЅ', 'ССѓР»', 'Р°РІРі.', 'СЃРµРї.', 'РѕРєС‚.', 'РЅРѕРІ.', 'РґРµС†.'],
            weekdays: ['РЅРµРґРµС™Р°', 'РїРѕРЅРµРґРµС™Р°Рє', 'СѓС‚РѕСЂР°Рє', 'СЃСЂРµРґР°', 'С‡РµС‚РІСЂС‚Р°Рє', 'РїРµС‚Р°Рє', 'СЃСѓР±РѕС‚Р°'],
            weekdaysShort: ['РЅРµРґ.', 'РїРѕРЅ.', 'СѓС‚Рѕ.', 'СЃСЂРµ.', 'С‡РµС‚.', 'РїРµС‚.', 'СЃСѓР±.'],
            weekdaysMin: ['РЅРµ', 'РїРѕ', 'СѓС‚', 'СЃСЂ', 'С‡Рµ', 'РїРµ', 'СЃСѓ'],
            longDateFormat: {
                LT: 'H:mm',
                LTS : 'LT:ss',
                L: 'DD. MM. YYYY',
                LL: 'D. MMMM YYYY',
                LLL: 'D. MMMM YYYY LT',
                LLLL: 'dddd, D. MMMM YYYY LT'
            },
            calendar: {
                sameDay: '[РґР°РЅР°СЃ Сѓ] LT',
                nextDay: '[СЃСѓС‚СЂР° Сѓ] LT',

                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[Сѓ] [РЅРµРґРµС™Сѓ] [Сѓ] LT';
                        case 3:
                            return '[Сѓ] [СЃСЂРµРґСѓ] [Сѓ] LT';
                        case 6:
                            return '[Сѓ] [СЃСѓР±РѕС‚Сѓ] [Сѓ] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[Сѓ] dddd [Сѓ] LT';
                    }
                },
                lastDay  : '[ССѓС‡Рµ Сѓ] LT',
                lastWeek : function () {
                    var lastWeekDays = [
                        '[РїСЂРѕС€Р»Рµ] [РЅРµРґРµС™Рµ] [Сѓ] LT',
                        '[РїСЂРѕС€Р»РѕРі] [РїРѕРЅРµРґРµС™РєР°] [Сѓ] LT',
                        '[РїСЂРѕС€Р»РѕРі] [СѓС‚РѕСЂРєР°] [Сѓ] LT',
                        '[РїСЂРѕС€Р»Рµ] [СЃСЂРµРґРµ] [Сѓ] LT',
                        '[РїСЂРѕС€Р»РѕРі] [С‡РµС‚РІСЂС‚РєР°] [Сѓ] LT',
                        '[РїСЂРѕС€Р»РѕРі] [РїРµС‚РєР°] [Сѓ] LT',
                        '[РїСЂРѕС€Р»Рµ] [СЃСѓР±РѕС‚Рµ] [Сѓ] LT'
                    ];
                    return lastWeekDays[this.day()];
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'Р·Р° %s',
                past   : 'РїСЂРµ %s',
                s      : 'РЅРµРєРѕР»РёРєРѕ СЃРµРєСѓРЅРґРё',
                m      : translator.translate,
                mm     : translator.translate,
                h      : translator.translate,
                hh     : translator.translate,
                d      : 'РґР°РЅ',
                dd     : translator.translate,
                M      : 'РјРµСЃРµС†',
                MM     : translator.translate,
                y      : 'РіРѕРґРёРЅСѓ',
                yy     : translator.translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Serbian-latin (sr)
// author : Milan JanaДЌkoviД‡<milanjanackovic@gmail.com> : https://github.com/milan-j

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var translator = {
            words: { //Different grammatical cases
                m: ['jedan minut', 'jedne minute'],
                mm: ['minut', 'minute', 'minuta'],
                h: ['jedan sat', 'jednog sata'],
                hh: ['sat', 'sata', 'sati'],
                dd: ['dan', 'dana', 'dana'],
                MM: ['mesec', 'meseca', 'meseci'],
                yy: ['godina', 'godine', 'godina']
            },
            correctGrammaticalCase: function (number, wordKey) {
                return number === 1 ? wordKey[0] : (number >= 2 && number <= 4 ? wordKey[1] : wordKey[2]);
            },
            translate: function (number, withoutSuffix, key) {
                var wordKey = translator.words[key];
                if (key.length === 1) {
                    return withoutSuffix ? wordKey[0] : wordKey[1];
                } else {
                    return number + ' ' + translator.correctGrammaticalCase(number, wordKey);
                }
            }
        };

        return moment.defineLocale('sr', {
            months: ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'],
            monthsShort: ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun', 'jul', 'avg.', 'sep.', 'okt.', 'nov.', 'dec.'],
            weekdays: ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'ДЌetvrtak', 'petak', 'subota'],
            weekdaysShort: ['ned.', 'pon.', 'uto.', 'sre.', 'ДЌet.', 'pet.', 'sub.'],
            weekdaysMin: ['ne', 'po', 'ut', 'sr', 'ДЌe', 'pe', 'su'],
            longDateFormat: {
                LT: 'H:mm',
                LTS : 'LT:ss',
                L: 'DD. MM. YYYY',
                LL: 'D. MMMM YYYY',
                LLL: 'D. MMMM YYYY LT',
                LLLL: 'dddd, D. MMMM YYYY LT'
            },
            calendar: {
                sameDay: '[danas u] LT',
                nextDay: '[sutra u] LT',

                nextWeek: function () {
                    switch (this.day()) {
                        case 0:
                            return '[u] [nedelju] [u] LT';
                        case 3:
                            return '[u] [sredu] [u] LT';
                        case 6:
                            return '[u] [subotu] [u] LT';
                        case 1:
                        case 2:
                        case 4:
                        case 5:
                            return '[u] dddd [u] LT';
                    }
                },
                lastDay  : '[juДЌe u] LT',
                lastWeek : function () {
                    var lastWeekDays = [
                        '[proЕЎle] [nedelje] [u] LT',
                        '[proЕЎlog] [ponedeljka] [u] LT',
                        '[proЕЎlog] [utorka] [u] LT',
                        '[proЕЎle] [srede] [u] LT',
                        '[proЕЎlog] [ДЌetvrtka] [u] LT',
                        '[proЕЎlog] [petka] [u] LT',
                        '[proЕЎle] [subote] [u] LT'
                    ];
                    return lastWeekDays[this.day()];
                },
                sameElse : 'L'
            },
            relativeTime : {
                future : 'za %s',
                past   : 'pre %s',
                s      : 'nekoliko sekundi',
                m      : translator.translate,
                mm     : translator.translate,
                h      : translator.translate,
                hh     : translator.translate,
                d      : 'dan',
                dd     : translator.translate,
                M      : 'mesec',
                MM     : translator.translate,
                y      : 'godinu',
                yy     : translator.translate
            },
            ordinalParse: /\d{1,2}\./,
            ordinal : '%d.',
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : swedish (sv)
// author : Jens Alm : https://github.com/ulmus

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('sv', {
            months : 'januari_februari_mars_april_maj_juni_juli_augusti_september_oktober_november_december'.split('_'),
            monthsShort : 'jan_feb_mar_apr_maj_jun_jul_aug_sep_okt_nov_dec'.split('_'),
            weekdays : 'sГ¶ndag_mГҐndag_tisdag_onsdag_torsdag_fredag_lГ¶rdag'.split('_'),
            weekdaysShort : 'sГ¶n_mГҐn_tis_ons_tor_fre_lГ¶r'.split('_'),
            weekdaysMin : 'sГ¶_mГҐ_ti_on_to_fr_lГ¶'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'YYYY-MM-DD',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[Idag] LT',
                nextDay: '[Imorgon] LT',
                lastDay: '[IgГҐr] LT',
                nextWeek: 'dddd LT',
                lastWeek: '[FГ¶rra] dddd[en] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'om %s',
                past : 'fГ¶r %s sedan',
                s : 'nГҐgra sekunder',
                m : 'en minut',
                mm : '%d minuter',
                h : 'en timme',
                hh : '%d timmar',
                d : 'en dag',
                dd : '%d dagar',
                M : 'en mГҐnad',
                MM : '%d mГҐnader',
                y : 'ett ГҐr',
                yy : '%d ГҐr'
            },
            ordinalParse: /\d{1,2}(e|a)/,
            ordinal : function (number) {
                var b = number % 10,
                    output = (~~(number % 100 / 10) === 1) ? 'e' :
                        (b === 1) ? 'a' :
                            (b === 2) ? 'a' :
                                (b === 3) ? 'e' : 'e';
                return number + output;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : tamil (ta)
// author : Arjunkumar Krishnamoorthy : https://github.com/tk120404

    (function (factory) {
        factory(moment);
    }(function (moment) {
        /*var symbolMap = {
            '1': 'аЇ§',
            '2': 'аЇЁ',
            '3': 'аЇ©',
            '4': 'аЇЄ',
            '5': 'аЇ«',
            '6': 'аЇ¬',
            '7': 'аЇ­',
            '8': 'аЇ®',
            '9': 'аЇЇ',
            '0': 'аЇ¦'
        },
        numberMap = {
            'аЇ§': '1',
            'аЇЁ': '2',
            'аЇ©': '3',
            'аЇЄ': '4',
            'аЇ«': '5',
            'аЇ¬': '6',
            'аЇ­': '7',
            'аЇ®': '8',
            'аЇЇ': '9',
            'аЇ¦': '0'
        }; */

        return moment.defineLocale('ta', {
            months : 'а®ња®©а®µа®°а®ї_а®Єа®їа®ЄаЇЌа®°а®µа®°а®ї_а®®а®ѕа®°аЇЌа®љаЇЌ_а®Џа®ЄаЇЌа®°а®ІаЇЌ_а®®аЇ‡_а®њаЇ‚а®©аЇЌ_а®њаЇ‚а®ІаЇ€_а®†а®•а®ёаЇЌа®џаЇЌ_а®љаЇ†а®ЄаЇЌа®џаЇ†а®®аЇЌа®Єа®°аЇЌ_а®…а®•аЇЌа®џаЇ‡а®ѕа®Єа®°аЇЌ_а®Ёа®µа®®аЇЌа®Єа®°аЇЌ_а®џа®їа®ља®®аЇЌа®Єа®°аЇЌ'.split('_'),
            monthsShort : 'а®ња®©а®µа®°а®ї_а®Єа®їа®ЄаЇЌа®°а®µа®°а®ї_а®®а®ѕа®°аЇЌа®љаЇЌ_а®Џа®ЄаЇЌа®°а®ІаЇЌ_а®®аЇ‡_а®њаЇ‚а®©аЇЌ_а®њаЇ‚а®ІаЇ€_а®†а®•а®ёаЇЌа®џаЇЌ_а®љаЇ†а®ЄаЇЌа®џаЇ†а®®аЇЌа®Єа®°аЇЌ_а®…а®•аЇЌа®џаЇ‡а®ѕа®Єа®°аЇЌ_а®Ёа®µа®®аЇЌа®Єа®°аЇЌ_а®џа®їа®ља®®аЇЌа®Єа®°аЇЌ'.split('_'),
            weekdays : 'а®ћа®ѕа®Їа®їа®±аЇЌа®±аЇЃа®•аЇЌа®•а®їа®ґа®®аЇ€_а®¤а®їа®™аЇЌа®•а®џаЇЌа®•а®їа®ґа®®аЇ€_а®љаЇ†а®µаЇЌа®µа®ѕа®ЇаЇЌа®•а®їа®ґа®®аЇ€_а®ЄаЇЃа®¤а®©аЇЌа®•а®їа®ґа®®аЇ€_а®µа®їа®Їа®ѕа®ґа®•аЇЌа®•а®їа®ґа®®аЇ€_а®µаЇ†а®іаЇЌа®іа®їа®•аЇЌа®•а®їа®ґа®®аЇ€_а®ља®©а®їа®•аЇЌа®•а®їа®ґа®®аЇ€'.split('_'),
            weekdaysShort : 'а®ћа®ѕа®Їа®їа®±аЇЃ_а®¤а®їа®™аЇЌа®•а®іаЇЌ_а®љаЇ†а®µаЇЌа®µа®ѕа®ЇаЇЌ_а®ЄаЇЃа®¤а®©аЇЌ_а®µа®їа®Їа®ѕа®ґа®©аЇЌ_а®µаЇ†а®іаЇЌа®іа®ї_а®ља®©а®ї'.split('_'),
            weekdaysMin : 'а®ћа®ѕ_а®¤а®ї_а®љаЇ†_а®ЄаЇЃ_а®µа®ї_а®µаЇ†_а®љ'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY, LT',
                LLLL : 'dddd, D MMMM YYYY, LT'
            },
            calendar : {
                sameDay : '[а®‡а®©аЇЌа®±аЇЃ] LT',
                nextDay : '[а®Ёа®ѕа®іаЇ€] LT',
                nextWeek : 'dddd, LT',
                lastDay : '[а®ЁаЇ‡а®±аЇЌа®±аЇЃ] LT',
                lastWeek : '[а®•а®џа®ЁаЇЌа®¤ а®µа®ѕа®°а®®аЇЌ] dddd, LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s а®‡а®ІаЇЌ',
                past : '%s а®®аЇЃа®©аЇЌ',
                s : 'а®’а®°аЇЃ а®ља®їа®І а®µа®їа®Ёа®ѕа®џа®їа®•а®іаЇЌ',
                m : 'а®’а®°аЇЃ а®Ёа®їа®®а®їа®џа®®аЇЌ',
                mm : '%d а®Ёа®їа®®а®їа®џа®™аЇЌа®•а®іаЇЌ',
                h : 'а®’а®°аЇЃ а®®а®Ја®ї а®ЁаЇ‡а®°а®®аЇЌ',
                hh : '%d а®®а®Ја®ї а®ЁаЇ‡а®°а®®аЇЌ',
                d : 'а®’а®°аЇЃ а®Ёа®ѕа®іаЇЌ',
                dd : '%d а®Ёа®ѕа®џаЇЌа®•а®іаЇЌ',
                M : 'а®’а®°аЇЃ а®®а®ѕа®¤а®®аЇЌ',
                MM : '%d а®®а®ѕа®¤а®™аЇЌа®•а®іаЇЌ',
                y : 'а®’а®°аЇЃ а®µа®°аЇЃа®џа®®аЇЌ',
                yy : '%d а®†а®ЈаЇЌа®џаЇЃа®•а®іаЇЌ'
            },
            /*        preparse: function (string) {
            return string.replace(/[аЇ§аЇЁаЇ©аЇЄаЇ«аЇ¬аЇ­аЇ®аЇЇаЇ¦]/g, function (match) {
                return numberMap[match];
            });
        },
        postformat: function (string) {
            return string.replace(/\d/g, function (match) {
                return symbolMap[match];
            });
        },*/
            ordinalParse: /\d{1,2}а®µа®¤аЇЃ/,
            ordinal : function (number) {
                return number + 'а®µа®¤аЇЃ';
            },


            // refer http://ta.wikipedia.org/s/1er1
            meridiemParse: /а®Їа®ѕа®®а®®аЇЌ|а®µаЇ€а®•а®±аЇ€|а®•а®ѕа®ІаЇ€|а®Ёа®ЈаЇЌа®Єа®•а®ІаЇЌ|а®Ћа®±аЇЌа®Єа®ѕа®џаЇЃ|а®®а®ѕа®ІаЇ€/,
            meridiem : function (hour, minute, isLower) {
                if (hour < 2) {
                    return ' а®Їа®ѕа®®а®®аЇЌ';
                } else if (hour < 6) {
                    return ' а®µаЇ€а®•а®±аЇ€';  // а®µаЇ€а®•а®±аЇ€
                } else if (hour < 10) {
                    return ' а®•а®ѕа®ІаЇ€'; // а®•а®ѕа®ІаЇ€
                } else if (hour < 14) {
                    return ' а®Ёа®ЈаЇЌа®Єа®•а®ІаЇЌ'; // а®Ёа®ЈаЇЌа®Єа®•а®ІаЇЌ
                } else if (hour < 18) {
                    return ' а®Ћа®±аЇЌа®Єа®ѕа®џаЇЃ'; // а®Ћа®±аЇЌа®Єа®ѕа®џаЇЃ
                } else if (hour < 22) {
                    return ' а®®а®ѕа®ІаЇ€'; // а®®а®ѕа®ІаЇ€
                } else {
                    return ' а®Їа®ѕа®®а®®аЇЌ';
                }
            },
            meridiemHour : function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'а®Їа®ѕа®®а®®аЇЌ') {
                    return hour < 2 ? hour : hour + 12;
                } else if (meridiem === 'а®µаЇ€а®•а®±аЇ€' || meridiem === 'а®•а®ѕа®ІаЇ€') {
                    return hour;
                } else if (meridiem === 'а®Ёа®ЈаЇЌа®Єа®•а®ІаЇЌ') {
                    return hour >= 10 ? hour : hour + 12;
                } else {
                    return hour + 12;
                }
            },
            week : {
                dow : 0, // Sunday is the first day of the week.
                doy : 6  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : thai (th)
// author : Kridsada Thanabulpong : https://github.com/sirn

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('th', {
            months : 'аёЎаёЃаёЈаёІаё„аёЎ_аёЃаёёаёЎаё аёІаёћаё±аё™аёа№Њ_аёЎаёµаё™аёІаё„аёЎ_а№ЂаёЎаё©аёІаёўаё™_аёћаё¤аё©аё аёІаё„аёЎ_аёЎаёґаё–аёёаё™аёІаёўаё™_аёЃаёЈаёЃаёЋаёІаё„аёЎ_аёЄаёґаё‡аё«аёІаё„аёЎ_аёЃаё±аё™аёўаёІаёўаё™_аё•аёёаёҐаёІаё„аёЎ_аёћаё¤аёЁаё€аёґаёЃаёІаёўаё™_аёаё±аё™аё§аёІаё„аёЎ'.split('_'),
            monthsShort : 'аёЎаёЃаёЈаёІ_аёЃаёёаёЎаё аёІ_аёЎаёµаё™аёІ_а№ЂаёЎаё©аёІ_аёћаё¤аё©аё аёІ_аёЎаёґаё–аёёаё™аёІ_аёЃаёЈаёЃаёЋаёІ_аёЄаёґаё‡аё«аёІ_аёЃаё±аё™аёўаёІ_аё•аёёаёҐаёІ_аёћаё¤аёЁаё€аёґаёЃаёІ_аёаё±аё™аё§аёІ'.split('_'),
            weekdays : 'аё­аёІаё—аёґаё•аёўа№Њ_аё€аё±аё™аё—аёЈа№Њ_аё­аё±аё‡аё„аёІаёЈ_аёћаёёаё_аёћаё¤аё«аё±аёЄаёљаё”аёµ_аёЁаёёаёЃаёЈа№Њ_а№ЂаёЄаёІаёЈа№Њ'.split('_'),
            weekdaysShort : 'аё­аёІаё—аёґаё•аёўа№Њ_аё€аё±аё™аё—аёЈа№Њ_аё­аё±аё‡аё„аёІаёЈ_аёћаёёаё_аёћаё¤аё«аё±аёЄ_аёЁаёёаёЃаёЈа№Њ_а№ЂаёЄаёІаёЈа№Њ'.split('_'), // yes, three characters difference
            weekdaysMin : 'аё­аёІ._аё€._аё­._аёћ._аёћаё¤._аёЁ._аёЄ.'.split('_'),
            longDateFormat : {
                LT : 'H аё™аёІаё¬аёґаёЃаёІ m аё™аёІаё—аёµ',
                LTS : 'LT s аё§аёґаё™аёІаё—аёµ',
                L : 'YYYY/MM/DD',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY а№Ђаё§аёҐаёІ LT',
                LLLL : 'аё§аё±аё™ddddаё—аёµа№€ D MMMM YYYY а№Ђаё§аёҐаёІ LT'
            },
            meridiemParse: /аёЃа№€аё­аё™а№Ђаё—аёµа№€аёўаё‡|аё«аёҐаё±аё‡а№Ђаё—аёµа№€аёўаё‡/,
            isPM: function (input) {
                return input === 'аё«аёҐаё±аё‡а№Ђаё—аёµа№€аёўаё‡';
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 12) {
                    return 'аёЃа№€аё­аё™а№Ђаё—аёµа№€аёўаё‡';
                } else {
                    return 'аё«аёҐаё±аё‡а№Ђаё—аёµа№€аёўаё‡';
                }
            },
            calendar : {
                sameDay : '[аё§аё±аё™аё™аёµа№‰ а№Ђаё§аёҐаёІ] LT',
                nextDay : '[аёћаёЈаёёа№€аё‡аё™аёµа№‰ а№Ђаё§аёҐаёІ] LT',
                nextWeek : 'dddd[аё«аё™а№‰аёІ а№Ђаё§аёҐаёІ] LT',
                lastDay : '[а№ЂаёЎаё·а№€аё­аё§аёІаё™аё™аёµа№‰ а№Ђаё§аёҐаёІ] LT',
                lastWeek : '[аё§аё±аё™]dddd[аё—аёµа№€а№ЃаёҐа№‰аё§ а№Ђаё§аёҐаёІ] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'аё­аёµаёЃ %s',
                past : '%sаё—аёµа№€а№ЃаёҐа№‰аё§',
                s : 'а№„аёЎа№€аёЃаёµа№€аё§аёґаё™аёІаё—аёµ',
                m : '1 аё™аёІаё—аёµ',
                mm : '%d аё™аёІаё—аёµ',
                h : '1 аёЉаё±а№€аё§а№‚аёЎаё‡',
                hh : '%d аёЉаё±а№€аё§а№‚аёЎаё‡',
                d : '1 аё§аё±аё™',
                dd : '%d аё§аё±аё™',
                M : '1 а№Ђаё”аё·аё­аё™',
                MM : '%d а№Ђаё”аё·аё­аё™',
                y : '1 аё›аёµ',
                yy : '%d аё›аёµ'
            }
        });
    }));
// moment.js locale configuration
// locale : Tagalog/Filipino (tl-ph)
// author : Dan Hagman

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('tl-ph', {
            months : 'Enero_Pebrero_Marso_Abril_Mayo_Hunyo_Hulyo_Agosto_Setyembre_Oktubre_Nobyembre_Disyembre'.split('_'),
            monthsShort : 'Ene_Peb_Mar_Abr_May_Hun_Hul_Ago_Set_Okt_Nob_Dis'.split('_'),
            weekdays : 'Linggo_Lunes_Martes_Miyerkules_Huwebes_Biyernes_Sabado'.split('_'),
            weekdaysShort : 'Lin_Lun_Mar_Miy_Huw_Biy_Sab'.split('_'),
            weekdaysMin : 'Li_Lu_Ma_Mi_Hu_Bi_Sab'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'MM/D/YYYY',
                LL : 'MMMM D, YYYY',
                LLL : 'MMMM D, YYYY LT',
                LLLL : 'dddd, MMMM DD, YYYY LT'
            },
            calendar : {
                sameDay: '[Ngayon sa] LT',
                nextDay: '[Bukas sa] LT',
                nextWeek: 'dddd [sa] LT',
                lastDay: '[Kahapon sa] LT',
                lastWeek: 'dddd [huling linggo] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'sa loob ng %s',
                past : '%s ang nakalipas',
                s : 'ilang segundo',
                m : 'isang minuto',
                mm : '%d minuto',
                h : 'isang oras',
                hh : '%d oras',
                d : 'isang araw',
                dd : '%d araw',
                M : 'isang buwan',
                MM : '%d buwan',
                y : 'isang taon',
                yy : '%d taon'
            },
            ordinalParse: /\d{1,2}/,
            ordinal : function (number) {
                return number;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : turkish (tr)
// authors : Erhan Gundogan : https://github.com/erhangundogan,
//           Burak YiДџit Kaya: https://github.com/BYK

    (function (factory) {
        factory(moment);
    }(function (moment) {
        var suffixes = {
            1: '\'inci',
            5: '\'inci',
            8: '\'inci',
            70: '\'inci',
            80: '\'inci',

            2: '\'nci',
            7: '\'nci',
            20: '\'nci',
            50: '\'nci',

            3: '\'ГјncГј',
            4: '\'ГјncГј',
            100: '\'ГјncГј',

            6: '\'ncД±',

            9: '\'uncu',
            10: '\'uncu',
            30: '\'uncu',

            60: '\'Д±ncД±',
            90: '\'Д±ncД±'
        };

        return moment.defineLocale('tr', {
            months : 'Ocak_Ећubat_Mart_Nisan_MayД±s_Haziran_Temmuz_AДџustos_EylГјl_Ekim_KasД±m_AralД±k'.split('_'),
            monthsShort : 'Oca_Ећub_Mar_Nis_May_Haz_Tem_AДџu_Eyl_Eki_Kas_Ara'.split('_'),
            weekdays : 'Pazar_Pazartesi_SalД±_Г‡arЕџamba_PerЕџembe_Cuma_Cumartesi'.split('_'),
            weekdaysShort : 'Paz_Pts_Sal_Г‡ar_Per_Cum_Cts'.split('_'),
            weekdaysMin : 'Pz_Pt_Sa_Г‡a_Pe_Cu_Ct'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd, D MMMM YYYY LT'
            },
            calendar : {
                sameDay : '[bugГјn saat] LT',
                nextDay : '[yarД±n saat] LT',
                nextWeek : '[haftaya] dddd [saat] LT',
                lastDay : '[dГјn] LT',
                lastWeek : '[geГ§en hafta] dddd [saat] LT',
                sameElse : 'L'
            },
            relativeTime : {
                future : '%s sonra',
                past : '%s Г¶nce',
                s : 'birkaГ§ saniye',
                m : 'bir dakika',
                mm : '%d dakika',
                h : 'bir saat',
                hh : '%d saat',
                d : 'bir gГјn',
                dd : '%d gГјn',
                M : 'bir ay',
                MM : '%d ay',
                y : 'bir yД±l',
                yy : '%d yД±l'
            },
            ordinalParse: /\d{1,2}'(inci|nci|ГјncГј|ncД±|uncu|Д±ncД±)/,
            ordinal : function (number) {
                if (number === 0) {  // special case for zero
                    return number + '\'Д±ncД±';
                }
                var a = number % 10,
                    b = number % 100 - a,
                    c = number >= 100 ? 100 : null;

                return number + (suffixes[a] || suffixes[b] || suffixes[c]);
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziЙЈt in Latin (tzm-latn)
// author : Abdel Said : https://github.com/abdelsaid

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('tzm-latn', {
            months : 'innayr_brЛ¤ayrЛ¤_marЛ¤sЛ¤_ibrir_mayyw_ywnyw_ywlywz_ЙЈwЕЎt_ЕЎwtanbir_ktЛ¤wbrЛ¤_nwwanbir_dwjnbir'.split('_'),
            monthsShort : 'innayr_brЛ¤ayrЛ¤_marЛ¤sЛ¤_ibrir_mayyw_ywnyw_ywlywz_ЙЈwЕЎt_ЕЎwtanbir_ktЛ¤wbrЛ¤_nwwanbir_dwjnbir'.split('_'),
            weekdays : 'asamas_aynas_asinas_akras_akwas_asimwas_asiбёЌyas'.split('_'),
            weekdaysShort : 'asamas_aynas_asinas_akras_akwas_asimwas_asiбёЌyas'.split('_'),
            weekdaysMin : 'asamas_aynas_asinas_akras_akwas_asimwas_asiбёЌyas'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[asdkh g] LT',
                nextDay: '[aska g] LT',
                nextWeek: 'dddd [g] LT',
                lastDay: '[assant g] LT',
                lastWeek: 'dddd [g] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'dadkh s yan %s',
                past : 'yan %s',
                s : 'imik',
                m : 'minuбёЌ',
                mm : '%d minuбёЌ',
                h : 'saЙ›a',
                hh : '%d tassaЙ›in',
                d : 'ass',
                dd : '%d ossan',
                M : 'ayowr',
                MM : '%d iyyirn',
                y : 'asgas',
                yy : '%d isgasn'
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : Morocco Central Atlas TamaziЙЈt (tzm)
// author : Abdel Said : https://github.com/abdelsaid

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('tzm', {
            months : 'вµ‰вµЏвµЏвґ°вµўвµ”_вґ±вµ•вґ°вµўвµ•_вµЋвґ°вµ•вµљ_вµ‰вґ±вµ”вµ‰вµ”_вµЋвґ°вµўвµўвµ“_вµўвµ“вµЏвµўвµ“_вµўвµ“вµЌвµўвµ“вµЈ_вµ–вµ“вµ›вµњ_вµ›вµ“вµњвґ°вµЏвґ±вµ‰вµ”_вґЅвµџвµ“вґ±вµ•_вµЏвµ“вµЎвґ°вµЏвґ±вµ‰вµ”_вґ·вµ“вµЉвµЏвґ±вµ‰вµ”'.split('_'),
            monthsShort : 'вµ‰вµЏвµЏвґ°вµўвµ”_вґ±вµ•вґ°вµўвµ•_вµЋвґ°вµ•вµљ_вµ‰вґ±вµ”вµ‰вµ”_вµЋвґ°вµўвµўвµ“_вµўвµ“вµЏвµўвµ“_вµўвµ“вµЌвµўвµ“вµЈ_вµ–вµ“вµ›вµњ_вµ›вµ“вµњвґ°вµЏвґ±вµ‰вµ”_вґЅвµџвµ“вґ±вµ•_вµЏвµ“вµЎвґ°вµЏвґ±вµ‰вµ”_вґ·вµ“вµЉвµЏвґ±вµ‰вµ”'.split('_'),
            weekdays : 'вґ°вµ™вґ°вµЋвґ°вµ™_вґ°вµўвµЏвґ°вµ™_вґ°вµ™вµ‰вµЏвґ°вµ™_вґ°вґЅвµ”вґ°вµ™_вґ°вґЅвµЎвґ°вµ™_вґ°вµ™вµ‰вµЋвµЎвґ°вµ™_вґ°вµ™вµ‰вґ№вµўвґ°вµ™'.split('_'),
            weekdaysShort : 'вґ°вµ™вґ°вµЋвґ°вµ™_вґ°вµўвµЏвґ°вµ™_вґ°вµ™вµ‰вµЏвґ°вµ™_вґ°вґЅвµ”вґ°вµ™_вґ°вґЅвµЎвґ°вµ™_вґ°вµ™вµ‰вµЋвµЎвґ°вµ™_вґ°вµ™вµ‰вґ№вµўвґ°вµ™'.split('_'),
            weekdaysMin : 'вґ°вµ™вґ°вµЋвґ°вµ™_вґ°вµўвµЏвґ°вµ™_вґ°вµ™вµ‰вµЏвґ°вµ™_вґ°вґЅвµ”вґ°вµ™_вґ°вґЅвµЎвґ°вµ™_вґ°вµ™вµ‰вµЋвµЎвґ°вµ™_вґ°вµ™вµ‰вґ№вµўвґ°вµ™'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS: 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'dddd D MMMM YYYY LT'
            },
            calendar : {
                sameDay: '[вґ°вµ™вґ·вµ… вґґ] LT',
                nextDay: '[вґ°вµ™вґЅвґ° вґґ] LT',
                nextWeek: 'dddd [вґґ] LT',
                lastDay: '[вґ°вµљвґ°вµЏвµњ вґґ] LT',
                lastWeek: 'dddd [вґґ] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : 'вґ·вґ°вґ·вµ… вµ™ вµўвґ°вµЏ %s',
                past : 'вµўвґ°вµЏ %s',
                s : 'вµ‰вµЋвµ‰вґЅ',
                m : 'вµЋвµ‰вµЏвµ“вґє',
                mm : '%d вµЋвµ‰вµЏвµ“вґє',
                h : 'вµ™вґ°вµ„вґ°',
                hh : '%d вµњвґ°вµ™вµ™вґ°вµ„вµ‰вµЏ',
                d : 'вґ°вµ™вµ™',
                dd : '%d oвµ™вµ™вґ°вµЏ',
                M : 'вґ°вµўoвµ“вµ”',
                MM : '%d вµ‰вµўвµўвµ‰вµ”вµЏ',
                y : 'вґ°вµ™вґівґ°вµ™',
                yy : '%d вµ‰вµ™вґівґ°вµ™вµЏ'
            },
            week : {
                dow : 6, // Saturday is the first day of the week.
                doy : 12  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : ukrainian (uk)
// author : zemlanin : https://github.com/zemlanin
// Author : Menelion ElensГєle : https://github.com/Oire

    (function (factory) {
        factory(moment);
    }(function (moment) {
        function plural(word, num) {
            var forms = word.split('_');
            return num % 10 === 1 && num % 100 !== 11 ? forms[0] : (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20) ? forms[1] : forms[2]);
        }

        function relativeTimeWithPlural(number, withoutSuffix, key) {
            var format = {
                'mm': 'С…РІРёР»РёРЅР°_С…РІРёР»РёРЅРё_С…РІРёР»РёРЅ',
                'hh': 'РіРѕРґРёРЅР°_РіРѕРґРёРЅРё_РіРѕРґРёРЅ',
                'dd': 'РґРµРЅСЊ_РґРЅС–_РґРЅС–РІ',
                'MM': 'РјС–СЃСЏС†СЊ_РјС–СЃСЏС†С–_РјС–СЃСЏС†С–РІ',
                'yy': 'СЂС–Рє_СЂРѕРєРё_СЂРѕРєС–РІ'
            };
            if (key === 'm') {
                return withoutSuffix ? 'С…РІРёР»РёРЅР°' : 'С…РІРёР»РёРЅСѓ';
            }
            else if (key === 'h') {
                return withoutSuffix ? 'РіРѕРґРёРЅР°' : 'РіРѕРґРёРЅСѓ';
            }
            else {
                return number + ' ' + plural(format[key], +number);
            }
        }

        function monthsCaseReplace(m, format) {
            var months = {
                    'nominative': 'СЃС–С‡РµРЅСЊ_Р»СЋС‚РёР№_Р±РµСЂРµР·РµРЅСЊ_РєРІС–С‚РµРЅСЊ_С‚СЂР°РІРµРЅСЊ_С‡РµСЂРІРµРЅСЊ_Р»РёРїРµРЅСЊ_СЃРµСЂРїРµРЅСЊ_РІРµСЂРµСЃРµРЅСЊ_Р¶РѕРІС‚РµРЅСЊ_Р»РёСЃС‚РѕРїР°Рґ_РіСЂСѓРґРµРЅСЊ'.split('_'),
                    'accusative': 'СЃС–С‡РЅСЏ_Р»СЋС‚РѕРіРѕ_Р±РµСЂРµР·РЅСЏ_РєРІС–С‚РЅСЏ_С‚СЂР°РІРЅСЏ_С‡РµСЂРІРЅСЏ_Р»РёРїРЅСЏ_СЃРµСЂРїРЅСЏ_РІРµСЂРµСЃРЅСЏ_Р¶РѕРІС‚РЅСЏ_Р»РёСЃС‚РѕРїР°РґР°_РіСЂСѓРґРЅСЏ'.split('_')
                },

                nounCase = (/D[oD]? *MMMM?/).test(format) ?
                    'accusative' :
                    'nominative';

            return months[nounCase][m.month()];
        }

        function weekdaysCaseReplace(m, format) {
            var weekdays = {
                    'nominative': 'РЅРµРґС–Р»СЏ_РїРѕРЅРµРґС–Р»РѕРє_РІС–РІС‚РѕСЂРѕРє_СЃРµСЂРµРґР°_С‡РµС‚РІРµСЂ_РївЂ™СЏС‚РЅРёС†СЏ_СЃСѓР±РѕС‚Р°'.split('_'),
                    'accusative': 'РЅРµРґС–Р»СЋ_РїРѕРЅРµРґС–Р»РѕРє_РІС–РІС‚РѕСЂРѕРє_СЃРµСЂРµРґСѓ_С‡РµС‚РІРµСЂ_РївЂ™СЏС‚РЅРёС†СЋ_СЃСѓР±РѕС‚Сѓ'.split('_'),
                    'genitive': 'РЅРµРґС–Р»С–_РїРѕРЅРµРґС–Р»РєР°_РІС–РІС‚РѕСЂРєР°_СЃРµСЂРµРґРё_С‡РµС‚РІРµСЂРіР°_РївЂ™СЏС‚РЅРёС†С–_СЃСѓР±РѕС‚Рё'.split('_')
                },

                nounCase = (/(\[[Р’РІРЈСѓ]\]) ?dddd/).test(format) ?
                    'accusative' :
                    ((/\[?(?:РјРёРЅСѓР»РѕС—|РЅР°СЃС‚СѓРїРЅРѕС—)? ?\] ?dddd/).test(format) ?
                        'genitive' :
                        'nominative');

            return weekdays[nounCase][m.day()];
        }

        function processHoursFunction(str) {
            return function () {
                return str + 'Рѕ' + (this.hours() === 11 ? 'Р±' : '') + '] LT';
            };
        }

        return moment.defineLocale('uk', {
            months : monthsCaseReplace,
            monthsShort : 'СЃС–С‡_Р»СЋС‚_Р±РµСЂ_РєРІС–С‚_С‚СЂР°РІ_С‡РµСЂРІ_Р»РёРї_СЃРµСЂРї_РІРµСЂ_Р¶РѕРІС‚_Р»РёСЃС‚_РіСЂСѓРґ'.split('_'),
            weekdays : weekdaysCaseReplace,
            weekdaysShort : 'РЅРґ_РїРЅ_РІС‚_СЃСЂ_С‡С‚_РїС‚_СЃР±'.split('_'),
            weekdaysMin : 'РЅРґ_РїРЅ_РІС‚_СЃСЂ_С‡С‚_РїС‚_СЃР±'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD.MM.YYYY',
                LL : 'D MMMM YYYY СЂ.',
                LLL : 'D MMMM YYYY СЂ., LT',
                LLLL : 'dddd, D MMMM YYYY СЂ., LT'
            },
            calendar : {
                sameDay: processHoursFunction('[РЎСЊРѕРіРѕРґРЅС– '),
                nextDay: processHoursFunction('[Р—Р°РІС‚СЂР° '),
                lastDay: processHoursFunction('[Р’С‡РѕСЂР° '),
                nextWeek: processHoursFunction('[РЈ] dddd ['),
                lastWeek: function () {
                    switch (this.day()) {
                        case 0:
                        case 3:
                        case 5:
                        case 6:
                            return processHoursFunction('[РњРёРЅСѓР»РѕС—] dddd [').call(this);
                        case 1:
                        case 2:
                        case 4:
                            return processHoursFunction('[РњРёРЅСѓР»РѕРіРѕ] dddd [').call(this);
                    }
                },
                sameElse: 'L'
            },
            relativeTime : {
                future : 'Р·Р° %s',
                past : '%s С‚РѕРјСѓ',
                s : 'РґРµРєС–Р»СЊРєР° СЃРµРєСѓРЅРґ',
                m : relativeTimeWithPlural,
                mm : relativeTimeWithPlural,
                h : 'РіРѕРґРёРЅСѓ',
                hh : relativeTimeWithPlural,
                d : 'РґРµРЅСЊ',
                dd : relativeTimeWithPlural,
                M : 'РјС–СЃСЏС†СЊ',
                MM : relativeTimeWithPlural,
                y : 'СЂС–Рє',
                yy : relativeTimeWithPlural
            },

            // M. E.: those two are virtually unused but a user might want to implement them for his/her website for some reason

            meridiemParse: /РЅРѕС‡С–|СЂР°РЅРєСѓ|РґРЅСЏ|РІРµС‡РѕСЂР°/,
            isPM: function (input) {
                return /^(РґРЅСЏ|РІРµС‡РѕСЂР°)$/.test(input);
            },
            meridiem : function (hour, minute, isLower) {
                if (hour < 4) {
                    return 'РЅРѕС‡С–';
                } else if (hour < 12) {
                    return 'СЂР°РЅРєСѓ';
                } else if (hour < 17) {
                    return 'РґРЅСЏ';
                } else {
                    return 'РІРµС‡РѕСЂР°';
                }
            },

            ordinalParse: /\d{1,2}-(Р№|РіРѕ)/,
            ordinal: function (number, period) {
                switch (period) {
                    case 'M':
                    case 'd':
                    case 'DDD':
                    case 'w':
                    case 'W':
                        return number + '-Р№';
                    case 'D':
                        return number + '-РіРѕ';
                    default:
                        return number;
                }
            },

            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 1st is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : uzbek (uz)
// author : Sardor Muminov : https://github.com/muminoff

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('uz', {
            months : 'СЏРЅРІР°СЂСЊ_С„РµРІСЂР°Р»СЊ_РјР°СЂС‚_Р°РїСЂРµР»СЊ_РјР°Р№_РёСЋРЅСЊ_РёСЋР»СЊ_Р°РІРіСѓСЃС‚_СЃРµРЅС‚СЏР±СЂСЊ_РѕРєС‚СЏР±СЂСЊ_РЅРѕСЏР±СЂСЊ_РґРµРєР°Р±СЂСЊ'.split('_'),
            monthsShort : 'СЏРЅРІ_С„РµРІ_РјР°СЂ_Р°РїСЂ_РјР°Р№_РёСЋРЅ_РёСЋР»_Р°РІРі_СЃРµРЅ_РѕРєС‚_РЅРѕСЏ_РґРµРє'.split('_'),
            weekdays : 'РЇРєС€Р°РЅР±Р°_Р”СѓС€Р°РЅР±Р°_РЎРµС€Р°РЅР±Р°_Р§РѕСЂС€Р°РЅР±Р°_РџР°Р№С€Р°РЅР±Р°_Р–СѓРјР°_РЁР°РЅР±Р°'.split('_'),
            weekdaysShort : 'РЇРєС€_Р”СѓС€_РЎРµС€_Р§РѕСЂ_РџР°Р№_Р–СѓРј_РЁР°РЅ'.split('_'),
            weekdaysMin : 'РЇРє_Р”Сѓ_РЎРµ_Р§Рѕ_РџР°_Р–Сѓ_РЁР°'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM YYYY',
                LLL : 'D MMMM YYYY LT',
                LLLL : 'D MMMM YYYY, dddd LT'
            },
            calendar : {
                sameDay : '[Р‘СѓРіСѓРЅ СЃРѕР°С‚] LT [РґР°]',
                nextDay : '[Р­СЂС‚Р°РіР°] LT [РґР°]',
                nextWeek : 'dddd [РєСѓРЅРё СЃРѕР°С‚] LT [РґР°]',
                lastDay : '[РљРµС‡Р° СЃРѕР°С‚] LT [РґР°]',
                lastWeek : '[РЈС‚РіР°РЅ] dddd [РєСѓРЅРё СЃРѕР°С‚] LT [РґР°]',
                sameElse : 'L'
            },
            relativeTime : {
                future : 'РЇРєРёРЅ %s РёС‡РёРґР°',
                past : 'Р‘РёСЂ РЅРµС‡Р° %s РѕР»РґРёРЅ',
                s : 'С„СѓСЂСЃР°С‚',
                m : 'Р±РёСЂ РґР°РєРёРєР°',
                mm : '%d РґР°РєРёРєР°',
                h : 'Р±РёСЂ СЃРѕР°С‚',
                hh : '%d СЃРѕР°С‚',
                d : 'Р±РёСЂ РєСѓРЅ',
                dd : '%d РєСѓРЅ',
                M : 'Р±РёСЂ РѕР№',
                MM : '%d РѕР№',
                y : 'Р±РёСЂ Р№РёР»',
                yy : '%d Р№РёР»'
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 7  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : vietnamese (vi)
// author : Bang Nguyen : https://github.com/bangnk

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('vi', {
            months : 'thГЎng 1_thГЎng 2_thГЎng 3_thГЎng 4_thГЎng 5_thГЎng 6_thГЎng 7_thГЎng 8_thГЎng 9_thГЎng 10_thГЎng 11_thГЎng 12'.split('_'),
            monthsShort : 'Th01_Th02_Th03_Th04_Th05_Th06_Th07_Th08_Th09_Th10_Th11_Th12'.split('_'),
            weekdays : 'chб»§ nhбє­t_thб»© hai_thб»© ba_thб»© tЖ°_thб»© nДѓm_thб»© sГЎu_thб»© bбєЈy'.split('_'),
            weekdaysShort : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
            weekdaysMin : 'CN_T2_T3_T4_T5_T6_T7'.split('_'),
            longDateFormat : {
                LT : 'HH:mm',
                LTS : 'LT:ss',
                L : 'DD/MM/YYYY',
                LL : 'D MMMM [nДѓm] YYYY',
                LLL : 'D MMMM [nДѓm] YYYY LT',
                LLLL : 'dddd, D MMMM [nДѓm] YYYY LT',
                l : 'DD/M/YYYY',
                ll : 'D MMM YYYY',
                lll : 'D MMM YYYY LT',
                llll : 'ddd, D MMM YYYY LT'
            },
            calendar : {
                sameDay: '[HГґm nay lГєc] LT',
                nextDay: '[NgГ y mai lГєc] LT',
                nextWeek: 'dddd [tuбє§n tб»›i lГєc] LT',
                lastDay: '[HГґm qua lГєc] LT',
                lastWeek: 'dddd [tuбє§n rб»“i lГєc] LT',
                sameElse: 'L'
            },
            relativeTime : {
                future : '%s tб»›i',
                past : '%s trЖ°б»›c',
                s : 'vГ i giГўy',
                m : 'mб»™t phГєt',
                mm : '%d phГєt',
                h : 'mб»™t giб»ќ',
                hh : '%d giб»ќ',
                d : 'mб»™t ngГ y',
                dd : '%d ngГ y',
                M : 'mб»™t thГЎng',
                MM : '%d thГЎng',
                y : 'mб»™t nДѓm',
                yy : '%d nДѓm'
            },
            ordinalParse: /\d{1,2}/,
            ordinal : function (number) {
                return number;
            },
            week : {
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : chinese (zh-cn)
// author : suupic : https://github.com/suupic
// author : Zeno Zeng : https://github.com/zenozeng

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('zh-cn', {
            months : 'дёЂжњ€_дєЊжњ€_дё‰жњ€_е››жњ€_дє”жњ€_е…­жњ€_дёѓжњ€_е…«жњ€_д№ќжњ€_еЌЃжњ€_еЌЃдёЂжњ€_еЌЃдєЊжњ€'.split('_'),
            monthsShort : '1жњ€_2жњ€_3жњ€_4жњ€_5жњ€_6жњ€_7жњ€_8жњ€_9жњ€_10жњ€_11жњ€_12жњ€'.split('_'),
            weekdays : 'жџжњџж—Ґ_жџжњџдёЂ_жџжњџдєЊ_жџжњџдё‰_жџжњџе››_жџжњџдє”_жџжњџе…­'.split('_'),
            weekdaysShort : 'е‘Ёж—Ґ_е‘ЁдёЂ_е‘ЁдєЊ_е‘Ёдё‰_е‘Ёе››_е‘Ёдє”_е‘Ёе…­'.split('_'),
            weekdaysMin : 'ж—Ґ_дёЂ_дєЊ_дё‰_е››_дє”_е…­'.split('_'),
            longDateFormat : {
                LT : 'Ahз‚№mm',
                LTS : 'Ahз‚№mе€†sз§’',
                L : 'YYYY-MM-DD',
                LL : 'YYYYе№ґMMMDж—Ґ',
                LLL : 'YYYYе№ґMMMDж—ҐLT',
                LLLL : 'YYYYе№ґMMMDж—ҐddddLT',
                l : 'YYYY-MM-DD',
                ll : 'YYYYе№ґMMMDж—Ґ',
                lll : 'YYYYе№ґMMMDж—ҐLT',
                llll : 'YYYYе№ґMMMDж—ҐddddLT'
            },
            meridiemParse: /е‡Њж™Ё|ж—©дёЉ|дёЉеЌ€|дё­еЌ€|дё‹еЌ€|ж™љдёЉ/,
            meridiemHour: function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'е‡Њж™Ё' || meridiem === 'ж—©дёЉ' ||
                    meridiem === 'дёЉеЌ€') {
                    return hour;
                } else if (meridiem === 'дё‹еЌ€' || meridiem === 'ж™љдёЉ') {
                    return hour + 12;
                } else {
                    // 'дё­еЌ€'
                    return hour >= 11 ? hour : hour + 12;
                }
            },
            meridiem : function (hour, minute, isLower) {
                var hm = hour * 100 + minute;
                if (hm < 600) {
                    return 'е‡Њж™Ё';
                } else if (hm < 900) {
                    return 'ж—©дёЉ';
                } else if (hm < 1130) {
                    return 'дёЉеЌ€';
                } else if (hm < 1230) {
                    return 'дё­еЌ€';
                } else if (hm < 1800) {
                    return 'дё‹еЌ€';
                } else {
                    return 'ж™љдёЉ';
                }
            },
            calendar : {
                sameDay : function () {
                    return this.minutes() === 0 ? '[д»Ље¤©]Ah[з‚№ж•ґ]' : '[д»Ље¤©]LT';
                },
                nextDay : function () {
                    return this.minutes() === 0 ? '[жЋе¤©]Ah[з‚№ж•ґ]' : '[жЋе¤©]LT';
                },
                lastDay : function () {
                    return this.minutes() === 0 ? '[жЁе¤©]Ah[з‚№ж•ґ]' : '[жЁе¤©]LT';
                },
                nextWeek : function () {
                    var startOfWeek, prefix;
                    startOfWeek = moment().startOf('week');
                    prefix = this.unix() - startOfWeek.unix() >= 7 * 24 * 3600 ? '[дё‹]' : '[жњ¬]';
                    return this.minutes() === 0 ? prefix + 'dddAhз‚№ж•ґ' : prefix + 'dddAhз‚№mm';
                },
                lastWeek : function () {
                    var startOfWeek, prefix;
                    startOfWeek = moment().startOf('week');
                    prefix = this.unix() < startOfWeek.unix()  ? '[дёЉ]' : '[жњ¬]';
                    return this.minutes() === 0 ? prefix + 'dddAhз‚№ж•ґ' : prefix + 'dddAhз‚№mm';
                },
                sameElse : 'LL'
            },
            ordinalParse: /\d{1,2}(ж—Ґ|жњ€|е‘Ё)/,
            ordinal : function (number, period) {
                switch (period) {
                    case 'd':
                    case 'D':
                    case 'DDD':
                        return number + 'ж—Ґ';
                    case 'M':
                        return number + 'жњ€';
                    case 'w':
                    case 'W':
                        return number + 'е‘Ё';
                    default:
                        return number;
                }
            },
            relativeTime : {
                future : '%sе†…',
                past : '%sе‰Ќ',
                s : 'е‡ з§’',
                m : '1е€†й’џ',
                mm : '%dе€†й’џ',
                h : '1е°Џж—¶',
                hh : '%dе°Џж—¶',
                d : '1е¤©',
                dd : '%dе¤©',
                M : '1дёЄжњ€',
                MM : '%dдёЄжњ€',
                y : '1е№ґ',
                yy : '%dе№ґ'
            },
            week : {
                // GB/T 7408-1994гЂЉж•°жЌ®е…ѓе’Њдє¤жЌўж јејЏВ·дїЎжЃЇдє¤жЌўВ·ж—Ґжњџе’Њж—¶й—ґиЎЁз¤єжі•гЂ‹дёЋISO 8601:1988з­‰ж•€
                dow : 1, // Monday is the first day of the week.
                doy : 4  // The week that contains Jan 4th is the first week of the year.
            }
        });
    }));
// moment.js locale configuration
// locale : traditional chinese (zh-tw)
// author : Ben : https://github.com/ben-lin

    (function (factory) {
        factory(moment);
    }(function (moment) {
        return moment.defineLocale('zh-tw', {
            months : 'дёЂжњ€_дєЊжњ€_дё‰жњ€_е››жњ€_дє”жњ€_е…­жњ€_дёѓжњ€_е…«жњ€_д№ќжњ€_еЌЃжњ€_еЌЃдёЂжњ€_еЌЃдєЊжњ€'.split('_'),
            monthsShort : '1жњ€_2жњ€_3жњ€_4жњ€_5жњ€_6жњ€_7жњ€_8жњ€_9жњ€_10жњ€_11жњ€_12жњ€'.split('_'),
            weekdays : 'жџжњџж—Ґ_жџжњџдёЂ_жџжњџдєЊ_жџжњџдё‰_жџжњџе››_жџжњџдє”_жџжњџе…­'.split('_'),
            weekdaysShort : 'йЂ±ж—Ґ_йЂ±дёЂ_йЂ±дєЊ_йЂ±дё‰_йЂ±е››_йЂ±дє”_йЂ±е…­'.split('_'),
            weekdaysMin : 'ж—Ґ_дёЂ_дєЊ_дё‰_е››_дє”_е…­'.split('_'),
            longDateFormat : {
                LT : 'Ahй»ћmm',
                LTS : 'Ahй»ћmе€†sз§’',
                L : 'YYYYе№ґMMMDж—Ґ',
                LL : 'YYYYе№ґMMMDж—Ґ',
                LLL : 'YYYYе№ґMMMDж—ҐLT',
                LLLL : 'YYYYе№ґMMMDж—ҐddddLT',
                l : 'YYYYе№ґMMMDж—Ґ',
                ll : 'YYYYе№ґMMMDж—Ґ',
                lll : 'YYYYе№ґMMMDж—ҐLT',
                llll : 'YYYYе№ґMMMDж—ҐddddLT'
            },
            meridiemParse: /ж—©дёЉ|дёЉеЌ€|дё­еЌ€|дё‹еЌ€|ж™љдёЉ/,
            meridiemHour : function (hour, meridiem) {
                if (hour === 12) {
                    hour = 0;
                }
                if (meridiem === 'ж—©дёЉ' || meridiem === 'дёЉеЌ€') {
                    return hour;
                } else if (meridiem === 'дё­еЌ€') {
                    return hour >= 11 ? hour : hour + 12;
                } else if (meridiem === 'дё‹еЌ€' || meridiem === 'ж™љдёЉ') {
                    return hour + 12;
                }
            },
            meridiem : function (hour, minute, isLower) {
                var hm = hour * 100 + minute;
                if (hm < 900) {
                    return 'ж—©дёЉ';
                } else if (hm < 1130) {
                    return 'дёЉеЌ€';
                } else if (hm < 1230) {
                    return 'дё­еЌ€';
                } else if (hm < 1800) {
                    return 'дё‹еЌ€';
                } else {
                    return 'ж™љдёЉ';
                }
            },
            calendar : {
                sameDay : '[д»Ље¤©]LT',
                nextDay : '[жЋе¤©]LT',
                nextWeek : '[дё‹]ddddLT',
                lastDay : '[жЁе¤©]LT',
                lastWeek : '[дёЉ]ddddLT',
                sameElse : 'L'
            },
            ordinalParse: /\d{1,2}(ж—Ґ|жњ€|йЂ±)/,
            ordinal : function (number, period) {
                switch (period) {
                    case 'd' :
                    case 'D' :
                    case 'DDD' :
                        return number + 'ж—Ґ';
                    case 'M' :
                        return number + 'жњ€';
                    case 'w' :
                    case 'W' :
                        return number + 'йЂ±';
                    default :
                        return number;
                }
            },
            relativeTime : {
                future : '%sе…§',
                past : '%sе‰Ќ',
                s : 'е№ѕз§’',
                m : 'дёЂе€†йђ',
                mm : '%dе€†йђ',
                h : 'дёЂе°Џж™‚',
                hh : '%dе°Џж™‚',
                d : 'дёЂе¤©',
                dd : '%dе¤©',
                M : 'дёЂеЂ‹жњ€',
                MM : '%dеЂ‹жњ€',
                y : 'дёЂе№ґ',
                yy : '%dе№ґ'
            }
        });
    }));

    moment.locale('en');


    /************************************
     Exposing Moment
     ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                'Accessing Moment through the global scope is ' +
                'deprecated, and will be removed in an upcoming ' +
                'release.',
                moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define(function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);
