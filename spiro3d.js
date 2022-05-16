
var canvas = document.querySelector('#glcanvas');
var gl = canvas.getContext('webgl2');
var ww = window.innerWidth*.5;
var hh = window.innerHeight*.6;
var raf = 0;

var colorMgr =
{
    radd: 0.001, gadd: -0.001, badd: 0.001, inColor: true,
    randomize: function()
    {
        this.red = Math.random();
        this.green = Math.random();
        this.blue = Math.random();
    },
    flip: function()
    {
        this.randomize();
        this.inColor = !colorMgr.inColor;
    },
    next: function()
    {
        if (!this.inColor)
        {
            this.red = this.green = this.blue = 1.0;
            return;
        }
        this.red += this.radd;
        this.green += this.gadd;
        this.blue += this.badd;
        if (this.red > 1.0) { this.red = 1.0; this.radd *= -1;}
        if (this.red < 0.50) { this.red = 0.50; this.radd *= -1;}
        if (this.green > 1.0) { this.green = 1.0; this.gadd *= -1;}
        if (this.green < 0.50) { this.green = 0.50; this.gadd *= -1;}
        if (this.blue > 1.0) { this.blue = 1.0; this.badd *= -1;}
        if (this.blue < 0.50) { this.blue = 0.50; this.badd *= -1;}
    }
}

var spiro =
{
    rotX: 0.0, rotY: 0.0, rotZ: 0.0,
    proX: 0.0, proY: 0.0, proZ: -0.3333, //proZ2: 0.0,
    speedX: 0.02, speedY: 0.02, speedZ: 0.02,
    fFov: 1800.0, centerX: 0.0, centerY: 0.0, centerZ: 0.0,
    autoX: false, autoY: false, autoZ: false, autoOffset: false,
    scale: -6.0, speed: 0.0, width: 3, offset: 0.5, maxOffset: 1.0, loops: 40.0,
    program: gl.createProgram(),
    positions: [],

    draw: function()
    {
        colorMgr.next();
        spiro.colors = [colorMgr.red, colorMgr.blue, colorMgr.green, 1.0];

        let axisX = 0.0, axisY = 0.0;
        let center = vec3.fromValues(this.centerX, this.centerY, this.centerZ);
        let oldxyz = vec3.create();

        for (let angle1 = 0.0; angle1 < this.loops * Math.PI; angle1 += 0.01)
        {
            axisX += this.proX / 1000.0;
            axisY += this.proY / 1000.0;

            // start with a circle
            let x = parseFloat(this.centerX + this.offset + Math.cos(angle1));
            let y = parseFloat(this.centerY + Math.sin(angle1));
            let z = parseFloat(this.centerZ);
            xyz = vec3.fromValues(x, y, z);

            // rotate around Z to create a basic spirograph
            vec3.rotateZ(xyz, xyz, center, angle1 * this.proZ);
            //vec3.rotateZ(xyz, xyz, center, -0.5*angle1 * (this.proZ2 / this.proZ));

            // rotate around X and Y to move into 3d
            vec3.rotateX(xyz, xyz, center, axisX);
            vec3.rotateY(xyz, xyz, center, axisY);

            if (angle1)
            {
                let jog =  0.005;
                for (let i = 0; i < 1/*spiro.width*/; i++)
                {
                this.positions.push(xyz[0]+jog*i);
                this.positions.push(xyz[1]+jog*i);
                this.positions.push(xyz[2]+jog*i);
                this.positions.push(oldxyz[0]+jog*i);
                this.positions.push(oldxyz[1]+jog*i);
                this.positions.push(oldxyz[2]+jog*i);
                }
            }
            vec3.copy(oldxyz, xyz);
        }
    }
};

main();

function loadShader(gl, type, source)
{
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        return alert('getShaderParameter() failed: ' + gl.getShaderInfoLog(shader));
    return shader;
}

function main()
{
    if (!gl)
        return alert('Your browser doesn\'t support WebGL.');

    document.getElementById("proXdisp").value=document.getElementById("proX").value;
    document.getElementById("proYdisp").value=document.getElementById("proY").value;
    document.getElementById("proZdisp").value=document.getElementById("proZ").value;
    //document.getElementById("proZ2disp").value=document.getElementById("proZ2").value;
    document.getElementById("speed").value=spiro.speed;
    //document.getElementById("width").value=spiro.width;

    colorMgr.randomize();

    // vertex shader
    const vsSource = `
        attribute vec4 aVertexPosition;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }`;

    // fragment shader
    const fsSource = `
        precision highp float;
        uniform vec4 uGlobalColor;
        void main(void) {
            gl_FragColor = uGlobalColor;
        }`;

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    spiro.draw();

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
        return alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));

    spiro.program = shaderProgram;
    spiro.positionLocation = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    spiro.colorLocation = gl.getAttribLocation(shaderProgram, 'aVertexColor');
    spiro.projectionLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    spiro.modelLocation = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');

    spiro.uGlobalColor = gl.getUniformLocation(shaderProgram, "uGlobalColor");

    spiro.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, spiro.positionBuffer);

    drawScene();
}

function drawScene()
{
    while(spiro.positions.length)
        spiro.positions.pop();
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    spiro.draw();

    if (spiro.autoOffset)
    {
        if (Math.abs(spiro.offset) > spiro.maxOffset)
            spiro.speed = spiro.speed * -1;
        spiro.offset += spiro.speed / 10.0;
    }


    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const fieldOfView = 45 * Math.PI / 180, zNear = 0.1, zFar = 100.0;

    const modelViewMatrix = mat4.create();
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, spiro.scale]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, spiro.rotX, [1, 0, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, spiro.rotY, [0, 1, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, spiro.rotZ, [0, 0, 1]);

    gl.bindBuffer(gl.ARRAY_BUFFER, spiro.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spiro.positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(spiro.positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(spiro.positionLocation);

    gl.useProgram(spiro.program);

    gl.uniformMatrix4fv(spiro.projectionLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(spiro.modelLocation, false, modelViewMatrix);

    gl.uniform4fv(spiro.uGlobalColor, spiro.colors);

    //msg(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) );
    //gl.lineWidth(2);
    gl.drawArrays(gl.LINES, 0, spiro.positions.length);

    if (spiro.autoX) spiro.rotX += spiro.speedX;
    if (spiro.autoY) spiro.rotY += spiro.speedY;
    if (spiro.autoZ) spiro.rotZ += spiro.speedZ;

    raf = window.requestAnimationFrame(drawScene);
}

function randomize()
{
    spiro.proX = spiro.proY = spiro.proZ = 0.0;
    while (spiro.proZ == 0.0)
        spiro.proZ = (1.0 - Math.random() * 2.0).toPrecision(2);
    /*while(spiro.proY == 0.0 || spiro.proY == proZ)
        spiro.proY = (1.0 - Math.random() * 2.0).toPrecision(1);
    while(spiro.proX == 0.0 || spiro.proX == spiro.proY || spiro.proX == spiro.proZ)
        spiro.proX = (1.0 - Math.random() * 2.0).toPrecision(1);*/

    document.getElementById("proX").value = document.getElementById("proXdisp").value = spiro.proX;
    document.getElementById("proY").value = document.getElementById("proYdisp").value = spiro.proY;
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

