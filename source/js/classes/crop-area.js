'use strict';

crop.factory('cropArea', ['cropCanvas', function (CropCanvas) {
    var CropArea = function (ctx, events) {
        this._ctx = ctx;
        this._events = events;

        this._aspectRatio = null;
        this._minSize = {x: 0, y: 0, w: 80, h: 80};

        this._cropCanvas = new CropCanvas(ctx);

        this._image = new Image();
        this._x = 0;
        this._y = 0;
        this._size = {x: 0, y: 0, w: 200, h: 200};
    };

    /* GETTERS/SETTERS */

    CropArea.prototype.getImage = function () {
        return this._image;
    };
    CropArea.prototype.setImage = function (image) {
        this._image = image;
    };

    CropArea.prototype.getSize = function () {
        return this._size;
    };

    CropArea.prototype.getX = function () {
        return this._x;
    };
    CropArea.prototype.setX = function (x) {
        this._x = x;
        //this._dontDragOutside();
    };

    CropArea.prototype.getY = function () {
        return this._y;
    };
    CropArea.prototype.setY = function (y) {
        this._y = y;
        //this._dontDragOutside();
    };

    CropArea.prototype.getSize = function () {
        return this._size;
    };
    CropArea.prototype.setSize = function (size) {
        size = this._processSize(size);
        if(this._aspectRatio) {
            size.h = size.w / this._aspectRatio;
        }
        this._size = this._preventBoundaryCollision(size);
    };

    CropArea.prototype.setSizeByCorners = function (northWestCorner, southEastCorner) {

        var size = {x: northWestCorner.x,
            y: northWestCorner.y,
            w: southEastCorner.x - northWestCorner.x,
            h: southEastCorner.y - northWestCorner.y};
        this.setSize(size);
    };

    CropArea.prototype.getSouthEastBound = function () {
        return this._southEastBound(this.getSize());
    };

    CropArea.prototype.getPosition = function () {
        return this._size;
    };

    CropArea.prototype.getMinSize = function () {
        return this._minSize;
    };

    CropArea.prototype.getCenterPoint = function () {
        var s = this.getSize();
        return {x: s.x + (s.w / 2),
            y: s.y + (s.h / 2) };
    };

    CropArea.prototype.setCenterPoint = function (point) {
        var s = this.getSize();
        this.setSize({x: point.x - s.w / 2, y: point.y - s.h / 2, w: s.w, h: s.h});
        this._events.trigger('area-resize');
        this._events.trigger('area-move');
    };

    CropArea.prototype.setMinSize = function (size) {
        this._minSize = this._processSize(size);
        this.setSize(this._minSize);
        //not sure we need to set this?
//        this._dontDragOutside();
    };

    /* FUNCTIONS */
    CropArea.prototype._dontDragOutside = function () {
        var h = this._ctx.canvas.height,
            w = this._ctx.canvas.width;
        if (this._size > w) {
            this._size = w;
        }
        if (this._size > h) {
            this._size = h;
        }
        if (this._x < this._size / 2) {
            this._x = this._size / 2;
        }
        if (this._x > w - this._size / 2) {
            this._x = w - this._size / 2;
        }
        if (this._y < this._size / 2) {
            this._y = this._size / 2;
        }
        if (this._y > h - this._size / 2) {
            this._y = h - this._size / 2;
        }
    };

    CropArea.prototype._preventBoundaryCollision = function (size) {
        var canvasH = this._ctx.canvas.height,
            canvasW = this._ctx.canvas.width;

        if (this._areaIsDragging) {
            if (size.x < 0) size.x = 0;
            if (size.y < 0) size.y = 0;
            if (size.x + size.w > canvasW) size.x = canvasW - size.w;
            if (size.y + size.h > canvasH) size.y = canvasH - size.h;
            return size;
        }

        var nw = {x: size.x, y: size.y};
        var se = this._southEastBound(size);

        // check northwest corner
        if (nw.x < 0) {
            nw.x = 0;
        }
        if (nw.y < 0) {
            nw.y = 0;
        }

        // check southeast corner
        if (se.x > canvasW) {
            se.x = canvasW
        }
        if (se.y > canvasH) {
            se.y = canvasH
        }

        var newSize = {x: nw.x,
            y: nw.y,
            w: se.x - nw.x,
            h: se.y - nw.y};

        //finally, enforce 1:1 aspect ratio for square-like selections
        var areaType = this.getType();
        if (areaType === "circle" || areaType === "square") {
            newSize = {x: newSize.x,
                y: newSize.y,
                w: Math.min(newSize.w, newSize.h),
                h: Math.min(newSize.w, newSize.h)};
        }
        //allow to set a user-defined aspect ratio for rectangles
        else if (areaType === "rectangle" && this._aspectRatio !== null) {
            var heightWithRatio = newSize.w / this._aspectRatio;
            if (heightWithRatio < canvasH && se.y < canvasH) {
            }
            else {
                if ((newSize.h * this._aspectRatio) <= canvasW) {
                    newSize.w = newSize.h * this._aspectRatio;
                }
                else {
                    newSize.h = newSize.w / this._aspectRatio;
                }
            }
        }

        return newSize;
    };

    CropArea.prototype._drawArea = function () {
    };

    CropArea.prototype._processSize = function (size) {
        // make this polymorphic to accept a single floating point number
        // for square-like sizes (including circle)
        if (typeof size == "number") {
            size = {
                w: size,
                h: size
            };
        }

        return {
            x: size.x || this._minSize.x,
            y: size.y || this._minSize.y,
            w: size.w || this._minSize.w,
            h: size.h || this._minSize.h
        };
    };

    CropArea.prototype._southEastBound = function (size) {
        return {x: size.x + size.w, y: size.y + size.h};
    };

    CropArea.prototype.draw = function () {
        // draw crop area
        this._cropCanvas.drawCropArea(this._image, this.getCenterPoint(), this._size, this._drawArea);
    };

    CropArea.prototype.processMouseMove = function () {
    };

    CropArea.prototype.processMouseDown = function () {
    };

    CropArea.prototype.processMouseUp = function () {
    };

    return CropArea;
}]);