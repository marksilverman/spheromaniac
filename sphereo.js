var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');

var x_rotation1 = 0.0, x_rotation2 = 0.0;
var y_rotation1 = 0.0, y_rotation2 = 0.0;
var z_rotation1 = 0.0, z_rotation2 = 0.0;

var x_twists1 = 0, x_period1 = 1, x_radius1 = 0.0;
var x_twists2 = 0, x_period2 = 1, x_radius2 = 0.0;
var y_twists1 = 0, y_period1 = 1, y_radius1 = 0.0;
var y_twists2 = 0, y_period2 = 1, y_radius2 = 0.0;
var z_twists1 = 0, z_period1 = 1, z_radius1 = 1.0;
var z_twists2 = 0, z_period2 = 1, z_radius2 = 0.0;

var scale = 200.0, lineWidth = 3, loops = 10, raf = 0;
var viewMat = mat4.create();
var center = [0.0, 0.0, 0.0];
var customColor = '#00ffff';
var autoRotateX = true, autoRotateY = true, autoRotateZ = true;
var cameraRotationX = 0.0, cameraRotationY = 0.0, cameraRotationZ = 0.0;
var isDragging = false;
var lastMouseX = 0, lastMouseY = 0;
var activeMouseButton = -1, dragSensitivity = 0.005;

var xTwists1Input, xPeriod1Input, xRadius1Slider;
var xTwists2Input, xPeriod2Input, xRadius2Slider;
var yTwists1Input, yPeriod1Input, yRadius1Slider;
var yTwists2Input, yPeriod2Input, yRadius2Slider;
var zTwists1Input, zPeriod1Input, zRadius1Slider;
var zTwists2Input, zPeriod2Input, zRadius2Slider;
var loopsSlider, loopsInput;
var cameraXSlider, cameraYSlider, cameraZSlider;
var scaleSlider;
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

function adjustX1(amount)
{
    x_twists1 += amount;
    x_rotation1 = x_twists1 / x_period1;
    updateDisplay();
    autoSetLoops();
}

function adjustX1Period(amount)
{
    x_period1 = Math.max(1, x_period1 + amount);
    x_rotation1 = x_twists1 / x_period1;
    updateDisplay();
    autoSetLoops();
}

function setX1Twists()
{
    x_twists1 = parseInt(xTwists1Input.value) || 0;
    x_rotation1 = x_twists1 / x_period1;
    updateDisplay();
    autoSetLoops();
}

function setX1Period()
{
    x_period1 = Math.max(1, parseInt(xPeriod1Input.value) || 1);
    x_rotation1 = x_twists1 / x_period1;
    updateDisplay();
    autoSetLoops();
}

function adjustX2(amount)
{
    x_twists2 += amount;
    x_rotation2 = x_twists2 / x_period2;
    updateDisplay();
    autoSetLoops();
}

function adjustX2Period(amount)
{
    x_period2 = Math.max(1, x_period2 + amount);
    x_rotation2 = x_twists2 / x_period2;
    updateDisplay();
    autoSetLoops();
}

function setX2Twists()
{
    x_twists2 = parseInt(xTwists2Input.value) || 0;
    x_rotation2 = x_twists2 / x_period2;
    updateDisplay();
    autoSetLoops();
}

function setX2Period()
{
    x_period2 = Math.max(1, parseInt(xPeriod2Input.value) || 1);
    x_rotation2 = x_twists2 / x_period2;
    updateDisplay();
    autoSetLoops();
}

function adjustY1(amount)
{
    y_twists1 += amount;
    y_rotation1 = y_twists1 / y_period1;
    updateDisplay();
    autoSetLoops();
}

function adjustY1Period(amount)
{
    y_period1 = Math.max(1, y_period1 + amount);
    y_rotation1 = y_twists1 / y_period1;
    updateDisplay();
    autoSetLoops();
}

function setY1Twists()
{
    y_twists1 = parseInt(yTwists1Input.value) || 0;
    y_rotation1 = y_twists1 / y_period1;
    updateDisplay();
    autoSetLoops();
}

function setY1Period()
{
    y_period1 = Math.max(1, parseInt(yPeriod1Input.value) || 1);
    y_rotation1 = y_twists1 / y_period1;
    updateDisplay();
    autoSetLoops();
}

function adjustY2(amount)
{
    y_twists2 += amount;
    y_rotation2 = y_twists2 / y_period2;
    updateDisplay();
    autoSetLoops();
}

