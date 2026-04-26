var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var x_rotation = 0.0, y_rotation = 0.0, z_rotation = 0.0;
var x_turns = 0, x_period = 1;
var y_turns = 0, y_period = 1;
var z_turns = 0, z_period = 1;
var scale = 200.0, speedOff = 0.0, speedOffSign = 1.0;
var lineWidth = 3, offset = 0.1, maxOffset = 4.0, loops = 10, raf = 0;
var viewMat = mat4.create();
var center = [0.0, 0.0, 0.0];
var customColor = '#00ffff';
var autoRotate = true;
var cameraRotationX = 0.0, cameraRotationY = 0.0, cameraRotationZ = 0.0;
var isDragging = false;
var lastMouseX = 0, lastMouseY = 0;
var activeMouseButton = -1, dragSensitivity = 0.005;

var xTurnsInput, xPeriodInput;
var yTurnsInput, yPeriodInput;
var zTurnsInput, zPeriodInput;
var loopsSlider, loopsInput;
var cameraXSlider, cameraYSlider, cameraZSlider;
var scaleSlider, offsetSlider;
var autoRotateCheck, inColorCheck, lightModeCheck;
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
    autoRotate = false;
    autoRotateCheck.checked = false;
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
        autoRotate = false;
        autoRotateCheck.checked = false;
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
    x_turns += amount;
    x_rotation = x_turns / x_period;
    updateDisplay();
    autoSetLoops();
}

function adjustXPeriod(amount)
{
    x_period = Math.max(1, x_period + amount);
    x_rotation = x_turns / x_period;
    updateDisplay();
    autoSetLoops();
}

function setXTurns()
{
    x_turns = parseInt(xTurnsInput.value) || 0;
    x_rotation = x_turns / x_period;
    updateDisplay();
    autoSetLoops();
}

function setXPeriod()
{
    x_period = Math.max(1, parseInt(xPeriodInput.value) || 1);
    x_rotation = x_turns / x_period;
    updateDisplay();
    autoSetLoops();
}

function adjustY(amount)
{
    y_turns += amount;
    y_rotation = y_turns / y_period;
    updateDisplay();
    autoSetLoops();
}

function adjustYPeriod(amount)
{
    y_period = Math.max(1, y_period + amount);
    y_rotation = y_turns / y_period;
    updateDisplay();
    autoSetLoops();
}

function setYTurns()
{
    y_turns = parseInt(yTurnsInput.value) || 0;
    y_rotation = y_turns / y_period;
    updateDisplay();
    autoSetLoops();
}

function setYPeriod()
{
    y_period = Math.max(1, parseInt(yPeriodInput.value) || 1);
    y_rotation = y_turns / y_period;
    updateDisplay();
    autoSetLoops();
}

function adjustZ(amount)
{
    z_turns += amount;
    z_rotation = z_turns / z_period;
    updateDisplay();
    autoSetLoops();
}

function adjustZPeriod(amount)
{
    z_period = Math.max(1, z_period + amount);
    z_rotation = z_turns / z_period;
    updateDisplay();
    autoSetLoops();
}

function setZTurns()
{
    z_turns = parseInt(zTurnsInput.value) || 0;
    z_rotation = z_turns / z_period;
    updateDisplay();
    autoSetLoops();
}

function setZPeriod()
{
    z_period = Math.max(1, parseInt(zPeriodInput.value) || 1);
    z_rotation = z_turns / z_period;
    updateDisplay();
    autoSetLoops();
}

function updateDisplay()
{
    xTurnsInput.value = x_turns;
    xPeriodInput.value = x_period;
    yTurnsInput.value = y_turns;
    yPeriodInput.value = y_period;
    zTurnsInput.value = z_turns;
    zPeriodInput.value = z_period;
}

