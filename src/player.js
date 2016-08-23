var WAVEFORM_CONTAINER = '#waveform';
var REGION_VISIBLE_COLOR = 'rgba(0, 0, 0, 0.1)';
var REGION_HIDE = 'rgba(0, 0, 0, 0)';


function pad(n) {
    // from here - http://stackoverflow.com/a/8089938/3199099
    return (0 <= n && n < 10) ? ("0" + n) : n.toString();
}

function format_time(time) {
    var minutes = Math.floor(time / 60);
    var seconds = (time - minutes * 60).toFixed(3);
    return minutes + ":" + pad(seconds);
}

function keep_in_bounds(n, bounds) {
    if (n < bounds[0]) {
	return bounds[0];
    } else if (n > bounds[1]) {
	return bounds[1];
    } else {
	return n;
    }
}

function blur_controls() {
    document.querySelectorAll('#main_container button')
	.forEach(function(o, i) { o.blur(); });
}


var AudioPlayer = function() {
    var that = this;

    this.loop_start = 0;
    this.loop_end = 0;
    this.loop_enabled = false;
    this.region = false;
    this.timeline = false;

    this.init = function () {
	that.ws = WaveSurfer.create({
	    container: WAVEFORM_CONTAINER,
	    cursorWidth: 1,
	    height: 128,
	    normalize: true,
	    progressColor: 'lightblue',
	    waveColor: 'lightblue'
	});
	that.timeline = Object.create(WaveSurfer.Timeline);
	that.timeline.init({
	    wavesurfer: that.ws,
	    container: '#waveform_timeline'
	});
	that.ws.on('audioprocess', that.handle_playing);
	that.ws.on('pause', that.handle_pause);
	that.ws.on('seek', function() { that.update_time(); } );
	that.ws.on('ready', function() {
	    that.ws.enableDragSelection();
	    that.ws.on('region-created', that.handle_region_create);
	    that.ws.on('region-removed', that.handle_region_remove);
	    that.update_time(0);
	    that.ws.zoom(0);
	});
    };
    
    this.update_time = function(time) {
	time = time || that.ws.getCurrentTime();
	document.getElementById('time').innerHTML = format_time(time);
    };

    this.handle_playing = function() {
	document.querySelector('#play_pause_btn i.fa-play').style.display = 'none';
	document.querySelector('#play_pause_btn i.fa-pause').style.display = '';
	that.update_time();
    };

    this.handle_pause = function() {
	document.querySelector('#play_pause_btn i.fa-play').style.display = '';
	document.querySelector('#play_pause_btn i.fa-pause').style.display = 'none';
    };

    this.handle_region_create = function(region) {
	Object.keys(that.ws.regions.list).forEach(function(id) {
	    if (region.id !== id) {
		that.ws.regions.list[id].remove();
	    }
	});
	that.region = region;
	that.loop_on();
    };

    this.handle_region_remove = function() {
	that.region = false;
    };
    
    this.set_loop_start = function(time) {
	var loop_start = time || that.ws.getCurrentTime();
	if (that.region) {
	    that.region.update({
		start: loop_start
	    });
	} else {
	    that.region = that.ws.addRegion({
		start: loop_start,
		end: that.ws.getDuration()
	    });
	}
	document.getElementById('loop_start_input')
	    .value = format_time(loop_start);
    };

    this.set_loop_end = function(time) {
	var loop_end = time || that.ws.getCurrentTime();
	if (that.region) {
	    that.region.update({
		end: loop_end
	    });
	} else {
	    that.region = that.ws.addRegion({
		start: 0,
		end: loop_end
	    });
	}
	document.getElementById('loop_end_input')
	    .value = format_time(loop_end);
    };

    this.loop_on = function() {
	if (that.region) {
	    that.region.loop = true;
	    that.region.color = REGION_VISIBLE_COLOR;
	    that.region.updateRender();
	    document.getElementById('loop_enabled')
		.innerHTML = "loop enabled";
	}
    };

    this.loop_off = function() {
	if (that.region) {
	    that.region.loop = false;
	    that.region.color = REGION_HIDE;
	    that.region.updateRender();
	    document.getElementById('loop_enabled')
		.innerHTML = "no loop";
	}
    };
    
    this.dispatch_keypress = function(e) {
	// TODO: make this not so dumb
	if (e.key === " ") {
	    e.preventDefault();
	    that.ws.playPause();
	} else if (e.key === "h") {
	    that.ws.skip(-that.large_scrub_increment());
	} else if (e.key === "j") {
	    that.ws.skip(-that.small_scrub_increment());
	} else if (e.key === "k") {
	    that.ws.skip(that.small_scrub_increment());
	} else if (e.key === "l") {
	    that.ws.skip(that.large_scrub_increment());
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
	    if (that.region) {
		that.set_loop_start(that.region.start - that.small_scrub_increment());
	    }
	} else if (e.key === "U") {
	    // scrub loop start right
	    if (that.region) {
		that.set_loop_start(that.region.start + that.small_scrub_increment());
	    }
	} else if (e.key === "I") {
	    // scrub loop end left
	    if (that.region) {
		that.set_loop_end(that.region.end - that.small_scrub_increment());
	    }
	} else if (e.key === "O") {
	    // scrub loop end right
	    if (that.region) {
		that.set_loop_end(that.region.end + that.small_scrub_increment());
	    }
	} else if (e.key === "o") {
	    if (that.region) {
		that.region.loop ? that.loop_off() : that.loop_on();
	    } else {
		console.log("no region selected");
	    }
	} else if (e.key === "s") {
	    // toggle scrollParent property
	    that.ws.params.scrollParent ? (that.ws.params.scrollParent = false) : (that.ws.scrollParent = true);
	} else if (e.key === "f") {
	    document.getElementById('file_input').click();
	} else if (e.key === "a") {
	    if (that.region) {
		that.ws.seekAndCenter(that.region.start / that.ws.getDuration());
	    }
	} else if (e.key === "0" && !e.shiftKey) {
	    that.ws.seekAndCenter(0);
	} else if (e.key === "$") {
	    that.ws.seekAndCenter(1);
	}
	blur_controls();
    };

    this.dispatch_mouse = function() {

    };

    this.small_scrub_increment = function() {
	var min = 0.01;
	var max = 0.2;
	var zoom = that.ws.params.minPxPerSec;
	var increment = max - (max - min) * zoom / 100;
	return keep_in_bounds(increment, [min, max]);
    };

    this.large_scrub_increment = function() {
	var min = 0.5;
	var max = 5;
	var zoom = that.ws.params.minPxPerSec;
	var increment = max - (max - min) * zoom / 100;
	return keep_in_bounds(increment, [min, max]);
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
    document.getElementById('file_input').addEventListener('change', player.load_audio_file, false);
    document.getElementById('waveform').addEventListener('mousemove', player.dispatch_mouse);
    document.getElementById('skip_back_btn').onclick = function(e) { player.ws.skipBackward(); };
    document.getElementById('play_pause_btn').onclick = function(e) { player.ws.playPause(); };
    document.getElementById('skip_forward_btn').onclick = function(e) {	player.ws.skipForward(); };
    document.getElementById('zoom_in_btn').onclick = function(e) { player.zoom_in(); };
    document.getElementById('zoom_out_btn').onclick = function(e) { player.zoom_out(); };
});
