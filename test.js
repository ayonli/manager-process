"use strict";

var assert = require("assert");
var cluster = require("cluster");
var co = require("co");
var manager = require(".");

if (cluster.isMaster) {
    co(function* () {
        var processes = yield manager.getAllProcesses();
        var _manager = yield manager.getManager();
        var pid = yield manager.getManagerPid();
        var isManager = yield manager.isManager();
        var __process = {
            pid: process.pid,
            ppid: process.ppid,
            uid: process.getuid && process.getuid(),
            gid: process.getgid && process.getgid(),
            name: "node",
            cmd: [process.argv[0]].concat(process.execArgv, process.argv.slice(1)).join(" ")
        };

        assert.deepStrictEqual(processes, [__process]);
        assert.deepStrictEqual(_manager, __process);
        assert.strictEqual(pid, process.pid);
        assert.strictEqual(isManager, true);

        var workers = [];
        var messages = [];
        var managerPid;
        var managerProcess;

        for (var i = 0; i < 4; i++) {
            var worker = cluster.fork();

            workers.push(worker);
            worker.on("message", function (msg) {
                messages.push(msg);

                if (managerProcess === undefined) managerProcess = msg[1];
                if (managerPid === undefined) managerPid = msg[2];

                // ensure all sub-processes returns the same manager
                assert.deepStrictEqual(msg[1], managerProcess);
                assert.strictEqual(msg[2], managerPid);

                assert.strictEqual(msg.length, 4);
                assert.strictEqual(msg[0].length, 4);

                if (messages.length == 4) {
                    var booleans = [];
                    for (var j = 0; j < 4; j++) {
                        workers[j].kill();
                        booleans.push(messages[j][3]);
                    }

                    var index = booleans.indexOf(true);

                    // // ensure only one process that could be manager
                    assert.ok(index >= 0);
                    assert.strictEqual(index, booleans.lastIndexOf(true));

                    console.log("#### OK ####");
                }
            });
        }
    });
} else {
    co(function* () {
        var processes = yield manager.getAllProcesses();
        var _manager = yield manager.getManager();
        var pid = yield manager.getManagerPid();
        var isManager = yield manager.isManager();

        process.send([processes, _manager, pid, isManager]);
    });
}