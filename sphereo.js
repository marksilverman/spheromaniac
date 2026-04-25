var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var camX = 0.0, camY = 0.0, camZ = 0.0;
var x_rotation = 0.0, y_rotation = 0.0, z_rotation = 0.0;
var speedX = 0.0, speedY = 0.0, speedZ = 0.0;
var scale = 200.0, speedOff = 0.0, speedOffSign = 1.0;
var lineWidth = 3, offset = 0.1, maxOffset = 2.0, loops = 10, raf = 0;
var viewMat = mat4.create();
var center = [0.0, 0.0, 0.0];
var customColor = '#00ffff';
var isDragging = false;
var lastMouseX = 0, lastMouseY = 0;
var activeMouseButton = -1, dragSensitivity = 0.005;

canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });

canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    activeMouseButton = e.button;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
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
    }
    else if (activeMouseButton === 2)
    {
        var rotZ = mat4.fromZRotation(mat4.create(), deltaY * dragSensitivity);
        mat4.multiply(viewMat, rotZ, viewMat);
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
    colorMgr.randomize();
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

    if (speedX)
    {
        camX += speedX;
        if (camX > 6.28) camX = 0.0;
        document.getElementById("camX").value = camX;
    }

    if (speedY)
    {
        camY += speedY;
        if (camY > 6.28) camY = 0.0;
        document.getElementById("camY").value = camY;
    }

    if (speedZ > 0.0)
    {
        camZ += speedZ;
        if (camZ > 6.28) camZ = 0.0;
        document.getElementById("camZ").value = camZ;
    }

    raf = window.requestAnimationFrame(drawScene);
}

function randomFraction()
{
    var denom = 2 + Math.floor(Math.random() * 8);
    var numer = 1 + Math.floor(Math.random() * (denom - 1));
    return numer / denom;
}

function randomize()
{
    x_rotation = randomFraction();
    y_rotation = randomFraction();
    z_rotation = randomFraction();

    var zeroAxis = Math.floor(Math.random() * 3);
    if (zeroAxis === 0) x_rotation = 0;
    else if (zeroAxis === 1) y_rotation = 0;
    else z_rotation = 0;

    scale = 100 + Math.floor(Math.random() * 201);
    offset = Math.random() * ((canvas.width / 2) / scale - 1);

    document.getElementById('scale').value = scale;
    document.getElementById('offset').value = offset;

    updateDisplay();
    colorMgr.randomize();
    if (!raf) pause();
}

function toggleLight()
{
    document.body.classList.toggle('light');
    customColor = document.body.classList.contains('light') ? '#000000' : '#00ffff';
    document.getElementById('colorPicker').value = customColor;
}

function pause()
{
    if (document.getElementById("pause").innerHTML == "pause")
    {
        window.cancelAnimationFrame(raf);
        document.getElementById("pause").innerHTML = "unpause";
        raf = 0;
    }
    else
    {
        document.getElementById("pause").innerHTML =  "pause";
        drawScene();
    }
}
