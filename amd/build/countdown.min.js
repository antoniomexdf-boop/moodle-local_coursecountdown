// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Course countdown AMD module.
 *
 * @module      local_coursecountdown/countdown
 * @copyright   2026 Antonio Jimenez <antoniomexdf@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    var DEFAULT_YELLOW_THRESHOLD = 30 * 60;
    var DEFAULT_RED_THRESHOLD = 5 * 60;

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function normalizeInt(value, fallback) {
        var parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return fallback;
        }
        return Math.floor(parsed);
    }

    function normalizeColor(value, fallback) {
        if (typeof value !== 'string') {
            return fallback;
        }
        var trimmed = value.trim();
        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
            return trimmed;
        }
        return fallback;
    }

    function safeString(value, fallback) {
        if (typeof value === 'string') {
            return value;
        }
        return fallback;
    }

    function formatDate(unixSeconds) {
        if (!unixSeconds || unixSeconds <= 0) {
            return '';
        }

        var d = new Date(unixSeconds * 1000);
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function formatDuration(totalSeconds, strings) {
        if (totalSeconds < 0) {
            totalSeconds = 0;
        }

        var days = Math.floor(totalSeconds / 86400);
        var hours = Math.floor((totalSeconds % 86400) / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        var dayLabel = days === 1 ? strings.day : strings.days;
        var hourLabel = hours === 1 ? strings.hour : strings.hours;
        var minuteLabel = minutes === 1 ? strings.minute : strings.minutes;
        var secondLabel = seconds === 1 ? strings.second : strings.seconds;

        return days + ' ' + dayLabel + ': ' +
            pad(hours) + ' ' + hourLabel + ': ' +
            pad(minutes) + ' ' + minuteLabel + ': ' +
            pad(seconds) + ' ' + secondLabel;
    }

    function applyState(el, secondsLeft, thresholds) {
        el.classList.remove('is-green', 'is-yellow', 'is-red', 'is-blink');

        if (secondsLeft <= thresholds.red) {
            el.classList.add('is-red', 'is-blink');
            return;
        }

        if (secondsLeft <= thresholds.yellow) {
            el.classList.add('is-yellow');
            return;
        }

        el.classList.add('is-green');
    }

    function getOrCreateContainer() {
        var container = document.getElementById('local-coursecountdown');
        if (container) {
            return container;
        }

        container = document.createElement('div');
        container.id = 'local-coursecountdown';
        container.className = 'local-coursecountdown alert alert-dismissible';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        document.body.insertBefore(container, document.body.firstChild);
        return container;
    }

    function moveToCourseContent(container) {
        var selectors = [
            '#region-main',
            '#page-content .container-fluid',
            '#page-content',
            '.course-content'
        ];

        for (var i = 0; i < selectors.length; i++) {
            var target = document.querySelector(selectors[i]);
            if (target) {
                target.insertBefore(container, target.firstChild);
                return;
            }
        }
    }

    function applyCustomColors(container, colors) {
        var defaults = {
            green: {text: '#0c6522', background: '#eaf9ed', border: '#bee5c6'},
            yellow: {text: '#725400', background: '#fff5d6', border: '#ffe086'},
            red: {text: '#8b0000', background: '#ffe3e3', border: '#ffaaaa'}
        };

        var green = colors.green || {};
        var yellow = colors.yellow || {};
        var red = colors.red || {};

        container.style.setProperty('--lcc-green-text', normalizeColor(green.text, defaults.green.text));
        container.style.setProperty('--lcc-green-bg', normalizeColor(green.background, defaults.green.background));
        container.style.setProperty('--lcc-green-border', normalizeColor(green.border, defaults.green.border));

        container.style.setProperty('--lcc-yellow-text', normalizeColor(yellow.text, defaults.yellow.text));
        container.style.setProperty('--lcc-yellow-bg', normalizeColor(yellow.background, defaults.yellow.background));
        container.style.setProperty('--lcc-yellow-border', normalizeColor(yellow.border, defaults.yellow.border));

        container.style.setProperty('--lcc-red-text', normalizeColor(red.text, defaults.red.text));
        container.style.setProperty('--lcc-red-bg', normalizeColor(red.background, defaults.red.background));
        container.style.setProperty('--lcc-red-border', normalizeColor(red.border, defaults.red.border));
    }

    function getDatesText(start, end, strings, showDates, dates) {
        if (!showDates) {
            return '';
        }

        var startFormatted = start > 0 ? safeString(dates.startformatted, '') : '';
        var endFormatted = end > 0 ? safeString(dates.endformatted, '') : '';

        if (!startFormatted && start > 0) {
            startFormatted = formatDate(start);
        }

        if (!endFormatted && end > 0) {
            endFormatted = formatDate(end);
        }

        return strings.startlabel + ': ' + (start > 0 ? startFormatted : strings.nostart) + ' | ' +
            strings.endlabel + ': ' + (end > 0 ? endFormatted : strings.noend);
    }

    function renderContent(container, mainText, datesText, showClose, strings) {
        container.textContent = '';

        var content = document.createElement('div');
        content.className = 'local-coursecountdown__content';

        var remaining = document.createElement('div');
        remaining.className = 'local-coursecountdown__remaining';
        remaining.textContent = mainText;
        content.appendChild(remaining);

        if (datesText) {
            var dates = document.createElement('div');
            dates.className = 'local-coursecountdown__dates';
            dates.textContent = datesText;
            content.appendChild(dates);
        }

        container.appendChild(content);

        if (showClose) {
            var closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'local-coursecountdown__close';
            closeButton.setAttribute('aria-label', strings.closebuttonaria);
            closeButton.title = strings.closebutton;

            var closeIcon = document.createElement('span');
            closeIcon.setAttribute('aria-hidden', 'true');
            closeIcon.textContent = '\u00D7';

            closeButton.appendChild(closeIcon);
            container.appendChild(closeButton);
        }
    }

    function init(config) {
        var container = getOrCreateContainer();
        if (container.dataset.initialized === '1') {
            return;
        }
        container.dataset.initialized = '1';

        moveToCourseContent(container);

        var start = Number(config.start || 0);
        var end = Number(config.end || 0);
        var strings = config.strings || {};
        var dates = config.dates || {};
        var settings = config.settings || {};
        var intervalId = 0;
        var closedByUser = false;

        strings.startlabel = safeString(strings.startlabel, 'Opens');
        strings.endlabel = safeString(strings.endlabel, 'Closes');
        strings.opensin = safeString(strings.opensin, 'Opens in');
        strings.closesin = safeString(strings.closesin, 'Closes in');
        strings.closed = safeString(strings.closed, 'Course closed');
        strings.open = safeString(strings.open, 'Course open');
        strings.nodates = safeString(strings.nodates, 'No configured dates');
        strings.nostart = safeString(strings.nostart, 'No date');
        strings.noend = safeString(strings.noend, 'No date');
        strings.closebutton = safeString(strings.closebutton, 'Close');
        strings.closebuttonaria = safeString(strings.closebuttonaria, 'Close countdown bar');
        strings.day = safeString(strings.day, 'day');
        strings.days = safeString(strings.days, 'days');
        strings.hour = safeString(strings.hour, 'hour');
        strings.hours = safeString(strings.hours, 'hours');
        strings.minute = safeString(strings.minute, 'minute');
        strings.minutes = safeString(strings.minutes, 'minutes');
        strings.second = safeString(strings.second, 'second');
        strings.seconds = safeString(strings.seconds, 'seconds');

        var showDates = normalizeInt(settings.showdates, 1) === 1;
        var showClose = normalizeInt(settings.showclose, 1) === 1;
        var yellowThreshold = normalizeInt(settings.yellowminutes, DEFAULT_YELLOW_THRESHOLD / 60) * 60;
        var redThreshold = normalizeInt(settings.redminutes, DEFAULT_RED_THRESHOLD / 60) * 60;
        var thresholds = {
            yellow: yellowThreshold > 0 ? yellowThreshold : DEFAULT_YELLOW_THRESHOLD,
            red: redThreshold > 0 ? redThreshold : DEFAULT_RED_THRESHOLD
        };

        if (thresholds.red > thresholds.yellow) {
            thresholds.red = thresholds.yellow;
        }

        applyCustomColors(container, settings.colors || {});

        container.addEventListener('click', function(e) {
            var target = e.target;
            if (!showClose || !target) {
                return;
            }

            if (target.classList.contains('local-coursecountdown__close') ||
                (target.parentElement && target.parentElement.classList.contains('local-coursecountdown__close'))) {
                closedByUser = true;
                container.style.display = 'none';
                if (intervalId) {
                    window.clearInterval(intervalId);
                }
            }
        });

        function render() {
            if (closedByUser) {
                return;
            }

            var now = Math.floor(Date.now() / 1000);
            var target = 0;
            var label = '';
            var datesText = getDatesText(start, end, strings, showDates, dates);

            if (start <= 0 && end <= 0) {
                container.classList.remove('is-green', 'is-yellow', 'is-red', 'is-blink');
                container.classList.add('is-green');
                renderContent(container, strings.nodates, datesText, showClose, strings);
                return;
            }

            if (start > 0 && now < start) {
                target = start;
                label = strings.opensin;
            } else if (end > 0 && now < end) {
                target = end;
                label = strings.closesin;
            } else if (end > 0 && now >= end) {
                container.classList.remove('is-green', 'is-yellow', 'is-red', 'is-blink');
                container.classList.add('is-red');
                renderContent(container, strings.closed, datesText, showClose, strings);
                return;
            } else if (start > 0 && end <= 0 && now >= start) {
                container.classList.remove('is-green', 'is-yellow', 'is-red', 'is-blink');
                container.classList.add('is-green');
                renderContent(container, strings.open, datesText, showClose, strings);
                return;
            } else {
                target = start > 0 ? start : end;
                label = end > 0 ? strings.closesin : strings.opensin;
            }

            var secondsLeft = Math.max(0, target - now);
            applyState(container, secondsLeft, thresholds);
            renderContent(container, label + ': ' + formatDuration(secondsLeft, strings), datesText, showClose, strings);
        }

        render();
        intervalId = window.setInterval(render, 1000);
    }

    return {
        init: init
    };
});
