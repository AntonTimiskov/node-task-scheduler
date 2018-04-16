var later = require("later");

later.date.localTime();

module.exports.later = later;

later.setTimeout = function (fn, sched) {
    var s = later.schedule(sched), t;
    scheduleTimeout();
    function scheduleTimeout() {
        var now = Date.now(), 
            next = s.next(2, now);
        var diff = 0;
        if (next && next.length > 0) {
            diff = next[0].getTime() - now;
        }
        if (diff < 1e3) {
            if (next.length > 1)
                diff = next[1].getTime() - now;
            else
                return;
        }
        if (diff < 2147483647) {
            t = setTimeout(fn, diff);
        } else {
            t = setTimeout(scheduleTimeout, 2147483647);
        }
    }
    return {
        clear: function () {
            clearTimeout(t);
        }
    };
};
