var s,
	loadButton = document.getElementById('load-btn'),
	saveButton = document.getElementById('save-btn'),
	fileInput = document.getElementById('fileInput'),
	$layerButtons = $('.layer-btn'),
	$ui = $('#ui'),
	activeLayer = $('.layer-btn.active').attr('id'),
	CMD = false,
	DRAGGING = false,
	dragOrigin = {x: 0, y: 0},
	worldMatrix = new Snap.Matrix(),
	filterTint,
	worldGroup,
	bgGroup,
	fgGroup,
	physicsGroup,
	lastimage;

buildSVG();
addListeners();

function buildSVG() {
	s = Snap(window.innerWidth, window.innerHeight);

	filterTint = s.filter(Snap.filter.hueRotate(90));

	worldGroup = s.g();
	bgGroup = s.g();
	fgGroup = s.g();
	physicsGroup = s.g();

	worldGroup.attr({id: "world"});
	bgGroup.attr({id: "bg"});
	fgGroup.attr({id: "fg"});
	physicsGroup.attr({id: "physics"});

	worldGroup.add(bgGroup);
	worldGroup.add(fgGroup);
	worldGroup.add(physicsGroup);
}

function parseSVG() {
	var images,
		i;

	filterTint = s.filter(Snap.filter.hueRotate(90));

	worldGroup = s.select("#world");
	bgGroup = s.select("#bg");
	fgGroup = s.select("#fg");
	physicsGroup = s.select("#physics");

	images = fgGroup.selectAll('image');

	for (i = 0; i < images.length; i += 1) {
		images[i].drag();
	}
}

function addListeners() {
	loadButton.addEventListener('click', handle_loadButton_CLICK);
	saveButton.addEventListener('click', handle_saveButton_CLICK);
	fileInput.addEventListener('change', handle_LOAD);
	document.addEventListener('keydown', handle_KEY_DOWN);
	document.addEventListener('keyup', handle_KEY_UP);
	document.body.addEventListener('dragover', handle_DRAG_OVER);
	document.body.addEventListener('drop', handle_DROP);
	document.body.addEventListener('mousedown', handle_MOUSEDOWN);
	document.body.addEventListener('mouseup', handle_MOUSEUP);
	
	$layerButtons.bind('click', handle_layerBtns_CLICK);
}

function toggleUI(){
	$ui.toggleClass("hidden", 0);
}

function duplicate() {
	if (activeLayer == "layer-fg-btn") {
		var image = lastimage.clone();
		image.drag();
		fgGroup.add(image);
		lastimage = image;
	}
}

function handle_MOUSEDOWN(e) {
	if (DRAGGING == true) {
		dragOrigin.x = e.pageX;
		dragOrigin.y = e.pageY;
		document.body.addEventListener('mousemove', handle_MOUSEMOVE);
	}
}

function handle_MOUSEUP(e) {
	document.body.removeEventListener('mousemove', handle_MOUSEMOVE);
}

function handle_MOUSEMOVE(e) {
	worldMatrix.translate(e.pageX - dragOrigin.x, e.pageY - dragOrigin.y);
	worldGroup.transform(worldMatrix.toTransformString());
	dragOrigin.x = e.pageX;
	dragOrigin.y = e.pageY;
}

function handle_DRAG_OVER(e) {
	e.preventDefault();
}

function handle_DROP(e) {
	e.preventDefault();
	
	var reader = new FileReader();
	reader.addEventListener('load', handle_IMG_LOAD);
	reader.readAsDataURL(e.dataTransfer.files[0]);	
}

function handle_IMG_LOAD(e) {
	var image = s.image(e.target.result, 0, 0);
	
	if (activeLayer == "layer-bg-btn") {
		bgGroup.add(image);
	} else if (activeLayer == "layer-fg-btn") {
		image.drag();
		image.attr({filter: filterTint});
		fgGroup.add(image);
		lastimage = image;
	}
}

function handle_layerBtns_CLICK(e) {
	var $this = $(this);
	
	if ($this.hasClass('active')) {
		$this.toggleClass("visible", 0);
	}
	
	$layerButtons.removeClass('active');
	$this.addClass('active');
	activeLayer = $('.layer-btn.active').attr('id');
	toggleVisibleGroups($this);
}

function toggleVisibleGroups($this) {
	if ($this.hasClass("visible")) {
		switch ($this.attr('id')){
			case "layer-bg-btn":
				bgGroup.attr({opacity: 1});
			break;
			case "layer-fg-btn":
				fgGroup.attr({opacity: 1});
			break;
			case "layer-physics-btn":
				physicsGroup.attr({opacity: 1});
			break;
		}
	} else {
		switch ($this.attr('id')){
			case "layer-bg-btn":
				bgGroup.attr({opacity: 0});
			break;
			case "layer-fg-btn":
				fgGroup.attr({opacity: 0});
			break;
			case "layer-physics-btn":
				physicsGroup.attr({opacity: 0});
			break;
		}
	}
}

function handle_loadButton_CLICK() {
	var evt = document.createEvent("MouseEvents");
	evt.initEvent("click", true, false);
	fileInput.dispatchEvent(evt);
}

function handle_LOAD(e) {
	var reader = new FileReader();
	reader.addEventListener('load', handle_FILE_LOAD);
	reader.readAsText(e.target.files[0]); 
}

function handle_FILE_LOAD(e) {
	var contentString,
		content;
		
	s.remove();

	contentString = e.target.result;
	fragment = Snap.parse(contentString)
	
	document.body.appendChild(fragment.node);

	s = Snap(document.getElementsByTagName('svg')[0]);
	parseSVG();
}

function handle_saveButton_CLICK() {
	var filestring = '',
		blob;
	
	filestring = s.toString();
	blob = new Blob([filestring], {type: "text/plain;charset=utf-8"});	
	saveAs(blob, "level.svg");
}

function handle_KEY_DOWN(e) {
	e.preventDefault();

	console.log(e.keyCode);

	switch(e.keyCode) {
		case 72: //H
			toggleUI();
		break;
		case 32: //SPACE
			DRAGGING = true;
		break;
		case 91: //CMD
			CMD = true;
		break;
		case 68: //D
			if (CMD == true) {
				duplicate();
			}
		break;
	}
}

function handle_KEY_UP(e) {
	switch(e.keyCode) {
		case 32:
			DRAGGING = false;
		break;
		case 91: //CMD
			CMD = false;
		break;
	}
}