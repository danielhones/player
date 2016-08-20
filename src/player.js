var SPACE = 32;
var WAVEFORM_CONTAINER = '#waveform';


function pad(n) {
    return (0 <= n && n < 10) ? ("0" + n) : n.toString();
}

var Player = function() {
    
};

function init_wavesurfer() {
    var wavesurfer = WaveSurfer.create({
	container: WAVEFORM_CONTAINER,
	height: 128,
	normalize: true,
	progressColor: 'darkblue',
	waveColor: 'blue'
    });
    return wavesurfer;
}

function update_time(time) {
    var minutes = Math.floor(time / 60);
    var seconds = (time - minutes * 60).toFixed(3);
    document.getElementById('time').innerHTML = minutes + ":" + pad(seconds);
}

function dispatch_keypress(e) {
    if (e.key === " ") {
	wf.playPause();
    } else if (e.key === "h") {
	/*
	  TODO: these skip values should depend on the zoom level.
	  Zoomed farther out, they should have a larger effect,
	  up to a max.  Zoomed in they can have more minute control.
	*/
	wf.skip(-2);
    } else if (e.key === "j") {
	wf.skip(-0.1);
    } else if (e.key === "k") {
	wf.skip(0.1);
    } else if (e.key === "l") {
	wf.skip(2);
    } else if (e.key === "+") {
	var current_zoom = wf.params.minPxPerSec;
	wf.zoom(current_zoom + 4);
    } else if (e.key === "_") {
	var current_zoom = wf.params.minPxPerSec;
	wf.zoom(current_zoom - 4);
    }
}

function dispatch_mousemove(e) {
    if (e.buttons === 1) {
	// update_time(progress);
    }
}

document.addEventListener("DOMContentLoaded", function(event) { 
    wf = init_wavesurfer();

    wf.on('audioprocess', function() { update_time(wf.getCurrentTime()); });
    wf.on('seek', function() { update_time(wf.getCurrentTime()); });
    // wf.on('ready', function() { wf.play(); });
    wf.on('ready', function() { update_time(0); } );
    wf.load('../untitled.mp3');
    document.addEventListener('keyup', dispatch_keypress);
    document.getElementById('file_input')
	.addEventListener('change', load_audio_file, false);
    document.getElementById('waveform')
    	.addEventListener('mousemove', dispatch_mousemove);
});

function load_audio_file(e) {
    // adapted from here - http://stackoverflow.com/a/26298948/3199099
    var file = e.target.files[0];
    if (!file) {
	return;
    }
    wf.loadBlob(file);
}


