var s,
	loadButton = document.getElementById('load-btn'),
	saveButton = document.getElementById('save-btn'),
	jsonButton = document.getElementById('json-btn'),
	fileInput = document.getElementById('fileInput'),
	$imgClassInput = $('#img-class'),
	$layerButtons = $('.layer-btn'),
	$ui = $('#ui'),
	//$currentImg,
	currentImg,
	activeLayerId = $('.layer-btn.active').attr('id'),
	CMD = false,
	DRAGGING = false,
	dragOrigin = {x: 0, y: 0},
	worldMatrix = new Snap.Matrix(),
	filterTint,
	worldGroup,
	bgGroup,
	fgGroup,
	physicsGroup;

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
		images[i].click(handle_img_CLICK);
	}
}

function addListeners() {
	loadButton.addEventListener('click', handle_loadButton_CLICK);
	saveButton.addEventListener('click', handle_saveButton_CLICK);
	jsonButton.addEventListener('click', handle_jsonButton_CLICK);
	
	fileInput.addEventListener('change', handle_LOAD);
	document.addEventListener('keydown', handle_KEY_DOWN);
	document.addEventListener('keyup', handle_KEY_UP);
	document.body.addEventListener('dragover', handle_DRAG_OVER);
	document.body.addEventListener('drop', handle_DROP);
	document.body.addEventListener('mousedown', handle_MOUSEDOWN);
	document.body.addEventListener('mouseup', handle_MOUSEUP);
	
	$imgClassInput.on('change', handle_imgClassInput_CHANGE);
	$layerButtons.click(handle_layerBtns_CLICK);
}

function toggleUI(){
	$ui.toggleClass("hidden", 0);
}

function duplicate() {
	if (activeLayerId == "layer-fg-btn") {
		var image = currentImg.clone();
		image.click(handle_img_CLICK);
		image.drag();
		fgGroup.add(image);
		currentImg = image;
	}
}

function handle_imgClassInput_CHANGE(e) {
	currentImg.node.className.baseVal = $imgClassInput.val();
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
	
	if (activeLayerId == "layer-bg-btn") {
		bgGroup.add(image);
	} else if (activeLayerId == "layer-fg-btn") {
		image.drag();
		image.bind('click', handle_img_CLICK);
		image.attr({filter: filterTint});
		fgGroup.add(image);
		currentImg = image;
	}
}

function handle_img_CLICK() {
	var $this = $(this);
		
	currentImg = this;
	$imgClassInput.val(this.node.className.baseVal);
}

function handle_layerBtns_CLICK(e) {
	var $this = $(this);
	
	if ($this.hasClass('active')) {
		$this.toggleClass("visible", 0);
	}
	
	$layerButtons.removeClass('active');
	$this.addClass('active');
	activeLayerId = $('.layer-btn.active').attr('id');
	toggleVisibleGroups($this);
}

function toggleVisibleGroups($this) {
	var group;
	
	if ($this.hasClass("visible")) {
		switch ($this.attr('id')){
			case "layer-bg-btn":
				group = bgGroup;
			break;
			case "layer-fg-btn":
				group = fgGroup;
			break;
			case "layer-physics-btn":
				group = physicsGroup;
			break;
		}
		group.attr({opacity: 1, 'pointer-events': 'auto'});
		
	} else {
		switch ($this.attr('id')){
			case "layer-bg-btn":
				group = bgGroup;
			break;
			case "layer-fg-btn":
				group = fgGroup;
			break;
			case "layer-physics-btn":
				group = physicsGroup;
			break;
		}
		group.attr({opacity: 0, 'pointer-events': 'none'});
		
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
	var contentString;
		
	s.remove();

	contentString = e.target.result;
	fragment = Snap.parse(contentString)
	document.body.appendChild(fragment.node);
	s = Snap(document.getElementsByTagName('svg')[0]);
	parseSVG();
}

function handle_jsonButton_CLICK() {
	var filestring = '',
		blob,
		items,
		item,
		i,
		matrix;
	
	filestring += "[";
		
	items = Snap.selectAll('#fg>image');
	for (i = 0; i < items.length; i += 1) {
		item = items[i];
		matrix = item.attr('transform').globalMatrix;		
		filestring += '{cl: "' + item.node.className.baseVal + '", x: ' + matrix.e + ', y: ' + matrix.f + '}';
		
		if (i < items.length - 1) {
			filestring += ",";
		}
	}
	
	filestring += "]";
	
	blob = new Blob([filestring], {type: "text/plain;charset=utf-8"});	
	saveAs(blob, "level.json");
}

function handle_saveButton_CLICK() {
	var filestring = '',
		blob;
	
	filestring = s.toString();
	blob = new Blob([filestring], {type: "text/plain;charset=utf-8"});	
	saveAs(blob, "level.svg");
}

function handle_KEY_DOWN(e) {
	console.log(e.keyCode);

	switch(e.keyCode) {
		case 72: //H
			e.preventDefault();
			toggleUI();
		break;
		case 32: //SPACE
			e.preventDefault();
			DRAGGING = true;
		break;
		case 91: //CMD
			e.preventDefault();
			CMD = true;
		break;
		case 68: //D
			e.preventDefault();
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