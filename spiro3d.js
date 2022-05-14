
var canvas = document.querySelector('#glcanvas');
var gl = canvas.getContext('webgl');
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
    fFov: 1800.0,
    radius1: -0.3, radius2: -0.2, radius3: 0.4,
    rotX: 0.0, rotY: 0.0, rotZ: 0.0,
    proX: 0.0, proY: 0.0, proZ: 0.0,
    speedX: 0.02, speedY: 0.02, speedZ: 0.02,
    centerX: 0.0, centerY: 0.0, centerZ: 0.0,
    autoX: false, autoY: false, autoZ: false, autoOffset: false,
    scale: -6.0, speed: 0.0, blur: 0.0, width: 3, offset: 0.0, maxOffset: 0.2,
    loops: 10, x: -1.0, y: -1.0, z: 1.0, oldx: -1.0, oldy: -1.0,
    program: gl.createProgram(),
    positions: [],

    draw: function()
    {
        colorMgr.next();
        spiro.colors = [colorMgr.red, colorMgr.blue, colorMgr.green, 1.0];

        let axisX = 0.0;
        let axisY = 0.0;
        let axisZ = 0.0;

        for (let angle1 = 0.0; angle1 < this.loops * 2 * Math.PI; angle1 += 0.005)
        {
            var rrr = this.radius1 - this.radius2 + this.radius3;
            this.x = rrr * Math.cos(angle1);
            this.y = rrr * Math.sin(angle1);
            this.z = 0.0;

            var angle2 = angle1;

            if (this.radius2)
            {
                angle2 = angle1 * (this.radius1 - this.radius2) / this.radius2;
                if (this.radius3)
                {
                    this.x += Math.cos(angle2);
                    this.y -= Math.sin(angle2);
                }
                else
                {
                    this.x += this.offset * Math.cos(angle2);
                    this.y -= this.offset * Math.sin(angle2);
                }
            }

            if (this.radius3)
            {
                var angle3 = angle2 * rrr / this.radius3;
                this.x += this.offset * Math.cos(angle3);
                this.y -= this.offset * Math.sin(angle3);
            }

            axisX += this.proX;
            axisY += this.proY;
            axisZ += this.proZ;

            this.x += this.centerX;
            this.y += this.centerY;
            this.z += this.centerZ;
            let center = vec3.fromValues(this.centerX, this.centerY, this.centerZ);
            xyz = vec3.fromValues(this.x, this.y, this.z);
            vec3.rotateX(xyz, xyz, center, axisX);
            vec3.rotateY(xyz, xyz, center, axisY);
            vec3.rotateZ(xyz, xyz, center, axisZ);
            this.x = xyz[0];
            this.y = xyz[1];
            this.z = xyz[2];

            if (angle1)
            {
                this.positions.push(this.x);
                this.positions.push(this.y);
                this.positions.push(this.z);
                this.positions.push(this.oldx);
                this.positions.push(this.oldy);
                this.positions.push(this.oldz);
            }
            this.oldx = this.x;
            this.oldy = this.y;
            this.oldz = this.z;
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

    document.getElementById("radius1disp").value=document.getElementById("radius1").value;
    document.getElementById("radius2disp").value=document.getElementById("radius2").value;
    document.getElementById("radius3disp").value=document.getElementById("radius3").value;
    document.getElementById("speed").value=spiro.speed;
    document.getElementById("width").value=spiro.width;
    document.getElementById("blur").value=100-100*spiro.blur;

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
    // if (spiro.blur == 0.0)
    {
        spiro.positions.length=0;
        gl.clearColor(0.0,0.0,0.0,1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    }
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

    //gl.lineWidth(5);
    gl.drawArrays(gl.LINES, 0, spiro.positions.length);

    if (spiro.autoX) spiro.rotX += spiro.speedX;
    if (spiro.autoY) spiro.rotY += spiro.speedY;
    if (spiro.autoZ) spiro.rotZ += spiro.speedZ;

    raf = window.requestAnimationFrame(drawScene);
}

function randomize()
{
    spiro.radius1 = spiro.radius2 = spiro.radius3 = 0.0;
    while (spiro.radius1 == 0.0)
        spiro.radius1 = 1.0 - Math.random() * 2.0;
    while(spiro.radius2 == 0.0 || spiro.radius2 == radius1)
        spiro.radius2 = 1.0 - Math.random() * 2.0;
    while(spiro.radius3 == 0.0 || spiro.radius3 == spiro.radius2 || spiro.radius3 == spiro.radius1)
        spiro.radius3 = 1.0 - Math.random() * 2.0;

    document.getElementById("radius1").value = spiro.radius1;
    document.getElementById("radius2").value = spiro.radius2;
    document.getElementById("radius3").value = spiro.radius3;

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

