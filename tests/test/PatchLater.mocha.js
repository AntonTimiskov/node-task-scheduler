var assert = require('assert');
var sinon = require("sinon");
var _ = require('underscore');
var patch = require('../../src/PatchLater.js');


describe('PatchLater', function () {

    var clock;
    
    beforeEach(function () {
        var startDate = new Date(2015, 2, 12);
        clock = sinon.useFakeTimers(startDate.getTime());
    });
    afterEach(function () {
        clock.restore();
    });
    
    it('Not throw exception if recurrence rule is set to one repeat', function () {
        var done = false;
        function test() {
            done = true;
        }
        
        var s = patch.later.parse.cron("1 0 12 3 * 2015");
        patch.later.setTimeout(test, s);
        
        assert.doesNotThrow(function () { clock.tick(60000); }, "Exception is occur");
        assert.ok(done === true, "Done is not true");
    });
    
    it('Not throw exception if recurrence rule is expired', function () {
        var done = false;
        function test() {
            done = true;
        }
        
        var s = patch.later.parse.cron("1 0 12 3 * 2014");
        assert.doesNotThrow(function () {
            patch.later.setTimeout(test, s);
        }, "Exception is occur");
    });
})
