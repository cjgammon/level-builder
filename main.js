var s,
	loadButton = document.getElementById('load-btn'),
	saveButton = document.getElementById('save-btn'),
	jsonButton = document.getElementById('json-btn'),
	fileInput = document.getElementById('fileInput'),
	$filename = $('#file-name'),
	$imgClassInput = $('#img-class'),
	$layerButtons = $('.layer-btn'),
	$ui = $('#ui'),
	mouse = {x: 0, y: 0},
	currentImg,
	currentRect,
	activeLayerId = $('.layer-btn.active').attr('id'),
	HANDLE_SIZE = 10,
	CMD = false,
	DRAGGING = false,
	DRAG = false,
	DRAG_HANDLE = false,
	dragOrigin = {x: 0, y: 0},
	worldMatrix = new Snap.Matrix(),
	filterTint,
	worldGroup,
	bgGroup,
	fgGroup,
	physicsGroup,
	physicsBg;

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

	physicsBg = s.rect(0, 0, window.innerWidth, window.innerHeight);
	physicsBg.attr({
		id: 'physics-bg',
		fill: 'rgba(0, 255, 0, 0.1)'
	});
	physicsBg.click(handle_physicsLayer_CLICK);
	physicsGroup.add(physicsBg);

	worldGroup.add(bgGroup);
	worldGroup.add(fgGroup);
	worldGroup.add(physicsGroup);
}

function parseSVG() {
	var images,
		rectGroups,
		i,
		rectGroup,
		handle;

	filterTint = s.filter(Snap.filter.hueRotate(90));

	worldGroup = s.select("#world");
	bgGroup = s.select("#bg");
	fgGroup = s.select("#fg");
	physicsGroup = s.select("#physics");
	physicsBg = s.select("#physics-bg");
	physicsBg.click(handle_physicsLayer_CLICK);

	images = fgGroup.selectAll('image');

	for (i = 0; i < images.length; i += 1) {
		images[i].drag();
		images[i].click(handle_img_CLICK);
	}
	
	rectGroups = Snap.selectAll('.physics-block');
	for (i = 0; i < rectGroups.length; i += 1) {
		rectGroup = rectGroups[i];
		rectGroup.drag();
		rectGroup.mousedown(handle_rectGroup_MOUSEDOWN);
		rectGroup.rect = rectGroup.select('.physics-frame');
		
		handle = rectGroup.select('.physics-handle');
		handle.drag();
		handle.mousedown(handle_handle_MOUSEDOWN);
		handle.mouseup(handle_handle_MOUSEUP);
		handle.mousemove(handle_handle_MOUSEMOVE);
		handle.group = rectGroup;
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
	document.body.addEventListener('mousemove', handle_MOUSEMOVE);
	window.addEventListener('resize', handle_RESIZE);
		
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
	} else if (activeLayerId == "layer-physics-btn") {
		
	}
}

function deleteImage() {
	currentImg.remove();
}

function deleteRect() {
	currentRect.remove();	
}

function addRect() {
	var rectGroup,
		rect,
		handle;
		
	deselectRects();
	
	rectGroup = s.g();
	
	rectGroup.transform('translate(' + (mouse.x - worldMatrix.e) + ', ' + (mouse.y - worldMatrix.f) + ')');
	rectGroup.addClass('physics-block');
	rectGroup.mousedown(handle_rectGroup_MOUSEDOWN);
	rectGroup.drag();
	physicsGroup.add(rectGroup);
	currentRect = rectGroup;
	
	rect = s.rect(0, 0, 100, 100);
	rect.attr({
		fill: 'rgba(255, 0, 0, 0.25)',
		stroke: 'white'
	});
	rect.addClass('physics-frame');
	rectGroup.rect = rect;
	rectGroup.add(rect);
	
	handle = s.rect(0, 0, HANDLE_SIZE, HANDLE_SIZE);
	handle.transform('translate(' + (rect.attr('width') - (HANDLE_SIZE / 2)) + ', ' + (rect.attr('height') - (HANDLE_SIZE / 2)) + ')');
	handle.attr({
		fill: 'black',
		stroke: '#ccc',
		cursor: 'pointer'
	});
	handle.addClass('physics-handle');
	handle.group = rectGroup;
	handle.drag();
	handle.mousedown(handle_handle_MOUSEDOWN);
	handle.mouseup(handle_handle_MOUSEUP);
	handle.mousemove(handle_handle_MOUSEMOVE);
	rectGroup.add(handle);
}

function deselectRects() {
	var rectGroups = Snap.selectAll('.physics-block'),
		i;
	
	for (i = 0; i < rectGroups.length; i += 1) {
		console.log(rectGroups);
		rectGroups[i].rect.attr({
			stroke: 'rgba(255, 0, 0, 0.5)'
		});
	}
}

function handle_handle_MOUSEDOWN(e) {
	e.stopPropagation();
	DRAG_HANDLE = true;
	this.group.undrag();
}

function handle_handle_MOUSEUP(e) {
	DRAG_HANDLE = false
	this.group.drag();
}

function handle_handle_MOUSEMOVE(e) {
	var matrix = this.matrix;

	this.group.rect.attr({width: matrix.e + (HANDLE_SIZE / 2)});
	this.group.rect.attr({height: matrix.f + (HANDLE_SIZE / 2)});
}

