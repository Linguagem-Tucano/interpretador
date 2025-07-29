import Parser from "./parser.ts";
import { evaluate} from "./interpreter.ts";
import Environment from "./environment.ts";
import { StringVal } from "./values.ts";
import { FuncCall, Program, Stmt } from "./ast.ts";


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

        let program = {} as Program;
        try {
            program = parser.produceAST(input);
            
            
        } catch (error) {
            console.error("Erro de sintaxe: " + error);
        }

        let result;
        try {
    
            result = evaluate(program,env);
        } catch (error) {
            console.error(error);
        }
        console.log((result as StringVal).value);
        
    }
}

export function interpret(text:string) {
    const parser = new Parser();
    const code = text;
    let program;

    try {
        program = parser.produceAST(code);
        //console.log(program);
        try {
            return evaluate(program,env);
        } catch (error) {
            console.error(error);
            throw error;
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
    
}

export function resetEnv() {
    env = new Environment();
}

export function callbackFun(funcname:string) {
    if (env.hasFunc(funcname)) {
        let funccall = {kind:"FuncCall", identifier:funcname} as FuncCall
        let body = [funccall] as Stmt[];
        let pr = {kind:"Program", body} as Program;
        evaluate(pr,env);
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