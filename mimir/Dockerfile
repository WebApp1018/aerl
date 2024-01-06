FROM grafana/mimir:latest

COPY ./config.yaml /mnt/config/

USER root

CMD ["-config.file=/mnt/config/config.yaml", "-config.expand-env=true"]
