"use strict";

const path = require("path");
const findProcess = require("find-process");
const trimStart = require("lodash/trimStart");
const endsWith = require("lodash/endsWith");
const includes = require("lodash/includes");
const findIndex = require("lodash/findIndex");
const find = require("lodash/find");
const map = require("lodash/map");
const unique = require("lodash/uniq");

/** Entry script filename */
let script = process.mainModule.filename;

script = endsWith(script, ".js") ? script.slice(0, -3) : script;
script = endsWith(script, path.sep + "index") ? script.slice(0, -6) : script;

function getAllProcesses() {
    return findProcess("name", "node", true).then(items => {
        var members = [];

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let cmd = trimStart(item.cmd, '"');

            // On Linux, as I've tried, sometimes the system will create more 
            // processes as expected in cluster mode, however the extra 
            // processes are not forked by the master class, instead they are 
            // forked by one of the child-process. So to avoid getting those 
            // unexpected processes, ensure all retrieved processes are fork by
            // the same process.
            if (includes(cmd, script)) {
                let i = findIndex(members, member => member.pid === item.ppid);

                // if 'i' is 0, that indicates the first process is the master 
                // process itself.
                if (i === -1 || i === 0)
                    members.push(item);
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
                cmd: [process.argv[0]].concat(process.execArgv, process.argv.slice(1)).join(" ")
            }];
        }
    });
}

function getManager() {
    return getAllProcesses().then(items => {
        // The items may contain the master process, which is not supposed to be
        // the manager when with cluster or child_process.
        let ppids = unique(map(items, item => item.ppid)),
            ppid = ppids.length > 1 ? ppids[1] : ppids[0]; // might be undefined

        return find(items, item => item.ppid === ppid);
    });
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