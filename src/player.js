var WAVEFORM_CONTAINER = '#waveform';
var SMALL_SCRUB_INCREMENT = 0.1;  // seconds
var LARGE_SCRUB_INCREMENT = 2;  // seconds


function pad(n) {
    return (0 <= n && n < 10) ? ("0" + n) : n.toString();
}


function format_time(time) {
    var minutes = Math.floor(time / 60);
    var seconds = (time - minutes * 60).toFixed(3);
    return minutes + ":" + pad(seconds);
}


var AudioPlayer = function() {
    var that = this;

    this.loop_start = 0;
    this.loop_end = 0;
    this.loop_enabled = false;
    this.region = false;

    this.init = function () {
	that.ws = WaveSurfer.create({
	    container: WAVEFORM_CONTAINER,
	    cursorWidth: 1,
	    height: 128,
	    normalize: true,
	    progressColor: 'lightblue',
	    waveColor: 'lightblue'
	});	
	that.ws.on('audioprocess', that.handle_playing);
	that.ws.on('pause', that.handle_pause);
	that.ws.on('seek', function() { that.update_time(); } );
	that.ws.on('ready', function() {
	    that.ws.enableDragSelection();
	    that.ws.on('region-created', that.handle_region_create);
	    that.ws.on('region-removed', that.handle_region_remove);
	    that.update_time(0);
	    that.set_loop_end(that.ws.getDuration());
	    that.ws.zoom(0);
	});
    };
    
    this.update_time = function(time) {
	time = time || that.ws.getCurrentTime();
	document.getElementById('time').innerHTML = format_time(time);
    };

    this.handle_playing = function() {
	/*
	if (that.loop_enabled && that.ws.getCurrentTime() >= that.loop_end) {
	    setTimeout(function () {
                that.ws.seekTo(seconds_to_progress(that.loop_start));
            }, 0);
	}
	document.getElementById('play_pause_btn').innerHTML = 'pause';
	*/
	that.update_time();
    };

    this.handle_pause = function() {
	document.getElementById('play_pause_btn').innerHTML = 'play';
    };

    this.handle_region_create = function(region) {
	Object.keys(that.ws.regions.list).forEach(function(id) {
	    if (region.id !== id) {
		that.ws.regions.list[id].remove();
	    }
	});
	that.region = region;
    };

    that.handle_region_remove = function() {
	that.region = false;
    };
    
    this.set_loop_start = function(time) {
	that.loop_start = time || that.ws.getCurrentTime();
	if (that.loop_end < that.loop_start) {
	    that.set_loop_end(that.loop_start);
	}
	if (that.loop_start < 0) {
	    that.set_loop_start(0);
	}
	if (that.loop_start > that.ws.getDuration()) {
	    that.set_loop_start(that.ws.getDuration());
	}
	document.getElementById('loop_start_input')
	    .value = format_time(that.loop_start);
    };

    this.set_loop_end = function(time) {
	that.loop_end = time || that.ws.getCurrentTime();
	if (that.loop_end < that.loop_start) {
	    that.set_loop_start(that.loop_end);
	}
	if (that.loop_end < 0) {
	    that.set_loop_end(0);
	}
	if (that.loop_end > that.ws.getDuration()) {
	    that.set_loop_end(that.ws.getDuration());
	}
	document.getElementById('loop_end_input')
	    .value = format_time(that.loop_end);
    };

    this.loop_on = function() {
	that.loop_enabled = true;  // TODO: remove soon
	if (that.region) {
	    that.region.loop = true;
	    document.getElementById('loop_enabled')
		.innerHTML = "loop enabled";
	}
    };

    this.loop_off = function() {
	that.loop_enabled = false;  // TODO: remove soon
	if (that.region) {
	    that.region.loop = false;
	    document.getElementById('loop_enabled')
		.innerHTML = "no loop";
	}
    };
    
    this.dispatch_keypress = function(e) {
	// TODO: make this not so dumb
	if (e.key === " ") {
	    that.ws.playPause();
	} else if (e.key === "h") {
	    that.ws.skip(-2);
	} else if (e.key === "j") {
	    that.ws.skip(-0.1);
	} else if (e.key === "k") {
	    that.ws.skip(0.1);
	} else if (e.key === "l") {
	    that.ws.skip(2);
	} else if (e.key === "+") {
	    that.zoom_in();
	} else if (e.key === "_") {
	    that.zoom_out();
	} else if (e.key === ")") {
	    that.ws.zoom(0);
	} else if (e.key === "u") {
	    // set loop start to current time
	    that.set_loop_start(that.ws.getCurrentTime());
	} else if (e.key === "i") {
	    // set loop end to current time
	    that.set_loop_end(that.ws.getCurrentTime());
	} else if (e.key === "Y") {
	    // scrub loop start left
	    that.set_loop_start(that.loop_start - SMALL_SCRUB_INCREMENT);
	} else if (e.key === "U") {
	    // scrub loop start right
	    that.set_loop_start(that.loop_start + SMALL_SCRUB_INCREMENT);
	} else if (e.key === "I") {
	    // scrub loop end left
	    that.set_loop_end(that.loop_end - SMALL_SCRUB_INCREMENT);
	} else if (e.key === "O") {
	    // scrub loop end right
	    that.set_loop_end(that.loop_end + SMALL_SCRUB_INCREMENT);
	} else if (e.key === "o") {
	    that.loop_enabled ? that.loop_off() : that.loop_on();
	} else if (e.key === "s") {
	    // toggle scrollParent property
	    that.ws.params.scrollParent ? (that.ws.params.scrollParent = false) : (that.ws.scrollParent = true);
	}
    };

    this.dispatch_mouse = function() {

    };

    this.zoom_in = function() {
	that.ws.zoom(that.ws.params.minPxPerSec + 4);
    };

    this.zoom_out = function() {
	that.ws.zoom(that.ws.params.minPxPerSec - 4);
    };

    this.load_audio_file = function(e) {
	// adapted from here - http://stackoverflow.com/a/26298948/3199099
	e.srcElement.blur();
	var file = e.target.files[0];
	if (!file) {
	    return;
	}
	that.ws.loadBlob(file);
    };

    function seconds_to_progress(seconds) {
	return seconds / that.ws.getDuration();
    }
};


document.addEventListener("DOMContentLoaded", function(event) { 
    player = new AudioPlayer();
    player.init();
    document.addEventListener('keydown', player.dispatch_keypress);
    document.getElementById('file_input')
	.addEventListener('change', player.load_audio_file, false);
    document.getElementById('waveform')
    	.addEventListener('mousemove', player.dispatch_mouse);

    document.getElementById('skip_back_btn').onclick = function() { player.ws.skipBackward(); };
    document.getElementById('play_pause_btn').onclick = function() { player.ws.playPause(); };
    document.getElementById('skip_forward_btn').onclick = function() { player.ws.skipForward(); };
    document.getElementById('zoom_in_btn').onclick = player.zoom_in;
    document.getElementById('zoom_out_btn').onclick = player.zoom_out;
});
