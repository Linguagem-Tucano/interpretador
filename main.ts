/// <reference lib="dom" />
// deno-lint-ignore-file no-explicit-any
import Parser from "./parser.ts";
import { evaluate} from "./interpreter.ts";
import Environment from "./environment.ts";
import { Expr, FuncCall, Program, Stmt, StringLiteral } from "./ast.ts";


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

            let v = result.value;
            if (result.type == "BooleanVal") {v = result.value ? "verdadeiro" : "falso"}

            console.log(v);
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

export function drawLine(x1:number,y1:number,x2:number,y2:number) {
    if (ctx!=undefined) {
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.stroke();
    } else {
        throw "Ambiente não suporta gráficos";
    }
}

export function drawImage(x:number,y:number,w:number,h:number,img:string) {
    if (ctx!=undefined) {
        const image = document.getElementById(img);
        if (image) {
            ctx.drawImage(image, x, y, w, h);
        } else {
            throw "Objeto "+img+" não encontrado";
        }
    } else {
        throw "Ambiente não suporta gráficos"
    }
}

export function clearCanvas() {
    if (ctx!=undefined) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
        throw "Ambiente não suporta gráficos";
    }
}

export function drawText(x:number,y:number,text:string,size:number) {
    if (ctx!=undefined) {
        ctx.font = size+"px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(text,x,y);
    } else {
        throw "Ambiente não suporta gráficos";
    }
}

try {
    if (Deno.args.length>=1) {
        // idk man just suck it up
    } else {
        repl();
    }
} catch(_error) {
    //Empty catch to avoid error when running in browser
}