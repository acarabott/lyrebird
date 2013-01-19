/*jslint newcap: true, plusplus: true, passfail: true, browser: true, devel: true, indent: 4, maxlen: 100 */
/*global webkitAudioContext: false, createJRemixer: false, jQuery: false, $: false,
		Waveform: false */
var apiKey = 'YLTCU72SODVIC00NB';
var trackID = 'TRFINBO13C52D7A637';
var trackURL = 'audio/something.mp3';
var trackWave = 'data/somethingWave.json';

var remixer, player, track, remixed,
	$canvas, canvas, context,
	waveformRequest, waveform, waveformData,
	waveformPoints, mousePos,
	secondWave;

jQuery(document).ready(function ($) {
	'use strict';
	var audioContext;

	function getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	}

	function drawSections(track) {
		var type, types, cWidth, cHeight, dur, pos, i;

		cWidth = parseFloat($canvas.width(), 10);
		cHeight = parseFloat($canvas.height(), 10);
		dur = track.buffer.duration;

		types = {
			sections: {
				color: "yellow"
			},
			bars: {
				color: "gray",
				show: "true"
			},
			beats: {
				color: "blue"
			},
			fsegments: {
				color: "green"
			},
			tatums : {
				color: "orange"
			}
		};

		context.beginPath();

		for (type in types)	{
			if (types.hasOwnProperty(type)) {
				if (types[type].hasOwnProperty('color')) {
					context.strokeStyle = types[type].color;
				} else {
					context.strokeStyle = 'red';
				}

				// testing
				if (types[type].hasOwnProperty('show')) {
					for (i = 0; i < track.analysis[type].length; i++) {
						pos = parseFloat(track.analysis[type][i].start, 10);
						pos = pos / dur;
						pos = pos * cWidth;

						context.moveTo(pos, 0);
						context.lineTo(pos, cHeight);
					}
				}

			}
		}

		context.closePath();
		context.stroke();
	}

	function drawWaveform() {
		$.getJSON(trackWave, function (data) {
			waveformData = data.mid;
			waveform = new Waveform({
				container: document.getElementById('canvasContainer'),
				data: waveformData.slice(0)
			});

			$canvas = $('#canvasContainer canvas');
			canvas = $canvas[0];
			context = canvas.getContext('2d');

			canvas.addEventListener('mousedown', function (evt) {
				mousePos = getMousePos(canvas, evt);
			}, false);

			// drawSections(track);


			secondWave = new Waveform({
				container: document.getElementById('secondCanvasContainer'),
				data: waveformData.slice(waveformData.length * 0.5, waveformData.length * 0.51)
			});

		});
	}


	audioContext = new webkitAudioContext();
	drawWaveform();
	// remixer = createJRemixer(audioContext, $, apiKey);
	// player = remixer.getPlayer();

	// remixer.remixTrackById(trackID, trackURL, function (t, percent) {
	// 	track = t;

	// 	$('#info').text(percent + "% of the track loaded");
	// 	if (percent === 100) {
	// 		$('#info').text(percent + "% of the track loaded, remix time");
	// 	}

	// 	if (track.status === 'ok') {
	// 		drawWaveform();
	// 	}
	// });


});
