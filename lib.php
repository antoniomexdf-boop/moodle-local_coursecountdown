<?php
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
 * Course countdown local plugin callbacks.
 *
 * @package     local_coursecountdown
 * @copyright   2026 Antonio Jimenez <antoniomexdf@gmail.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Queue required assets and JS config.
 *
 * @param stdClass $course
 * @return void
 */
function local_coursecountdown_bootstrap(stdClass $course): void {
    global $PAGE;

    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $start = !empty($course->startdate) ? (int)$course->startdate : 0;
    $end = !empty($course->enddate) ? (int)$course->enddate : 0;
    $dateformat = get_string('strftimedatetime', 'langconfig');
    $startformatted = $start > 0 ? userdate($start, $dateformat) : '';
    $endformatted = $end > 0 ? userdate($end, $dateformat) : '';

    $PAGE->requires->css('/local/coursecountdown/styles.css');
    $PAGE->requires->js_call_amd('local_coursecountdown/countdown', 'init', [[
        'start' => $start,
        'end' => $end,
        'dates' => [
            'startformatted' => $startformatted,
            'endformatted' => $endformatted,
        ],
        'settings' => [
            'showclose' => 1,
            'showdates' => 1,
            'yellowminutes' => 30,
            'redminutes' => 5,
            'colors' => [
                'green' => [
                    'text' => '#0c6522',
                    'background' => '#eaf9ed',
                    'border' => '#bee5c6',
                ],
                'yellow' => [
                    'text' => '#725400',
                    'background' => '#fff5d6',
                    'border' => '#ffe086',
                ],
                'red' => [
                    'text' => '#8b0000',
                    'background' => '#ffe3e3',
                    'border' => '#ffaaaa',
                ],
            ],
        ],
        'strings' => [
            'startlabel' => get_string('startlabel', 'local_coursecountdown'),
            'endlabel' => get_string('endlabel', 'local_coursecountdown'),
            'opensin' => get_string('opensin', 'local_coursecountdown'),
            'closesin' => get_string('closesin', 'local_coursecountdown'),
            'closed' => get_string('closed', 'local_coursecountdown'),
            'open' => get_string('open', 'local_coursecountdown'),
            'nodates' => get_string('nodates', 'local_coursecountdown'),
            'closebutton' => get_string('closebutton', 'local_coursecountdown'),
            'closebuttonaria' => get_string('closebuttonaria', 'local_coursecountdown'),
            'nostart' => get_string('nostart', 'local_coursecountdown'),
            'noend' => get_string('noend', 'local_coursecountdown'),
            'day' => get_string('day', 'local_coursecountdown'),
            'days' => get_string('days', 'local_coursecountdown'),
            'hour' => get_string('hour', 'local_coursecountdown'),
            'hours' => get_string('hours', 'local_coursecountdown'),
            'minute' => get_string('minute', 'local_coursecountdown'),
            'minutes' => get_string('minutes', 'local_coursecountdown'),
            'second' => get_string('second', 'local_coursecountdown'),
            'seconds' => get_string('seconds', 'local_coursecountdown'),
        ],
    ]]);
}

/**
 * Render countdown container at top of body.
 *
 * @return string
 */
function local_coursecountdown_before_standard_top_of_body_html(): string {
    global $PAGE;

    if (empty($PAGE->course) || empty($PAGE->course->id) || (int)$PAGE->course->id === SITEID) {
        return '';
    }

    local_coursecountdown_bootstrap($PAGE->course);

    return '<div id="local-coursecountdown" class="local-coursecountdown" aria-live="polite"></div>';
}

/**
 * Fallback hook to always load assets in course pages.
 *
 * @param global_navigation $navigation
 * @param stdClass $course
 * @param context_course $context
 * @return void
 */
function local_coursecountdown_extend_navigation_course($navigation, $course, $context): void {
    if (empty($course->id) || (int)$course->id === SITEID) {
        return;
    }
    local_coursecountdown_bootstrap($course);
}
