var canvas = document.querySelector('#canvas');
var ctx = canvas.getContext('2d');
var ww = canvas.width*.5;
var hh = canvas.height*.5;
var raf = 0;

var colorMgr =
{
    red: 100, green: 200, blue: 50, radd: 1, gadd: -1, badd: 1, inColor: true, fgColor: '',
    randomize: function ()
    {
        this.red = 100+Math.floor(Math.random() * 100);
        this.green = 100+Math.floor(Math.random() * 100);
        this.blue = 100+Math.floor(Math.random() * 100);
    },
    flip: function()
    {
        this.inColor = !this.inColor;
    },
    next: function()
    {
        if (!this.inColor)
            return;

        this.red += this.radd;
        this.green += this.gadd;
        this.blue += this.badd;
        if (this.red > 255) { this.red = 255; this.radd *= -1; }
        if (this.red < 100) { this.red = 100; this.radd *= -1; }
        if (this.green > 255) { this.green = 255; this.gadd *=-1; }
        if (this.green < 100) { this.green = 100; this.gadd *= -1; }
        if (this.blue > 255) { this.blue = 255; this.badd *=-1; }
        if (this.blue < 100) { this.blue = 100; this.badd *= -1; }
        this.fgColor='rgba(' + this.red + ',' + this.green + ',' + this.blue + ')';
    }
}

var spiro =
{
    rotX: 0.0, rotY: 0.0, rotZ: 0.0,
    proX: 0.0, proY: 0.0, proZ: -0.3333,
    speedX: 0.02, speedY: 0.02, speedZ: 0.02,
    autoX: false, autoY: false, autoZ: false, autoOffset: false,
    fFov: 1800.0, scale: 40.0, speed: 0.02, width: 3, offset: 0.5, maxOffset: 1.0, loops: 40.0,

    draw: function()
    {
        colorMgr.next();
        spiro.colors = [colorMgr.red, colorMgr.blue, colorMgr.green, 1.0];

        ctx.save();
        ctx.translate(ww, hh);
        ctx.beginPath();

        let axisX = 0.0, axisY = 0.0;
        let center = [ 0.0, 0.0, 0.0 ];
        let oldxyz = [ 0.0, 0.0, 0.0 ];

        for (let angle1 = 0.0; angle1 < this.loops * Math.PI; angle1 += 0.01)
        {
            axisX += this.proX / 1000.0;
            axisY += this.proY / 1000.0;

            // start with a circle
            let x = parseFloat(5 * this.offset + Math.cos(angle1));
            let y = parseFloat(Math.sin(angle1));
            let z = 0.0;

            let xyz = [ x, y, z ];
            // rotate around Z to create a basic spirograph
            vec3.rotateZ(xyz, xyz, center, angle1 * this.proZ);

            // rotate around X and Y to move into 3d
            vec3.rotateX(xyz, xyz, center, axisX);
            vec3.rotateY(xyz, xyz, center, axisY);

            // account for rotation of the camera
            vec3.rotateX(xyz, xyz, center, spiro.rotX);
            vec3.rotateY(xyz, xyz, center, spiro.rotY);
            vec3.rotateZ(xyz, xyz, center, spiro.rotZ);

            if (angle1 == 0)
                ctx.moveTo(xyz[0]*this.scale, xyz[1]*this.scale);
            else
                ctx.lineTo(xyz[0]*this.scale, xyz[1]*this.scale);
        }
        ctx.lineWidth = spiro.width;
        ctx.strokeStyle = colorMgr.fgColor;
        ctx.stroke();
        ctx.restore();
    }
};

main();

function main()
{
    if (!ctx)
        return alert('Your browser doesn\'t support WebGL.');

    document.getElementById("proXdisp").value=document.getElementById("proX").value;
    document.getElementById("proYdisp").value=document.getElementById("proY").value;
    document.getElementById("proZdisp").value=document.getElementById("proZ").value;
    document.getElementById("speed").value=spiro.speed;
    document.getElementById("width").value=spiro.width;

    colorMgr.randomize();

    spiro.draw();

    drawScene();
}

function drawScene()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spiro.draw();

    if (spiro.autoOffset)
    {
        if (Math.abs(spiro.offset) > spiro.maxOffset)
            spiro.speed = spiro.speed * -1;
        spiro.offset += spiro.speed / 10.0;
    }

    if (spiro.autoX) spiro.rotX += spiro.speedX;
    if (spiro.autoY) spiro.rotY += spiro.speedY;
    if (spiro.autoZ) spiro.rotZ += spiro.speedZ;

    raf = window.requestAnimationFrame(drawScene);
}

function randomize()
{
    spiro.proX = (1.0 - Math.random() * 2.0).toPrecision(2);
    document.getElementById("proX").value = document.getElementById("proXdisp").value = spiro.proZ;

    spiro.proY = (1.0 - Math.random() * 2.0).toPrecision(2);
    document.getElementById("proY").value = document.getElementById("proYdisp").value = spiro.proZ;

    spiro.proZ = (1.0 - Math.random() * 2.0).toPrecision(2);
    document.getElementById("proZ").value = document.getElementById("proZdisp").value = spiro.proZ;
    colorMgr.randomize();
    if (!raf) pause();
}

function pause()
{
    if (raf)
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

