class Spheromaniac
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.fixedCircleRadius = 8.0;
        this.rollingCircleRadius = 6.0;
        this.penDistance = 12.0;

        this.xTurns = 4;
        this.xPeriod = 5;
        this.yTurns = 0;
        this.yPeriod = 1;

        this.scale = 200.0;
        this.lineWidth = 3;
        this.loops = 10;
        this.viewMat = mat4.create();
        this.customColor = '#00ffff';

        this.autoRotateX = true;
        this.autoRotateY = true;
        this.autoRotateZ = true;

        this.cameraRotationX = 0.0;
        this.cameraRotationY = 0.0;
        this.cameraRotationZ = 0.0;

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.activeMouseButton = -1;
        this.dragSensitivity = 0.005;
        this.lastPinchDistance = 0;
        this.lastTwistAngle = 0;

        this.animating = false;
        this.animationAngle = 0.0;
        this.animationSpeed = 0.05;
        this.tailLoops = 1;
        this.colorOffset = 0.0;
        this.showAxes = false;
        this.showMechanism = true;
        this.tubeEnabled = false;
        this.tubeRadius = 8;
        this.tubeSides = 6;
        this.facesEnabled = false;
        this.keyboardStep = 0.05;

        this.fixedCircleRadiusInput = null;
        this.rollingCircleRadiusInput = null;
        this.penDistanceInput = null;
        this.penDistanceSlider = null;
        this.xTurnsInput = null;
        this.xTurnsSlider = null;
        this.xPeriodInput = null;
        this.xPeriodSlider = null;
        this.yTurnsInput = null;
        this.yTurnsSlider = null;
        this.yPeriodInput = null;
        this.yPeriodSlider = null;
        this.loopsSlider = null;
        this.loopsInput = null;
        this.tailLoopsSlider = null;
        this.animationSpeedSlider = null;
        this.showMechanismCheck = null;
        this.tubeCheck = null;
        this.tubeRadiusSlider = null;
        this.tubeSidesSlider = null;
        this.facesCheck = null;
        this.cameraXSlider = null;
        this.cameraYSlider = null;
        this.cameraZSlider = null;
        this.scaleSlider = null;
        this.autoRotateXCheck = null;
        this.autoRotateYCheck = null;
        this.autoRotateZCheck = null;
        this.cycleColorCheck = null;
        this.lightModeCheck = null;
        this.colorPickerInput = null;
        this.animateBtn = null;
        this.showAxesCheck = null;
        this.previewCanvas = null;
        this.axesIndicatorCanvas = null;

        this.colorMgr = {
            red: 100,
            green: 200,
            blue: 50,
            radd: 2,
            gadd: -2,
            badd: 2,
            inColor: false,
            fgColor: '',
            randomize: function()
            {
                this.red = 100 + Math.floor(Math.random() * 100);
                this.green = 100 + Math.floor(Math.random() * 100);
                this.blue = 100 + Math.floor(Math.random() * 100);
            },
            flip: function()
            {
                this.inColor = !this.inColor;
            },
            add: function(color, adder)
            {
                color += adder;
                if (color > 255)
                {
                    color = 255;
                    adder *= -1;
                }
                if (color < 100)
                {
                    color = 100;
                    adder *= -1;
                }
                return [color, adder];
            },
            next: function()
            {
                if (!this.inColor)
                    return;
                [this.red, this.radd] = this.add(this.red, this.radd);
                [this.green, this.gadd] = this.add(this.green, this.gadd);
                [this.blue, this.badd] = this.add(this.blue, this.badd);
                this.fgColor = 'rgba(' + this.red + ',' + this.green + ',' + this.blue + ')';
            }
        };
    }

    wrapAngle(angle)
    {
        if (angle < 0)
            angle += 2 * Math.PI;
        if (angle > 2 * Math.PI)
            angle -= 2 * Math.PI;
        return angle;
    }

    greatestCommonDivisor(a, b)
    {
        while (b > 0)
        {
            var t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    calculatePoint(fixedAngle, fixedCircleRadius, rollingCircleRadius, penDistance)
    {
        var rollingAngle = ((fixedCircleRadius - rollingCircleRadius) / rollingCircleRadius) * fixedAngle;
        var x = (fixedCircleRadius - rollingCircleRadius) * Math.cos(fixedAngle) + penDistance * Math.cos(rollingAngle);
        var y = (fixedCircleRadius - rollingCircleRadius) * Math.sin(fixedAngle) - penDistance * Math.sin(rollingAngle);
        return [x, y];
    }

    applyRotation(penX, penY, fixedAngle)
    {
        var rotX = 0;
        if (this.xTurns != 0 && this.xPeriod != 0)
            rotX = fixedAngle * this.xTurns / this.xPeriod;
        var rotY = 0;
        if (this.yTurns != 0 && this.yPeriod != 0)
            rotY = fixedAngle * this.yTurns / this.yPeriod;
        var modelMat = mat4.create();
        mat4.rotateX(modelMat, modelMat, rotX);
        mat4.rotateY(modelMat, modelMat, rotY);
        var xyz = [penX, penY, 0];
        vec3.transformMat4(xyz, xyz, modelMat);
        return xyz;
    }

    computePenPoint(fixedAngle)
    {
        if (this.fixedCircleRadius == 0 || this.rollingCircleRadius == 0 || this.penDistance == 0)
            return [0, 0];
        var [x, y] = this.calculatePoint(fixedAngle, this.fixedCircleRadius, this.rollingCircleRadius, this.penDistance);
        return [x / this.fixedCircleRadius, y / this.fixedCircleRadius];
    }

    hasFractionalParams()
    {
        if (this.fixedCircleRadius % 1 != 0 || this.rollingCircleRadius % 1 != 0)
            return true;
        if (this.xTurns != 0 && (this.xTurns % 1 != 0 || this.xPeriod % 1 != 0))
            return true;
        if (this.yTurns != 0 && (this.yTurns % 1 != 0 || this.yPeriod % 1 != 0))
            return true;
        return false;
    }

    autoSetLoops()
    {
        if (this.hasFractionalParams())
            return;

        var periods = [];

        if (this.fixedCircleRadius != 0 && this.rollingCircleRadius != 0 && this.penDistance != 0)
        {
            var r1 = Math.abs(Math.round(this.fixedCircleRadius));
            var r2 = Math.abs(Math.round(this.rollingCircleRadius));
            if (r1 > 0 && r2 > 0)
                periods.push(r2 / this.greatestCommonDivisor(r1, r2));
        }
        if (this.xTurns != 0)
            periods.push(Math.abs(this.xPeriod));
        if (this.yTurns != 0)
            periods.push(Math.abs(this.yPeriod));

        if (periods.length == 0)
        {
            this.setLoops(1);
            return;
        }
        var lcm = periods.reduce((a, b) => a * b / this.greatestCommonDivisor(a, b));
        if (lcm > 60)
            lcm = 60;
        this.setLoops(lcm);
    }

    setLoops(value)
    {
        this.loops = Math.round(parseFloat(value));
        this.loopsSlider.value = this.loops;
        this.loopsInput.value = this.loops;
        this.tailLoopsSlider.max = this.loops;
        if (this.tailLoops > this.loops)
        {
            this.tailLoops = this.loops;
            this.tailLoopsSlider.value = this.tailLoops;
        }
    }

    setTailLoops(value)
    {
        var parsed = parseFloat(value);
        if (isNaN(parsed))
            parsed = 0;
        if (parsed < 0)
            parsed = 0;
        if (parsed > this.loops)
            parsed = this.loops;
        this.tailLoops = parsed;
        this.tailLoopsSlider.value = this.tailLoops;
    }

    readAllParams()
    {
        this.fixedCircleRadius = parseFloat(this.fixedCircleRadiusInput.value);
        if (isNaN(this.fixedCircleRadius))
            this.fixedCircleRadius = 0;

        this.rollingCircleRadius = parseFloat(this.rollingCircleRadiusInput.value);
        if (isNaN(this.rollingCircleRadius))
            this.rollingCircleRadius = 0;

        this.penDistance = parseFloat(this.penDistanceInput.value);
        if (isNaN(this.penDistance))
            this.penDistance = 0;

        this.xTurns = parseFloat(this.xTurnsInput.value);
        if (isNaN(this.xTurns))
            this.xTurns = 0;

        this.xPeriod = parseFloat(this.xPeriodInput.value);
        if (isNaN(this.xPeriod))
            this.xPeriod = 0;
        if (this.xPeriod < 0)
            this.xPeriod = 0;

        this.yTurns = parseFloat(this.yTurnsInput.value);
        if (isNaN(this.yTurns))
            this.yTurns = 0;

        this.yPeriod = parseFloat(this.yPeriodInput.value);
        if (isNaN(this.yPeriod))
            this.yPeriod = 0;
        if (this.yPeriod < 0)
            this.yPeriod = 0;

        this.penDistanceSlider.value = this.penDistance;
        this.xTurnsSlider.value = this.xTurns;
        this.xPeriodSlider.value = this.xPeriod;
        this.yTurnsSlider.value = this.yTurns;
        this.yPeriodSlider.value = this.yPeriod;

        this.autoSetLoops();
        this.animationAngle = 0;
        this.updatePreviews();
    }

    adjust(inputEl, amount)
    {
        inputEl.value = parseFloat(inputEl.value) + amount;
        this.readAllParams();
    }

    updateDisplay()
    {
        this.fixedCircleRadiusInput.value = this.fixedCircleRadius;
        this.rollingCircleRadiusInput.value = this.rollingCircleRadius;
        this.penDistanceInput.value = this.penDistance;
        this.penDistanceSlider.value = this.penDistance;
        this.xTurnsInput.value = this.xTurns;
        this.xTurnsSlider.value = this.xTurns;
        this.xPeriodInput.value = this.xPeriod;
        this.xPeriodSlider.value = this.xPeriod;
        this.yTurnsInput.value = this.yTurns;
        this.yTurnsSlider.value = this.yTurns;
        this.yPeriodInput.value = this.yPeriod;
        this.yPeriodSlider.value = this.yPeriod;
    }

    randomColor()
    {
        var hue = Math.floor(Math.random() * 360);
        var lightness = 70;
        if (document.body.classList.contains('light'))
            lightness = 25;
        return 'hsl(' + hue + ', 100%, ' + lightness + '%)';
    }

    hexToHue(hex)
    {
        var r = parseInt(hex.slice(1, 3), 16) / 255;
        var g = parseInt(hex.slice(3, 5), 16) / 255;
        var b = parseInt(hex.slice(5, 7), 16) / 255;
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var delta = max - min;
        if (delta == 0)
            return 0;
        var hue;
        if (max == r)
            hue = ((g - b) / delta) % 6;
        else if (max == g)
            hue = (b - r) / delta + 2;
        else
            hue = (r - g) / delta + 4;
        hue = hue * 60;
        if (hue < 0)
            hue += 360;
        return hue;
    }

    rebuildViewMat()
    {
        mat4.identity(this.viewMat);
        mat4.multiply(this.viewMat, mat4.fromXRotation(mat4.create(), this.cameraRotationX), this.viewMat);
        mat4.multiply(this.viewMat, mat4.fromYRotation(mat4.create(), this.cameraRotationY), this.viewMat);
        mat4.multiply(this.viewMat, mat4.fromZRotation(mat4.create(), this.cameraRotationZ), this.viewMat);
    }

    resetCamera()
    {
        mat4.identity(this.viewMat);
        this.cameraRotationX = 0.0;
        this.cameraRotationY = 0.0;
        this.cameraRotationZ = 0.0;
    }

    stopAutoRotate()
    {
        this.autoRotateX = false;
        this.autoRotateY = false;
        this.autoRotateZ = false;
        this.autoRotateXCheck.checked = false;
        this.autoRotateYCheck.checked = false;
        this.autoRotateZCheck.checked = false;
    }

    setCameraX(value)
    {
        this.cameraRotationX = this.wrapAngle(parseFloat(value));
        this.rebuildViewMat();
        this.stopAutoRotate();
    }

    setCameraY(value)
    {
        this.cameraRotationY = this.wrapAngle(parseFloat(value));
        this.rebuildViewMat();
        this.stopAutoRotate();
    }

    setCameraZ(value)
    {
        this.cameraRotationZ = this.wrapAngle(parseFloat(value));
        this.rebuildViewMat();
        this.stopAutoRotate();
    }

    setCameraPlane(rx, ry, rz)
    {
        this.cameraRotationX = rx;
        this.cameraRotationY = ry;
        this.cameraRotationZ = rz;
        this.rebuildViewMat();
        this.stopAutoRotate();
    }

    applyXYRotation(deltaX, deltaY)
    {
        var rotY = mat4.fromYRotation(mat4.create(), deltaX * this.dragSensitivity);
        var rotX = mat4.fromXRotation(mat4.create(), deltaY * this.dragSensitivity);
        var temp = mat4.create();
        mat4.multiply(temp, rotY, this.viewMat);
        mat4.multiply(this.viewMat, rotX, temp);
        this.cameraRotationY = this.wrapAngle(this.cameraRotationY + deltaX * this.dragSensitivity);
        this.cameraRotationX = this.wrapAngle(this.cameraRotationX + deltaY * this.dragSensitivity);
    }

    applyZRotation(radians)
    {
        var rotZ = mat4.fromZRotation(mat4.create(), radians);
        mat4.multiply(this.viewMat, rotZ, this.viewMat);
        this.cameraRotationZ = this.wrapAngle(this.cameraRotationZ + radians);
    }

    stopDrag()
    {
        this.isDragging = false;
        this.activeMouseButton = -1;
    }

    handleKeyDown(e)
    {
        if (document.activeElement.tagName == 'INPUT')
            return;
        if (e.ctrlKey || e.metaKey)
            return;
        var handled = true;
        if (e.key == 'a' || e.key == 'ArrowLeft')
        {
            mat4.multiply(this.viewMat, mat4.fromYRotation(mat4.create(), this.keyboardStep), this.viewMat);
            this.cameraRotationY = this.wrapAngle(this.cameraRotationY + this.keyboardStep);
        }
        else if (e.key == 'd' || e.key == 'ArrowRight')
        {
            mat4.multiply(this.viewMat, mat4.fromYRotation(mat4.create(), -this.keyboardStep), this.viewMat);
            this.cameraRotationY = this.wrapAngle(this.cameraRotationY - this.keyboardStep);
        }
        else if (e.key == 's' || (e.key == 'ArrowDown' && !e.shiftKey))
        {
            mat4.multiply(this.viewMat, mat4.fromXRotation(mat4.create(), this.keyboardStep), this.viewMat);
            this.cameraRotationX = this.wrapAngle(this.cameraRotationX + this.keyboardStep);
        }
        else if (e.key == 'w' || (e.key == 'ArrowUp' && !e.shiftKey))
        {
            mat4.multiply(this.viewMat, mat4.fromXRotation(mat4.create(), -this.keyboardStep), this.viewMat);
            this.cameraRotationX = this.wrapAngle(this.cameraRotationX - this.keyboardStep);
        }
        else if (e.key == 'q' || (e.key == 'ArrowUp' && e.shiftKey))
        {
            mat4.multiply(this.viewMat, mat4.fromZRotation(mat4.create(), this.keyboardStep), this.viewMat);
            this.cameraRotationZ = this.wrapAngle(this.cameraRotationZ + this.keyboardStep);
        }
        else if (e.key == 'e' || (e.key == 'ArrowDown' && e.shiftKey))
        {
            mat4.multiply(this.viewMat, mat4.fromZRotation(mat4.create(), -this.keyboardStep), this.viewMat);
            this.cameraRotationZ = this.wrapAngle(this.cameraRotationZ - this.keyboardStep);
        }
        else if (e.key == 'r')
        {
            this.resetCamera();
        }
        else
        {
            handled = false;
        }
        if (handled)
        {
            this.stopAutoRotate();
            e.preventDefault();
        }
    }

    setupEventHandlers()
    {
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.scale -= e.deltaY * 0.5;
            if (this.scale < 10)
                this.scale = 10;
            if (this.scale > 400)
                this.scale = 400;
            this.scaleSlider.value = this.scale;
        }, { passive: false });

        window.addEventListener('resize', () => {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            this.resetPanelPositions();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.activeMouseButton = e.button;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.stopAutoRotate();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging)
                return;
            var deltaX = e.clientX - this.lastMouseX;
            var deltaY = e.clientY - this.lastMouseY;
            if (this.activeMouseButton == 0)
                this.applyXYRotation(deltaX, deltaY);
            else if (this.activeMouseButton == 2)
                this.applyZRotation(deltaY * this.dragSensitivity);
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        this.canvas.addEventListener('mouseup', () => this.stopDrag());
        this.canvas.addEventListener('mouseleave', () => this.stopDrag());

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length == 1)
            {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
                this.stopAutoRotate();
            }
            else if (e.touches.length == 2)
            {
                this.isDragging = false;
                var dx = e.touches[1].clientX - e.touches[0].clientX;
                var dy = e.touches[1].clientY - e.touches[0].clientY;
                this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
                this.lastTwistAngle = Math.atan2(dy, dx);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length == 1 && this.isDragging)
            {
                var deltaX = e.touches[0].clientX - this.lastMouseX;
                var deltaY = e.touches[0].clientY - this.lastMouseY;
                this.applyXYRotation(deltaX, deltaY);
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            }
            else if (e.touches.length == 2)
            {
                var dx = e.touches[1].clientX - e.touches[0].clientX;
                var dy = e.touches[1].clientY - e.touches[0].clientY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                var angle = Math.atan2(dy, dx);

                var pinchDelta = dist - this.lastPinchDistance;
                this.scale += pinchDelta * 0.5;
                if (this.scale < 10)
                    this.scale = 10;
                if (this.scale > 400)
                    this.scale = 400;
                this.scaleSlider.value = this.scale;

                this.applyZRotation(angle - this.lastTwistAngle);

                this.lastPinchDistance = dist;
                this.lastTwistAngle = angle;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => this.stopDrag());
        this.canvas.addEventListener('touchcancel', () => this.stopDrag());

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    randomize()
    {
        var fixedRadiusChoices = [5, 7, 8, 9, 10, 12];
        var rollingRadiusChoices = [2, 3, 4, 5, 6, 7];

        this.fixedCircleRadius = fixedRadiusChoices[Math.floor(Math.random() * fixedRadiusChoices.length)];
        var validChoices = rollingRadiusChoices.filter(r => r < this.fixedCircleRadius);
        this.rollingCircleRadius = validChoices[Math.floor(Math.random() * validChoices.length)];
        this.penDistance = 1 + Math.floor(Math.random() * this.fixedCircleRadius);

        var rotationChoices = [3, 5, 7, 9];
        this.xTurns = 0;
        this.xPeriod = 1;
        this.yTurns = 0;
        this.yPeriod = 1;
        var activeRotations = Math.floor(Math.random() * 3);
        if (activeRotations >= 1)
        {
            this.xTurns = 1;
            this.xPeriod = rotationChoices[Math.floor(Math.random() * rotationChoices.length)];
        }
        if (activeRotations >= 2)
        {
            this.yTurns = 1;
            this.yPeriod = rotationChoices[Math.floor(Math.random() * rotationChoices.length)];
        }

        var maxScale = Math.floor(Math.min(this.canvas.width, this.canvas.height) * 0.35);
        var range = maxScale - 80;
        if (range < 1)
            range = 1;
        this.scale = 80 + Math.floor(Math.random() * range);
        this.scaleSlider.value = this.scale;

        this.autoSetLoops();
        this.customColor = this.randomColor();
        this.colorMgr.randomize();
        this.updateDisplay();
        this.updatePreviews();
    }

    toggleAllAutoRotate()
    {
        var anyOn = this.autoRotateX || this.autoRotateY || this.autoRotateZ;
        this.autoRotateX = !anyOn;
        this.autoRotateY = !anyOn;
        this.autoRotateZ = !anyOn;
        this.autoRotateXCheck.checked = this.autoRotateX;
        this.autoRotateYCheck.checked = this.autoRotateY;
        this.autoRotateZCheck.checked = this.autoRotateZ;
    }

    toggleAnimate()
    {
        if (this.animating)
            this.stopAnimation();
        else
            this.startAnimation();
    }

    startAnimation()
    {
        this.animating = true;
        this.animationAngle = 0;
        this.animateBtn.classList.add('btn-active');
        this.animateBtn.textContent = 'stop animation';
    }

    stopAnimation()
    {
        this.animating = false;
        this.animateBtn.classList.remove('btn-active');
        this.animateBtn.textContent = 'begin animation';
    }

    toggleLight()
    {
        document.body.classList.toggle('light');
        if (document.body.classList.contains('light'))
            this.customColor = '#000000';
        else
            this.customColor = '#00ffff';
        this.colorPickerInput.value = this.customColor;
    }

    exportOBJ()
    {
        var totalAngle = this.loops * 2 * Math.PI;
        var increment = 2 * Math.PI / 360;
        var lines = ['# Spheromaniac export'];
        var indices = [];
        var i = 1;

        for (let fixedAngle = 0.0; fixedAngle < totalAngle; fixedAngle += increment)
        {
            let [penX, penY] = this.computePenPoint(fixedAngle);
            let xyz = this.applyRotation(penX, penY, fixedAngle);
            lines.push('v ' + xyz[0].toFixed(6) + ' ' + xyz[1].toFixed(6) + ' ' + xyz[2].toFixed(6));
            indices.push(i++);
        }

        lines.push('l ' + indices.join(' '));

        var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'spheromaniac.obj';
        a.click();
        URL.revokeObjectURL(url);
    }

    strokePolyline3D(ctx, points, strokeStyle, lineWidth)
    {
        ctx.beginPath();
        for (let i = 0; i < points.length; i++)
        {
            let p = [points[i][0], points[i][1], points[i][2]];
            vec3.transformMat4(p, p, this.viewMat);
            if (i == 0)
                ctx.moveTo(p[0], p[1]);
            else
                ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    fillDot3D(ctx, point, dotRadius, fillStyle)
    {
        let p = [point[0], point[1], point[2]];
        vec3.transformMat4(p, p, this.viewMat);
        ctx.beginPath();
        ctx.arc(p[0], p[1], dotRadius, 0, 2 * Math.PI);
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    drawAxesIndicator()
    {
        var axesCtx = this.axesIndicatorCanvas.getContext('2d');
        var size = this.axesIndicatorCanvas.width;
        var centerX = size / 2;
        var centerY = size / 2;
        var axisLength = size * 0.38;

        axesCtx.clearRect(0, 0, size, size);

        var xAxis = [1, 0, 0];
        var yAxis = [0, 1, 0];
        var zAxis = [0, 0, 1];

        vec3.transformMat4(xAxis, xAxis, this.viewMat);
        vec3.transformMat4(yAxis, yAxis, this.viewMat);
        vec3.transformMat4(zAxis, zAxis, this.viewMat);

        var axes = [
            { transformed: xAxis, color: '#ff4444', label: 'X' },
            { transformed: yAxis, color: '#44cc44', label: 'Y' },
            { transformed: zAxis, color: '#4488ff', label: 'Z' }
        ];

        for (var i = 0; i < axes.length; i++)
        {
            var axis = axes[i];
            var tipX = centerX + axis.transformed[0] * axisLength;
            var tipY = centerY + axis.transformed[1] * axisLength;

            axesCtx.beginPath();
            axesCtx.moveTo(centerX, centerY);
            axesCtx.lineTo(tipX, tipY);
            axesCtx.lineWidth = 2;
            axesCtx.strokeStyle = axis.color;
            axesCtx.stroke();

            axesCtx.fillStyle = axis.color;
            axesCtx.font = '14px monospace';
            axesCtx.fillText(axis.label, tipX + 2, tipY + 4);
        }
    }

    updatePreviews()
    {
        this.drawPlanePreview(this.previewCanvas, this.fixedCircleRadius, this.rollingCircleRadius, this.penDistance);
    }

    drawPlanePreview(previewCanvas, fixedR, rollingR, penD)
    {
        var previewCtx = previewCanvas.getContext('2d');
        var size = previewCanvas.width;

        previewCtx.clearRect(0, 0, size, size);

        if (fixedR == 0 || rollingR == 0 || penD == 0)
            return;

        var r1 = Math.abs(Math.round(fixedR));
        var r2 = Math.abs(Math.round(rollingR));
        if (r1 == 0 || r2 == 0)
            return;

        var planeLoops = r2 / this.greatestCommonDivisor(r1, r2);
        if (planeLoops > 60)
            planeLoops = 60;

        var maxExtent = Math.abs(fixedR - rollingR) + Math.abs(penD);
        if (maxExtent == 0)
            return;

        var halfSize = size / 2;
        var previewScale = (halfSize - 4) / maxExtent;

        previewCtx.save();
        previewCtx.translate(halfSize, halfSize);
        previewCtx.beginPath();

        var drawUpTo = planeLoops * 2 * Math.PI;
        if (this.animating)
            drawUpTo = this.animationAngle;
        var increment = 2 * Math.PI / 360;
        for (let fixedAngle = 0.0; fixedAngle < drawUpTo; fixedAngle += increment)
        {
            let [px, py] = this.calculatePoint(fixedAngle, fixedR, rollingR, penD);
            px *= previewScale;
            py *= previewScale;

            if (fixedAngle == 0)
                previewCtx.moveTo(px, py);
            else
                previewCtx.lineTo(px, py);
        }

        previewCtx.lineWidth = 1;
        if (this.colorMgr.inColor)
            previewCtx.strokeStyle = this.colorMgr.fgColor;
        else
            previewCtx.strokeStyle = this.customColor;
        previewCtx.stroke();

        if (this.animating)
        {
            var isLight = document.body.classList.contains('light');
            var overlayStrokeFaint = 'rgba(255,255,255,0.4)';
            var overlayStroke = 'rgba(255,255,255,0.65)';
            var overlayArm = 'rgba(255,255,255,0.85)';
            if (isLight)
            {
                overlayStrokeFaint = 'rgba(0,0,0,0.3)';
                overlayStroke = 'rgba(0,0,0,0.5)';
                overlayArm = 'rgba(0,0,0,0.65)';
            }
            var overlayPen = this.customColor;
            if (this.colorMgr.inColor)
                overlayPen = this.colorMgr.fgColor;

            var mechanismAngle = this.animationAngle % (planeLoops * 2 * Math.PI);

            var outerCircleRadius = fixedR * previewScale;
            var innerCircleRadius = Math.abs(rollingR) * previewScale;

            var rollingCenterX = (fixedR - rollingR) * Math.cos(mechanismAngle) * previewScale;
            var rollingCenterY = (fixedR - rollingR) * Math.sin(mechanismAngle) * previewScale;

            var [penX, penY] = this.calculatePoint(mechanismAngle, fixedR, rollingR, penD);
            penX *= previewScale;
            penY *= previewScale;

            previewCtx.beginPath();
            previewCtx.arc(0, 0, outerCircleRadius, 0, 2 * Math.PI);
            previewCtx.strokeStyle = overlayStrokeFaint;
            previewCtx.lineWidth = 1;
            previewCtx.stroke();

            previewCtx.beginPath();
            previewCtx.arc(rollingCenterX, rollingCenterY, innerCircleRadius, 0, 2 * Math.PI);
            previewCtx.strokeStyle = overlayStroke;
            previewCtx.lineWidth = 1;
            previewCtx.stroke();

            previewCtx.beginPath();
            previewCtx.moveTo(rollingCenterX, rollingCenterY);
            previewCtx.lineTo(penX, penY);
            previewCtx.strokeStyle = overlayArm;
            previewCtx.lineWidth = 1;
            previewCtx.stroke();

            previewCtx.beginPath();
            previewCtx.arc(penX, penY, 2, 0, 2 * Math.PI);
            previewCtx.fillStyle = overlayPen;
            previewCtx.fill();
        }

        previewCtx.restore();
    }

    drawAxes(ctx)
    {
        var axisExtent = 5000;
        this.strokePolyline3D(ctx, [[-axisExtent, 0, 0], [axisExtent, 0, 0]], '#ff4444', 1);
        this.strokePolyline3D(ctx, [[0, -axisExtent, 0], [0, axisExtent, 0]], '#44cc44', 1);
        this.strokePolyline3D(ctx, [[0, 0, -axisExtent], [0, 0, axisExtent]], '#4466ff', 1);
    }

    drawMechanism(ctx)
    {
        if (this.fixedCircleRadius == 0 || this.rollingCircleRadius == 0 || this.penDistance == 0)
            return;

        var isLight = document.body.classList.contains('light');
        var faintStroke = 'rgba(255,255,255,0.4)';
        var mediumStroke = 'rgba(255,255,255,0.65)';
        var armStroke = 'rgba(255,255,255,0.85)';
        if (isLight)
        {
            faintStroke = 'rgba(0,0,0,0.3)';
            mediumStroke = 'rgba(0,0,0,0.5)';
            armStroke = 'rgba(0,0,0,0.65)';
        }
        var penFill = this.customColor;
        if (this.colorMgr.inColor)
            penFill = this.colorMgr.fgColor;
        var segments = 48;

        var r1 = Math.abs(Math.round(this.fixedCircleRadius));
        var r2 = Math.abs(Math.round(this.rollingCircleRadius));
        var planeLoops = r2 / this.greatestCommonDivisor(r1, r2);
        var mechAngle = this.animationAngle % (planeLoops * 2 * Math.PI);

        var rollingCenterX = (this.scale / this.fixedCircleRadius) * (this.fixedCircleRadius - this.rollingCircleRadius) * Math.cos(mechAngle);
        var rollingCenterY = (this.scale / this.fixedCircleRadius) * (this.fixedCircleRadius - this.rollingCircleRadius) * Math.sin(mechAngle);

        var [penRawX, penRawY] = this.calculatePoint(mechAngle, this.fixedCircleRadius, this.rollingCircleRadius, this.penDistance);
        var penX = penRawX * this.scale / this.fixedCircleRadius;
        var penY = penRawY * this.scale / this.fixedCircleRadius;

        var innerCircleRadius = (this.scale / this.fixedCircleRadius) * Math.abs(this.rollingCircleRadius);

        var outerPts = [];
        var innerPts = [];
        for (let i = 0; i <= segments; i++)
        {
            let t = i * 2 * Math.PI / segments;
            outerPts.push(this.applyRotation(this.scale * Math.cos(t), this.scale * Math.sin(t), mechAngle));
            innerPts.push(this.applyRotation(rollingCenterX + innerCircleRadius * Math.cos(t), rollingCenterY + innerCircleRadius * Math.sin(t), mechAngle));
        }
        var rotatedRollingCenter = this.applyRotation(rollingCenterX, rollingCenterY, mechAngle);
        var rotatedPen = this.applyRotation(penX, penY, mechAngle);

        this.strokePolyline3D(ctx, outerPts, faintStroke, 1);
        this.strokePolyline3D(ctx, innerPts, mediumStroke, 1);
        this.strokePolyline3D(ctx, [rotatedRollingCenter, rotatedPen], armStroke, 1);
        this.fillDot3D(ctx, rotatedPen, 3, penFill);
    }

    drawFaces()
    {
        var totalAngle = this.loops * 2 * Math.PI;
        var increment = 2 * Math.PI / 360;
        var steps = Math.ceil(totalAngle / increment);

        this.ctx.beginPath();
        for (let i = 0; i <= steps; i++)
        {
            let fixedAngle = i * increment;
            if (i == steps)
                fixedAngle = totalAngle;
            let [px, py] = this.computePenPoint(fixedAngle);
            px *= this.scale;
            py *= this.scale;
            let xyz = this.applyRotation(px, py, fixedAngle);
            vec3.transformMat4(xyz, xyz, this.viewMat);
            if (i == 0)
                this.ctx.moveTo(xyz[0], xyz[1]);
            else
                this.ctx.lineTo(xyz[0], xyz[1]);
        }
        this.ctx.closePath();

        var fillColor = this.customColor;
        if (this.colorMgr.inColor)
            fillColor = this.colorMgr.fgColor;
        this.ctx.fillStyle = fillColor;
        this.ctx.fill('evenodd');
    }

    drawTube()
    {
        var totalAngle = this.loops * 2 * Math.PI;
        var samples = 60 * this.loops;
        if (samples < 60)
            samples = 60;
        var stepAngle = totalAngle / samples;

        var positions = [];
        for (let i = 0; i <= samples; i++)
        {
            let angle = i * stepAngle;
            let [px, py] = this.computePenPoint(angle);
            px *= this.scale;
            py *= this.scale;
            positions.push(this.applyRotation(px, py, angle));
        }

        var tangents = [];
        for (let i = 0; i <= samples; i++)
        {
            let prev = positions[Math.max(0, i - 1)];
            let next = positions[Math.min(samples, i + 1)];
            let t = [next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]];
            let len = Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
            if (len > 1e-8)
            {
                t[0] /= len;
                t[1] /= len;
                t[2] /= len;
            }
            tangents.push(t);
        }

        var up = [0, 0, 1];
        if (Math.abs(tangents[0][0] * up[0] + tangents[0][1] * up[1] + tangents[0][2] * up[2]) > 0.99)
            up = [0, 1, 0];
        var n0 = [
            tangents[0][1] * up[2] - tangents[0][2] * up[1],
            tangents[0][2] * up[0] - tangents[0][0] * up[2],
            tangents[0][0] * up[1] - tangents[0][1] * up[0]
        ];
        var n0Len = Math.sqrt(n0[0] * n0[0] + n0[1] * n0[1] + n0[2] * n0[2]);
        n0[0] /= n0Len;
        n0[1] /= n0Len;
        n0[2] /= n0Len;
        var normals = [n0];

        for (let i = 1; i <= samples; i++)
        {
            let prevT = tangents[i - 1];
            let curT = tangents[i];
            let axis = [
                prevT[1] * curT[2] - prevT[2] * curT[1],
                prevT[2] * curT[0] - prevT[0] * curT[2],
                prevT[0] * curT[1] - prevT[1] * curT[0]
            ];
            let axisLen = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
            let cur = [normals[i - 1][0], normals[i - 1][1], normals[i - 1][2]];
            if (axisLen > 1e-8)
            {
                axis[0] /= axisLen;
                axis[1] /= axisLen;
                axis[2] /= axisLen;
                let dot = prevT[0] * curT[0] + prevT[1] * curT[1] + prevT[2] * curT[2];
                if (dot > 1)
                    dot = 1;
                if (dot < -1)
                    dot = -1;
                let angle = Math.acos(dot);
                let cs = Math.cos(angle);
                let sn = Math.sin(angle);
                let kdotv = axis[0] * cur[0] + axis[1] * cur[1] + axis[2] * cur[2];
                let kcrossv = [
                    axis[1] * cur[2] - axis[2] * cur[1],
                    axis[2] * cur[0] - axis[0] * cur[2],
                    axis[0] * cur[1] - axis[1] * cur[0]
                ];
                cur = [
                    cur[0] * cs + kcrossv[0] * sn + axis[0] * kdotv * (1 - cs),
                    cur[1] * cs + kcrossv[1] * sn + axis[1] * kdotv * (1 - cs),
                    cur[2] * cs + kcrossv[2] * sn + axis[2] * kdotv * (1 - cs)
                ];
            }

            let dot2 = cur[0] * curT[0] + cur[1] * curT[1] + cur[2] * curT[2];
            cur[0] -= dot2 * curT[0];
            cur[1] -= dot2 * curT[1];
            cur[2] -= dot2 * curT[2];
            let curLen = Math.sqrt(cur[0] * cur[0] + cur[1] * cur[1] + cur[2] * cur[2]);
            cur[0] /= curLen;
            cur[1] /= curLen;
            cur[2] /= curLen;
            normals.push(cur);
        }

        var rings = [];
        for (let i = 0; i <= samples; i++)
        {
            let n = normals[i];
            let t = tangents[i];
            let b = [
                t[1] * n[2] - t[2] * n[1],
                t[2] * n[0] - t[0] * n[2],
                t[0] * n[1] - t[1] * n[0]
            ];
            let ring = [];
            for (let k = 0; k < this.tubeSides; k++)
            {
                let theta = 2 * Math.PI * k / this.tubeSides;
                let cs = Math.cos(theta);
                let sn = Math.sin(theta);
                let v = [
                    positions[i][0] + this.tubeRadius * (cs * n[0] + sn * b[0]),
                    positions[i][1] + this.tubeRadius * (cs * n[1] + sn * b[1]),
                    positions[i][2] + this.tubeRadius * (cs * n[2] + sn * b[2])
                ];
                ring.push(v);
            }
            rings.push(ring);
        }

        var stroke = this.customColor;
        if (this.colorMgr.inColor)
            stroke = this.colorMgr.fgColor;

        for (let i = 0; i <= samples; i++)
        {
            let closed = rings[i].slice();
            closed.push(rings[i][0]);
            this.strokePolyline3D(this.ctx, closed, stroke, 1);
        }

        for (let k = 0; k < this.tubeSides; k++)
        {
            let line = [];
            for (let i = 0; i <= samples; i++)
                line.push(rings[i][k]);
            this.strokePolyline3D(this.ctx, line, stroke, 1);
        }
    }

    drawScene()
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.colorMgr.next();

        this.ctx.save();
        this.ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);

        var totalAngle = this.loops * 2 * Math.PI;
        var drawUpTo = totalAngle;
        var tailAngle = 0;
        if (this.animating)
        {
            drawUpTo = this.animationAngle;
            tailAngle = this.animationAngle - this.tailLoops * 2 * Math.PI;
            if (tailAngle < 0)
                tailAngle = 0;
        }
        var increment = 2 * Math.PI / 360;
        var colorHue = this.hexToHue(this.customColor);
        var prevX = 0;
        var prevY = 0;
        var hasPrev = false;
        var startStep = Math.floor(tailAngle / increment);
        var steps = Math.ceil(drawUpTo / increment);

        if (this.facesEnabled)
            this.drawFaces();

        for (let i = startStep; i <= steps; i++)
        {
            let fixedAngle = i * increment;
            if (i == startStep)
                fixedAngle = tailAngle;
            if (i == steps)
                fixedAngle = drawUpTo;
            let [penX, penY] = this.computePenPoint(fixedAngle);
            penX *= this.scale;
            penY *= this.scale;

            let xyz = this.applyRotation(penX, penY, fixedAngle);
            vec3.transformMat4(xyz, xyz, this.viewMat);

            if (hasPrev)
            {
                let depth = (xyz[2] + this.scale) / (2 * this.scale);
                if (depth < 0)
                    depth = 0;
                if (depth > 1)
                    depth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(prevX, prevY);
                this.ctx.lineTo(xyz[0], xyz[1]);
                this.ctx.globalAlpha = 0.15 + 0.85 * depth;
                this.ctx.lineWidth = this.lineWidth * (0.8 + 0.2 * depth);
                if (this.lineWidth > 8)
                {
                    if (depth > 0.35)
                        this.ctx.lineCap = 'round';
                    else
                        this.ctx.lineCap = 'butt';
                }
                if (this.colorMgr.inColor)
                {
                    let hue = colorHue + this.colorOffset + (fixedAngle / totalAngle) * 60;
                    let lightness = 40 + 25 * Math.sin(fixedAngle);
                    this.ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + lightness + '%)';
                }
                else
                {
                    this.ctx.strokeStyle = this.customColor;
                }
                this.ctx.stroke();
            }

            prevX = xyz[0];
            prevY = xyz[1];
            hasPrev = true;
        }

        this.ctx.globalAlpha = 1.0;

        if (this.showAxes)
            this.drawAxes(this.ctx);
        if (this.animating && this.showMechanism)
            this.drawMechanism(this.ctx);
        if (this.tubeEnabled)
            this.drawTube();

        this.ctx.restore();

        if (this.animating)
        {
            this.animationAngle += this.animationSpeed;
            this.updatePreviews();
        }

        if (this.colorMgr.inColor)
        {
            this.colorOffset += 1.0;
            if (this.colorOffset >= 360)
                this.colorOffset -= 360;
        }

        if (this.autoRotateX)
        {
            mat4.multiply(this.viewMat, mat4.fromXRotation(mat4.create(), 0.005), this.viewMat);
            this.cameraRotationX = this.wrapAngle(this.cameraRotationX + 0.005);
        }
        if (this.autoRotateY)
        {
            mat4.multiply(this.viewMat, mat4.fromYRotation(mat4.create(), 0.003), this.viewMat);
            this.cameraRotationY = this.wrapAngle(this.cameraRotationY + 0.003);
        }
        if (this.autoRotateZ)
        {
            mat4.multiply(this.viewMat, mat4.fromZRotation(mat4.create(), 0.002), this.viewMat);
            this.cameraRotationZ = this.wrapAngle(this.cameraRotationZ + 0.002);
        }

        this.cameraXSlider.value = this.cameraRotationX;
        this.cameraYSlider.value = this.cameraRotationY;
        this.cameraZSlider.value = this.cameraRotationZ;

        this.drawAxesIndicator();

        window.requestAnimationFrame(() => this.drawScene());
    }

    movePanelTo(panel, left, top)
    {
        if (left < 0)
            left = 0;
        if (top < 0)
            top = 0;
        if (left > window.innerWidth - panel.offsetWidth)
            left = window.innerWidth - panel.offsetWidth;
        if (top > window.innerHeight - panel.offsetHeight)
            top = window.innerHeight - panel.offsetHeight;
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
    }

    makeDraggable(panel, handle)
    {
        var dragOffsetX = 0;
        var dragOffsetY = 0;
        var panelDragging = false;

        handle.addEventListener('mousedown', (e) => {
            panelDragging = true;
            var rect = panel.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            e.preventDefault();
        });

        handle.addEventListener('touchstart', (e) => {
            panelDragging = true;
            var rect = panel.getBoundingClientRect();
            dragOffsetX = e.touches[0].clientX - rect.left;
            dragOffsetY = e.touches[0].clientY - rect.top;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('mousemove', (e) => {
            if (!panelDragging)
                return;
            this.movePanelTo(panel, e.clientX - dragOffsetX, e.clientY - dragOffsetY);
        });

        window.addEventListener('touchmove', (e) => {
            if (!panelDragging)
                return;
            this.movePanelTo(panel, e.touches[0].clientX - dragOffsetX, e.touches[0].clientY - dragOffsetY);
        }, { passive: false });

        window.addEventListener('mouseup', () => {
            panelDragging = false;
        });

        window.addEventListener('touchend', () => {
            panelDragging = false;
        });

        window.addEventListener('touchcancel', () => {
            panelDragging = false;
        });
    }

    resetPanelPositions()
    {
        var panelTitle = document.getElementById('panel-title');
        var panelX = document.getElementById('panel-x');
        var panelY = document.getElementById('panel-y');
        var panelShape = document.getElementById('panel-shape');
        var panelPreview = document.getElementById('panel-preview');
        var panelRight = document.getElementById('panel-right');
        var panelBottomRight = document.getElementById('panel-bottom-right');
        var panelAnimation = document.getElementById('panel-animation');
        var panelFaces = document.getElementById('panel-faces');
        var panelAxes = document.getElementById('panel-axes');

        panelTitle.style.top = '20px';
        panelTitle.style.left = ((window.innerWidth - panelTitle.offsetWidth) / 2) + 'px';

        panelShape.style.top = '20px';
        panelShape.style.left = '20px';

        panelPreview.style.top = '20px';
        panelPreview.style.left = (20 + panelShape.offsetWidth + 10) + 'px';

        panelX.style.top = (20 + panelShape.offsetHeight + 10) + 'px';
        panelX.style.left = '20px';
        panelY.style.top = (20 + panelShape.offsetHeight + 10 + panelX.offsetHeight + 10) + 'px';
        panelY.style.left = '20px';

        panelRight.style.top = '20px';
        panelRight.style.left = (window.innerWidth - panelRight.offsetWidth - 20) + 'px';

        panelBottomRight.style.bottom = 'auto';
        panelBottomRight.style.right = 'auto';
        panelBottomRight.style.top = (window.innerHeight - panelBottomRight.offsetHeight - 20) + 'px';
        panelBottomRight.style.left = (window.innerWidth - panelBottomRight.offsetWidth - 20) + 'px';

        panelAnimation.style.bottom = 'auto';
        panelAnimation.style.right = 'auto';
        panelAnimation.style.top = (window.innerHeight - panelAnimation.offsetHeight - 20) + 'px';
        panelAnimation.style.left = '20px';

        panelFaces.style.bottom = 'auto';
        panelFaces.style.right = 'auto';
        panelFaces.style.top = (window.innerHeight - panelFaces.offsetHeight - 20) + 'px';
        panelFaces.style.left = Math.floor((window.innerWidth - panelFaces.offsetWidth) / 2) + 'px';

        panelAxes.style.top = '20px';
        panelAxes.style.left = Math.floor((window.innerWidth - panelAxes.offsetWidth) * 0.75) + 'px';
    }

    initPanelPositions()
    {
        this.resetPanelPositions();

        var panelTitle = document.getElementById('panel-title');
        var panelX = document.getElementById('panel-x');
        var panelY = document.getElementById('panel-y');
        var panelShape = document.getElementById('panel-shape');
        var panelPreview = document.getElementById('panel-preview');
        var panelRight = document.getElementById('panel-right');
        var panelBottomRight = document.getElementById('panel-bottom-right');
        var panelAnimation = document.getElementById('panel-animation');
        var panelFaces = document.getElementById('panel-faces');
        var panelAxes = document.getElementById('panel-axes');

        this.makeDraggable(panelTitle, panelTitle.querySelector('.drag-handle'));
        this.makeDraggable(panelX, panelX.querySelector('.drag-handle'));
        this.makeDraggable(panelY, panelY.querySelector('.drag-handle'));
        this.makeDraggable(panelShape, panelShape.querySelector('.drag-handle'));
        this.makeDraggable(panelPreview, panelPreview.querySelector('.drag-handle'));
        this.makeDraggable(panelRight, panelRight.querySelector('.drag-handle'));
        this.makeDraggable(panelBottomRight, panelBottomRight.querySelector('.drag-handle'));
        this.makeDraggable(panelAnimation, panelAnimation.querySelector('.drag-handle'));
        this.makeDraggable(panelFaces, panelFaces.querySelector('.drag-handle'));
        this.makeDraggable(panelAxes, panelAxes.querySelector('.drag-handle'));
    }

    init()
    {
        if (!this.ctx)
        {
            alert("Your browser doesn't support something.");
            return;
        }

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.fixedCircleRadiusInput = document.getElementById('fixed_circle_radius');
        this.rollingCircleRadiusInput = document.getElementById('rolling_circle_radius');
        this.penDistanceInput = document.getElementById('pen_distance');
        this.penDistanceSlider = document.getElementById('pen_distance_slider');
        this.xTurnsInput = document.getElementById('x_turns');
        this.xTurnsSlider = document.getElementById('x_turns_slider');
        this.xPeriodInput = document.getElementById('x_period');
        this.xPeriodSlider = document.getElementById('x_period_slider');
        this.yTurnsInput = document.getElementById('y_turns');
        this.yTurnsSlider = document.getElementById('y_turns_slider');
        this.yPeriodInput = document.getElementById('y_period');
        this.yPeriodSlider = document.getElementById('y_period_slider');

        this.loopsSlider = document.getElementById('loops');
        this.loopsInput = document.getElementById('loops_num');
        this.tailLoopsSlider = document.getElementById('tail_loops');
        this.animationSpeedSlider = document.getElementById('animation_speed');
        this.showMechanismCheck = document.getElementById('showMechanism');
        this.tubeCheck = document.getElementById('tubeEnabled');
        this.tubeRadiusSlider = document.getElementById('tube_radius');
        this.tubeSidesSlider = document.getElementById('tube_sides');
        this.facesCheck = document.getElementById('facesEnabled');
        this.cameraXSlider = document.getElementById('cameraRotationX');
        this.cameraYSlider = document.getElementById('cameraRotationY');
        this.cameraZSlider = document.getElementById('cameraRotationZ');
        this.scaleSlider = document.getElementById('scale');
        this.autoRotateXCheck = document.getElementById('autoRotateX');
        this.autoRotateYCheck = document.getElementById('autoRotateY');
        this.autoRotateZCheck = document.getElementById('autoRotateZ');
        this.cycleColorCheck = document.getElementById('inColor');
        this.lightModeCheck = document.getElementById('lightMode');
        this.colorPickerInput = document.getElementById('colorPicker');
        this.animateBtn = document.getElementById('animateBtn');
        this.showAxesCheck = document.getElementById('showAxes');
        this.previewCanvas = document.getElementById('preview_shape');
        this.axesIndicatorCanvas = document.getElementById('axes-indicator');

        this.colorMgr.randomize();
        this.updateDisplay();
        this.autoSetLoops();
        this.autoRotateXCheck.checked = this.autoRotateX;
        this.autoRotateYCheck.checked = this.autoRotateY;
        this.autoRotateZCheck.checked = this.autoRotateZ;
        this.cycleColorCheck.checked = this.colorMgr.inColor;
        this.lightModeCheck.checked = false;
        this.showAxesCheck.checked = false;
        this.showMechanismCheck.checked = true;
        this.animationSpeedSlider.value = this.animationSpeed;
        this.tubeCheck.checked = false;
        this.tubeRadiusSlider.value = this.tubeRadius;
        this.tubeSidesSlider.value = this.tubeSides;
        this.facesCheck.checked = false;
        this.updatePreviews();
        this.initPanelPositions();
        this.setupEventHandlers();
        this.drawScene();
    }
}

var app = new Spheromaniac(document.querySelector('#canvas'));
app.init();
