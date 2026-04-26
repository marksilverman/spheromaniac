var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var x_rotation = 0.0, y_rotation = 0.0, z_rotation = 0.0;
var x_twists = 0, x_period = 1;
var y_twists = 0, y_period = 1;
var z_twists = 0, z_period = 1;
var offsetX = 1.0, offsetY = 0.0, offsetZ = 0.0;
var speedOffX = 0.0, speedOffY = 0.0, speedOffZ = 0.0;
var speedOffXSign = 1, speedOffYSign = 1, speedOffZSign = 1;
var scale = 200.0, lineWidth = 3, loops = 10, raf = 0;
var viewMat = mat4.create();
var center = [0.0, 0.0, 0.0];
var customColor = '#00ffff';
var autoRotateX = true, autoRotateY = true, autoRotateZ = true;
var cameraRotationX = 0.0, cameraRotationY = 0.0, cameraRotationZ = 0.0;
var isDragging = false;
var lastMouseX = 0, lastMouseY = 0;
var activeMouseButton = -1, dragSensitivity = 0.005;

var xTwistsInput, xPeriodInput;
var yTwistsInput, yPeriodInput;
var zTwistsInput, zPeriodInput;
var loopsSlider, loopsInput;
var cameraXSlider, cameraYSlider, cameraZSlider;
var scaleSlider;
var offsetXSlider, offsetYSlider, offsetZSlider;
var speedOffXSlider, speedOffYSlider, speedOffZSlider;
var autoRotateXCheck, autoRotateYCheck, autoRotateZCheck, inColorCheck, lightModeCheck;
var colorPickerInput;

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

