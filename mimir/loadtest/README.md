# Load testing Mimir with K6

Run the following script against a Mimir instance

## Running the load test

```shell
sh loadtest.sh
```

## Load testing Mimir running on fly

You can use the fly cli to proxy a localhost port to a remote fly instance allowing you to load test a deployment without exposing it to the internet.

```shell
fly proxy 8080:8080 mimir-aerl-cloud.internal
```

Now you can run the load test against `localhost:8080`.