function adjustY2Period(amount)
{
    y_period2 = Math.max(1, y_period2 + amount);
    y_rotation2 = y_twists2 / y_period2;
    updateDisplay();
    autoSetLoops();
}

function setY2Twists()
{
    y_twists2 = parseInt(yTwists2Input.value) || 0;
    y_rotation2 = y_twists2 / y_period2;
    updateDisplay();
    autoSetLoops();
}

function setY2Period()
{
    y_period2 = Math.max(1, parseInt(yPeriod2Input.value) || 1);
    y_rotation2 = y_twists2 / y_period2;
    updateDisplay();
    autoSetLoops();
}

function adjustZ1(amount)
{
    z_twists1 += amount;
    z_rotation1 = z_twists1 / z_period1;
    updateDisplay();
    autoSetLoops();
}

function adjustZ1Period(amount)
{
    z_period1 = Math.max(1, z_period1 + amount);
    z_rotation1 = z_twists1 / z_period1;
    updateDisplay();
    autoSetLoops();
}

function setZ1Twists()
{
    z_twists1 = parseInt(zTwists1Input.value) || 0;
    z_rotation1 = z_twists1 / z_period1;
    updateDisplay();
    autoSetLoops();
}

function setZ1Period()
{
    z_period1 = Math.max(1, parseInt(zPeriod1Input.value) || 1);
    z_rotation1 = z_twists1 / z_period1;
    updateDisplay();
    autoSetLoops();
}

function adjustZ2(amount)
{
    z_twists2 += amount;
    z_rotation2 = z_twists2 / z_period2;
    updateDisplay();
    autoSetLoops();
}

function adjustZ2Period(amount)
{
    z_period2 = Math.max(1, z_period2 + amount);
    z_rotation2 = z_twists2 / z_period2;
    updateDisplay();
    autoSetLoops();
}

function setZ2Twists()
{
    z_twists2 = parseInt(zTwists2Input.value) || 0;
    z_rotation2 = z_twists2 / z_period2;
    updateDisplay();
    autoSetLoops();
}

function setZ2Period()
{
    z_period2 = Math.max(1, parseInt(zPeriod2Input.value) || 1);
    z_rotation2 = z_twists2 / z_period2;
    updateDisplay();
    autoSetLoops();
}

function updateDisplay()
{
    xTwists1Input.value = x_twists1;
    xPeriod1Input.value = x_period1;
    xTwists2Input.value = x_twists2;
    xPeriod2Input.value = x_period2;
    yTwists1Input.value = y_twists1;
    yPeriod1Input.value = y_period1;
    yTwists2Input.value = y_twists2;
    yPeriod2Input.value = y_period2;
    zTwists1Input.value = z_twists1;
    zPeriod1Input.value = z_period1;
    zTwists2Input.value = z_twists2;
    zPeriod2Input.value = z_period2;
}

