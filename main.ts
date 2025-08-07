/// <reference lib="dom" />
// deno-lint-ignore-file no-explicit-any
import Parser from "./parser.ts";
import { evaluate} from "./interpreter.ts";
import Environment from "./environment.ts";
import { StringVal } from "./values.ts";
import { Expr, FuncCall, Program, Stmt, StringLiteral } from "./ast.ts";
import { tokenize } from "./lexer.ts";


let env = new Environment();

let ctx = undefined as any;

export function repl() {
    const parser = new Parser();
    console.log("Tucano interativo v0.1");
    console.log("Beta público.");
    console.log('Digite "sair" para sair');
    while (true) {
        const input = prompt("> ");

        if (!input || input=="sair") {
            break;
        }

        let result;
        try {
            let program = {} as Program;
            program = parser.produceAST(input);
            
            result = evaluate(program,env);

            console.log((result as StringVal).value);
        } catch (_error) {
            //empty
        }
        
    }
}

export function interpret(text:string) {
    const parser = new Parser();
    const code = text;
    let program;

    //console.log(program);
    try {
        program = parser.produceAST(code);
        return evaluate(program,env);
    } catch (_error) {
        //empty            
    }

    
}

export function resetEnv() {
    env = new Environment();
}

export function setCtx(newCtx:any) {
    ctx = newCtx;
}

export function callbackFun(funcname:string, argumentos:string[]) {
    if (env.hasFunc(funcname)) {
        
        
        const args = [] as Expr[];
        for (let i = 0; i < argumentos.length; i++) {
            const arg = argumentos[i];
            const literal = {kind:"StringLiteral", value:arg} as StringLiteral;
            args.push(literal);
        }
        const funccall = {kind:"FuncCall", identifier:funcname, args} as FuncCall
        const body = [funccall] as Stmt[];
        const pr = {kind:"Program", body} as Program;
        evaluate(pr,env);
    }
}

export function reportError(errorMessage:string, line:number) {
    const msg = "Erro: "+errorMessage+" na linha "+line;
    console.error(msg);
    return msg;
    //throw msg;
}

//export function drawLine(x1:number,y1:number,x2:number,y2:number,line:number) {
//    if (ctx!=undefined) {
//        ctx.beginPath();
//        ctx.moveTo(x1,y1);
//        ctx.lineTo(x2,y2);
//        ctx.stroke();
//    } else {
//        throw reportError("Ambiente não suporta gráficos",line)
//    }
//}
//
//export function drawImage(x:number,y:number,w:number,h:number,img:string,line:number) {
//    if (ctx!=undefined) {
//        const image = document.getElementById(img);
//        if (image) {
//            ctx.drawImage(image, x, y, w, h);
//        } else {
//            throw reportError("Objeto "+img+" não encontrado",line);
//        }
//    } else {
//        throw reportError("Ambiente não suporta gráficos",line)
//    }
//}
//
//export function clearCanvas(line:number) {
//    if (ctx!=undefined) {
//        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
//    } else {
//        throw reportError("Ambiente não suporta gráficos",line)
//    }
//}

try {
    if (Deno.args.length>=1) {
        // idk man just suck it up
    } else {
        repl();
    }
} catch(_error) {
    //Empty catch to avoid error when running in browser
}

// --- Line Shader ---
const lineVertSrc = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0, 1); }
`;
const lineFragSrc = `
precision mediump float;
uniform vec4 u_color;
void main() { gl_FragColor = u_color; }
`;

// --- Image Shader ---
const imgVertSrc = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;
void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texcoord = a_texcoord;
}
`;
const imgFragSrc = `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_sampler;
void main() {
    gl_FragColor = texture2D(u_sampler, v_texcoord);
}
`;

// --- Compile and Link ---
function createShader(gl: WebGLRenderingContext, type: number, src: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
}
function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    return program;
}

// --- After you have your gl context: ---
export let lineProgram: WebGLProgram, linePosLoc: number, lineColorLoc: WebGLUniformLocation;
export let imgProgram: WebGLProgram, imgPosLoc: number, imgTexLoc: number, imgSamplerLoc: WebGLUniformLocation;

export function initWebGLPrograms(gl: WebGLRenderingContext) {
    // Line program
    lineProgram = createProgram(gl, lineVertSrc, lineFragSrc);
    linePosLoc = gl.getAttribLocation(lineProgram, "a_position");
    lineColorLoc = gl.getUniformLocation(lineProgram, "u_color")!;

    // Image program
    imgProgram = createProgram(gl, imgVertSrc, imgFragSrc);
    imgPosLoc = gl.getAttribLocation(imgProgram, "a_position");
    imgTexLoc = gl.getAttribLocation(imgProgram, "a_texcoord");
    imgSamplerLoc = gl.getUniformLocation(imgProgram, "u_sampler")!;
}

let gl: WebGLRenderingContext | undefined = undefined;

export function setGL(newGL: WebGLRenderingContext) {
    gl = newGL;
}

// --- Clear Screen ---
export function clearCanvas() {
    if (!gl) throw "WebGL context not set";
    gl.clearColor(1, 1, 1, 1); // white background
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// --- Draw Line ---
export function drawLine(x1: number, y1: number, x2: number, y2: number, color: [number, number, number, number] = [0,0,0,1]) {
    if (!gl) throw "WebGL context not set";
    // Convert to clip space (-1 to 1)
    const w = gl.canvas.width, h = gl.canvas.height;
    const toClip = (x: number, y: number) => [(x / w) * 2 - 1, 1 - (y / h) * 2];
    const [cx1, cy1] = toClip(x1, y1);
    const [cx2, cy2] = toClip(x2, y2);

    const vertices = new Float32Array([cx1, cy1, cx2, cy2]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

    // Use a simple shader program for lines (see below)
    gl.useProgram(lineProgram);
    gl.enableVertexAttribArray(linePosLoc);
    gl.vertexAttribPointer(linePosLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(lineColorLoc, color);
    gl.drawArrays(gl.LINES, 0, 2);

    gl.deleteBuffer(buffer);
}

// --- Draw Image ---
export function drawImage(x: number, y: number, w: number, h: number, imgId: string) {
    if (!gl) throw "WebGL context not set";
    const image = document.getElementById(imgId) as HTMLImageElement;
    if (!image) throw `Image not found: ${imgId}`;

    // Create texture if not already cached
    let texture = (image as any)._webglTexture;
    if (!texture) {
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        (image as any)._webglTexture = texture;
    } else {
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    // Vertices for a quad (two triangles)
    const cw = gl.canvas.width, ch = gl.canvas.height;
    const toClip = (x: number, y: number) => [(x / cw) * 2 - 1, 1 - (y / ch) * 2];
    const [x0, y0] = toClip(x, y);
    const [x1, y1] = toClip(x + w, y + h);

    const vertices = new Float32Array([
        x0, y0, 0, 0,
        x1, y0, 1, 0,
        x0, y1, 0, 1,
        x1, y1, 1, 1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);

    // Use a simple shader program for textured quads (see below)
    gl.useProgram(imgProgram);
    gl.enableVertexAttribArray(imgPosLoc);
    gl.enableVertexAttribArray(imgTexLoc);
    gl.vertexAttribPointer(imgPosLoc, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(imgTexLoc, 2, gl.FLOAT, false, 16, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(imgSamplerLoc, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.deleteBuffer(buffer);
}