xk6 build --with github.com/grafana/xk6-client-prometheus-remote@latest

./k6 run load-testing-with-k6.js \
    -e K6_WRITE_HOSTNAME="localhost:8080" \
    -e K6_READ_HOSTNAME="localhost:8080" \
    -e K6_WRITE_REQUEST_RATE="1" \
    -e K6_WRITE_SERIES_PER_REQUEST="20" \
    -e K6_READ_REQUEST_RATE="500" \
    -e RAMP_UP_MIN="1" \
    -e K6_TENANT_ID="temp-load-testing" \
    -e K6_DURATION_MIN="5" \
    --out json=result.json