function handle_rectGroup_MOUSEDOWN() {
	var className;
	
	deselectRects();
	this.rect.attr({
		stroke: 'rgba(255, 255, 255, 1)'
	});
	
	currentRect = this;
	
	className = this.node.className.baseVal.replace('physics-block', '');
	$imgClassInput.val(className);
	this.toBack();
}

function handle_physicsLayer_CLICK() {
	deselectRects();
}

function handle_imgClassInput_CHANGE(e) {
	if (activeLayerId == "layer-fg-btn") {
		currentImg.addClass($imgClassInput.val());
	} else if (activeLayerId == "layer-physics-btn") {
		currentRect.addClass($imgClassInput.val());
	}
}

function handle_MOUSEDOWN(e) {
	if (DRAGGING == true) {
		dragOrigin.x = e.pageX;
		dragOrigin.y = e.pageY;
		DRAG = true;
	}	
}

function handle_MOUSEUP(e) {
	DRAG = false;
	DRAG_HANDLE = false;
}

function handle_MOUSEMOVE(e) {
	mouse = {x: e.pageX, y: e.pageY};
	
	if (DRAG == true) {
		worldMatrix.translate(e.pageX - dragOrigin.x, e.pageY - dragOrigin.y);
		worldGroup.transform(worldMatrix.toTransformString());
		dragOrigin.x = e.pageX;
		dragOrigin.y = e.pageY;
		
		physicsBg.transform('translate(' + -worldMatrix.e + ', ' + -worldMatrix.f + ')');
	}
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
	var reader = new FileReader(),
		name;
		
	reader.addEventListener('load', handle_FILE_LOAD);
	name = e.target.files[0].name.split('.');
	$filename.val(name[0]);
	reader.readAsText(e.target.files[0]); 
}

function handle_FILE_LOAD(e) {
	var contentString,
		matrix;
		
	s.remove();

	contentString = e.target.result;
	fragment = Snap.parse(contentString)
	document.body.appendChild(fragment.node);
	s = Snap(document.getElementsByTagName('svg')[0]);
	parseSVG();
	
	matrix = worldGroup.attr('transform').localMatrix;
	worldMatrix.translate(matrix.e, matrix.f);
	
	physicsBg.transform('translate(' + -worldMatrix.e + ', ' + -worldMatrix.f + ')');
}

function handle_jsonButton_CLICK() {
	var filestring = '',
		blob,
		items,
		item,
		rectGroups,
		rectGroup,
		rectClass,
		i,
		matrix;
	
	filestring += "[";
		
	items = Snap.selectAll('#fg>image');
	for (i = 0; i < items.length; i += 1) {
		item = items[i];
				
		matrix = item.attr('transform').localMatrix;		
		filestring += '{cl: "' + item.node.className.baseVal + '", x: ' + matrix.e + ', y: ' + matrix.f + '}';
		
		if (i < items.length - 1) {
			filestring += ",";
		}
	}
	
	filestring += "]";
	filestring += "\n";
	filestring += "[";
	
	//get all groups
	rectGroups = Snap.selectAll('#physics>.physics-block');
	for (i = 0; i < rectGroups.length; i += 1) {
		rectGroup = rectGroups[i];
		rectClass = rectGroup.node.className.baseVal.replace('physics-block', '');
		rectClass = rectClass.replace(" ", "");
		
		matrix = rectGroup.attr('transform').localMatrix;	
		filestring += '{cl: "' + rectClass + '", x: ' + matrix.e + ', y: ' + matrix.f + ', w: ' + rectGroup.rect.attr('width') + ', h: ' + rectGroup.rect.attr('height') + '}';
	
		if (i < rectGroups.length - 1) {
			filestring += ",";
		}
	}
	
	filestring += "]";
	
	blob = new Blob([filestring], {type: "text/plain;charset=utf-8"});	
	saveAs(blob, $filename.val() + ".json");
}

function handle_saveButton_CLICK() {
	var filestring = '',
		blob;
	
	filestring = s.toString();
	blob = new Blob([filestring], {type: "text/plain;charset=utf-8"});	
	saveAs(blob, $filename.val() + ".svg");
}

function handle_KEY_DOWN(e) {
	console.log(e.keyCode);

	switch(e.keyCode) {
		case 72: //H
			if (CMD == true) {
				e.preventDefault();
				toggleUI();
			}
		break;
		case 32: //SPACE
			e.preventDefault();
			DRAGGING = true;
		break;
		case 91: //CMD
		case 93:
			e.preventDefault();
			CMD = true;
		break;
		case 68: //D
			if (CMD == true) {
				e.preventDefault();
				duplicate();
			}
		break;
		case 88: //X
			if (CMD == true) {
				e.preventDefault();
				if (activeLayerId == "layer-fg-btn") {
					deleteImage();
				} else if (activeLayerId == "layer-physics-btn") {
					deleteRect();	
				}
			}
		break;
		case 77: //M
			if (CMD == true) {
				e.preventDefault();
				addRect();
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
		case 93:
			CMD = false;
		break;
	}
}

function handle_RESIZE() {
	physicsBg.attr({width: window.innerWidth});
	physicsBg.attr({height: window.innerHeight});
	s.attr({width: window.innerWidth});
	s.attr({height: window.innerHeight});	
}