canvas.addEventListener('mousemove', function(e)
{
    if (!isDragging)
        return;
    var deltaX = e.clientX - lastMouseX;
    var deltaY = e.clientY - lastMouseY;
    if (activeMouseButton === 0)
    {
        var rotY = mat4.fromYRotation(mat4.create(), deltaX * dragSensitivity);
        var rotX = mat4.fromXRotation(mat4.create(), deltaY * dragSensitivity);
        var temp = mat4.create();
        mat4.multiply(temp, rotY, viewMat);
        mat4.multiply(viewMat, rotX, temp);
        cameraRotationY = wrapAngle(cameraRotationY + deltaX * dragSensitivity);
        cameraRotationX = wrapAngle(cameraRotationX + deltaY * dragSensitivity);
    }
    else if (activeMouseButton === 2)
    {
        var rotZ = mat4.fromZRotation(mat4.create(), deltaY * dragSensitivity);
        mat4.multiply(viewMat, rotZ, viewMat);
        cameraRotationZ = wrapAngle(cameraRotationZ + deltaY * dragSensitivity);
    }
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

function adjustX(amount)
{
    x_twists += amount;
    x_rotation = x_twists / x_period;
    updateDisplay();
    autoSetLoops();
}

function adjustXPeriod(amount)
{
    x_period = Math.max(1, x_period + amount);
    x_rotation = x_twists / x_period;
    updateDisplay();
    autoSetLoops();
}

function setXTwists()
{
    x_twists = parseInt(xTwistsInput.value) || 0;
    x_rotation = x_twists / x_period;
    updateDisplay();
    autoSetLoops();
}

function setXPeriod()
{
    x_period = Math.max(1, parseInt(xPeriodInput.value) || 1);
    x_rotation = x_twists / x_period;
    updateDisplay();
    autoSetLoops();
}

function adjustY(amount)
{
    y_twists += amount;
    y_rotation = y_twists / y_period;
    updateDisplay();
    autoSetLoops();
}

function adjustYPeriod(amount)
{
    y_period = Math.max(1, y_period + amount);
    y_rotation = y_twists / y_period;
    updateDisplay();
    autoSetLoops();
}

function setYTwists()
{
    y_twists = parseInt(yTwistsInput.value) || 0;
    y_rotation = y_twists / y_period;
    updateDisplay();
    autoSetLoops();
}

function setYPeriod()
{
    y_period = Math.max(1, parseInt(yPeriodInput.value) || 1);
    y_rotation = y_twists / y_period;
    updateDisplay();
    autoSetLoops();
}

function adjustZ(amount)
{
    z_twists += amount;
    z_rotation = z_twists / z_period;
    updateDisplay();
    autoSetLoops();
}

function adjustZPeriod(amount)
{
    z_period = Math.max(1, z_period + amount);
    z_rotation = z_twists / z_period;
    updateDisplay();
    autoSetLoops();
}

function setZTwists()
{
    z_twists = parseInt(zTwistsInput.value) || 0;
    z_rotation = z_twists / z_period;
    updateDisplay();
    autoSetLoops();
}

function setZPeriod()
{
    z_period = Math.max(1, parseInt(zPeriodInput.value) || 1);
    z_rotation = z_twists / z_period;
    updateDisplay();
    autoSetLoops();
}

function updateDisplay()
{
    xTwistsInput.value = x_twists;
    xPeriodInput.value = x_period;
    yTwistsInput.value = y_twists;
    yPeriodInput.value = y_period;
    zTwistsInput.value = z_twists;
    zPeriodInput.value = z_period;
}

function autoSetLoops()
{
    var periods = [];
    if (x_twists !== 0)
        periods.push(x_period);
    if (y_twists !== 0)
        periods.push(y_period);
    if (z_twists !== 0)
        periods.push(z_period);
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

    xTwistsInput = document.getElementById('x_twists');
    xPeriodInput = document.getElementById('x_period');
    yTwistsInput = document.getElementById('y_twists');
    yPeriodInput = document.getElementById('y_period');
    zTwistsInput = document.getElementById('z_twists');
    zPeriodInput = document.getElementById('z_period');
    loopsSlider  = document.getElementById('loops');
    loopsInput   = document.getElementById('loops_num');
    cameraXSlider   = document.getElementById('cameraRotationX');
    cameraYSlider   = document.getElementById('cameraRotationY');
    cameraZSlider   = document.getElementById('cameraRotationZ');
    scaleSlider     = document.getElementById('scale');
    offsetXSlider   = document.getElementById('offset_x');
    offsetYSlider   = document.getElementById('offset_y');
    offsetZSlider   = document.getElementById('offset_z');
    speedOffXSlider = document.getElementById('speed_off_x');
    speedOffYSlider = document.getElementById('speed_off_y');
    speedOffZSlider = document.getElementById('speed_off_z');
    autoRotateXCheck = document.getElementById('autoRotateX');
    autoRotateYCheck = document.getElementById('autoRotateY');
    autoRotateZCheck = document.getElementById('autoRotateZ');
    inColorCheck    = document.getElementById('inColor');
    lightModeCheck  = document.getElementById('lightMode');
    colorPickerInput = document.getElementById('colorPicker');

    colorMgr.randomize();
    updateDisplay();
    autoSetLoops();
    autoRotateXCheck.checked = autoRotateX;
    autoRotateYCheck.checked = autoRotateY;
    autoRotateZCheck.checked = autoRotateZ;
    inColorCheck.checked = colorMgr.inColor;
    lightModeCheck.checked = false;
    offsetXSlider.value = offsetX;
    offsetYSlider.value = offsetY;
    offsetZSlider.value = offsetZ;
    initPanelPositions();
    drawScene();
}

function drawScene()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    colorMgr.next();

    ctx.save();
    ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
    ctx.beginPath();

    let increment = 2 * Math.PI / 360;
    for (let angle = 0.0; angle < loops * 2 * Math.PI; angle += increment)
    {
        let xyz = [scale * offsetX, scale * offsetY, scale * offsetZ];

        vec3.rotateZ(xyz, xyz, center, angle * z_rotation);
        vec3.rotateX(xyz, xyz, center, angle * x_rotation);
        vec3.rotateY(xyz, xyz, center, angle * y_rotation);

        vec3.transformMat4(xyz, xyz, viewMat);

        if (angle === 0)
            ctx.moveTo(xyz[0], xyz[1]);
        else
            ctx.lineTo(xyz[0], xyz[1]);
    }
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = colorMgr.inColor ? colorMgr.fgColor : customColor;
    ctx.stroke();
    ctx.restore();

    if (speedOffX !== 0)
    {
        if (offsetX > 1.0)
        {
            offsetX = 1.0;
            speedOffXSign = -1;
        }
        if (offsetX < 0.0)
        {
            offsetX = 0.0;
            speedOffXSign = 1;
        }
        offsetX += speedOffXSign * speedOffX;
        offsetXSlider.value = offsetX;
    }
    if (speedOffY !== 0)
    {
        if (offsetY > 1.0)
        {
            offsetY = 1.0;
            speedOffYSign = -1;
        }
        if (offsetY < 0.0)
        {
            offsetY = 0.0;
            speedOffYSign = 1;
        }
        offsetY += speedOffYSign * speedOffY;
        offsetYSlider.value = offsetY;
    }
    if (speedOffZ !== 0)
    {
        if (offsetZ > 1.0)
        {
            offsetZ = 1.0;
            speedOffZSign = -1;
        }
        if (offsetZ < 0.0)
        {
            offsetZ = 0.0;
            speedOffZSign = 1;
        }
        offsetZ += speedOffZSign * speedOffZ;
        offsetZSlider.value = offsetZ;
    }

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

    raf = window.requestAnimationFrame(drawScene);
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

function randomIrreducibleFraction(denom)
{
    var numerators = [];
    for (var n = 1; n < 2 * denom; n++)
    {
        if (greatestCommonDivisor(n, denom) === 1)
            numerators.push(n);
    }
    return numerators[Math.floor(Math.random() * numerators.length)];
}

function randomize()
{
    var denomPool = [3, 4, 5, 7, 8, 9];

    var denomA = denomPool[Math.floor(Math.random() * denomPool.length)];
    var denomB = denomPool[Math.floor(Math.random() * denomPool.length)];
    var lcm = denomA * denomB / greatestCommonDivisor(denomA, denomB);
    if (lcm > 60)
        denomB = denomA;

    var twistsA = randomIrreducibleFraction(denomA);
    var twistsB = randomIrreducibleFraction(denomB);
    var zeroAxis = Math.floor(Math.random() * 3);
    if (zeroAxis === 0)
    {
        x_twists = 0;
        x_period = denomA;
        y_twists = twistsA;
        y_period = denomA;
        z_twists = twistsB;
        z_period = denomB;
    }
    else if (zeroAxis === 1)
    {
        x_twists = twistsA;
        x_period = denomA;
        y_twists = 0;
        y_period = denomA;
        z_twists = twistsB;
        z_period = denomB;
    }
    else
    {
        x_twists = twistsA;
        x_period = denomA;
        y_twists = twistsB;
        y_period = denomB;
        z_twists = 0;
        z_period = denomB;
    }
    x_rotation = x_twists / x_period;
    y_rotation = y_twists / y_period;
    z_rotation = z_twists / z_period;

    var maxScale = Math.floor(Math.min(canvas.width, canvas.height) * 0.4);
    scale = 100 + Math.floor(Math.random() * Math.max(1, maxScale - 100));
    offsetX = 0.3 + Math.random() * 0.7;
    offsetY = 0.0;
    offsetZ = 0.0;

    scaleSlider.value = scale;
    offsetXSlider.value = offsetX;
    offsetYSlider.value = offsetY;
    offsetZSlider.value = offsetZ;
    autoSetLoops();
    customColor = randomColor();
    updateDisplay();
    colorMgr.randomize();
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

    window.addEventListener('mousemove', function(e)
    {
        if (!panelDragging)
            return;
        panel.style.left = (e.clientX - dragOffsetX) + 'px';
        panel.style.top = (e.clientY - dragOffsetY) + 'px';
    });

    window.addEventListener('mouseup', function()
    {
        panelDragging = false;
    });
}

function initPanelPositions()
{
    var panelLeft = document.getElementById('panel-left');
    var panelRight = document.getElementById('panel-right');
    var panelBottomRight = document.getElementById('panel-bottom-right');
    var panelBottom = document.getElementById('panel-bottom');

    panelLeft.style.top = '20px';
    panelLeft.style.left = '20px';

    panelRight.style.right = '';
    panelRight.style.top = '20px';
    panelRight.style.left = (window.innerWidth - panelRight.offsetWidth - 20) + 'px';

    panelBottomRight.style.bottom = '';
    panelBottomRight.style.right = '';
    panelBottomRight.style.top = (window.innerHeight - panelBottomRight.offsetHeight - 20) + 'px';
    panelBottomRight.style.left = (window.innerWidth - panelBottomRight.offsetWidth - 20) + 'px';

    panelBottom.style.bottom = '';
    panelBottom.style.transform = 'none';
    panelBottom.style.top = (window.innerHeight - panelBottom.offsetHeight - 20) + 'px';
    panelBottom.style.left = ((window.innerWidth - panelBottom.offsetWidth) / 2) + 'px';

    makeDraggable(panelLeft, panelLeft.querySelector('.drag-handle'));
    makeDraggable(panelRight, panelRight.querySelector('.drag-handle'));
    makeDraggable(panelBottomRight, panelBottomRight.querySelector('.drag-handle'));
    makeDraggable(panelBottom, panelBottom.querySelector('.drag-handle'));
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
