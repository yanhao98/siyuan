docker build --file .github/Dockerfile --platform linux/amd64 -t siyuan-note-local-amd64 .

docker run --rm -it -p 6806:6806 \
  -v wspace:/siyuan/workspace \
  siyuan-note-local-amd64 \
  --accessAuthCode=1
