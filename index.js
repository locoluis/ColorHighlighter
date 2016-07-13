var ColorHighlighter = function()
{
	var instance = this;
	instance.handleImageLoad = function(e)
	{
		jQuery('body, canvas').css({'cursor': 'wait'});
		var reader = new FileReader();
		reader.onload = function(event){
			var img = new Image();
			img.onload = function() {
				instance.mask.width = instance.buffer.width = img.width;
				instance.mask.height = instance.buffer.height = img.height;
				instance.bufCtx.imageSmoothingEnabled = false;
				instance.bufCtx.drawImage(img, 0, 0);
				instance.computeMask();
				jQuery('[href="#home"]').click();
				jQuery('body, canvas').css({'cursor': 'auto'});
			};
			img.src = event.target.result;
		};
		reader.readAsDataURL(e.target.files[0]);	 
	};
	instance.handleURLLoad = function(e)
	{
		jQuery('body, canvas').css({'cursor': 'wait'});
		var url = jQuery('#imageURL').val();
		var img = new Image();
		img.onload = function() {
			instance.mask.width = instance.buffer.width = img.width;
			instance.mask.height = instance.buffer.height = img.height;
			instance.bufCtx = instance.buffer.getContext('2d');
			instance.bufCtx.imageSmoothingEnabled = false;
			instance.bufCtx.drawImage(img, 0, 0);
			instance.computeMask();
			jQuery('[href="#home"]').click();
			jQuery('body, canvas').css({'cursor': 'auto'});
		};
		img.src = url + '?' + new Date().getTime();
		img.setAttribute('crossOrigin', '');
	};
	instance.computeMask = function()
	{
		jQuery('body, canvas').css({'cursor': 'wait'});
		setTimeout(function() {
			var src = instance.bufCtx.getImageData(0, 0, instance.buffer.width, instance.buffer.height);
			var dst = instance.maskCtx.getImageData(0, 0, instance.buffer.width, instance.buffer.height);
			var red = 1 * jQuery('#red').val();
			var green = 1 * jQuery('#green').val();
			var blue = 1 * jQuery('#blue').val();
			var thr = 1 * jQuery('#thr').val();
			var lt = ((0.3 * red + 0.59 * green + 0.11 * blue) >= 127.5) ? 0 : 255;
			for(var i = 0; i < instance.buffer.width * instance.buffer.height * 4; i+=4) {
				var dr = red - src.data[i];
				var dg = green - src.data[i + 1];
				var db = blue - src.data[i + 2];
				var dx = Math.sqrt(dr * dr + dg * dg + db * db);
				var okay = dx <= thr;
				if(okay) {
					for(var j = 0; j < 4; j++) {
						dst.data[i + j] = src.data[i + j];
					}
				} else {
					for(var j = 0; j < 3; j++) {
						dst.data[i + j] = (lt * 3 + src.data[i + j]) >> 2;
					}
					dst.data[i + 3] = 255;
				}
			}
			instance.maskCtx.putImageData(dst, 0, 0);
			instance.update();
		}, 10);
	};
	instance.update = function()
	{
		instance.zoom = jQuery('#zoom').val() / 100.0;
		var bgcolor = 'rgb(' + jQuery('#red').val() + ',' + jQuery('#green').val() + ',' + jQuery('#blue').val()+ ')';
		jQuery('#color').css({'background-color': bgcolor});
		instance.mask.style.width = instance.buffer.style.width = (instance.zoom * instance.buffer.width) + 'px';
		instance.mask.style.height = instance.buffer.style.height = (instance.zoom * instance.buffer.height) + 'px';
		jQuery('body, canvas').css({'cursor': 'auto'});
	};
	instance.resize = function()
	{
		instance.update();
	};
	instance.getPosition = function(event)
	{
		var p = jQuery(instance.mask).offset();
		var x = event.pageX - p.left;
		var y = event.pageY - p.top;
		return {"x": Math.floor(x / instance.zoom), "y": Math.floor(y / instance.zoom)};
	};
	instance.click = function(event)
	{
		event.preventDefault();
		var p = instance.getPosition(event);
		var pix = instance.bufCtx.getImageData(p.x, p.y, 1, 1).data;
		instance.manualChange = false;
		jQuery('#red').val(pix[0]).trigger('change');
		jQuery('#green').val(pix[1]).trigger('change');
		jQuery('#blue').val(pix[2]).trigger('change');
		instance.manualChange = true;
		instance.computeMask();
	};
	instance.manualChange = true;
	instance.down = false;
	instance.zoom = 1;
	instance.color = {"r": 0, "g": 0, "b": 0};
	instance.mask = document.getElementById('arena');
	instance.mask.width = 640;
	instance.mask.height = 480;
	instance.maskCtx = instance.mask.getContext('2d');
	instance.maskCtx.imageSmoothingEnabled = false;
	instance.buffer = document.createElement('canvas');
	instance.buffer.width = 640;
	instance.buffer.height = 480;
	instance.bufCtx = instance.buffer.getContext('2d');
	instance.bufCtx.imageSmoothingEnabled = false;
	jQuery('#imageLoader').change(instance.handleImageLoad);
	jQuery('#imageURL').change(instance.handleURLLoad);
	jQuery('#arena').bind('vclick', instance.click);
	
	var ss = ["red", "green", "blue", "thr"];
	for(var i = 0; i < ss.length; i++) {
		(function() {
			var si = ss[i];
			if(typeof noUiSlider != 'undefined') {
				var dd = "slider" + si.substring(0, 1).toUpperCase() + si.substring(1);
				var de = document.getElementById(dd);
				noUiSlider.create(de, {
					start: [ jQuery('#' + si).val() ],
					step: 1,
					range: {
						'min': 0,
						'max': 255
					}
				});
				de.noUiSlider.on('update', function(values, handle) {
					jQuery('#' + si).val(Math.floor(values[handle]));
				});
				de.noUiSlider.on('change', function(values, handle) {
					instance.computeMask();
				});
			}
			jQuery('#' + si).change(function() {
				if(typeof noUiSlider != 'undefined') {
					de.noUiSlider.set([this.value]);
				}
				if(instance.manualChange) {
					instance.computeMask();
				}
			});
		})();
	}
	(function() {
		var si = "zoom";
		if(typeof noUiSlider != 'undefined') {
			var dd = "slider" + si.substring(0, 1).toUpperCase() + si.substring(1);
			var de = document.getElementById(dd);
			noUiSlider.create(de, {
				start: Math.log(jQuery('#' + si).val()) / Math.log(10.0),
				step: 0.1,
				range: {
					'min': 1,
					'max': 3
				}
			});
			de.noUiSlider.on('update', function(values, handle) {
				jQuery('#' + si).val(Math.floor(Math.pow(10.0, values[handle])));
			});
			de.noUiSlider.on('change', function(values, handle) {
				instance.update();
			});
		}
		jQuery('#' + si).change(function() {
			if(typeof noUiSlider != 'undefined') {
				de.noUiSlider.set(Math.log(this.value) / Math.log(10.0));
			}
			instance.update();
		});
	})();
	jQuery(window).resize(instance.resize);
	instance.resize();
};

