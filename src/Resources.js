var swagger = require("swagger-node-express");
var paramTypes = require("swagger-node-express/lib/paramTypes.js");
var url = require("url");
var _ = require("underscore");
var models = require('./models.js');
var logger = require("./Logger.js");


function IsRecurValid(recur) {
  return typeof recur !== 'undefined' &&
    Object.prototype.toString.call(recur.triggers) === '[object Array]' &&
    recur.triggers.length > 0 &&
    recur.triggers[0];
}

k8sClient = function () {
  const Client = require('kubernetes-client').Client;
  const config = require('kubernetes-client').config;
  const client = new Client({ config: config.getInCluster(), version: '1.7' });
  return client;
};

jobNameStructure = function (jobName) {
  const uuid = require('node-uuid').v4;
  var _guid = uuid();
  var _tenant = jobName.split('-tasks-')[0].split('dmp-')[1];
  return {
    cronJobName: _tenant.split('-')[0] + "." + _guid,
    taskId: jobName.split('-tasks-')[1],
    tenant: _tenant
  }
}

k8sCronJobTrigger = function(a) {
  return a.split(' ')[0]+' '+a.split(' ')[1]+' '+a.split(' ')[2]+' '+a.split(' ')[3]+' '+a.split(' ')[4];
}

qsJobId = function(req) {
  var _jobNameStructure = jobNameStructure(req.params.jobId);
  return { qs: { labelSelector: 'taskId=' + _jobNameStructure.taskId + ', tenant=' + _jobNameStructure.tenant } }
}

cronJob = function (jobName, job) {

  _jobNameStructure = jobNameStructure(jobName)
  return  {
    kind: "CronJob", 
    metadata: {
      name: _jobNameStructure.cronJobName,
      labels: {
        taskId: _jobNameStructure.taskId,
        tenant: _jobNameStructure.tenant
      }
    },    
    spec: {
      schedule: job.recur.triggers[0],
      jobTemplate: {
        spec: {
          template: {
            spec: {
              containers: [{
                name: "executer",
                image: "dmpclusterdevwestus2registry.azurecr.io/dmp-executer:2.0.122.3-pt-scheduler-01",
                args: ["node", "index.js"],
                env: [{
                  name:"job", 
                  value: JSON.stringify(job)
                }]
              }],
              restartPolicy: "OnFailure"
            }
          }
        }
      }  
    }
  }
}  

