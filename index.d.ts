declare namespace manager {
    interface ProcessInfo {
        pid: number;
        ppid?: number;
        uid?: number;
        gid?: number;
        name: string;
        cmd: string;
    }

    function getAllProcesses(): Promise<ProcessInfo[]>

    function getManager(): Promise<ProcessInfo>

    function getManagerPid(): Promise<number>;

    function isManager(): Promise<boolean>;
}

export = manager;