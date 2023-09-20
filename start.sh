echo "Backend copies: ${1:-1}"
docker compose up -d --force-recreate --build --scale backend=${1:-1}
