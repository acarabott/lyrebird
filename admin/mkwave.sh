#!/bin/sh

# make wav
ffmpeg -i $1 -vn -acodec pcm_s16le "${1%.*}".wav;

# make waveforn json
b="$(basename $1)";
wav2json --channels mid -o echo "${b%.*}wave".json "${1%.*}".wav;

