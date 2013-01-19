from pyechonest import config

import echonest.remix.audio as audio

config.ECHO_NEST_API_KEY = "YLTCU72SODVIC00NB"
config.ECHO_NEST_CONSUMER_KEY = 'd0fe2f9558fb209037fc49a4227ac81d'
config.ECHO_NEST_SHARED_SECRET = '9QNMqlVDQWWgMjxJVoej0Q'

filename 	= 'audio/something.mp3'
analysis 	= audio.LocalAudioFile(filename)
sections	= analysis.analysis.sections
bars		= analysis.analysis.bars
beats		= analysis.analysis.beats
tempo		= analysis.analysis.tempo
tatums		= analysis.analysis.tatums

for beat in beats:
	print beat