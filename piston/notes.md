
# Running Piston in WSL2 requires cgroup2

I am having a problem with my docker doesn't have cgroup2.
I am running WSL2.
I installed Docker for Desktop.
However inside my WSL I see 2 docker contexts.
The default doesn't have cgroup2.
And the desktop-linux  doesn't work.




Here’s what’s going on: desktop-linux is a Windows-only endpoint.
That context points at the Windows named pipenpipe:////./pipe/dockerDesktopLinuxEngine, which the Linux Docker CLI inside WSL doesn’t speak—hence the “protocol not available” error when you do docker ps.
default is your WSL-integrated daemon over the UNIX socket, so you’ll stay in that context. It is Docker Desktop running inside the special “docker-desktop” WSL distro, but by default WSL2 still leaves all controllers on cgroup v1—even though a v2 hierarchy exists alongside it. So docker info will report Cgroup Version: 1.
To get true cgroup v2 in your Docker Desktop WSL engine, disable the v1 controllers in your WSL2 kernel. On Windows, open (or create) C:\Users\<you>\.wslconfig and add:
[wsl2]
kernelCommandLine = cgroup_no_v1=all
Then run:
Edit
wsl.exe --shutdown
and restart your distro. Now, under the default context, docker info should report Cgroup Version: 2 
After that, keep using the default context (the UNIX-socket one) inside WSL—don’t switch to desktop-linux.

# Install packages
The base image's CMD or ENTRYPOINT will start the Piston API server.
Language packages will be installed manually via API calls
to the running Piston service.


Get packages: curl http://localhost:2000/api/v2/packages

Install packages: 
```
curl -X POST http://localhost:2000/api/v2/packages  -H 'Content-Type: application/json'  -d '{"language":"python","version":"3.12.0"}'

curl -X POST http://localhost:2000/api/v2/packages  -H 'Content-Type: application/json'  -d '{"language":"gcc","version":"10.2.0"}'
```

Get available runtimes: curl http://localhost:2000/api/v2/runtimes

Test execution
```
curl -X POST http://localhost:2000/api/v2/execute \
        -H "Content-Type: application/json" \
        -d '{
            "language": "python",
            "version": "*" , 
            "files": [{
                "name": "main.py",
                "content": "print(\"Hello from Piston!\")"
                }
            ]
            }'

```

