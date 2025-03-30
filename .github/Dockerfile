# FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS builder # https://github.com/confluentinc/confluent-kafka-go/issues/898
FROM golang:1.24-alpine AS builder

COPY . /go/src/github.com/siyuan-note/siyuan
WORKDIR /go/src/github.com/siyuan-note/siyuan

ARG TARGETOS TARGETARCH
ENV GO111MODULE=on
ENV CGO_ENABLED=1
ENV GOOS=$TARGETOS
ENV GOARCH=$TARGETARCH

RUN set -eux && apk add --no-cache gcc musl-dev

RUN set -ex \
  && go build -C kernel \
  --tags "fts5" \
  -ldflags "-s -w" \
  -o /go/bin/kernel

#####
# 🐳
#####
FROM alpine AS dist

RUN apk add --no-cache ca-certificates tzdata su-exec

WORKDIR /opt/siyuan/

ENV TZ=Asia/Shanghai
ENV HOME=/home/siyuan
ENV RUN_IN_CONTAINER=true
EXPOSE 6806

COPY kernel/entrypoint.sh /opt/siyuan/entrypoint.sh
COPY app/appearance /opt/siyuan/appearance
COPY app/stage /opt/siyuan/stage
COPY app/guide /opt/siyuan/guide
COPY app/changelogs /opt/siyuan/changelogs
COPY --from=builder /go/bin/kernel /opt/siyuan/kernel

ENTRYPOINT ["/opt/siyuan/entrypoint.sh"]