function autoSetLoops()
{
    var periods = [];
    if (x_turns !== 0)
        periods.push(x_period);
    if (y_turns !== 0)
        periods.push(y_period);
    if (z_turns !== 0)
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

    xTurnsInput  = document.getElementById('x_turns');
    xPeriodInput = document.getElementById('x_period');
    yTurnsInput  = document.getElementById('y_turns');
    yPeriodInput = document.getElementById('y_period');
    zTurnsInput  = document.getElementById('z_turns');
    zPeriodInput = document.getElementById('z_period');
    loopsSlider  = document.getElementById('loops');
    loopsInput   = document.getElementById('loops_num');
    cameraXSlider   = document.getElementById('cameraRotationX');
    cameraYSlider   = document.getElementById('cameraRotationY');
    cameraZSlider   = document.getElementById('cameraRotationZ');
    scaleSlider     = document.getElementById('scale');
    offsetSlider    = document.getElementById('offset');
    autoRotateCheck = document.getElementById('autoRotate');
    inColorCheck    = document.getElementById('inColor');
    lightModeCheck  = document.getElementById('lightMode');
    colorPickerInput = document.getElementById('colorPicker');

    colorMgr.randomize();
    updateDisplay();
    autoSetLoops();
    autoRotateCheck.checked = autoRotate;
    inColorCheck.checked = colorMgr.inColor;
    lightModeCheck.checked = false;
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
        // start with a circle
        let x = scale * (offset + Math.cos(angle));
        let y = scale * Math.sin(angle);
        let xyz = [ x, y, 0.0 ];

        // rotate around Z to create a basic spirograph
        vec3.rotateZ(xyz, xyz, center, angle * z_rotation);

        // rotate around X and Y to move into 3d
        vec3.rotateX(xyz, xyz, center, angle * x_rotation);
        vec3.rotateY(xyz, xyz, center, angle * y_rotation);

        // account for rotation of the camera
        vec3.transformMat4(xyz, xyz, viewMat);

        if (angle == 0)
            ctx.moveTo(xyz[0], xyz[1]);
        else
            ctx.lineTo(xyz[0], xyz[1]);
    }
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = colorMgr.inColor ? colorMgr.fgColor : customColor;
    ctx.stroke();
    ctx.restore();

    if (speedOff)
    {
        if (offset > maxOffset)
        {
            offset = maxOffset;
            speedOffSign = -1;
        }
        if (offset < -1 * maxOffset)
        {
            offset = -1 * maxOffset;
            speedOffSign = 1;
        }
        offset += speedOffSign * speedOff;
        offsetSlider.value = offset;
    }

    if (autoRotate)
    {
        mat4.multiply(viewMat, mat4.fromXRotation(mat4.create(), 0.005), viewMat);
        mat4.multiply(viewMat, mat4.fromYRotation(mat4.create(), 0.003), viewMat);
        mat4.multiply(viewMat, mat4.fromZRotation(mat4.create(), 0.002), viewMat);
        cameraRotationX = wrapAngle(cameraRotationX + 0.005);
        cameraRotationY = wrapAngle(cameraRotationY + 0.003);
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

    var turnsA = randomIrreducibleFraction(denomA);
    var turnsB = randomIrreducibleFraction(denomB);
    var zeroAxis = Math.floor(Math.random() * 3);
    if (zeroAxis === 0)
    {
        x_turns = 0;
        x_period = denomA;
        y_turns = turnsA;
        y_period = denomA;
        z_turns = turnsB;
        z_period = denomB;
    }
    else if (zeroAxis === 1)
    {
        x_turns = turnsA;
        x_period = denomA;
        y_turns = 0;
        y_period = denomA;
        z_turns = turnsB;
        z_period = denomB;
    }
    else
    {
        x_turns = turnsA;
        x_period = denomA;
        y_turns = turnsB;
        y_period = denomB;
        z_turns = 0;
        z_period = denomB;
    }
    x_rotation = x_turns / x_period;
    y_rotation = y_turns / y_period;
    z_rotation = z_turns / z_period;

    var maxScale = Math.floor(Math.min(canvas.width, canvas.height) * 0.4);
    scale = 100 + Math.floor(Math.random() * Math.max(1, maxScale - 100));
    offset = Math.random() * ((canvas.width / 2) / scale - 1);

    scaleSlider.value = scale;
    offsetSlider.value = offset;
    autoSetLoops();
    customColor = randomColor();
    updateDisplay();
    colorMgr.randomize();
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

function setCameraX(value)
{
    cameraRotationX = parseFloat(value);
    rebuildViewMat();
    autoRotate = false;
    autoRotateCheck.checked = false;
}

function setCameraY(value)
{
    cameraRotationY = parseFloat(value);
    rebuildViewMat();
    autoRotate = false;
    autoRotateCheck.checked = false;
}

function setCameraZ(value)
{
    cameraRotationZ = parseFloat(value);
    rebuildViewMat();
    autoRotate = false;
    autoRotateCheck.checked = false;
}

function toggleLight()
{
    document.body.classList.toggle('light');
    customColor = document.body.classList.contains('light') ? '#000000' : '#00ffff';
    colorPickerInput.value = customColor;
}
