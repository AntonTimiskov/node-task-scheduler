var jsjob = require("./Job.js"),
    restjob = require("./RestJob.js"),
    _ = require('underscore'),
    logger = require("./Logger.js");

var jobMapping, defaultJobType, jobs;
exports.jobMapping = jobMapping = { "rest": restjob, "js": jsjob };
exports.defaultJobType = defaultJobType = "rest";
exports.jobs = jobs = {};

exports.createJob = function (jobDefinition) {
    logger.debug("Call createJob %j", jobDefinition);
    if (jobs[jobDefinition.name])
        throw new Error("Job with the same name already exists");

    var jobType = jobDefinition.type || defaultJobType;
    var jobCtor = jobMapping[jobType];
    var job = new jobCtor(jobDefinition);
    jobs[job.name] = job;
    job.run();
    return job;
}

exports.deleteJob = function (jobName) {
    logger.debug("Call deleteJob %s", jobName);
    var job = jobs[jobName];
    if (job) {
        job.cancel();
        delete jobs[jobName];
    }
}

exports.getJob = function (jobName) {
    logger.debug("Call getJob %s", jobName);
    return jobs[jobName];
}

exports.getJobs = function () {
    logger.debug("Call getJobs");
    return _.map(jobs, function (value, key) { return value });
}
