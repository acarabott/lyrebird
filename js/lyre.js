/*jslint newcap: true, plusplus: true, passfail: true, browser: true, devel: true, indent: 4, maxlen: 100 */
/*global webkitAudioContext: false, createJRemixer: false, jQuery: false, $: false,
		Waveform: false */
var apiKey = 'YLTCU72SODVIC00NB';
var trackID = 'TRFINBO13C52D7A637';
var trackURL = 'audio/something.mp3';
var trackWave = 'data/somethingWave.json';

var remixer, player, track, remixed,
	waveformRequest, waveform, waveformData;

(function () {
	'use strict';
	var context;

	context = new webkitAudioContext();

	remixer = createJRemixer(context, $, apiKey);
	player = remixer.getPlayer();

	remixer.remixTrackById(trackID, trackURL, function (t, percent) {
		track = t;

		$('#info').text(percent + "% of the track loaded");
		if (percent === 100) {
			$('#info').text(percent + "% of the track loaded, remix time");
		}

		// if (track.status === 'ok') {
		// 	console.log(track.analysis);
		// }
	});

	$.getJSON(trackWave, function (data) {
		waveformData = data.mid;
		waveform = new Waveform({
			container: document.getElementById('waveform'),
			data: waveformData.slice(0)
		});
	});

	// waveformRequest = new XMLHttpRequest();
	// waveformRequest.open('GET', trackWave, true);
	// waveformRequest.onload = function () {
	// 	waveformData = $.parseJSON(waveformRequest.response).mid;
	// 	waveform = new Waveform({
	// 		container: document.getElementById('waveform'),
	// 		data: waveformData.slice(0)
	// 	});
	// };
	// waveformRequest.send();
}());