#explanation

We deploy new versions of software using a process inspired by [Go module version](https://go.dev/ref/mod#versions). A single branch is tagged with the components and version number (e.g. `hubd/v1.2.3`). This triggers the deployment process.

This is to avoid having to maintain concurrent Git branches which always trends towards chaos.

# Preview Deployments

For some components, it makes sense to deploy to a preview environment for every commit/pull-request. These commits are deployed to a staging environment.
