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
		this.selectionContext = null;
		this.secondWave = null;
		this.playbackReady = false;
		this.fadeDur = 0.05;
		this.selection = null;
		this.scriptNode = null;
		this.startTime = null;
		this.selectionData = [0];
		this.selectionLight = '#858686';
		this.selectionDark = '#454646';
		this.$selectionStart = $('#selectionStart');
		this.$selectionEnd = $('#selectionEnd');
		this.$markerButtons = $('.markerButton');
	}

	Lyrebird.prototype.init = function () {
		this.audioInit();
	};

	Lyrebird.prototype.audioInit = function () {
		this.initPlayback();
		this.initEchonest();
		this.createScriptNode();
	};

	Lyrebird.prototype.initPlayback = function () {
		var self = this,
			request = new XMLHttpRequest();

		this.audioContext = new webkitAudioContext();

		request.open('GET', trackURL, true);
		request.responseType = 'arraybuffer';
		request.onload = function () {
			self.audioContext.decodeAudioData(request.response, function (buffer) {
				var i;

				for (i = 0; i < buffer.numberOfChannels; i++) {
					self.audioData[i] = new Float32Array(buffer.getChannelData(i));
				}

				self.createSource(buffer);

				self.playbackReady = true;
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
				$('#info').hide();
			}

			if (self.track.status === 'ok' && self.playbackReady) {
				self.loadWaveformData();
			}
		});
	};

	/**
	 * clone audio data from the original audioData
	 * @param   {number} startFrame the first frame to clone from
	 * @param   {number} endFrame   the frame to stop cloning at (not included in result)
	 * @returns {array}             array of Float32Array containing raw audio data
	 */
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

	Lyrebird.prototype.getFadeMul = function (index, length, fadeOut) {
		var mul;

		if (fadeOut) {
			mul = (length - index) / length;
		} else {
			mul = index / length;
		}

		// square twice to get a more natural quartic curve
		// ref: Miller Puckette: The Theory and Technique of Electronic Music
		// http://crca.ucsd.edu/~msp/techniques/latest/book-html/node70.html
		mul = (mul * mul) * (mul * mul);

		return mul;
	};

	Lyrebird.prototype.createBuffer = function (data) {
		var buffer, i, j, fadeFrames, fIndex;

		buffer = this.audioContext.createBuffer(
			data.length,
			data[0].length * 2,
			this.track.buffer.sampleRate
		);

		fadeFrames = Math.floor(buffer.sampleRate * this.fadeDur);

		for (i = 0; i < data.length; i++) {
			buffer.getChannelData(i).set(data[i]);

			for (j = 0; j < fadeFrames; j++) {
				// Fade In (start of audio)
				buffer.getChannelData(i)[j] *= this.getFadeMul(j, fadeFrames, false);

				fIndex = (data[i].length - fadeFrames) + j;
				//fade out (end of audio, mid buffer)
				buffer.getChannelData(i)[fIndex] *= this.getFadeMul(j, fadeFrames, true);
			}
		}

		return buffer;
	};

	Lyrebird.prototype.createSource = function (buffer) {
		this.source = this.audioContext.createBufferSource();
		this.source.buffer = buffer;
		this.source.loop = true;
		this.source.connect(this.audioContext.destination);
	};

	Lyrebird.prototype.prepareSelection = function (start, end) {
		var sr, startFrame, endFrame, buffer;

		sr = this.track.buffer.sampleRate;
		startFrame = Math.round(start * sr);
		endFrame = Math.round(end * sr);

		buffer = this.createBuffer(this.cloneAudioData(startFrame, endFrame));

		this.createSource(buffer);
	};

	Lyrebird.prototype.playSelection = function () {
		this.startTime = this.audioContext.currentTime;
		this.source.noteOn(this.startTime);
	};

	Lyrebird.prototype.stopSource = function () {
		this.source.noteOff(0);
	};

	Lyrebird.prototype.createWaveformPoints = function () {
		var dur, pos, i, j, type;

		dur = this.track.buffer.duration;

		for (i = 0; i < this.analysisTypes.length; i++) {
			type = this.analysisTypes[i];
			this.waveformPoints[type] = [];
			for (j = 0; j < this.track.analysis[type].length; j++) {
				pos = (parseFloat(this.track.analysis[type][j].start, 10) / dur) * this.cWidth;
				pos = Math.max(pos, 1);
				pos = Math.min(pos, this.cWidth - 1);
				this.waveformPoints[type].push(pos);
			}
		}
	};


	Lyrebird.prototype.drawWaveform = function () {
		var self = this,
			old = $('#canvasContainer canvas');

		if (old.length !== 0) {
			old.remove();
		}

		self.waveform = new Waveform({
			container: document.getElementById('canvasContainer'),
			data: self.waveformData,
			outerColor: '#00C4B3',
			innerColor: '#00A692'
		});

		self.$canvas = $('#canvasContainer canvas');
		self.cWidth = parseFloat(self.$canvas.width(), 10);
		self.cHeight = parseFloat(self.$canvas.height(), 10);

		self.canvas = self.$canvas[0];
		self.context = self.canvas.getContext('2d');
	};

	Lyrebird.prototype.drawSelectionWaveform = function () {
		var self = this;

		self.secondWave = new Waveform({
			container: document.getElementById('secondCanvasContainer'),
			data: self.selectionData,
			innerColor: '#858686;',
			outerColor: '#E9EAEB'
		});

		self.selectionContext = $('#secondCanvasContainer canvas')[0].getContext('2d');
	};

	Lyrebird.prototype.loadWaveformData = function () {
		var self = this;
		$.getJSON(trackWave, function (data) {
			self.waveformData = data.mid;
			self.drawWaveform();
			self.createInterface();
			self.drawSelectionWaveform();
		});
	};

	Lyrebird.prototype.drawLines = function () {
		var i, points;

		points = this.waveformPoints[this.currentType];

		this.context.beginPath();
		this.context.strokeStyle = "rgba(255, 255, 255, 0.8)";

		for (i = 0; i < points.length; i++) {
			this.context.moveTo(points[i], 0);
			this.context.lineTo(points[i], this.cHeight);
		}

		this.context.closePath();
		this.context.stroke();
	};

	Lyrebird.prototype.changeMarkers = function (type) {
		this.currentType = type;
		this.drawWaveform();
		this.drawLines();
		this.addMouseAction();
	};

	Lyrebird.prototype.getMousePos = function (canvas, evt) {
		var rect = this.canvas.getBoundingClientRect();

		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
	};

	Lyrebird.prototype.getSelectionFromMouse = function (mousex) {
		var selection, points, closest, analysis, i;

		points = this.waveformPoints[this.currentType];
		selection = [];

		for (i = 0; i < points.length; i++) {
			if (mousex >= points[i]) {
				closest = i;
			}
		}

		analysis = this.track.analysis[this.currentType][closest];

		selection[0] = parseFloat(analysis.start, 10);

		if (closest < points.length - 0) {
			selection[1] = selection[0] + parseFloat(analysis.duration, 10);
		} else {
			selection[1] = parseFloat(this.track.buffer.duration, 10);
		}

		return selection;
	};

	Lyrebird.prototype.getWaveformDataIndexFromTime = function (time) {
		var index;

		index = time / this.track.buffer.duration;
		index *= this.waveformData.length;
		index = Math.round(index);

		return index;
	};

	Lyrebird.prototype.getSelectionData = function (selection) {
		return this.waveformData.slice(
			this.getWaveformDataIndexFromTime(selection[0]),
			this.getWaveformDataIndexFromTime(selection[1])
		)
	};

	Lyrebird.prototype.zeroPad = function (number) {
		if (number < 10) {
			number = "0" + number;
			number = number.substring(number.length - 2, number.length);
		} else {
			number = number.toString();
		}

		return number;
	};

	Lyrebird.prototype.formatTime = function (seconds) {
		var mins = Math.floor(seconds / 60),
			secs = Math.floor(seconds % 60);

		return mins + ":" + this.zeroPad(secs);
	};

	Lyrebird.prototype.setSelectionTimes = function (selection) {
		var start, end;

		this.$selectionStart.text(this.formatTime(selection[0]));
		this.$selectionEnd.text(this.formatTime(selection[1]));
	};

	Lyrebird.prototype.addMouseAction = function () {
		var self = this;
		this.canvas.addEventListener('mousedown', function (event) {
			self.selection = self.getSelectionFromMouse(self.getMousePos(this, event).x);
			self.selectionData = self.getSelectionData(self.selection);
			self.setSelectionTimes(self.selection);
			self.stopSource();
			self.prepareSelection(self.selection[0], self.selection[1]);
			self.playSelection();
		}, false);
	};

	Lyrebird.prototype.addMarkerButtonActions = function () {
		var self = this;
		this.$markerButtons.click(function (event) {
			var $this = $(this);
			self.changeMarkers($this.attr('id'));
			self.$markerButtons.removeClass('current');
			$this.addClass('current');
		});
	};

	Lyrebird.prototype.createInterface = function () {
		var self = this;

		this.createWaveformPoints();
		this.drawLines();
		this.addMouseAction();
		this.addMarkerButtonActions();
	};

	Lyrebird.prototype.setPlayheadPosition = function () {
		var self = this,
			dur = this.selection[1] - this.selection[0],
			mod = (this.audioContext.currentTime - this.startTime) % dur,
			pos = mod / dur;

		$('#secondCanvasContainer canvas').remove();
		this.secondWave = new Waveform({
			container: document.getElementById('secondCanvasContainer'),
			data: this.selectionData,
			outerColor: '#E9EAEB',
			innerColor: function (wx, wy) {
				return wx <= pos ? self.selectionDark : self.selectionLight;
			}
		});
		// need to update secondcanvas
	};

	Lyrebird.prototype.createScriptNode = function () {
		var self = this;

		this.scriptNode = this.audioContext.createJavaScriptNode(2048, 2, 2);
		this.scriptNode.onaudioprocess = function (event) {
			if (self.startTime !== null) {
				self.setPlayheadPosition();
			}
		};
		this.scriptNode.connect(this.audioContext.destination);
	};

	lyrebird = new Lyrebird();
	lyrebird.init();
});