function autoSetLoops()
{
    var periods = [];
    if (x_radius1 > 0 && x_twists1 !== 0) periods.push(x_period1);
    if (x_radius2 > 0 && x_twists2 !== 0) periods.push(x_period2);
    if (y_radius1 > 0 && y_twists1 !== 0) periods.push(y_period1);
    if (y_radius2 > 0 && y_twists2 !== 0) periods.push(y_period2);
    if (z_radius1 > 0 && z_twists1 !== 0) periods.push(z_period1);
    if (z_radius2 > 0 && z_twists2 !== 0) periods.push(z_period2);
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

    xTwists1Input  = document.getElementById('x_twists1');
    xPeriod1Input  = document.getElementById('x_period1');
    xRadius1Slider = document.getElementById('x_radius1');
    xTwists2Input  = document.getElementById('x_twists2');
    xPeriod2Input  = document.getElementById('x_period2');
    xRadius2Slider = document.getElementById('x_radius2');

    yTwists1Input  = document.getElementById('y_twists1');
    yPeriod1Input  = document.getElementById('y_period1');
    yRadius1Slider = document.getElementById('y_radius1');
    yTwists2Input  = document.getElementById('y_twists2');
    yPeriod2Input  = document.getElementById('y_period2');
    yRadius2Slider = document.getElementById('y_radius2');

    zTwists1Input  = document.getElementById('z_twists1');
    zPeriod1Input  = document.getElementById('z_period1');
    zRadius1Slider = document.getElementById('z_radius1');
    zTwists2Input  = document.getElementById('z_twists2');
    zPeriod2Input  = document.getElementById('z_period2');
    zRadius2Slider = document.getElementById('z_radius2');

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

    colorMgr.randomize();
    updateDisplay();
    autoSetLoops();
    autoRotateXCheck.checked = autoRotateX;
    autoRotateYCheck.checked = autoRotateY;
    autoRotateZCheck.checked = autoRotateZ;
    inColorCheck.checked = colorMgr.inColor;
    lightModeCheck.checked = false;
    xRadius1Slider.value = x_radius1;
    xRadius2Slider.value = x_radius2;
    yRadius1Slider.value = y_radius1;
    yRadius2Slider.value = y_radius2;
    zRadius1Slider.value = z_radius1;
    zRadius2Slider.value = z_radius2;
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
        let z_arm1 = [scale * z_radius1, 0, 0];
        vec3.rotateZ(z_arm1, z_arm1, center, angle * z_rotation1);

        let z_arm2 = [scale * z_radius2, 0, 0];
        vec3.rotateZ(z_arm2, z_arm2, center, angle * z_rotation2);

        let x_arm1 = [0, scale * x_radius1, 0];
        vec3.rotateX(x_arm1, x_arm1, center, angle * x_rotation1);

        let x_arm2 = [0, scale * x_radius2, 0];
        vec3.rotateX(x_arm2, x_arm2, center, angle * x_rotation2);

        let y_arm1 = [0, 0, scale * y_radius1];
        vec3.rotateY(y_arm1, y_arm1, center, angle * y_rotation1);

        let y_arm2 = [0, 0, scale * y_radius2];
        vec3.rotateY(y_arm2, y_arm2, center, angle * y_rotation2);

        let xyz = [
            z_arm1[0] + z_arm2[0] + x_arm1[0] + x_arm2[0] + y_arm1[0] + y_arm2[0],
            z_arm1[1] + z_arm2[1] + x_arm1[1] + x_arm2[1] + y_arm1[1] + y_arm2[1],
            z_arm1[2] + z_arm2[2] + x_arm1[2] + x_arm2[2] + y_arm1[2] + y_arm2[2]
        ];

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

    function randomDenom()
    {
        return denomPool[Math.floor(Math.random() * denomPool.length)];
    }

    x_twists1 = 0; x_period1 = 1; x_radius1 = 0.0; x_rotation1 = 0.0;
    x_twists2 = 0; x_period2 = 1; x_radius2 = 0.0; x_rotation2 = 0.0;
    y_twists1 = 0; y_period1 = 1; y_radius1 = 0.0; y_rotation1 = 0.0;
    y_twists2 = 0; y_period2 = 1; y_radius2 = 0.0; y_rotation2 = 0.0;
    z_twists1 = 0; z_period1 = 1; z_radius1 = 1.0; z_rotation1 = 0.0;
    z_twists2 = 0; z_period2 = 1; z_radius2 = 0.0; z_rotation2 = 0.0;

    var denomA = randomDenom();
    z_twists1 = randomIrreducibleFraction(denomA);
    z_period1 = denomA;
    z_rotation1 = z_twists1 / z_period1;

    var denomB = randomDenom();
    while (denomA * denomB / greatestCommonDivisor(denomA, denomB) > 60)
        denomB = randomDenom();

    var twistsB = randomIrreducibleFraction(denomB);

    if (Math.random() < 0.5)
    {
        z_radius1 = 0.5 + Math.random() * 0.4;
        z_twists2 = twistsB;
        z_period2 = denomB;
        z_rotation2 = z_twists2 / z_period2;
        z_radius2 = 1.0 - z_radius1;
    }
    else
    {
        z_radius1 = 0.6 + Math.random() * 0.4;
        var secondPlane = Math.floor(Math.random() * 2);
        var radiusB = 0.3 + Math.random() * 0.4;
        if (secondPlane === 0)
        {
            x_twists1 = twistsB;
            x_period1 = denomB;
            x_rotation1 = x_twists1 / x_period1;
            x_radius1 = radiusB;
        }
        else
        {
            y_twists1 = twistsB;
            y_period1 = denomB;
            y_rotation1 = y_twists1 / y_period1;
            y_radius1 = radiusB;
        }
    }

    var maxScale = Math.floor(Math.min(canvas.width, canvas.height) * 0.35);
    scale = 80 + Math.floor(Math.random() * Math.max(1, maxScale - 80));

    scaleSlider.value = scale;
    xRadius1Slider.value = x_radius1;
    xRadius2Slider.value = x_radius2;
    yRadius1Slider.value = y_radius1;
    yRadius2Slider.value = y_radius2;
    zRadius1Slider.value = z_radius1;
    zRadius2Slider.value = z_radius2;

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
