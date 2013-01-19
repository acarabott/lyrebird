/*jslint newcap: true, plusplus: true, passfail: true, browser: true, devel: true, indent: 4, maxlen: 100 */
/*global webkitAudioContext: false, createJRemixer: false, jQuery: false, $: false,
		Waveform: false */
var apiKey = 'YLTCU72SODVIC00NB';
var trackID = 'TRFINBO13C52D7A637';
var trackURL = 'audio/something.mp3';
var trackWave = 'data/somethingWave.json';

var lyrebird;

jQuery(document).ready(function ($) {
	'use strict';
	var audioContext;

	function Lyrebird() {
		this.analysisTypes = ['sections', 'bars', 'beats', 'fsegments', 'tatums'];
		this.waveformPoints = {};
	}

	Lyrebird.prototype.init = function () {
		var self = this;

		this.audioContext = new webkitAudioContext();
		this.remixer = createJRemixer(this.audioContext, $, apiKey);
		this.player = this.remixer.getPlayer();

		this.remixer.remixTrackById(trackID, trackURL, function (t, percent) {
			self.track = t;

			$('#info').text(percent + "% of the track loaded");
			if (percent === 100) {
				$('#info').text(percent + "% of the track loaded, remix time");
			}

			if (self.track.status === 'ok') {
				self.drawWaveform();
			}
		});
	};


	Lyrebird.prototype.getMousePos = function (canvas, evt) {
		var rect = this.canvas.getBoundingClientRect();

		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	};

	Lyrebird.prototype.createWaveformPoints = function () {
		var cWidth, cHeight, dur, pos, i, j, type;

		cWidth = parseFloat(this.$canvas.width(), 10);
		cHeight = parseFloat(this.$canvas.height(), 10);
		dur = this.track.buffer.duration;

		for (i = 0; i < this.analysisTypes.length; i++) {
			type = this.analysisTypes[i];
			this.waveformPoints[type] = [];
			for (j = 0; j < this.track.analysis[type].length; j++) {
				pos = (parseFloat(this.track.analysis[type][j].start, 10) / dur) * cWidth;
				this.waveformPoints[type].push(pos);
			}
		}
	};

	Lyrebird.prototype.drawSections = function (track) {
		var type, types, cWidth, cHeight, dur, pos, i;

		cWidth = parseFloat(this.$canvas.width(), 10);
		cHeight = parseFloat(this.$canvas.height(), 10);
		dur = this.track.buffer.duration;

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

		this.context.beginPath();

		for (type in types)	{
			if (types.hasOwnProperty(type)) {
				if (types[type].hasOwnProperty('color')) {
					this.context.strokeStyle = types[type].color;
				} else {
					this.context.strokeStyle = 'red';
				}

				// testing
				if (types[type].hasOwnProperty('show')) {
					for (i = 0; i < track.analysis[type].length; i++) {
						pos = parseFloat(track.analysis[type][i].start, 10);
						pos = pos / dur;
						pos = pos * cWidth;

						this.context.moveTo(pos, 0);
						this.context.lineTo(pos, cHeight);
					}
				}

			}
		}

		this.context.closePath();
		this.context.stroke();
	};

	Lyrebird.prototype.drawWaveform = function () {
		var self = this;

		$.getJSON(trackWave, function (data) {
			self.waveformData = data.mid;
			self.waveform = new Waveform({
				container: document.getElementById('canvasContainer'),
				data: self.waveformData.slice(0)
			});

			self.$canvas = $('#canvasContainer canvas');
			self.canvas = self.$canvas[0];
			self.context = self.canvas.getContext('2d');

			self.canvas.addEventListener('mousedown', function (evt) {
				self.mousePos = self.getMousePos(self.canvas, evt);
			}, false);

			self.createWaveformPoints();
			// drawSections(track);

			self.secondWave = new Waveform({
				container: document.getElementById('secondCanvasContainer'),
				data: self.waveformData.slice(
					self.waveformData.length * 0.5,
					self.waveformData.length * 0.51
				)
			});

		});
	};

	lyrebird = new Lyrebird();
	lyrebird.init();
});
