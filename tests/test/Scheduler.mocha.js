var assert = require('assert');
var sinon = require("sinon");
var _ = require('underscore');
var Scheduler = require('../../src/Scheduler.js');


describe('Scheduling', function () {
    var jobName = "testJob", clock;
    
    beforeEach(function () {
        Scheduler.deleteJob(jobName);
        var startDate = new Date(2015, 1, 12);
        clock = sinon.useFakeTimers(startDate.getTime());
    });
    afterEach(function () {
        clock.restore();
    });
    
    
    it('Job execute every 2 seconds', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                triggers: ["0/2 * * * * * ?"]
            }
        });
        
        _.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function (iteration) {
            clock.tick(1999);
            assert.ok(job.testpass !== true, "Scheduled time is occurred; Iteration=" + iteration);
            clock.tick(1);
            assert.ok(job.testpass === true, "Scheduled time is not occurred; Iteration=" + iteration);
            
            job.testpass = false;
        });
    });
    
    
    it('Job execute at 00:00:01', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                triggers: ["1 0 * * * ?"]
            }
        });
        clock.tick(59999);
        assert.ok(job.testpass !== true, "Scheduled time is occurred");
        clock.tick(1);
        assert.ok(job.testpass === true, "Scheduled time is not occurred");
    });
    
    
    it('Job execute once', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                start: "2015-02-11T22:00:00Z",
                triggers: ["0 0 1 12 2 * 2015"]
            }
        });
        var hourms = 60 * 60 * 1000;
        clock.tick(hourms - 1);
        assert.ok(job.testpass !== true, "Scheduled time is occurred");
        clock.tick(1);
        assert.ok(job.testpass === true, "Scheduled time is not occurred");
    });
    
    it('Job execute after 10 seconds', function () {
        clock.tick(49000);
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                start: "2015-02-11T21:01:00.000Z",
                triggers: ["1 0 12 2 ? 2015"],
                end: null
            }
        });
        clock.tick(10999);
        assert.ok(job.testpass !== true, "Scheduled time is occurred");
        clock.tick(1);
        assert.ok(job.testpass === true, "Scheduled time is not occurred");
    });
    
    
    it('Job execute every 2 minutes', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                triggers: ["0/2 * * * * ?"]
            }
        });
        
        _.each([1, 2, 3, 4, 5], function (iteration) {
            clock.tick(119999);
            assert.ok(job.testpass !== true, "Scheduled time is occurred in " + iteration + "iteration");
            clock.tick(1);
            assert.ok(job.testpass === true, "Scheduled time is not occurred in " + iteration + "iteration");
            job.testpass = false;
        });
    });
    
    
    it('Job execute every 1 minutes after 01:00:00', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                start: new Date(2015, 1, 12, 1).toISOString(),
                triggers: ["0/1 * * * * ?"]
            }
        });
        
        var hourms = 60 * 60 * 1000;
        clock.tick(hourms - 1);
        assert.ok(job.testpass !== true, "Scheduled time is occurred");
        
        _.each([1, 2, 3, 4, 5], function (iteration) {
            clock.tick(1);
            assert.ok(job.testpass === true, "Scheduled time is not occurred in " + iteration + "iteration");
            job.testpass = false;
            clock.tick(59999);
            assert.ok(job.testpass !== true, "Scheduled time is occurred in " + iteration + "iteration");
        });
    });
    
    it('Job is initialized right if start date in past', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                start: "2015-02-10T22:00:00Z",
                triggers: ["0/2 * * * * ?"]
            }
        });
        
        
        _.each([1, 2, 3, 4, 5], function (iteration) {
            clock.tick(119999);
            assert.ok(job.testpass !== true, "Scheduled time is occurred in " + iteration + "iteration");
            clock.tick(1);
            assert.ok(job.testpass === true, "Scheduled time is not occurred in " + iteration + "iteration");
            job.testpass = false;
        });
    });
    
    
    it('Job is initialized right if end date in past', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                end: "2015-02-10T22:00:00Z",
                triggers: ["0/2 * * * * ?"]
            }
        });
        
        
        clock.tick(60 * 60 * 1000);
        assert.ok(job.testpass !== true, "Scheduled time is occurred");
    });
    
    it('Job execute every 3 minutes after 01:00:00', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                start: new Date(2015, 1, 12, 1).toISOString(),
                triggers: ["3/3 * * * * ?"]
            }
        });
        
        var hourms = 60 * 60 * 1000;
        clock.tick(hourms + 179999 );
        assert.ok(job.testpass !== true, "Scheduled time is occurred");
        
        _.each([1, 2, 3, 4, 5], function (iteration) {
            clock.tick(1);
            assert.ok(job.testpass === true, "Scheduled time is not occurred in " + iteration + "iteration");
            job.testpass = false;
            clock.tick(179999);
            assert.ok(job.testpass !== true, "Scheduled time is occurred in " + iteration + "iteration");
        });
    });
    
    it('Job execute every 1 minutes until 00:05:00', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                end: new Date(2015, 1, 12, 0, 5).toISOString(),
                triggers: ["0/1 * * * * ?"]
            }
        });
        
        _.each([1, 2, 3, 4], function (iteration) {
            clock.tick(59999);
            assert.ok(job.testpass !== true, "Scheduled time is occurred in " + iteration + "iteration");
            clock.tick(1);
            assert.ok(job.testpass === true, "Scheduled time is not occurred in " + iteration + "iteration");
            job.testpass = false;
        });
        
        _.each([5, 6, 7, 8], function (iteration) {
            clock.tick(60000);
            assert.ok(job.testpass !== true, "Scheduled time is occurred in " + iteration + "iteration");
        });
    });
    
    
    
    it('Calculate next and last start dates', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                triggers: ["0/1 * * * * ?"]
            }
        });
        
        assert.ok(job.nextStart.getTime() === (new Date().getTime() + 60000), "Wrong next start date!");
        clock.tick(60000);
        assert.ok(job.lastStart.getTime() === new Date().getTime(), "Wrong last start date!");
        assert.ok(job.nextStart.getTime() === (new Date().getTime() + 60000), "Wrong new next start date!");
    });

    it('Calculate next date over DST', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                triggers: ["0 0 20 * * ?"]
            }
        });

        assert.equal(job.nextStart.getHours(), 0);
        clock.tick(20 * 24 * 60 * 60 * 1000);
        assert.equal(job.nextStart.getHours(), 0, "Scheduler didn't respect DST changes");
    });
    
    it('Calculate next start date. Start date specified', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                start: new Date(2015, 1, 12, 1).toISOString(),
                triggers: ["0/1 * * * * ?"]
            }
        });
        
        assert.ok(job.nextStart.getTime() === (new Date().getTime() + 60 * 60000), "Wrong next start date!");
    });
    
    it('Calculate next start date. End date specified', function () {
        var job = Scheduler.createJob({
            name: jobName,
            type: "js",
            js: "this.testpass = true",
            recur: {
                triggers: ["0/10 * * * * ?"],
                end: new Date(2015, 1, 12, 1).toISOString(),
            }
        });
        
        _.each([1, 2, 3, 4, 5], function (iteration) {
            assert.ok(job.nextStart.getTime() === (new Date().getTime() + 600000), "Wrong next start date! Iteration:" + iteration);
            clock.tick(600000);
        });
        
        assert.ok(job.nextStart === undefined, "Wrong next start date!");
    });
});


/*describe('Scheduler', function () {
    var jobDefinition = {
        name: "testJob",
        type: "js",
        js: "this.testpass = true",
        recur: {
            triggers: ["0/1 * * * * ?"]
        }
    };
    
    beforeEach(function () {
        Scheduler.deleteJob(jobDefinition.name);
    });

    it('create job', function () {
        var job = undefined;
        assert.doesNotThrow(function () { job = Scheduler.createJob(jobDefinition); }, "CreteJob throws exception");
    });
});*/
