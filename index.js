"use strict";

const path = require("path");
const findProcess = require("find-process");
const trimStart = require("lodash/trimStart");
const startsWith = require("lodash/startsWith");
const endsWith = require("lodash/endsWith");
const includes = require("lodash/includes");

/** Entry script filename */
let script = process.mainModule.filename;

script = endsWith(script, ".js") ? script.slice(0, -3) : script;
script = endsWith(script, path.sep + "index") ? script.slice(0, -6) : script;

function getAllProcesses() {
    return findProcess("name", "node", true).then(items => {
        var members = [];
        var ppid;
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let cmd = trimStart(item.cmd, '"');

            // On Linux, as I've tried, sometimes the system will create more 
            // processes as expected in cluster mode, however the extra 
            // processes are not forked by the master class, instead they are 
            // forked by one of the child-process. So to avoid getting those 
            // unexpected processes, ensure all retrieved processes are fork by
            // the same process.
            if (startsWith(cmd, process.argv0)
                && includes(cmd, script)
                && (!ppid || item.ppid === ppid)
            ) {
                members.push(item);

                if (ppid === undefined)
                    ppid = item.ppid;
            }
        }

        if (members.length) {
            return members;
        } else {
            return [{
                pid: process.pid,
                ppid: process.ppid,
                uid: process.getuid && process.getuid(),
                gid: process.getgid && process.getgid(),
                name: "node",
                cmd: [process.argv0].concat(process.execArgv, process.argv.slice(1)).join(" ")
            }];
        }
    });
}

function getManager() {
    return getAllProcesses().then(items => items[0]);
}

function getManagerPid() {
    return getManager().then(manager => manager.pid);
}

function isManager() {
    return getManagerPid().then(pid => process.pid === pid);
}

exports.getAllProcesses = getAllProcesses;
exports.getManager = getManager;
exports.getManagerPid = getManagerPid;
exports.isManager = isManager;