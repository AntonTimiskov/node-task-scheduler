var later = require("./PatchLater.js").later,
    util = require("util"),
    _ = require('underscore'),
    logger = require("./Logger.js");


/*
 * examples of jobDefinition:
 * 
 * Log date every 2 minutes
 * {
 *  "name": "infojob",
 *  "js": "console.info(new Date())",
 *  "recur":{
 *      "triggers":["0/2 * * * * ?"]
 *  }
 * }
 * */
 var Job;
module.exports = Job = function (jobDefinition) {
    logger.debug("create new job", jobDefinition);
    
    this.name = jobDefinition.name;
    this.state = "create";
    this.recur = jobDefinition.recur;
    if (this.recur.start) this.recur.start = new Date(this.recur.start);
    if (this.recur.end) this.recur.end = new Date(this.recur.end);
    this.js = jobDefinition.js;
    
    this.lastStart = undefined;
    this.nextStart = undefined;
}


Job.prototype = {
    
    _execute: function () {
        if (this.state === "run") {
            logger.debug("execute job %s", this.name);
            this.lastStart = this.nextStart || new Date();
            
            try {
                this.execute();
            }
            catch (ex) {
                logger.error("Error in executing job", ex);
            }          
            
            this.nextStart = this.next();
        }
    },
    
    _buildSchedule: function () {
        var schedule = later.parse;
        _.each(this.recur.triggers, function (trigger, index) {
            var useSeconds = trigger.split(' ').length == 7;
            if (index === 0) {
                schedule = schedule.cron(trigger, useSeconds);
            }
            else {
                schedule = schedule.and().cron(trigger, useSeconds);
            }
        });
        
        return schedule;
    },
    
    //convert js Date object to cron expression
    _dateToCron : function (date) {
        var cronExpr = util.format("%d %d %d %d ? %d" , date.getMinutes()
                                        , date.getHours()
                                        , date.getDate()
                                        , date.getMonth() + 1
                                        , date.getFullYear());
        
        logger.debug("Convert date %s to cron expression %s", date, cronExpr);
        
        return cronExpr;
    },
    
    //convert date to later schedule object
    _dateToSchedule: function (date) {
        if (!util.isDate(date))
            date = new Date(date);
        
        var cronExpr = this._dateToCron(date);
        return later.parse.cron(cronExpr, false);
    },
    
    
    //run javascript code
    execute: function () {
        
        logger.debug("run javscript code %s", this.js);
        
        var fn = Function(this.js);
        fn.call(this);
    },
    
    
    //run scheduling
    run : function () {
        if (this.state === "create") {
            var schedule = this._buildSchedule();
            var execute = this._execute.bind(this);
            

            this.next = function () {
                var start = this.recur.start && (this.recur.start.getTime() - Date.now()) > 2e3 ? this.recur.start : new Date();
                var nextExecute = undefined;
                
                var next = later.schedule(schedule).next(2, start);
                if (next && (next[0].getTime() - Date.now()) > 1e3)
                    nextExecute = next[0];
                else if (next.length === 2)
                    nextExecute = next[1];

                if (nextExecute && this.recur.end && this.recur.end <= nextExecute)
                    nextExecute = undefined;

                return nextExecute;
            };
            

            this.nextStart = this.next();
            if (this.nextStart) {
                if (this.recur.start) {
                    if ((this.recur.start.getTime() - Date.now()) < 2e3)
                        this.timer = later.setInterval(execute, schedule);
                    else {
                        var executeOnRun = this.recur.start.getTime() === this.nextStart.getTime() ;
                        later.setTimeout((function () {
                            if (executeOnRun)
                                execute();                            
                            this.timer = later.setInterval(execute, schedule);
                        }).bind(this), this._dateToSchedule(this.recur.start));
                    } 
                }
                else
                    this.timer = later.setInterval(execute, schedule);
                
                if (this.recur.end)
                    later.setTimeout(this.cancel.bind(this), this._dateToSchedule(this.recur.end));
            }
            
            this.state = "run";
        }
    },
    
    
    //cancel job
    cancel : function () {
        if (this.timer) {
            logger.info("Job %s canceled", this.name);
            this.timer.clear();
        }
    },
    
    //pause job
    pause : function () {
        if (this.state !== "pause") {
            logger.info("Job %s paused", this.name);
            this.state = "pause";
        }
    },
    
    //resume job
    resume : function () {
        if (this.state === "pause") {
            logger.info("Job %s resumed", this.name);
            this.state = "run";
        }
    }
}
