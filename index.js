"use strict";

const path = require("path");
const findProcess = require("find-process");
const endsWith = require("lodash/endsWith");
const find = require("lodash/find");
const map = require("lodash/map");
const unique = require("lodash/uniq");
const splitArgv = require("argv-split");

/** Entry script filename */
let entry = getEntry(require.main.filename);

/**
 * @param {string} script 
 */
function getEntry(script) {
    let entry = endsWith(script, ".js") || endsWith(script, ".ts")
        ? script.slice(0, -3)
        : script;

    return endsWith(entry, path.sep + "index") ? entry.slice(0, -6) : entry;
}

/**
 * @param {string} cmd 
 * @returns {string}
 */
function getScript(cmd) {
    return find(splitArgv(cmd).slice(1), arg => arg[0] !== "-");
}

function getAllProcesses() {
    return findProcess("name", "node", true).then(items => {
        var members = [];

        for (let item of items) {
            let script = getScript(item.cmd);

            if (script && getEntry(script) === entry) {
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
                cmd: [process.argv[0]].concat(
                    process.execArgv,
                    process.argv.slice(1)
                ).join(" ")
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
