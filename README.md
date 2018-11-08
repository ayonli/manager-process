# Manager Process

In multi-processing scenario, it's better to handle some operations in just one 
process, rather than repeatedly running them in all processes. If you  you have 
all control of the master process, you can just put the code in the master 
process. However, you don't have control, e.g. using [PM2](https://pm2.io), you 
need a way to find out which process should run the specific program. Such a 
process, I call it the **Manager** process.

## Example

```javascript
const manager = require("manager-process");

(async () => {
    var _manager = await manager.getManager();
    var processes = await manager.getAllProcesses();
    var pid = await manager.getManagerPid();
    var isManager = await manager.isManager();

    if (isManager) {
        // TODO...
    }

    // This is the same
    if (pid === process.pid) {
        // TODO...
    }

    console.log(_manager);
    // {
    //  pid: number,
    //  ppid?: number,
    //  uid?: number;
    //  gid?: number;
    //  name: string;
    //  cmd: string;
    // }

    console.log(processes);
    // Array<{
    //  pid: number,
    //  ppid?: number,
    //  uid?: number;
    //  gid?: number;
    //  name: string;
    //  cmd: string;
    // }>
})();
```