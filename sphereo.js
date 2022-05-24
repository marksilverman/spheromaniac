var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var rotX = 0.0, rotY = 0.0, rotZ = 0.0;
var proX = 0.28, proY = 0.0, proZ = -0.3333;
var speedX = 0.01, speedY = 0.01, speedZ = 0.02;
var autoX = true, autoY = true, autoZ = false, autoOff = false;
var scale = 60.0, speedOff = 0.01, lineWidth = 3, offset = 2.5, maxOffset = 5.0, loops = 60.0, raf = 0;

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

    document.getElementById("proXdisp").value=document.getElementById("proX").value;
    document.getElementById("proYdisp").value=document.getElementById("proY").value;
    document.getElementById("proZdisp").value=document.getElementById("proZ").value;
    document.getElementById("speedOff").value=speedOff;
    document.getElementById("lineWidth").value=lineWidth;
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
    let oldxyz = [ 0.0, 0.0, 0.0 ];

    for (let angleZ = 0.0; angleZ < loops * Math.PI; angleZ += 0.01)
    {
        angleX += proX / 1000.0;
        angleY += proY / 1000.0;

        // start with a circle
        let xyz = [ scale * parseFloat(offset + Math.cos(angleZ)), scale * parseFloat(Math.sin(angleZ)), 0.0 ];

        // rotate around Z to create a basic spirograph
        vec3.rotateZ(xyz, xyz, center, angleZ * proZ);

        // rotate around X and Y to move into 3d
        vec3.rotateX(xyz, xyz, center, angleX);
        vec3.rotateY(xyz, xyz, center, angleY);

        // account for rotation of the camera
        vec3.rotateX(xyz, xyz, center, rotX);
        vec3.rotateY(xyz, xyz, center, rotY);
        vec3.rotateZ(xyz, xyz, center, rotZ);

        if (angleZ == 0)
            ctx.moveTo(xyz[0], xyz[1]);
        else
            ctx.lineTo(xyz[0], xyz[1]);
    }
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = colorMgr.fgColor;
    ctx.stroke();
    ctx.restore();

    if (autoOff)
    {
        if (Math.abs(offset) > maxOffset)
            speedOff = speedOff * -1;
        offset += speedOff;
    }

    if (autoX) rotX += speedX;
    if (autoY) rotY += speedY;
    if (autoZ) rotZ += speedZ;

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

function msg(info)
{
    document.getElementById("msg").innerHTML=info;
}

