import Parser from "./parser.ts";
import { evaluate} from "./interpreter.ts";
import Environment from "./environment.ts";
import { StringVal } from "./values.ts";
import { Expr, FuncCall, Program, Stmt, StringLiteral } from "./ast.ts";


let env = new Environment();

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

try {
    if (Deno.args.length>=1) {
        // idk man just suck it up
    } else {
        repl();
    }
} catch(_error) {
    //Empty catch to avoid error when running in browser
}