k8sNamespace = function (body) {
  return ( typeof body.namespace === 'undefined' ) ? 'default' : body.namespace;
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

    k8sClient().apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs.get( qsJobId(req) )
    .then((jobs) => {
        if (!_.isEmpty(jobs)){
          logger.info( '[k8sJob] get cronjob %j', _jobs );
          var _job = JSON.stringify(jobs[0]);
          logger.info( '[k8sJob] get cronjob %s', _job );
          res.send(_job);
        }
        else {
          swagger.errors.notFound('job', res);
        }
    })
    .catch(err => {
        logger.error( '[k8sJob] get cronjob err %s', err );
        swagger.errors.notFound('job', res);
    });
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
    else {
      logger.info("Call createJob %j", req.body);
      if (req.body.recur.start) req.body.recur.start = new Date(req.body.recur.start);
      if (req.body.recur.end) req.body.recur.end = new Date(req.body.recur.end);
      req.body.recur.triggers[0] = k8sCronJobTrigger(req.body.recur.triggers[0]);

      var client = k8sClient();

      client.apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs.post({ body: cronJob(req.body.name, req.body) })
      .then((job) => {
          logger.info( '[k8sJob1] add cronjob 1 %s', job );
          res.status(201).send({ status: "OK" });
      })
      .catch(err => {
          logger.error( '[k8sJob] add cronjob err %s', err );
          res.status(409).send("Job with the same name already exist");
      });
    }
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
      logger.info("Call updateJob %j", req.body);
      if (req.body.recur.start) req.body.recur.start = new Date(req.body.recur.start);
      if (req.body.recur.end) req.body.recur.end = new Date(req.body.recur.end);
      req.body.recur.triggers[0] = k8sCronJobTrigger(req.body.recur.triggers[0]);

      var client = k8sClient();

      client.apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs.get( qsJobId(req) )
      .then((jobs) => {
        if (!_.isEmpty(jobs)){
          _job = JSON.stringify(jobs[0])
          logger.info( '[k8sJob] get cronjob %s', _job );
          res.send(_job);
          client.apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs( jobNameStructure(req.params.jobId) ).put({ body: cronJob(req.params.jobId, req.body) })
          .then((job) => {
            logger.info( '[k8sJob1] update cronjob %s', job );
            res.status(200).send({ status: "OK" });
          })
          .catch(err => {
            logger.error( '[k8sJob] update cronjob err %s', err );
            client.apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs.post({ body: cronJob(req.body.name, req.body) })
            .then((job) => {
                logger.info( '[k8sJob1] add cronjob %s', job );
                res.status(201).send({ status: "OK" });
            })
            .catch(err => {
                logger.error( '[k8sJob] add cronjob err %s', err );
                res.status(400).send("Is not possible job create");
            });          
          });
        }
      });
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

    var _jobNameStructure = jobNameStructure(req.params.jobId);
    client = k8sClient();
    // client.apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs(req.params.jobId).delete({qs:{ propagationPolicy: 'Foreground'}})
    client.apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs( jobNameStructure(req.params.jobId) ).delete( qsJobId(req) )
    .then((job) => {
      logger.info( '[k8sJob] delete cronjob %s', job );
      res.status(200).send({ status: "OK" });
    })
    .catch(err => {
        logger.error( '[k8sJob] delete cronjob err %s', err );
        swagger.errors.notFound('job', res);
    });
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
    client = k8sClient();
    client.apis.batch.v2alpha1.namespaces( k8sNamespace(req.body) ).cronjobs.delete()
    .then((jobs) => {
      logger.info( '[k8sJob] delete cronjobs %s', jobs );
      res.status(200).send({ status: "OK" });
    })
    .catch(err => {
        logger.error( '[k8sJob] delete cronjobs err %s', err );
    });
  }
};

// exports.getAll = {
    // 'spec': {
        // description : "Get list of jobs",  
        // path : "/jobs",
        // method: "GET",
        // summary : "Fetch all jobs",
        // notes : "Get list of jobs",
        // type: "array",
        // items: {
            // $ref: "JobResponse"
        // },
        // nickname : "getJobs",
        // produces : ["application/json"],
        // responseMessages : [{ "code": 200 }]
    // },
    // 'action': function (req, res) {
        // var jobs = scheduler.getJobs();
        // res.send(JSON.stringify(jobs));
    // }
// };

// exports.pauseJob = {
    // 'spec': {
        // path : "/jobs/{jobId}/pause",
        // notes : "pause a job",
        // summary : "pause a job",
        // method: "POST",
        // produces : ["application/json"],
        // parameters : [paramTypes.path("jobId", "Id of job that needs to be paused", "string")],
        // responseMessages : [
            // {
                // "code": 200,
                // "message": "Job paused"
            // },
            // swagger.errors.invalid('input'), 
            // swagger.errors.notFound('job')],
        // nickname : "pauseJob"
    // },  
    // 'action': function (req, res) {
        // if (!req.params.jobId) {
            // res.status(400).send("Invalid Id");
        // }
        // var job = scheduler.getJob(req.params.jobId);
        
        // if (job) {
            // job.pause();
            // res.send(JSON.stringify(job));
        // }
        // else swagger.errors.notFound('job', res);
    // }
// };

// exports.resumeJob = {
    // 'spec': {
        // path : "/jobs/{jobId}/resume",
        // notes : "resume a job",
        // summary : "resume a job",
        // method: "POST",
        // produces : ["application/json"],
        // parameters : [paramTypes.path("jobId", "Id of job that needs to be resumed", "string")],
        // responseMessages : [
            // {
                // "code": 200,
                // "message": "Job resumed"
            // },
            // swagger.errors.invalid('input'), 
            // swagger.errors.notFound('job')],
        // nickname : "resumeJob"
    // },  
    // 'action': function (req, res) {
        // if (!req.params.jobId) {
            // res.status(400).send("Invalid Id");
        // }
        // var job = scheduler.getJob(req.params.jobId);
        
        // if (job) {
            // job.resume();
            // res.send(JSON.stringify(job));
        // }
        // else swagger.errors.notFound('job', res);
    // }
// };


