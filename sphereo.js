var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var camX = 0.0, camY = 0.0, camZ = 0.0;
var proX = 0.0, proY = 0.0, proZ = 0.0;
var speedX = 0.0, speedY = 0.0, speedZ = 0.0;
var scale = 200.0, speedOff = 0.0, speedOffSign = 1.0;
var lineWidth = 3, offset = 0.1, maxOffset = 2.0, loops = 60.0, raf = 0;
var viewMat = mat4.create();
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

canvas.addEventListener('mouseup', function() {
    isDragging = false;
    activeMouseButton = -1;
});

canvas.addEventListener('mouseleave', function() {
    isDragging = false;
    activeMouseButton = -1;
});

function adjustX(amount)
{
    if (amount === 0)
	proX = 0;
    else
	proX += amount;
    document.getElementById('proXnum').value = proX.toFixed(2);
}

function adjustY(amount)
{
    if (amount === 0)
	proY = 0;
    else
	proY += amount;
    document.getElementById('proYnum').value = proY.toFixed(2);
}

function adjustZ(amount)
{
    if (amount === 0)
	proZ = 0;
    else
	proZ += amount;
    document.getElementById('proZnum').value = proZ.toFixed(2);
}

var colorMgr =
{
    red: 100, green: 200, blue: 50, radd: 2, gadd: -2, badd: 2, inColor: true, fgColor: '',
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

    let angleX = 0.0, angleY = 0.0;
    let center = [ 0.0, 0.0, 0.0 ];

    for (let angleZ = 0.0; angleZ < loops * Math.PI; angleZ += 0.01)
    {
        angleX += proX / 1000.0;
        angleY += proY / 1000.0;

        // start with a circle
	let x = scale * (offset + Math.cos(angleZ));
	let y = scale * Math.sin(angleZ);
	let z = 0.0;
        let xyz = [ x, y, z ];

        // rotate around Z to create a basic spirograph
        vec3.rotateZ(xyz, xyz, center, angleZ * proZ);

        // rotate around X and Y to move into 3d
        vec3.rotateX(xyz, xyz, center, angleX);
        vec3.rotateY(xyz, xyz, center, angleY);

        // account for rotation of the camera
        vec3.transformMat4(xyz, xyz, viewMat);

        if (angleZ == 0)
            ctx.moveTo(xyz[0], xyz[1]);
        else
            ctx.lineTo(xyz[0], xyz[1]);
    }
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = colorMgr.fgColor;
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

function randomize()
{
    proX = proY = 0.0;

    if (Math.random() > 0.5)
        proX = (Math.random() * 0.7).toPrecision(2);
    else
        proY = (Math.random() * 0.7).toPrecision(2);
    proZ = Math.random().toPrecision(2);

    document.getElementById("proX").value = document.getElementById("proXdisp").value = proX;
    document.getElementById("proY").value = document.getElementById("proYdisp").value = proY;
    document.getElementById("proZ").value = document.getElementById("proZdisp").value = proZ;
    colorMgr.randomize();
    if (!raf) pause();
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
