#!/bin/sh

# make wav
ffmpeg -y -i $1 -vn -acodec pcm_s16le "${1%.*}".wav;

# make waveforn json
b="$(basename $1)";
wav2json --samples 20000 --channels mid -o data/"${b%.*}Wave".json "${1%.*}".wav;