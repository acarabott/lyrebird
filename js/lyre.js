/*jslint newcap: true, plusplus: true, passfail: true, browser: true, devel: true, indent: 4, maxlen: 100 */
/*global webkitAudioContext: false, createJRemixer: false, jQuery: false, $: false,
		Waveform: false, Float32Array: false*/
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
		this.currentType = this.analysisTypes[0];
		this.audioData = [];
		this.audioContext = null;
		this.remixer = null;
		this.source = null;
		this.track = null;
		this.cWidth = null;
		this.cHeight = null;
		this.$canvas = null;
		this.canvas = null;
		this.context = null;
		this.secondWave = null;
	}

	Lyrebird.prototype.init = function () {
		this.audioInit();
	};

	Lyrebird.prototype.audioInit = function () {
		this.initPlayback();
		this.initEchonest();
	};

	Lyrebird.prototype.initPlayback = function () {
		var self = this,
			request = new XMLHttpRequest();

		this.audioContext = new webkitAudioContext();
		this.source = this.audioContext.createBufferSource;

		request.open('GET', trackURL, true);
		request.responseType = 'arraybuffer';
		request.onload = function () {
			self.audioContext.decodeAudioData(request.response, function (buffer) {
				var i;

				for (i = 0; i < buffer.numberOfChannels; i++) {
					self.audioData[i] = new Float32Array(buffer.getChannelData(i));
				}

				self.source = self.audioContext.createBufferSource();
				self.source.buffer = buffer;
				self.source.loop = true;
				self.source.connect(self.audioContext.destination);
				// self.source.noteOn(context.currentTime);
			});
		};
		request.send();
	};

	Lyrebird.prototype.initEchonest = function () {
		var self = this;

		this.remixer = createJRemixer(this.audioContext, $, apiKey);

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

	Lyrebird.prototype.createWaveformPoints = function () {
		var dur, pos, i, j, type;

		this.cWidth = parseFloat(this.$canvas.width(), 10);
		this.cHeight = parseFloat(this.$canvas.height(), 10);
		dur = this.track.buffer.duration;

		for (i = 0; i < this.analysisTypes.length; i++) {
			type = this.analysisTypes[i];
			this.waveformPoints[type] = [];
			for (j = 0; j < this.track.analysis[type].length; j++) {
				pos = (parseFloat(this.track.analysis[type][j].start, 10) / dur) * this.cWidth;
				this.waveformPoints[type].push(pos);
			}
		}
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
			self.drawLines();

			self.secondWave = new Waveform({
				container: document.getElementById('secondCanvasContainer'),
				data: self.waveformData.slice(
					self.waveformData.length * 0.5,
					self.waveformData.length * 0.51
				)
			});

		});
	};

	Lyrebird.prototype.drawLines = function () {
		var i, points;

		points = this.waveformPoints[this.currentType];

		this.context.beginPath();
		this.context.strokeStyle = 'red';

		for (i = 0; i < points.length; i++) {
			this.context.moveTo(points[i], 0);
			this.context.lineTo(points[i], this.cHeight);
		}

		this.context.closePath();
		this.context.stroke();
	};

	Lyrebird.prototype.getMousePos = function (canvas, evt) {
		var rect = this.canvas.getBoundingClientRect();

		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	};

	Lyrebird.prototype.cloneAudioData = function (startFrame, endFrame) {
		var length, data, clone, i, j;

		length = endFrame - startFrame;
		clone = [];

		if (length > 0) {
			for (i = 0; i < this.audioData.length; i++) {
				clone[i] = new Float32Array(length);
				for (j = 0; j < length; j++) {
					clone[i][j] = this.audioData[i][startFrame + j];
				}
			}
		}

		return clone;
	};

	lyrebird = new Lyrebird();
	lyrebird.init();
});