jQuery(document).ready(function() {
	window.colorHighlighter = new ColorHighlighter();
	jQuery(document).on('swipeleft swiperight', function(event) {
		event.stopPropagation();
		event.preventDefault();
	});
	jQuery('form').submit(function(event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	});
	jQuery('.movable .panel-heading, .movable .panel-heading *').on('mousedown vmousedown', function(event) {
		event.stopPropagation();
		event.preventDefault();
		var startTime = new Date().getTime();
		var movable = jQuery(this).parents('.movable').eq(0);
		var start = {"x": event.pageX, "y": event.pageY};
		var startpos = movable.offset();
		jQuery(window).on('mousemove.panel vmousemove.panel', function(event) {
			event.stopPropagation();
			event.preventDefault();
			var current = {"x": event.pageX, "y": event.pageY};
			var to = {'left': (startpos.left + current.x - start.x) + 'px', 'top': (startpos.top + current.y - start.y) + 'px'};
			movable.css(to);
		});
		jQuery(window).one('mouseup vmouseup', function(event) {
			var stopTime = new Date().getTime();
			if((stopTime - startTime) < 100) {
				if(movable.find('.panel-body').is(':visible')) {
					movable.find('.panel-body').slideUp();
				} else {
					movable.find('.panel-body').slideDown();
				}
			}
			jQuery(window).off('mousemove.panel');
			jQuery(window).off('vmousemove.panel');
		});
	});
	var m = window.location.href.match(/[?&]url=([^&]+)/);
	if(m) {
		setTimeout(function() {
			jQuery('#imageURL').val(decodeURIComponent(m[1])).trigger('change');
		}, 500);
	}
});
