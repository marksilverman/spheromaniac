var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var x_rotation = 0.0, y_rotation = 0.0, z_rotation = 0.0;
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

canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

window.addEventListener('resize', function() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
});

canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    activeMouseButton = e.button;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    autoRotate = false;
    document.getElementById('autoRotate').checked = false;
});

canvas.addEventListener('mousemove', function(e) {
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

function stopDrag() {
    isDragging = false;
    activeMouseButton = -1;
}

canvas.addEventListener('mouseup', stopDrag);
canvas.addEventListener('mouseleave', stopDrag);

var keyboardStep = 0.05;

document.addEventListener('keydown', function(e) {
    if (document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text')
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
        document.getElementById('autoRotate').checked = false;
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
    document.getElementById('loops').value = loops;
    document.getElementById('loops_num').value = loops;
}

function adjustX(amount)
{
    x_rotation += amount;
    updateDisplay();
}

function adjustY(amount)
{
    y_rotation += amount;
    updateDisplay();
}

function adjustZ(amount)
{
    z_rotation += amount;
    updateDisplay();
}

function safeEval(str)
{
    if (!/^[\d\s+\-*/().]+$/.test(str))
	return 0;

    try {
	return Function('"use strict"; return (' + str + ')')();
    } catch {
	return 0;
    }
}

function updateDisplay()
{
    document.getElementById('x_rotation_num').value = x_rotation.toFixed(6);
    document.getElementById('x_rotation_slide').value = x_rotation;
    document.getElementById('y_rotation_num').value = y_rotation.toFixed(6);
    document.getElementById('y_rotation_slide').value = y_rotation;
    document.getElementById('z_rotation_num').value = z_rotation.toFixed(6);
    document.getElementById('z_rotation_slide').value = z_rotation;
}

var colorMgr =
{
    red: 100, green: 200, blue: 50, radd: 2, gadd: -2, badd: 2, inColor: false, fgColor: '',
    randomize: function ()
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
        if (color > 255) {
            color = 255;
            adder *= -1;
        }
        if (color < 100) {
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
        this.fgColor='rgba(' + this.red + ',' + this.green + ',' + this.blue + ')';
    }
}

main();

function main()
{
    if (!ctx)
        return alert("Your browser doesn\'t support something.");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    colorMgr.randomize();
    updateDisplay();
    setLoops(loops);
    document.getElementById('autoRotate').checked = autoRotate;
    document.getElementById('inColor').checked = colorMgr.inColor;
    document.getElementById('lightMode').checked = false;
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
        document.getElementById("offset").value = offset;
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

    document.getElementById('cameraRotationX').value = cameraRotationX;
    document.getElementById('cameraRotationY').value = cameraRotationY;
    document.getElementById('cameraRotationZ').value = cameraRotationZ;

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
    return numerators[Math.floor(Math.random() * numerators.length)] / denom;
}

function randomize()
{
    var denomPool = [3, 4, 5, 7, 8, 9];

    var denomA = denomPool[Math.floor(Math.random() * denomPool.length)];
    var denomB = denomPool[Math.floor(Math.random() * denomPool.length)];
    var lcm = denomA * denomB / greatestCommonDivisor(denomA, denomB);
    if (lcm > 40)
    {
        denomB = denomA;
        lcm = denomA;
    }
    loops = lcm;

    var zeroAxis = Math.floor(Math.random() * 3);
    if (zeroAxis === 0)
    {
        x_rotation = 0;
        y_rotation = randomIrreducibleFraction(denomA);
        z_rotation = randomIrreducibleFraction(denomB);
    }
    else if (zeroAxis === 1)
    {
        x_rotation = randomIrreducibleFraction(denomA);
        y_rotation = 0;
        z_rotation = randomIrreducibleFraction(denomB);
    }
    else
    {
        x_rotation = randomIrreducibleFraction(denomA);
        y_rotation = randomIrreducibleFraction(denomB);
        z_rotation = 0;
    }

    var maxScale = Math.floor(Math.min(canvas.width, canvas.height) * 0.4);
    scale = 100 + Math.floor(Math.random() * Math.max(1, maxScale - 100));
    offset = Math.random() * ((canvas.width / 2) / scale - 1);

    document.getElementById('scale').value = scale;
    document.getElementById('offset').value = offset;
    setLoops(loops);
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
    document.getElementById('autoRotate').checked = false;
}

function setCameraY(value)
{
    cameraRotationY = parseFloat(value);
    rebuildViewMat();
    autoRotate = false;
    document.getElementById('autoRotate').checked = false;
}

function setCameraZ(value)
{
    cameraRotationZ = parseFloat(value);
    rebuildViewMat();
    autoRotate = false;
    document.getElementById('autoRotate').checked = false;
}

function toggleLight()
{
    document.body.classList.toggle('light');
    customColor = document.body.classList.contains('light') ? '#000000' : '#00ffff';
    document.getElementById('colorPicker').value = customColor;
}

