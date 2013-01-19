/*jslint newcap: true, plusplus: true, passfail: true, browser: true, devel: true, indent: 4, maxlen: 100 */
/*global webkitAudioContext: false, createJRemixer: false, jQuery: false, $: false */
var apiKey = 'YLTCU72SODVIC00NB';
var trackID = 'TRFINBO13C52D7A637';
var trackURL = 'audio/something.mp3';

var remixer, player, track, remixed;

(function () {
	'use strict';

	var context = new webkitAudioContext();

	remixer = createJRemixer(context, $, apiKey);
	player = remixer.getPlayer();

	remixer.remixTrackById(trackID, trackURL, function (t, percent) {
		track = t;

		$('#info').text(percent + "% of the track loaded");
		if (percent === 100) {
			$('#info').text(percent + "% of the track loaded, remix time");
		}

		if (track.status === 'ok') {
			console.log(track.analysis);
		}
	});
}());