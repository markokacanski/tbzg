// Drawing functions
var drawRatio = 1.0;

function drawLine(x1, y1, x2, y2, width, color) {
	x1 *= drawRatio;
	y1 *= drawRatio;
	x2 *= drawRatio;
	y2 *= drawRatio;
	width *= drawRatio;

	context.beginPath();
	context.moveTo(x1, y1);
	context.lineTo(x2, y2);
	context.lineWidth = width;
	context.strokeStyle = color;
	context.stroke();
}

function drawCircle(x, y, r, color) {
	x *= drawRatio;
	y *= drawRatio;
	r *= drawRatio;

	context.beginPath();
	context.arc(x, y, r, 0, 2 * Math.PI, false);
	context.fillStyle = color;
	context.fill();
}

function drawCircleOutline(x, y, r, width, color) {
	x *= drawRatio;
	y *= drawRatio;
	r *= drawRatio;
	width *= drawRatio;

	context.beginPath();
	context.arc(x, y, r, 0, 2 * Math.PI, false);
	context.lineWidth = width;
	context.strokeStyle = color;
	context.stroke();
}

function drawRect(x, y, w, h, color) {
	x *= drawRatio;
	y *= drawRatio;
	w *= drawRatio;
	h *= drawRatio;

	context.beginPath();
	context.rect(x, y, w, h);
	context.fillStyle = color;
	context.fill();
}

function drawRectOutline(x, y, w, h, lineWidth, color) {
	x *= drawRatio;
	y *= drawRatio;
	w *= drawRatio;
	h *= drawRatio;

	context.beginPath();
	context.rect(x, y, w, h);
	context.lineWidth = lineWidth;
	context.strokeStyle = color;
	context.stroke();
}

function drawText(x, y, text, font, fontSize, color, style, align, baseline) {
	x *= drawRatio;
	y *= drawRatio;
	fontSize *= drawRatio;

	context.font = style + ' ' + fontSize + 'pt ' + font;
	context.fillStyle = color;
	context.textAlign = align;
	context.textBaseline = baseline;
	context.fillText(text, x, y);
}

function loadImage(imagePath, callback) {
	var imageObj = new Image();
	imageObj.onload = callback;
	imageObj.src = imagePath;
	return imageObj;
}

function getImageWidth(image) {
	if (image)
		return image.naturalWidth;

	return 0;
}

function getImageHeight(image) {
	if (image)
		return image.naturalHeight;

	return 0;
}

function drawImage(image, x, y, hflip, vflip) {
	if (!image)
		return;

	if (!hflip)
		hflip = false;
	if (!vflip)
		vflip = false;

	if (hflip) {
		context.scale(-1, 1);
		x = -x - getImageWidth(image);
	}
	if (vflip) {
		context.scale(1, -1);
		y = -y - getImageWidth(image);
	}

	context.drawImage(image, x, y);

	if (hflip) {
		context.scale(-1, 1);
	}
	if (vflip) {
		context.scale(1, -1);
	}
}

function drawImageResized(image, x, y, w, h, hflip, vflip) {
	if (!image)
		return;

	if (!hflip)
		hflip = false;
	if (!vflip)
		vflip = false;

	if (hflip) {
		context.scale(-1, 1);
		x = -x;
		w = -w;
	}
	if (vflip) {
		context.scale(1, -1);
		y = -y;
		h = -h;
	}

	context.drawImage(image, x, y, w, h);

	if (hflip) {
		context.scale(-1, 1);
	}
	if (vflip) {
		context.scale(1, -1);
	}
}

function drawImageCropped(image, sourceX, sourceY, sourceW, sourceH,
	destX, destY, destW, destH, hflip, vflip) {
	if (!image)
		return;

	if (!hflip)
		hflip = false;
	if (!vflip)
		vflip = false;

	if (hflip) {
		context.scale(-1, 1);
		destX = -destX;
		destW = -destW;
	}
	if (vflip) {
		context.scale(1, -1);
		destY = -destY;
		destH = -destH;
	}

	context.drawImage(image,
		sourceX,
		sourceY,
		sourceW,
		sourceH,
		destX,
		destY,
		destW,
		destH);

	if (hflip) {
		context.scale(-1, 1);
	}
	if (vflip) {
		context.scale(1, -1);
	}
}
