#!/usr/bin/env bash
# 사용: bash port.sh <port> [kill]
PORT=$1
lsof -i :"$PORT"
[[ "$2" == "kill" ]] && lsof -ti :"$PORT" | xargs kill -9
