
var canvas = document.querySelector('#glcanvas');
var gl = canvas.getContext('webgl');
var ww = window.innerWidth*.5;
var hh = window.innerHeight*.6;
var cubeRotation = 0.0;

var spiro={
    radius1: -0.3, radius2: 0.3, radius3: 0.4,
    scale: 0.7, speed: 0.04, blur: 0.2, width: 3, offset: 0.0, maxOffset: 0.2,
    rotateSpeed: 0.00, rotateAngle: 0.0, loops: 10, x: -1, y: -1, oldx: -1, oldy: -1,
    program: gl.createProgram(), positions: [],

    draw: function()
    {
        var tooBig=false;
        for (let angle1=0.0; angle1 < this.loops * 2 * Math.PI; angle1 += 0.005)
        {
            // 1st wheel
            this.x = (this.radius1-this.radius2+this.radius3)*Math.cos(angle1);
            this.y = (this.radius1-this.radius2+this.radius3)*Math.sin(angle1);

            // 2nd wheel
            var angle2=angle1*(this.radius1-this.radius2)/this.radius2;
            this.x += Math.cos(angle2);
            this.y -= Math.sin(angle2);

            // 3rd wheel
            var angle3=angle2*(this.radius1-this.radius2+this.radius3)/this.radius3;
            this.x += this.offset * Math.cos(angle3);
            this.y -= this.offset * Math.sin(angle3);

            this.x *= 2*this.scale;
            this.y *= 2*this.scale;

            if (this.y > hh / 2) tooBig = true;

            if(angle1)
            {
                this.positions.push(this.x);
                this.positions.push(this.y);
                this.positions.push(this.oldx);
                this.positions.push(this.oldy);
            }
            this.oldx=this.x;
            this.oldy=this.y;
        }
        if (tooBig)
           this.scale-=0.25;
        document.getElementById("scale").value=this.scale;
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
    document.getElementById("scale").value=spiro.scale;
    document.getElementById("rotate").value=spiro.rotateSpeed;
    document.getElementById("width").value=spiro.width;
    document.getElementById("blur").value=100-100*spiro.blur;

    // vertex shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying lowp vec4 vColor;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
        }`;

    // fragment shader
    const xxxfsSource = `
        varying lowp vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }`;

    const fsSource = `
        void main() {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }`;

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

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

    drawScene();
}

function drawScene()
{
    spiro.positions.length=0;
    spiro.draw();

    var colors = [
        1.0,  1.0,  1.0,  1.0,    // white
    ];

    if (Math.abs(spiro.offset) > spiro.maxOffset)
        spiro.speed = spiro.speed * -1;
    spiro.offset += spiro.speed / 10.0;
    spiro.rotateAngle += spiro.rotateSpeed;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(spiro.positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(spiro.positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(spiro.positionLocation);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(spiro.colorLocation, colors.length, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(spiro.colorLocation);

    gl.useProgram(spiro.program);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const fieldOfView = 45 * Math.PI / 180, zNear = 0.1, zFar = 100.0;

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    gl.uniformMatrix4fv(spiro.projectionLocation, false, projectionMatrix);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

    cubeRotation+=0.01;
    //mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);
    //mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * .7, [0, 1, 0]);

    gl.uniformMatrix4fv(spiro.modelLocation, false, modelViewMatrix);

    gl.drawArrays(gl.LINES, 0, spiro.positions.length);

    raf = window.requestAnimationFrame(drawScene);
}

/*
        var colorMgr=
        {
            radd: 1,gadd: -1,badd: 1,inColor: true,fgColor: '',bgColor: 'rgba(255, 255, 255,',
            rando: function() {return Math.floor(Math.random()*100);},
            next: function() {
                if(!this.inColor) {
                    this.bgColor='rgba(255, 255, 255,';
                    this.fgColor='black';
                    return;
                }
                this.red+=this.radd;
                this.green+=this.gadd;
                this.blue+=this.badd;
                if(this.red>255) {this.red=255; this.radd*=-1;}
                if(this.red<0) {this.red=0; this.radd*=-1;}
                if(this.green>255) {this.green=255; this.gadd*=-1;}
                if(this.green<0) {this.green=0; this.gadd*=-1;}
                if(this.blue>255) {this.blue=255; this.badd*=-1;}
                if(this.blue<0) {this.blue=0; this.badd*=-1;}
                this.fgColor='rgba('+this.red+','+this.green+','+this.blue+')';
            }
        }


        function randomize() {
            spiro.radius1=spiro.radius2=spiro.radius3=0;
            while(spiro.radius1==0)
                spiro.radius1=Math.round(1.0-Math.random()*2.0);
            while(spiro.radius2==0||spiro.radius2==radius1)
                spiro.radius2=Math.round(1.0-Math.random()*2.0);
            while(spiro.radius3==0||spiro.radius3==spiro.radius2||spiro.radius3==spiro.radius1)
                spiro.radius3=Math.round(1.0-Math.random()*2.0);
            document.getElementById("radius1").value=spiro.radius1;
            document.getElementById("radius2").value=spiro.radius2;
            document.getElementById("radius3").value=spiro.radius3;
            document.getElementById("scale").value=spiro.scale=20;
            if(colorMgr.inColor)
                colorMgr.bgColor='rgba('+rando1()+','+rando1()+','+rando1()+',';
            else
                colorMgr.bgColor='rgba(255, 255, 255,';
            if(!raf) pause();
        }
        function pause() {
            if(raf) {
                window.cancelAnimationFrame(raf);
                document.getElementById("pause").innerHTML="unpause";
                raf=0;
            }
            else {
                document.getElementById("pause").innerHTML="pause";
                draw();
            }
        }
        function rando1(r) {
            return Math.floor(Math.random()*155)+100;
        }

        function main() {

            colorMgr.red=colorMgr.rando();
            colorMgr.green=colorMgr.rando();
            colorMgr.blue=colorMgr.rando();

            draw();
        }

        }
*/
function msg(info)
{
    document.getElementById("msg").innerHTML=info;
}

