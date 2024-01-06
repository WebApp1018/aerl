/Users/liam/aerl/deb-s3/bin/deb-s3 upload \
    --codename stable \
    --component main \
    --sign AERL \
    --arch arm64 \
    --bucket aerl-cloud-pkgs \
    --endpoint https://4d940b8000140e116b8fccc826bea42b.r2.cloudflarestorage.com \
    --access-key-id $CF_ACCESS_KEY \
    --secret-access-key $CF_SECRET_KEY \
    --s3-region auto \
    hubd_0.1.2_arm64.deb
