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
    var buttons = document.querySelectorAll('#main_container button');
    for (var i = 0; i < buttons.length; i++) {
	buttons[i].blur();
    }
}

function open_modal() {
    var modal = document.getElementById('modal_backdrop');
    modal.style.display = "";
}

function close_modal() {
    document.getElementById('modal_backdrop').style.display = "none";
}


var AudioPlayer = function() {
    var that = this;
    
    // bindings format is [keypress, callback, description]
    var DEFAULT_BINDINGS = [
	['space', function(e) { e.preventDefault(); that.ws.playPause(); }, 'toggle play/pause'],
	['h', function() { that.ws.skip(-that.large_scrub_increment()); }, 'large scrub left'],
	['j', function() { that.ws.skip(-that.small_scrub_increment()); }, 'small scrub left'],
	['k', function() { that.ws.skip(that.small_scrub_increment()); }, 'small scrub right'],
	['l', function() { that.ws.skip(that.large_scrub_increment()); }, 'large scrub right'],
	['shift+=', function() { that.zoom_in(); }, 'zoom in on waveform'],
	['shift+-', function() { that.zoom_out(); }, 'zoom out from waveform'],
	['shift+0', function() { that.ws.zoom(0); }, 'reset zoom to fit whole waveform in window'],
	['u', function() { that.set_loop_start(that.ws.getCurrentTime()); }, 'set loop start at current time'],
	['i', function() { that.set_loop_end(that.ws.getCurrentTime()); }, 'set loop end at current time'],
	['o', function() { that.loop_toggle(); }, 'toggle loop on/off'],
	['shift+y',
	 function() {
	    if (that.region) {
		that.set_loop_start(that.region.start - that.small_scrub_increment());
	    }
	 },
	 'scrub loop start left'],
	['shift+u',
	 function() {
	    if (that.region) {
		that.set_loop_start(that.region.start + that.small_scrub_increment());
	    }
	 },
	 'scrub loop start right'],
	['shift+i',
	 function() {
	    if (that.region) {
		that.set_loop_end(that.region.end - that.small_scrub_increment());
	    }
	 },
	 'scrub loop end left'],
	['shift+o',
	 function() {
	     if (that.region) {
		 that.set_loop_end(that.region.end + that.small_scrub_increment());
	     }
	 },
	 'scrub loop end right'
	],
	['s',
	 function() {
	     that.ws.params.autoCenter ? (that.ws.params.autoCenter = false) : (that.ws.params.autoCenter = true);
	 },
	 'toggle auto-center of waveform while playing'],
	['f', function() { document.getElementById('file_input').click(); }, 'choose a file to play'],
	['a', function() { that.jump_to_loop_start(); }, 'jump to start of loop'],
	['shift+[', function() { that.ws.seekAndCenter(0); }, 'jump to start of track'],
	['shift+]', function() { that.ws.seekAndCenter(1); }, 'jump to end of track'],
	['?', open_modal, 'show help'],
	[['x', 'esc'], close_modal, 'close help']
    ];
    this.bindings = [];

    this.set_bindings = function(bindings) {
	bindings = bindings || DEFAULT_BINDINGS;
	var key_help = document.querySelector('#keyboard_shortcuts table tbody');
	bindings.forEach(function(b, i) {
	    var key = b[0],
		func = b[1],
		desc = b[2];
	    that.bindings.push({
		key: key,
		description: desc
	    });
	    var newrow = "<tr><td><code>" + key.toString().replace('+', ' + ') + "</code></td><td>" + desc + "</td></tr>";
	    key_help.innerHTML += newrow;
	    Mousetrap.bind(key, func);
	});
    };

    
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
	that.ws.on('loading', function() {
	    document.getElementById('time').innerHTML =
		'<i class="fa fa-spinner fa-pulse"></i>';
	});
	that.ws.on('ready', function() {
	    that.ws.enableDragSelection();
	    that.ws.on('region-created', that.handle_region_create);
	    that.ws.on('region-removed', that.handle_region_remove);
	    that.ws.on('region-updated', function() { that.update_loop_indicators(); });
	    that.update_time(0);
	    that.ws.zoom(0);
	});
	that.set_bindings();
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
	that.update_loop_indicators();
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
	that.loop_on();
	that.update_loop_indicators();
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
	that.loop_on();
	that.update_loop_indicators();
    };

    this.loop_toggle = function() {
	if (that.region) {
	    that.region.loop ? that.loop_off() : that.loop_on();
	} else {
	    console.log("no region selected");
	}
    };

    this.loop_on = function() {
	if (that.region) {
	    that.region.loop = true;
	    that.region.color = REGION_VISIBLE_COLOR;
	    that.region.updateRender();
	    document.getElementById('loop_indicators').style.display = '';
	}
    };

    this.loop_off = function() {
	if (that.region) {
	    that.region.loop = false;
	    that.region.color = REGION_HIDE;
	    that.region.updateRender();
	    document.getElementById('loop_indicators').style.display = 'none';
	}
    };

    this.update_loop_indicators = function() {
	var start_time = that.region ? that.region.start : "";
	var end_time = that.region ? that.region.end : "";
	document.getElementById('loop_start_indicator')
	    .innerHTML = format_time(start_time);
	document.getElementById('loop_end_indicator')
	    .innerHTML = format_time(end_time);
    };

    this.jump_to_loop_start = function() {
	if (that.region) { that.ws.seekAndCenter(that.region.start / that.ws.getDuration()); }
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
	that.ws.zoom(keep_in_bounds(that.ws.params.minPxPerSec + 4, [0, 140]));
    };

    this.zoom_out = function() {
	that.ws.zoom(keep_in_bounds(that.ws.params.minPxPerSec - 4, [0, 140]));
    };

    this.load_audio_file = function(e) {
	// adapted from here - http://stackoverflow.com/a/26298948/3199099
	that.loop_off();
	e.target.blur();
	var file = e.target.files[0];
	if (!file) {
	    return;
	}
	that.ws.loadBlob(file);
	document.getElementById('filename').innerHTML = file.name;
    };

    function seconds_to_progress(seconds) {
	return seconds / that.ws.getDuration();
    }
};


document.addEventListener("DOMContentLoaded", function(event) { 
    player = new AudioPlayer();
    player.init();

    document.getElementById('file_input').addEventListener('change', player.load_audio_file, false);
    document.getElementById('load_file_btn').onclick = function(e) {
	document.getElementById('file_input').click();
    };
    document.getElementById('filename').onclick = function(e) {
	document.getElementById('file_input').click();
    };
    document.getElementById('skip_back_btn').onclick = function(e) { player.ws.skipBackward(); };
    document.getElementById('play_pause_btn').onclick = function(e) { player.ws.playPause(); };
    document.getElementById('skip_forward_btn').onclick = function(e) {	player.ws.skipForward(); };
    document.getElementById('loop_toggle_btn').onclick = function(e) {	player.loop_toggle(); };
    document.getElementById('loop_start_indicator').onclick = player.jump_to_loop_start;
    document.getElementById('zoom_in_btn').onclick = function(e) { player.zoom_in(); };
    document.getElementById('zoom_out_btn').onclick = function(e) { player.zoom_out(); };
    document.getElementById('help_btn').onclick = function(e) { open_modal(); };
    document.getElementById('modal_close_btn').onclick = function(e) { close_modal(); };
});
