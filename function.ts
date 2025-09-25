import { ArgumentExpr, ReturnExpr, Stmt } from "./ast.ts";
import Environment from "./environment.ts";
import { evaluate } from "./interpreter.ts";
import { MK_NULL, NumberVal, RealVal, RuntimeVal, ValueType } from "./values.ts";
import { reportError } from "./main.ts";

export class Function {
    public body: Stmt[];
    public args: ArgumentExpr[];
    public type: ValueType = "NullVal";

    constructor(body: Stmt[], args: ArgumentExpr[], type?:ValueType) {
        this.body = body;
        this.args = args;
        this.type = type? type : "NullVal";
    }

    public call(env: Environment) {
        let lastRes = {} as RuntimeVal;
        for (let index = 0; index < this.body.length; index++) {
                const s = this.body[index];    
                if (s.kind=="ReturnExpr") {
                    let result = evaluate((s as ReturnExpr).value,env);
                    if (this.type!="NullVal") {
                        if (this.type=="NumberVal" && result.type=="RealVal") {result=this.returnNumber(result as RealVal); result.type="NumberVal";}
                        if (this.type=="RealVal" && result.type=="NumberVal") {result=this.returnReal(result); result.type="RealVal";}
                        if (result.type!=this.type) {throw reportError("Função retornou valor inválido, esperava "+this.type+" e recebi "+result.type,s.line);} 
                        return result;
                    } else {
                        return result;
                    }
                }   
                const curr = evaluate(s, env);
                lastRes=curr;
            }
        return lastRes;
    }

    private returnReal(val:RuntimeVal):RuntimeVal {
        if(val.type=="NumberVal") {
            return (val as RealVal);
        }
        return MK_NULL();
    }
    
    private returnNumber(val:RealVal):NumberVal {
        val.value=Math.floor(val.value);
        let result = (val as unknown);
        return result = (result as NumberVal);
    }
}