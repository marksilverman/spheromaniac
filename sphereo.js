var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');

var x_turns = 4, x_period = 5;
var y_turns = 1, y_period = 1;
var z_radius1 = 8.0, z_radius2 = 6.0, z_distance = 5.0;

var scale = 200.0, lineWidth = 3, loops = 10;
var viewMat = mat4.create();
var customColor = '#00ffff';
var autoRotateX = true, autoRotateY = true, autoRotateZ = true;
var cameraRotationX = 0.0, cameraRotationY = 0.0, cameraRotationZ = 0.0;
var isDragging = false;
var lastMouseX = 0, lastMouseY = 0;
var activeMouseButton = -1, dragSensitivity = 0.005;
var lastPinchDistance = 0, lastTwistAngle = 0;
var animating = false, animAngle = 0.0, animSpeed = 0.05;
var colorOffset = 0.0;
var showAxes = false;

var xTurnsInput, xPeriodInput, xTurnsSlider, xPeriodSlider;
var yTurnsInput, yPeriodInput, yTurnsSlider, yPeriodSlider;
var zRadius1Input, zRadius2Input, zDistanceInput;
var loopsSlider, loopsInput;
var cameraXSlider, cameraYSlider, cameraZSlider;
var scaleSlider;
var autoRotateXCheck, autoRotateYCheck, autoRotateZCheck, inColorCheck, lightModeCheck;
var colorPickerInput, animateBtn, showAxesCheck;
var previewZCanvas, axesIndicatorCanvas;
var zDistanceSlider;

canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

canvas.addEventListener('wheel', function(e)
{
    e.preventDefault();
    scale -= e.deltaY * 0.5;
    if (scale < 10)
        scale = 10;
    if (scale > 400)
        scale = 400;
    scaleSlider.value = scale;
}, { passive: false });

window.addEventListener('resize', function()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
});

canvas.addEventListener('mousedown', function(e)
{
    isDragging = true;
    activeMouseButton = e.button;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    stopAutoRotate();
});

function applyXYRotation(deltaX, deltaY)
{
    var rotY = mat4.fromYRotation(mat4.create(), deltaX * dragSensitivity);
    var rotX = mat4.fromXRotation(mat4.create(), deltaY * dragSensitivity);
    var temp = mat4.create();
    mat4.multiply(temp, rotY, viewMat);
    mat4.multiply(viewMat, rotX, temp);
    cameraRotationY = wrapAngle(cameraRotationY + deltaX * dragSensitivity);
    cameraRotationX = wrapAngle(cameraRotationX + deltaY * dragSensitivity);
}

function applyZRotation(radians)
{
    var rotZ = mat4.fromZRotation(mat4.create(), radians);
    mat4.multiply(viewMat, rotZ, viewMat);
    cameraRotationZ = wrapAngle(cameraRotationZ + radians);
}

