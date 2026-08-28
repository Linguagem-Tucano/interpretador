/// <reference lib="dom" />
// deno-lint-ignore-file no-explicit-any
import Parser from './parser.ts';
import { clearOutputBuffer, evaluate, flushOutputBuffer, setGlobalEnv } from './interpreter.ts';
import Environment from './environment.ts';
import { Body, Expr, FuncCall, Program, Stmt, StringLiteral } from './ast.ts';

let env = new Environment();

let ctx = undefined as any;

let getTucanoImage = undefined as any;

export function repl() {
    const parser = new Parser();
    console.log('Tucano interativo v0.1');
    console.log('Beta público.');
    console.log('Digite "sair" para sair');
    while (true) {
        const input = prompt('> ');

        if (!input || input == 'sair') {
            break;
        }

        let result;
        try {
            let program = {} as Program;
            program = parser.produceAST(input);

            result = evaluate(program, env);

            let v = result.value;
            if (result.type == 'BooleanVal') {
                v = result.value ? 'verdadeiro' : 'falso';
            }

            console.log(v);
        } catch (_error) {
            //empty
            //console.log(_error);
        }
    }
}

export function interpret(text: string) {
    const parser = new Parser();
    const code = text;
    let program;

    //console.log(program);
    try {
        program = parser.produceAST(code);
        return evaluate(program, env);
    } catch (_error) {
        //empty
    }
}

export let stoppingLines = [] as Array<number>;

export function shouldWeStop(numLine: number): boolean {
    return stoppingLines.includes(numLine); //simple and clean
}

export function addStoppingLine(num: number) {
    if (stoppingLines.includes(num)) return false; //do not push into array if it exists
    stoppingLines.push(num);
    return true;
}

export function removeStoppingLine(num: number) {
    if (!stoppingLines.includes(num)) return false; //dont remove what doesnt exist
    stoppingLines = stoppingLines.filter((n) => n !== num);
    return true;
}

export function resetEnv() {
    env = new Environment();
}

export function setCtx(newCtx: any) {
    ctx = newCtx;
}

export function setTucanoGetImage(newFunc: any) {
    getTucanoImage = newFunc;
}

export function callbackFun(funcname: string, argumentos: string[]) {
    if (env.hasFunc(funcname)) {
        const args = [] as Expr[];
        for (let i = 0; i < argumentos.length; i++) {
            const arg = argumentos[i];
            const literal = { kind: 'StringLiteral', value: arg } as StringLiteral;
            args.push(literal);
        }
        const funccall = { kind: 'FuncCall', identifier: funcname, args } as FuncCall;
        const body = {kind: 'Body', lines:[funccall], line:1} as Body;
        const pr = { kind: 'Program', body } as Program;
        evaluate(pr, env);
    }
}

export function reportError(errorMessage: string, line: number) {
    const msg = 'Erro: ' + errorMessage + ' na linha ' + line;
    console.error(msg);
    return msg;
    //throw msg;
}

export function drawLine(x1: number, y1: number, x2: number, y2: number) {
    if (ctx != undefined) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function drawImage(x: number, y: number, w: number, h: number, img: string) {
    if (ctx != undefined) {
        let image;
        if (getTucanoImage) {
            image = getTucanoImage(img);
        } else {
            image = document.getElementById(img);
        }

        if (image) {
            ctx.drawImage(image, x, y, w, h);
        } else {
            throw 'Objeto ' + img + ' não encontrado';
        }
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function clearCanvas() {
    if (ctx != undefined) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function drawText(x: number, y: number, text: string, size: number) {
    if (ctx != undefined) {
        ctx.font = size + 'px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function setLineWidth(w: number) {
    //Set line width using ctx
    if (ctx != undefined) {
        ctx.lineWidth = w;
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function setStrokeStyle(style: string) {
    if (ctx != undefined) {
        ctx.strokeStyle = style;
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function setFillStyle(style: string) {
    if (ctx != undefined) {
        ctx.fillStyle = style;
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function setColor(color:string) {
    if (ctx != undefined) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function saveCanvas() {
    if (ctx != undefined) {
        const dataURL = ctx.canvas.toDataURL('image/png');
        return dataURL;
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

export function drawRectangle(x: number, y: number, w: number, h: number, fill: string) {
    if (ctx != undefined) {
        fill == "preencher" ? ctx.fillRect(x, y, w, h) : ctx.strokeRect(x, y, w, h);
    } else {
        throw 'Ambiente não suporta gráficos';
    }
}

function readFile() {
    const parser = new Parser();
    const inputFile = Deno.args.at(0) as string;
    const decoder = new TextDecoder();
    const inputData = Deno.readFileSync(inputFile);
    const input = decoder.decode(inputData);

    try {
        let program = {} as Program;
        program = parser.produceAST(input);
        clearOutputBuffer();
        setGlobalEnv(env); //only call this bs here
        evaluate(program.body, env);
    } catch (_error) {
        console.log(_error);
    }
}

try {
    if (Deno.args.length >= 1) {
        readFile();
    } else {
        repl();
    }
} catch (_error) {
    //Empty catch to avoid error when running in browser
}
