#!/bin/bash

set -e

if [ -z $1 ]; then
    echo "Specify at least one argument."
    exit
fi

name=$(basename $1)
size=$2
if [ -z $size ]; then
    size="x150\>"
fi

set -x
magick $1 -resize $size "fallback/$name"
magick "fallback/$name" -quality 80 "webp/${name%.*}.webp"