canvas.addEventListener('mousemove', function(e)
{
    if (!isDragging)
        return;
    var deltaX = e.clientX - lastMouseX;
    var deltaY = e.clientY - lastMouseY;
    if (activeMouseButton === 0)
        applyXYRotation(deltaX, deltaY);
    else if (activeMouseButton === 2)
        applyZRotation(deltaY * dragSensitivity);
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

function stopDrag()
{
    isDragging = false;
    activeMouseButton = -1;
}

canvas.addEventListener('mouseup', stopDrag);
canvas.addEventListener('mouseleave', stopDrag);

canvas.addEventListener('touchstart', function(e)
{
    e.preventDefault();
    if (e.touches.length === 1)
    {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
        stopAutoRotate();
    }
    else if (e.touches.length === 2)
    {
        isDragging = false;
        var dx = e.touches[1].clientX - e.touches[0].clientX;
        var dy = e.touches[1].clientY - e.touches[0].clientY;
        lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
        lastTwistAngle = Math.atan2(dy, dx);
    }
}, { passive: false });

canvas.addEventListener('touchmove', function(e)
{
    e.preventDefault();
    if (e.touches.length === 1 && isDragging)
    {
        var deltaX = e.touches[0].clientX - lastMouseX;
        var deltaY = e.touches[0].clientY - lastMouseY;
        applyXYRotation(deltaX, deltaY);
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    }
    else if (e.touches.length === 2)
    {
        var dx = e.touches[1].clientX - e.touches[0].clientX;
        var dy = e.touches[1].clientY - e.touches[0].clientY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var angle = Math.atan2(dy, dx);

        var pinchDelta = dist - lastPinchDistance;
        scale += pinchDelta * 0.5;
        if (scale < 10)
            scale = 10;
        if (scale > 400)
            scale = 400;
        scaleSlider.value = scale;

        applyZRotation(angle - lastTwistAngle);

        lastPinchDistance = dist;
        lastTwistAngle = angle;
    }
}, { passive: false });

canvas.addEventListener('touchend', stopDrag);
canvas.addEventListener('touchcancel', stopDrag);

var keyboardStep = 0.05;

document.addEventListener('keydown', function(e)
{
    if (document.activeElement.tagName === 'INPUT')
        return;
    if (e.ctrlKey || e.metaKey)
        return;
    var handled = true;
    if (e.key === 'a' || e.key === 'ArrowLeft')
    {
        mat4.multiply(viewMat, mat4.fromYRotation(mat4.create(), keyboardStep), viewMat);
        cameraRotationY = wrapAngle(cameraRotationY + keyboardStep);
    }
    else if (e.key === 'd' || e.key === 'ArrowRight')
    {
        mat4.multiply(viewMat, mat4.fromYRotation(mat4.create(), -keyboardStep), viewMat);
        cameraRotationY = wrapAngle(cameraRotationY - keyboardStep);
    }
    else if (e.key === 's' || (e.key === 'ArrowDown' && !e.shiftKey))
    {
        mat4.multiply(viewMat, mat4.fromXRotation(mat4.create(), keyboardStep), viewMat);
        cameraRotationX = wrapAngle(cameraRotationX + keyboardStep);
    }
    else if (e.key === 'w' || (e.key === 'ArrowUp' && !e.shiftKey))
    {
        mat4.multiply(viewMat, mat4.fromXRotation(mat4.create(), -keyboardStep), viewMat);
        cameraRotationX = wrapAngle(cameraRotationX - keyboardStep);
    }
    else if (e.key === 'q' || (e.key === 'ArrowUp' && e.shiftKey))
    {
        mat4.multiply(viewMat, mat4.fromZRotation(mat4.create(), keyboardStep), viewMat);
        cameraRotationZ = wrapAngle(cameraRotationZ + keyboardStep);
    }
    else if (e.key === 'e' || (e.key === 'ArrowDown' && e.shiftKey))
    {
        mat4.multiply(viewMat, mat4.fromZRotation(mat4.create(), -keyboardStep), viewMat);
        cameraRotationZ = wrapAngle(cameraRotationZ - keyboardStep);
    }
    else if (e.key === 'r')
    {
        resetCamera();
    }
    else
    {
        handled = false;
    }
    if (handled)
    {
        stopAutoRotate();
        e.preventDefault();
    }
});

function wrapAngle(angle)
{
    if (angle < 0)
        angle += 2 * Math.PI;
    if (angle > 2 * Math.PI)
        angle -= 2 * Math.PI;
    return angle;
}

function setLoops(value)
{
    loops = Math.round(parseFloat(value));
    loopsSlider.value = loops;
    loopsInput.value = loops;
}

function adjustXTurns(amount)
{
    x_turns += amount;
    updateDisplay();
    autoSetLoops();
    animAngle = 0;
}

function adjustXPeriod(amount)
{
    x_period = Math.max(0.1, x_period + amount);
    updateDisplay();
    autoSetLoops();
    animAngle = 0;
}

function adjustYTurns(amount)
{
    y_turns += amount;
    updateDisplay();
    autoSetLoops();
    animAngle = 0;
}

function adjustYPeriod(amount)
{
    y_period = Math.max(0.1, y_period + amount);
    updateDisplay();
    autoSetLoops();
    animAngle = 0;
}

function adjustZRadius1(amount)
{
    z_radius1 += amount;
    updateDisplay();
    autoSetLoops();
    animAngle = 0;
    updatePreviews();
}

function adjustZRadius2(amount)
{
    z_radius2 += amount;
    updateDisplay();
    autoSetLoops();
    animAngle = 0;
    updatePreviews();
}

function adjustZDistance(amount)
{
    z_distance += amount;
    updateDisplay();
    autoSetLoops();
    animAngle = 0;
    updatePreviews();
}

function setXTurns()
{
    x_turns = parseFloat(xTurnsInput.value) || 0;
    xTurnsSlider.value = x_turns;
    autoSetLoops();
    animAngle = 0;
}

function setXTurnsFromSlider()
{
    x_turns = parseFloat(xTurnsSlider.value);
    xTurnsInput.value = x_turns;
    autoSetLoops();
    animAngle = 0;
}

function setXPeriod()
{
    x_period = Math.max(0.1, parseFloat(xPeriodInput.value) || 0.1);
    xPeriodSlider.value = x_period;
    autoSetLoops();
    animAngle = 0;
}

function setXPeriodFromSlider()
{
    x_period = parseFloat(xPeriodSlider.value);
    xPeriodInput.value = x_period;
    autoSetLoops();
    animAngle = 0;
}

function setYTurns()
{
    y_turns = parseFloat(yTurnsInput.value) || 0;
    yTurnsSlider.value = y_turns;
    autoSetLoops();
    animAngle = 0;
}

function setYTurnsFromSlider()
{
    y_turns = parseFloat(yTurnsSlider.value);
    yTurnsInput.value = y_turns;
    autoSetLoops();
    animAngle = 0;
}

function setYPeriod()
{
    y_period = Math.max(0.1, parseFloat(yPeriodInput.value) || 0.1);
    yPeriodSlider.value = y_period;
    autoSetLoops();
    animAngle = 0;
}

function setYPeriodFromSlider()
{
    y_period = parseFloat(yPeriodSlider.value);
    yPeriodInput.value = y_period;
    autoSetLoops();
    animAngle = 0;
}

function setZRadius1()
{
    z_radius1 = parseFloat(zRadius1Input.value) || 0;
    autoSetLoops();
    animAngle = 0;
    updatePreviews();
}

function setZRadius2()
{
    z_radius2 = parseFloat(zRadius2Input.value) || 0;
    autoSetLoops();
    animAngle = 0;
    updatePreviews();
}

function setZDistance()
{
    z_distance = parseFloat(zDistanceInput.value) || 0;
    zDistanceSlider.value = z_distance;
    autoSetLoops();
    animAngle = 0;
    updatePreviews();
}


function setZDistanceFromSlider()
{
    z_distance = parseFloat(zDistanceSlider.value) || 0;
    zDistanceInput.value = z_distance;
    autoSetLoops();
    animAngle = 0;
    updatePreviews();
}

function updateDisplay()
{
    xTurnsInput.value = x_turns;
    xTurnsSlider.value = x_turns;
    xPeriodInput.value = x_period;
    xPeriodSlider.value = x_period;
    yTurnsInput.value = y_turns;
    yTurnsSlider.value = y_turns;
    yPeriodInput.value = y_period;
    yPeriodSlider.value = y_period;
    zRadius1Input.value = z_radius1;
    zRadius2Input.value = z_radius2;
    zDistanceInput.value = z_distance;
    zDistanceSlider.value = z_distance;
}

function hasFractionalParams()
{
    if (z_radius1 % 1 !== 0 || z_radius2 % 1 !== 0)
        return true;
    if (x_turns !== 0 && (x_turns % 1 !== 0 || x_period % 1 !== 0))
        return true;
    if (y_turns !== 0 && (y_turns % 1 !== 0 || y_period % 1 !== 0))
        return true;
    return false;
}

function autoSetLoops()
{
    if (hasFractionalParams())
        return;

    var periods = [];

    if (z_radius1 !== 0 && z_radius2 !== 0 && z_distance !== 0)
    {
        var zR1 = Math.abs(Math.round(z_radius1));
        var zR2 = Math.abs(Math.round(z_radius2));
        if (zR1 > 0 && zR2 > 0)
            periods.push(zR2 / greatestCommonDivisor(zR1, zR2));
    }
    if (x_turns !== 0)
        periods.push(Math.abs(x_period));
    if (y_turns !== 0)
        periods.push(Math.abs(y_period));

    if (periods.length === 0)
    {
        setLoops(1);
        return;
    }
    var lcm = periods.reduce(function(a, b)
    {
        return a * b / greatestCommonDivisor(a, b);
    });
    setLoops(Math.min(lcm, 60));
}

var colorMgr =
{
    red: 100, green: 200, blue: 50, radd: 2, gadd: -2, badd: 2, inColor: false, fgColor: '',
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
        return [ color, adder ];
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
}

main();

function main()
{
    if (!ctx)
        return alert("Your browser doesn\'t support something.");

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    xTurnsInput   = document.getElementById('x_turns');
    xTurnsSlider  = document.getElementById('x_turns_slider');
    xPeriodInput  = document.getElementById('x_period');
    xPeriodSlider = document.getElementById('x_period_slider');
    yTurnsInput   = document.getElementById('y_turns');
    yTurnsSlider  = document.getElementById('y_turns_slider');
    yPeriodInput  = document.getElementById('y_period');
    yPeriodSlider = document.getElementById('y_period_slider');
    zRadius1Input  = document.getElementById('z_radius1');
    zRadius2Input  = document.getElementById('z_radius2');
    zDistanceInput = document.getElementById('z_distance');
    zDistanceSlider = document.getElementById('z_distance_slider');

    loopsSlider      = document.getElementById('loops');
    loopsInput       = document.getElementById('loops_num');
    cameraXSlider    = document.getElementById('cameraRotationX');
    cameraYSlider    = document.getElementById('cameraRotationY');
    cameraZSlider    = document.getElementById('cameraRotationZ');
    scaleSlider      = document.getElementById('scale');
    autoRotateXCheck = document.getElementById('autoRotateX');
    autoRotateYCheck = document.getElementById('autoRotateY');
    autoRotateZCheck = document.getElementById('autoRotateZ');
    inColorCheck     = document.getElementById('inColor');
    lightModeCheck   = document.getElementById('lightMode');
    colorPickerInput = document.getElementById('colorPicker');
    animateBtn       = document.getElementById('animateBtn');
    showAxesCheck    = document.getElementById('showAxes');
    previewZCanvas   = document.getElementById('preview_z');
    axesIndicatorCanvas = document.getElementById('axes-indicator');

    colorMgr.randomize();
    updateDisplay();
    autoSetLoops();
    autoRotateXCheck.checked = autoRotateX;
    autoRotateYCheck.checked = autoRotateY;
    autoRotateZCheck.checked = autoRotateZ;
    inColorCheck.checked = colorMgr.inColor;
    lightModeCheck.checked = false;
    showAxesCheck.checked = false;
    updatePreviews();
    initPanelPositions();
    drawScene();
}

function drawScene()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    colorMgr.next();

    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);

    var totalAngle = loops * 2 * Math.PI;
    var drawUpTo = animating ? animAngle : totalAngle;
    var increment = 2 * Math.PI / 360;
    var colorHue = hexToHue(customColor);
    var prevX = 0, prevY = 0, hasPrev = false;

    for (let angle = 0.0; angle < drawUpTo; angle += increment)
    {
        let zContribX = 0;
        let zContribY = 0;
        if (z_radius1 !== 0 && z_radius2 !== 0 && z_distance !== 0)
        {
            let zArmRadius = z_radius1 - z_radius2;
            let zRollingRatio = zArmRadius / z_radius2;
            let zPenAngle = zRollingRatio * angle;
            let zNorm = scale / z_radius1;
            zContribX = zNorm * (zArmRadius * Math.cos(angle) + z_distance * Math.cos(zPenAngle));
            zContribY = zNorm * (zArmRadius * Math.sin(angle) - z_distance * Math.sin(zPenAngle));
        }

        let rotX = (x_turns === 0) ? 0 : angle * x_turns / x_period;
        let rotY = (y_turns === 0) ? 0 : angle * y_turns / y_period;
        let modelMat = mat4.create();
        mat4.rotateX(modelMat, modelMat, rotX);
        mat4.rotateY(modelMat, modelMat, rotY);

        let xyz = [zContribX, zContribY, 0];
        vec3.transformMat4(xyz, xyz, modelMat);
        vec3.transformMat4(xyz, xyz, viewMat);

        if (hasPrev)
        {
            let depth = Math.max(0, Math.min(1, (xyz[2] + scale) / (2 * scale)));
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(xyz[0], xyz[1]);
            ctx.globalAlpha = 0.15 + 0.85 * depth;
            ctx.lineWidth = lineWidth * (0.5 + depth);
            if (colorMgr.inColor)
            {
                let hue = colorHue + colorOffset + (angle / totalAngle) * 60;
                let lightness = 40 + 25 * Math.sin(angle);
                ctx.strokeStyle = 'hsl(' + hue + ', 100%, ' + lightness + '%)';
            }
            else
            {
                ctx.strokeStyle = customColor;
            }
            ctx.stroke();
        }

        prevX = xyz[0];
        prevY = xyz[1];
        hasPrev = true;
    }

    ctx.globalAlpha = 1.0;

    if (animating || showAxes)
        drawMechanismOnMain(ctx);

    ctx.restore();

    if (animating)
    {
        animAngle += animSpeed;
        if (animAngle >= loops * 2 * Math.PI)
            animAngle = loops * 2 * Math.PI;
        updatePreviews();
    }

    if (colorMgr.inColor)
        colorOffset = (colorOffset + 1.0) % 360;

    if (autoRotateX)
    {
        mat4.multiply(viewMat, mat4.fromXRotation(mat4.create(), 0.005), viewMat);
        cameraRotationX = wrapAngle(cameraRotationX + 0.005);
    }
    if (autoRotateY)
    {
        mat4.multiply(viewMat, mat4.fromYRotation(mat4.create(), 0.003), viewMat);
        cameraRotationY = wrapAngle(cameraRotationY + 0.003);
    }
    if (autoRotateZ)
    {
        mat4.multiply(viewMat, mat4.fromZRotation(mat4.create(), 0.002), viewMat);
        cameraRotationZ = wrapAngle(cameraRotationZ + 0.002);
    }

    cameraXSlider.value = cameraRotationX;
    cameraYSlider.value = cameraRotationY;
    cameraZSlider.value = cameraRotationZ;

    drawAxesIndicator();

    window.requestAnimationFrame(drawScene);
}

