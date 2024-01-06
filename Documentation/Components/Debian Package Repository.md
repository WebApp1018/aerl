#explanation 

We distribute new versions of our hub daemon using a private package archive (PPA) which is deployed and served as static files on Cloudflare R2.

# Adding the PPA

Run the following to add the package source to a system.

```shell
echo "deb https://pkgs.aerl.cloud stable main" | sudo tee /etc/apt/sources.list.d/aerl-hub.list
```

Add the signing key.

```shell
curl -fsSL https://pkgs.aerl.cloud/dists/stable/Release.noarmor.gpg | sudo tee  /etc/apt/trusted.gpg.d/aerl-archive-keyring.gpg >/dev/null
```

You can now run the following to install hubd.

```shell
sudo apt-get update
sudo apt-get install hubd
```

# Deploying New Packages

New packages can be deployed using the [`upload.sh`](../../pkgs/upload.sh) script. This uses [deb-s3](https://github.com/deb-s3/deb-s3) to managed the package archive on R2 via the S3 compatible API. As such you will need API credentials for the R2 bucket before starting.

This process will eventually be automated to deploy via the hubd CI/CD pipeline.

# Other Files

The R2 bucket has a secondary use of storing other useful resources which may be used to aid installation. This includes GPG keys, `.list` files for given distributions and a helpful homepage served on the root to guide any lost users.
