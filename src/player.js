var WAVEFORM_CONTAINER = '#waveform';


function pad(n) {
    return (0 <= n && n < 10) ? ("0" + n) : n.toString();
}


var AudioPlayer = function() {
    var that = this;

    this.loop_start = 0;
    this.loop_end = 0;
    this.loop_enabled = false;

    this.init = function () {
	that.wavesurfer = WaveSurfer.create({
	    container: WAVEFORM_CONTAINER,
	    height: 128,
	    normalize: true,
	    progressColor: 'darkblue',
	    waveColor: 'blue'
	});
	that.wavesurfer.on('audioprocess', that.handle_playing);
	that.wavesurfer.on('seek', that.update_time);
	that.wavesurfer.on('ready', function() { that.update_time(0); });
	that.wavesurfer.load('../untitled.mp3');
	that.wavesurfer.on('ready', function() {
	    that.loop_end = that.wavesurfer.getDuration() / 2;
	});
    };
    
    this.update_time = function(time) {
	time = time || that.wavesurfer.getCurrentTime();
	var minutes = Math.floor(time / 60);
	var seconds = (time - minutes * 60).toFixed(3);
	document.getElementById('time').innerHTML = minutes + ":" + pad(seconds);
    };

    this.handle_playing = function() {
	if (that.loop_enabled && that.wavesurfer.getCurrentTime() >= that.loop_end) {
	    setTimeout(function () {
                that.wavesurfer.seekTo(seconds_to_progress(that.loop_start));
            }, 0);
	}
	that.update_time();
    };

    this.set_loop_start = function(time) {
	that.loop_start = time || that.wavesurfer.getCurrentTime();
    };

    this.set_loop_end = function(time) {
	that.loop_end = time || that.wavesurfer.getCurrentTime();
    };

    this.loop_on = function() {
	that.loop_enabled = true;
    };

    this.loop_off = function() {
	that.loop_enabled = false;
    };
    
    this.dispatch_keypress = function(e) {
	if (e.key === " ") {
	    that.wavesurfer.playPause();
	} else if (e.key === "h") {
	    /*
	      TODO: these skip values should depend on the zoom level.
	      Zoomed farther out, they should have a larger effect,
	      up to a max.  Zoomed in they can have more minute control.
	    */
	    that.wavesurfer.skip(-2);
	} else if (e.key === "j") {
	    that.wavesurfer.skip(-0.1);
	} else if (e.key === "k") {
	    that.wavesurfer.skip(0.1);
	} else if (e.key === "l") {
	    that.wavesurfer.skip(2);
	} else if (e.key === "+") {
	    that.zoom_in();
	} else if (e.key === "_") {
	    that.zoom_out();
	} else if (e.key === ")") {
	    that.wavesurfer.zoom(0);
	}
    };

    this.dispatch_mouse = function() {

    };

    this.zoom_in = function() {
	that.wavesurfer.zoom(that.wavesurfer.params.minPxPerSec + 4);
    };

    this.zoom_out = function() {
	that.wavesurfer.zoom(that.wavesurfer.params.minPxPerSec - 4);
    };

    this.load_audio_file = function(e) {
	// adapted from here - http://stackoverflow.com/a/26298948/3199099
	var file = e.target.files[0];
	if (!file) {
	    return;
	}
	that.wavesurfer.loadBlob(file);
    };

    function seconds_to_progress(seconds) {
	return seconds / that.wavesurfer.getDuration();
    }
};


document.addEventListener("DOMContentLoaded", function(event) { 
    player = new AudioPlayer();
    player.init();
    document.addEventListener('keyup', player.dispatch_keypress);
    document.getElementById('file_input')
	.addEventListener('change', player.load_audio_file, false);
    document.getElementById('waveform')
    	.addEventListener('mousemove', player.dispatch_mouse);

    document.getElementById('skip_back_btn').onclick = player.wavesurfer.skipBackward;
    document.getElementById('play_pause_btn').onclick = player.wavesurfer.playPause;
    document.getElementById('skip_forward_btn').onclick = player.wavesurfer.skipForward;
    document.getElementById('zoom_in_btn').onclick = player.zoom_in;
    document.getElementById('zoom_out_btn').onclick = player.zoom_out;
});
