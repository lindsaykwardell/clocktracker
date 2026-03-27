#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./convert-role-icon.sh <image-file>"
  echo "Example: ./convert-role-icon.sh ventriloquist.png"
  exit 1
fi

name=$(basename "$1" | sed 's/\.[^.]*$//')

for size in 48 80 160; do
  magick "$1" -resize "${size}x${size}" -quality 80 "public/img/role/${size}x${size}/${name}.webp"
  echo "Created public/img/role/${size}x${size}/${name}.webp"
done
