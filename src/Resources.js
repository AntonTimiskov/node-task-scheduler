var swagger = require("swagger-node-express");
var paramTypes = require("swagger-node-express/lib/paramTypes.js");
var url = require("url");
var _ = require("underscore");
var scheduler = require("./Scheduler.js");
var models = require('./models.js');


function IsRecurValid(recur) {
    return typeof recur !== 'undefined' &&
            Object.prototype.toString.call(recur.triggers) === '[object Array]' &&
            recur.triggers.length > 0 &&
            recur.triggers[0];
}


exports.getById = {
    'spec': {
        description : "Get job by ID",  
        path : "/jobs/{jobId}",
        method: "GET",
        summary : "Find job by ID",
        notes : "Returns a job based on ID",
        type : "JobResponse",
        nickname : "getJobById",
        produces : ["application/json"],
        parameters : [paramTypes.path("jobId", "ID of job that needs to be fetched", "string")],
        responseMessages : [
            { "code": 200 },
            swagger.errors.notFound('job')
        ]
    },
    'action': function (req, res) {
        var job = scheduler.getJob(req.params.jobId);
        
        if (job) res.send(JSON.stringify(job));
        else swagger.errors.notFound('job', res);
    }
};

exports.getAll = {
    'spec': {
        description : "Get list of jobs",  
        path : "/jobs",
        method: "GET",
        summary : "Fetch all jobs",
        notes : "Get list of jobs",
        type: "array",
        items: {
            $ref: "JobResponse"
        },
        nickname : "getJobs",
        produces : ["application/json"],
        responseMessages : [{ "code": 200 }]
    },
    'action': function (req, res) {
        var jobs = scheduler.getJobs();
        res.send(JSON.stringify(jobs));
    }
};

exports.addJob = {
    'spec': {
        path : "/jobs",
        notes : "Add a new job",
        summary : "Add a new job",
        method: "POST",
        produces : ["application/json"],
        parameters : [paramTypes.body("body", "Job object that needs to be added", "Job", undefined, true)],
        responseMessages : [
            {
                "code": 201,
                "message": "Job created"
            },
            swagger.errors.invalid('input'), 
            {
                'code': 409,
                'message': 'Job with the same name already exist'
            }],
        nickname : "addJob"
    },  
    'action': function (req, res) {
        if (typeof req.body === 'undefined' || 
            !req.body.name || 
            !IsRecurValid(req.body.recur)) {
            res.status(400).send("Invalid parameters");
        }
        else if (scheduler.getJob(req.body.name))
            res.status(409).send("Job with the same name already exist");
        else {
            scheduler.createJob(req.body);
            res.status(201).send({ status: "OK" });
        }
    }
};

exports.pauseJob = {
    'spec': {
        path : "/jobs/{jobId}/pause",
        notes : "pause a job",
        summary : "pause a job",
        method: "POST",
        produces : ["application/json"],
        parameters : [paramTypes.path("jobId", "Id of job that needs to be paused", "string")],
        responseMessages : [
            {
                "code": 200,
                "message": "Job paused"
            },
            swagger.errors.invalid('input'), 
            swagger.errors.notFound('job')],
        nickname : "pauseJob"
    },  
    'action': function (req, res) {
        if (!req.params.jobId) {
            res.status(400).send("Invalid Id");
        }
        var job = scheduler.getJob(req.params.jobId);
        
        if (job) {
            job.pause();
            res.send(JSON.stringify(job));
        }
        else swagger.errors.notFound('job', res);
    }
};

exports.resumeJob = {
    'spec': {
        path : "/jobs/{jobId}/resume",
        notes : "resume a job",
        summary : "resume a job",
        method: "POST",
        produces : ["application/json"],
        parameters : [paramTypes.path("jobId", "Id of job that needs to be resumed", "string")],
        responseMessages : [
            {
                "code": 200,
                "message": "Job resumed"
            },
            swagger.errors.invalid('input'), 
            swagger.errors.notFound('job')],
        nickname : "resumeJob"
    },  
    'action': function (req, res) {
        if (!req.params.jobId) {
            res.status(400).send("Invalid Id");
        }
        var job = scheduler.getJob(req.params.jobId);
        
        if (job) {
            job.resume();
            res.send(JSON.stringify(job));
        }
        else swagger.errors.notFound('job', res);
    }
};

exports.updateOrAddJob = {
    'spec': {
        path : "/jobs/{jobId}",
        notes : "update or create a new job",
        summary : "update or create a new job",
        method: "PUT",
        produces : ["application/json"],
        parameters : [paramTypes.path("jobId", "Id of job that needs to be paused", "string")],
        responseMessages : [{
                'code': 200,
                'message': 'Job updated'
            }, 
            {
                'code': 201,
                'message': 'Job created'
            },
            swagger.errors.invalid('input')
        ],
        nickname : "resumeJob"
    },  
    'action': function (req, res) {
        if (typeof req.body === 'undefined' || 
            !req.params.jobId || 
            !IsRecurValid(req.body.recur)) {
            res.status(400).send("Invalid parameters");
        }
        else {
            var job = scheduler.getJob(req.params.jobId);
            
            if (job) {
                scheduler.deleteJob(req.params.jobId);
                res.status(200);
            }
            else {
                res.status(201);
            }
            req.body.name = req.params.jobId;
            scheduler.createJob(req.body);
            res.send({ status: "OK" });
        }
    }
};



exports.deleteJob = {
    'spec': {
        path : "/jobs/{jobId}",
        notes : "delete a job",
        summary : "delete a job",
        method: "DELETE",
        parameters : [paramTypes.path("jobId", "Id of job that needs to be deleted", "string")],
        responseMessages : [
            {
                "code": 200,
                "message": "Job deleted"
            }],
        nickname : "deleteJob"
    },  
    'action': function (req, res) {
        scheduler.deleteJob(req.params.jobId);
        res.status(200).send({ status: "OK" });
    }
};

exports.deleteJobs = {
    'spec': {
        path : "/jobs",
        notes : "delete all jobs",
        summary : "delete all jobs",
        method: "DELETE",
        parameters : [],
        responseMessages : [
            {
                "code": 200,
                "message": "All jobs deleted"
            }],
        nickname : "deleteJobs"
    },  
    'action': function (req, res) {
        _.each(scheduler.getJobs().slice(), function (job) {
            scheduler.deleteJob(job.name);
        });
        res.status(200).send({ status: "OK" });
    }
};
