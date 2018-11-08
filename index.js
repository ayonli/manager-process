"use strict";

const path = require("path");
const findProcess = require("find-process");
const trimStart = require("lodash/trimStart");
const endsWith = require("lodash/endsWith");
const includes = require("lodash/includes");

/** Entry script filename */
let script = process.mainModule.filename;

script = endsWith(script, ".js") ? script.slice(0, -3) : script;
script = endsWith(script, path.sep + "index") ? script.slice(0, -6) : script;

function getAllProcesses() {
    return findProcess("name", "node", true).then(items => {
        var members = [];
        for (let i = 0; i < items.length; i++) {
            let item = items[i];

            includes(item.cmd, script) && members.push(item);
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
                cmd: "node " + process.execArgv.join(" ")
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