function drawPlanePreview(previewCanvas, radius1, radius2, distance)
{
    var previewCtx = previewCanvas.getContext('2d');
    var size = previewCanvas.width;

    previewCtx.clearRect(0, 0, size, size);

    if (radius1 === 0 || radius2 === 0 || distance === 0)
        return;

    var r1 = Math.abs(Math.round(radius1));
    var r2 = Math.abs(Math.round(radius2));
    if (r1 === 0 || r2 === 0)
        return;

    var planeLoops = r2 / greatestCommonDivisor(r1, r2);
    planeLoops = Math.min(planeLoops, 60);

    var armRadius = radius1 - radius2;
    var rollingRatio = armRadius / radius2;
    var maxExtent = Math.abs(armRadius) + Math.abs(distance);

    if (maxExtent === 0)
        return;

    var halfSize = size / 2;
    var previewScale = (halfSize - 4) / maxExtent;

    previewCtx.save();
    previewCtx.translate(halfSize, halfSize);
    previewCtx.beginPath();

    var drawUpTo = animating ? animAngle : (planeLoops * 2 * Math.PI);
    var increment = 2 * Math.PI / 360;
    for (let angle = 0.0; angle < drawUpTo; angle += increment)
    {
        let penAngle = rollingRatio * angle;
        let px = previewScale * (armRadius * Math.cos(angle) + distance * Math.cos(penAngle));
        let py = previewScale * (armRadius * Math.sin(angle) - distance * Math.sin(penAngle));

        if (angle === 0)
            previewCtx.moveTo(px, py);
        else
            previewCtx.lineTo(px, py);
    }

    previewCtx.lineWidth = 1;
    previewCtx.strokeStyle = colorMgr.inColor ? colorMgr.fgColor : customColor;
    previewCtx.stroke();

    if (animating)
    {
        var isLight = document.body.classList.contains('light');
        var overlayStrokeFaint = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
        var overlayStroke = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.65)';
        var overlayArm = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
        var overlayPen = colorMgr.inColor ? colorMgr.fgColor : customColor;

        var mechanismAngle = animAngle % (planeLoops * 2 * Math.PI);

        var outerCircleRadius = radius1 * previewScale;
        var innerCircleRadius = Math.abs(radius2) * previewScale;

        var rollingCenterX = armRadius * Math.cos(mechanismAngle) * previewScale;
        var rollingCenterY = armRadius * Math.sin(mechanismAngle) * previewScale;

        var penAngle = rollingRatio * mechanismAngle;
        var penX = (armRadius * Math.cos(mechanismAngle) + distance * Math.cos(penAngle)) * previewScale;
        var penY = (armRadius * Math.sin(mechanismAngle) - distance * Math.sin(penAngle)) * previewScale;

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

function updatePreviews()
{
    drawPlanePreview(previewZCanvas, z_radius1, z_radius2, z_distance);
}

function strokePolyline3D(ctx, points, strokeStyle, lineWidth)
{
    ctx.beginPath();
    for (let i = 0; i < points.length; i++)
    {
        let p = [points[i][0], points[i][1], points[i][2]];
        vec3.transformMat4(p, p, viewMat);
        if (i === 0)
            ctx.moveTo(p[0], p[1]);
        else
            ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

function fillDot3D(ctx, point, dotRadius, fillStyle)
{
    let p = [point[0], point[1], point[2]];
    vec3.transformMat4(p, p, viewMat);
    ctx.beginPath();
    ctx.arc(p[0], p[1], dotRadius, 0, 2 * Math.PI);
    ctx.fillStyle = fillStyle;
    ctx.fill();
}

function drawMechanismOnMain(ctx)
{
    var isLight = document.body.classList.contains('light');
    var faintStroke = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';
    var mediumStroke = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.65)';
    var armStroke = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
    var penFill = colorMgr.inColor ? colorMgr.fgColor : customColor;
    var segments = 48;

    var axisExtent = 5000;
    strokePolyline3D(ctx, [[-axisExtent, 0, 0], [axisExtent, 0, 0]], '#ff4444', 1);
    strokePolyline3D(ctx, [[0, -axisExtent, 0], [0, axisExtent, 0]], '#44cc44', 1);
    strokePolyline3D(ctx, [[0, 0, -axisExtent], [0, 0, axisExtent]], '#4466ff', 1);

    if (!animating)
        return;

    if (z_radius1 !== 0 && z_radius2 !== 0 && z_distance !== 0)
    {
        var zR1 = Math.abs(Math.round(z_radius1));
        var zR2 = Math.abs(Math.round(z_radius2));
        var zPlaneLoops = zR2 / greatestCommonDivisor(zR1, zR2);
        var zMechAngle = animAngle % (zPlaneLoops * 2 * Math.PI);
        var zNorm = scale / z_radius1;
        var zArmRadius = z_radius1 - z_radius2;
        var zRollingRatio = zArmRadius / z_radius2;
        var zPenAngle = zRollingRatio * zMechAngle;
        var zInnerRadius = zNorm * Math.abs(z_radius2);
        var zRcX = zNorm * zArmRadius * Math.cos(zMechAngle);
        var zRcY = zNorm * zArmRadius * Math.sin(zMechAngle);
        var zPenX = zNorm * (zArmRadius * Math.cos(zMechAngle) + z_distance * Math.cos(zPenAngle));
        var zPenY = zNorm * (zArmRadius * Math.sin(zMechAngle) - z_distance * Math.sin(zPenAngle));

        var zOuterPts = [];
        var zInnerPts = [];
        for (let i = 0; i <= segments; i++)
        {
            let t = i * 2 * Math.PI / segments;
            zOuterPts.push([scale * Math.cos(t), scale * Math.sin(t), 0]);
            zInnerPts.push([zRcX + zInnerRadius * Math.cos(t), zRcY + zInnerRadius * Math.sin(t), 0]);
        }
        strokePolyline3D(ctx, zOuterPts, faintStroke, 1);
        strokePolyline3D(ctx, zInnerPts, mediumStroke, 1);
        strokePolyline3D(ctx, [[zRcX, zRcY, 0], [zPenX, zPenY, 0]], armStroke, 1);
        fillDot3D(ctx, [zPenX, zPenY, 0], 3, penFill);
    }

}

function drawAxesIndicator()
{
    var axesCtx = axesIndicatorCanvas.getContext('2d');
    var size = axesIndicatorCanvas.width;
    var centerX = size / 2;
    var centerY = size / 2;
    var axisLength = size * 0.38;

    axesCtx.clearRect(0, 0, size, size);

    var xAxis = [1, 0, 0];
    var yAxis = [0, 1, 0];
    var zAxis = [0, 0, 1];

    vec3.transformMat4(xAxis, xAxis, viewMat);
    vec3.transformMat4(yAxis, yAxis, viewMat);
    vec3.transformMat4(zAxis, zAxis, viewMat);

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

function hexToHue(hex)
{
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var delta = max - min;
    if (delta === 0)
        return 0;
    var hue;
    if (max === r)
        hue = ((g - b) / delta) % 6;
    else if (max === g)
        hue = (b - r) / delta + 2;
    else
        hue = (r - g) / delta + 4;
    hue = hue * 60;
    if (hue < 0)
        hue += 360;
    return hue;
}

function randomColor()
{
    var hue = Math.floor(Math.random() * 360);
    var lightness = document.body.classList.contains('light') ? 25 : 70;
    return 'hsl(' + hue + ', 100%, ' + lightness + '%)';
}

function greatestCommonDivisor(a, b)
{
    while (b > 0)
    {
        var t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function randomize()
{
    var outerRadiusChoices = [5, 7, 8, 9, 10, 12];
    var innerRadiusChoices = [2, 3, 4, 5, 6, 7];

    function pickInnerRadius(outerRadius)
    {
        var validChoices = innerRadiusChoices.filter(function(r) { return r < outerRadius; });
        return validChoices[Math.floor(Math.random() * validChoices.length)];
    }

    z_radius1 = 0; z_radius2 = 0; z_distance = 0;

    z_radius1 = outerRadiusChoices[Math.floor(Math.random() * outerRadiusChoices.length)];
    z_radius2 = pickInnerRadius(z_radius1);
    z_distance = 1 + Math.floor(Math.random() * z_radius1);

    var rotationChoices = [3, 5, 7, 9];
    x_turns = 0; x_period = 1;
    y_turns = 0; y_period = 1;
    var activeRotations = Math.floor(Math.random() * 3);
    if (activeRotations >= 1)
    {
        x_turns = 1;
        x_period = rotationChoices[Math.floor(Math.random() * rotationChoices.length)];
    }
    if (activeRotations >= 2)
    {
        y_turns = 1;
        y_period = rotationChoices[Math.floor(Math.random() * rotationChoices.length)];
    }

    var maxScale = Math.floor(Math.min(canvas.width, canvas.height) * 0.35);
    scale = 80 + Math.floor(Math.random() * Math.max(1, maxScale - 80));
    scaleSlider.value = scale;

    autoSetLoops();
    customColor = randomColor();
    colorMgr.randomize();
    updateDisplay();
    animAngle = 0;
    updatePreviews();
}

function toggleAllAutoRotate()
{
    var anyOn = autoRotateX || autoRotateY || autoRotateZ;
    autoRotateX = !anyOn;
    autoRotateY = !anyOn;
    autoRotateZ = !anyOn;
    autoRotateXCheck.checked = autoRotateX;
    autoRotateYCheck.checked = autoRotateY;
    autoRotateZCheck.checked = autoRotateZ;
}

function toggleAnimate()
{
    animating = !animating;
    animAngle = 0;
    animateBtn.classList.toggle('btn-active', animating);
}

function makeDraggable(panel, handle)
{
    var dragOffsetX = 0;
    var dragOffsetY = 0;
    var panelDragging = false;

    handle.addEventListener('mousedown', function(e)
    {
        panelDragging = true;
        var rect = panel.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    handle.addEventListener('touchstart', function(e)
    {
        panelDragging = true;
        var rect = panel.getBoundingClientRect();
        dragOffsetX = e.touches[0].clientX - rect.left;
        dragOffsetY = e.touches[0].clientY - rect.top;
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('mousemove', function(e)
    {
        if (!panelDragging)
            return;
        var newLeft = e.clientX - dragOffsetX;
        var newTop = e.clientY - dragOffsetY;
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
    });

    window.addEventListener('touchmove', function(e)
    {
        if (!panelDragging)
            return;
        var newLeft = e.touches[0].clientX - dragOffsetX;
        var newTop = e.touches[0].clientY - dragOffsetY;
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
    }, { passive: false });

    window.addEventListener('mouseup', function()
    {
        panelDragging = false;
    });

    window.addEventListener('touchend', function()
    {
        panelDragging = false;
    });

    window.addEventListener('touchcancel', function()
    {
        panelDragging = false;
    });
}

function initPanelPositions()
{
    var panelX = document.getElementById('panel-x');
    var panelY = document.getElementById('panel-y');
    var panelZ = document.getElementById('panel-z');
    var panelRight = document.getElementById('panel-right');
    var panelBottomRight = document.getElementById('panel-bottom-right');
    var panelBottom = document.getElementById('panel-bottom');
    var panelAxes = document.getElementById('panel-axes');

    panelX.style.top = '20px';
    panelX.style.left = '20px';
    panelY.style.top = (20 + panelX.offsetHeight + 10) + 'px';
    panelY.style.left = '20px';
    panelZ.style.top = (20 + panelX.offsetHeight + 10 + panelY.offsetHeight + 10) + 'px';
    panelZ.style.left = '20px';

    panelRight.style.right = 'auto';
    panelRight.style.top = '20px';
    panelRight.style.left = (window.innerWidth - panelRight.offsetWidth - 20) + 'px';

    panelBottomRight.style.bottom = 'auto';
    panelBottomRight.style.right = 'auto';
    panelBottomRight.style.top = (window.innerHeight - panelBottomRight.offsetHeight - 20) + 'px';
    panelBottomRight.style.left = (window.innerWidth - panelBottomRight.offsetWidth - 20) + 'px';

    panelBottom.style.bottom = 'auto';
    panelBottom.style.transform = 'none';
    panelBottom.style.top = (window.innerHeight - panelBottom.offsetHeight - 20) + 'px';
    panelBottom.style.left = ((window.innerWidth - panelBottom.offsetWidth) / 2) + 'px';

    panelAxes.style.top = '20px';
    panelAxes.style.left = Math.floor((window.innerWidth - panelAxes.offsetWidth) * 0.75) + 'px';

    makeDraggable(panelX, panelX.querySelector('.drag-handle'));
    makeDraggable(panelY, panelY.querySelector('.drag-handle'));
    makeDraggable(panelZ, panelZ.querySelector('.drag-handle'));
    makeDraggable(panelRight, panelRight.querySelector('.drag-handle'));
    makeDraggable(panelBottomRight, panelBottomRight.querySelector('.drag-handle'));
    makeDraggable(panelBottom, panelBottom.querySelector('.drag-handle'));
    makeDraggable(panelAxes, panelAxes.querySelector('.drag-handle'));
}

function resetCamera()
{
    mat4.identity(viewMat);
    cameraRotationX = cameraRotationY = cameraRotationZ = 0.0;
}

function rebuildViewMat()
{
    mat4.identity(viewMat);
    mat4.multiply(viewMat, mat4.fromXRotation(mat4.create(), cameraRotationX), viewMat);
    mat4.multiply(viewMat, mat4.fromYRotation(mat4.create(), cameraRotationY), viewMat);
    mat4.multiply(viewMat, mat4.fromZRotation(mat4.create(), cameraRotationZ), viewMat);
}

function stopAutoRotate()
{
    autoRotateX = false;
    autoRotateY = false;
    autoRotateZ = false;
    autoRotateXCheck.checked = false;
    autoRotateYCheck.checked = false;
    autoRotateZCheck.checked = false;
}

function setCameraX(value)
{
    cameraRotationX = wrapAngle(parseFloat(value));
    rebuildViewMat();
    stopAutoRotate();
}

function setCameraY(value)
{
    cameraRotationY = wrapAngle(parseFloat(value));
    rebuildViewMat();
    stopAutoRotate();
}

function setCameraZ(value)
{
    cameraRotationZ = wrapAngle(parseFloat(value));
    rebuildViewMat();
    stopAutoRotate();
}

function setCameraPlaneXY()
{
    cameraRotationX = 0;
    cameraRotationY = 0;
    cameraRotationZ = 0;
    rebuildViewMat();
    stopAutoRotate();
}

function setCameraPlaneXZ()
{
    cameraRotationX = 3 * Math.PI / 2;
    cameraRotationY = 0;
    cameraRotationZ = 0;
    rebuildViewMat();
    stopAutoRotate();
}

function setCameraPlaneYZ()
{
    cameraRotationX = 0;
    cameraRotationY = Math.PI / 2;
    cameraRotationZ = 0;
    rebuildViewMat();
    stopAutoRotate();
}

function toggleLight()
{
    document.body.classList.toggle('light');
    customColor = document.body.classList.contains('light') ? '#000000' : '#00ffff';
    colorPickerInput.value = customColor;
}
