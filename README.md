
#AST反混淆入门与实战系列插件
> 个人转载整理资料，仅供个人学习使用
> 主要来源：
> [AST入门与实战  基于babel库的AST操作的入门与实战，以及爬虫相关的知识。](https://wx.zsxq.com/dweb2/index/group/48415254524248)
[<br />](https://wx.zsxq.com/dweb2/index/group/48415254524248)
<a name="Q0008"></a>

##联系方式
![](./my.jpg)
### 调用babel库反混淆代码模板
插件模板如下：
```javascript
//babel库及文件模块导入
const fs = require('fs');

//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;
//读取文件
let encode_file = "./encode.js",decode_file = "./decode_result.js";
if (process.argv.length > 2)
{
  encode_file = process.argv[2];
}
if (process.argv.length > 3)
{
  decode_file = process.argv[3];
}

let jscode = fs.readFileSync(encode_file, {encoding: "utf-8"});
//转换为ast树
let ast    = parser.parse(jscode);

const visitor = {
  //TODO  write your code here！
}


//some function code

//调用插件，处理源代码
traverse(ast,visitor);

//生成新的js code，并保存到文件中输出
let {code} = generator(ast,opts = {jsescOption:{"minimal":true}});

fs.writeFile(decode_file, code, (err) => {});
```

<a name="WdkYX"></a>
### 字面量解混淆
插件如下：
```javascript
  const simplifyLiteral = {
  NumericLiteral({node}) {
    if (node.extra && /^0[obx]/i.test(node.extra.raw)) {  //特征匹配
      node.extra = undefined;
    }
  },
  StringLiteral({node}) 
  {
    if (node.extra && /\\[ux]/gi.test(node.extra.raw)) {
      node.extra = undefined;
    }
  },
}
```

<a name="AwuUp"></a>
### 还原初始化为常量且未修改的变量
> 变量定义还原，当变量定义为字面量或者Identifier，
> 并且变量值没有被更改时，可进行还原。

```javascript
var a = 123;
const b = -5;
let c = window;
function d()
{
  var f = c.btoa("hello,AST!");
	return a + b + f ;
}

===>
  
function d() {
  var f = window.btoa("hello,AST!");
  return 123 + -5 + f;
}
```
插件如下：
```javascript
const restoreVarDeclarator = {
	VariableDeclarator(path)
	{
		let {id,init} = path.node;
		if (!types.isIdentifier(id)) return;
		let initPath = path.get("init");
		if (initPath.isUnaryExpression({operator:"+"}) ||
		  initPath.isUnaryExpression({operator:"-"}))
		{// -5或者 +"3" 也可以算作是字面量
			if (!types.isLiteral(init.argument)) return;
		}
		else if (initPath.isIdentifier())
		{
			let name = init.name;
			let browserEnv = ["window",'document','navigator','Image','XMLHttpRequest','location'];
			if (!browserEnv.includes(name) && typeof global[name] == undefined)
			{
				return;
			}
		}
		//如果初始值非Literal节点或者Identifier节点，不做还原
		//有时候为MemberExpression节点时，也可以还原，视情况而论
		//请大家自行添加，通用插件不做处理。
		else if (!initPath.isLiteral())
		{
			return;
		}
		const binding = path.scope.getBinding(id.name);
		//判断初始值是否被更改
		if (!binding || !binding.constant) return;
		
		//获取所有引用的地方并替换
		let referPaths = binding.referencePaths;
		console.log(path.toString())
		for (let referPath of referPaths)
		{
			referPath.replaceWith(init);
		}
		//替换完毕，直接删除即可。
		path.remove();
	},
}
```

<a name="A0TRq"></a>
### 处理没有参数的自执行函数
插件如下：
```javascript
const visitor = {
    UnaryExpression(path) {
        const {operator, argument} = path.node;
        if (operator !== "!" || !t.isCallExpression(argument))
            return;
        let {callee, arguments} = argument;
        if (!t.isFunctionExpression(callee) || arguments.length !== 0)
            return;
        path.replaceInline(callee.body.body);
    },
}
```
<a name="oHTe6"></a>
### 拆分逗号表达式
插件如下：
```javascript
const decode_comma = {
    //破解逗号表达式，兼容之前的脚本
    ExpressionStatement(path) {
        //****************************************特征判断
        let {expression} = path.node;
        if (!t.isSequenceExpression(expression)) return;
        let body = [];
        expression.expressions.forEach(express => {
            body.push(t.ExpressionStatement(express));
        })
        path.replaceInline(body);
    },
}
```
<a name="UMZKZ"></a>
### 常量折叠插件更新
`1 + 2 ==> 3`<br />插件如下：
```javascript
const constantFold = 
{
	 "BinaryExpression|UnaryExpression"(path)
  {
  	if(path.isUnaryExpression({operator:"-"}) || 
  	  path.isUnaryExpression({operator:"void"}))
  	{
  		return;
  	}
  	const {confident,value} = path.evaluate();
  	if (!confident || value == "Infinity") return;
  	if (typeof value == 'number' && isNaN(value)) return;
  	path.replaceWith(types.valueToNode(value));
  },
}
```

<a name="cy4uN"></a>
### 数组元素还原
插件名称: replaceArrayElements <br />Description: Array数据类型还原，需要元素全部为Literal，可嵌套
```javascript
var a = [1,2,3,[1213,234],{"code":"666"},window];
b = a[1] + a[2] + a[3];
c = a[4];
d = a[5];

===>
  
b = 2 + 3 + [1213, 234];
c = {
  "code": "666"
};
d = window;
```
插件如下：
```javascript
const replaceArrayElements =
{//数组还原
	VariableDeclarator(path) {
		let { node, scope } = path;
		let { id, init } = node;
		if (!types.isArrayExpression(init) || init.elements.length == 0) return;

		const binding = scope.getBinding(id.name);
		if (!binding || !binding.constant) {
			return;
		}

		for (let referPath of binding.referencePaths) {
			let { node, parent } = referPath;
			if (!types.isMemberExpression(parent, { object: node }) || !types.isNumericLiteral(parent.property)) {
				return;
			};
		}

		for (let referPath of binding.referencePaths) {
			let { parent, parentPath } = referPath;
			let index = parent.property.value;
			parentPath.replaceWith(init.elements[index]);
		}
		
		path.remove();
	},
}
```
<a name="B6okq"></a>
### Array类型元素还原
```javascript
(function(t,a,b,c,d)
{
   console.log(a[0]+a[1]);
   console.log(b[0]-b[1]);
   console.log(c);
   console.log(d);
   t = 123;
})(5,[1,2],[5,3],6,-5);
===>
  
(function (t) {
 console.log(1 + 2);
 console.log(5 - 3);
 console.log(6);
 console.log(-5);
 t = 123;
})(5);
```
插件如下：
```javascript
function isBaseLiteral(path) {
	if (path.isLiteral()) {
		return true;
	}
	if (path.isUnaryExpression({ operator: "-" }) ||
		  path.isUnaryExpression({ operator: "+" })) {
		return isBaseLiteral(path.get('argument'));
	}

	return false;
}


const resolveParams =
{
	CallExpression(path) {
		let callee = path.get('callee');
		let arguments = path.get('arguments');
		if (!callee.isFunctionExpression() || arguments.length == 0) {
			return;
		}
		let scope = callee.scope;
		let params = callee.get('params');


		for (let i in arguments) {
			let paramsPath = params[i];
			let argumentPath = arguments[i];
			const binding = scope.getBinding(paramsPath.node.name);
			if (!binding || !binding.constant) {
				continue;
			}

			let canRemoved = true;

			for (let referPath of binding.referencePaths) {
				if (argumentPath.isIdentifier() || isBaseLiteral(argumentPath)) {
					referPath.replaceWith(argumentPath.node);
				}
				else if (argumentPath.isArrayExpression()) {
					let parentPath = referPath.parentPath
					if (!parentPath.isMemberExpression()) {
						canRemoved = false;
						continue;
					}
					let { property } = parentPath.node;
					if (!types.isNumericLiteral(property)) {
						canRemoved = false;
						continue;
					}
					let index = property.value;
					if (index > argumentPath.node.elements.length) {
						canRemoved = false;
						continue;
					}
					parentPath.replaceWith(argumentPath.node.elements[index]);
				}
				else {
					canRemoved = false;
					break;
				}
			}
			if (canRemoved) {
				paramsPath.remove();
				argumentPath.remove();
			}
		}
	},
}
```
<a name="TS4Kv"></a>
### 自执行函数实参还原与替换
```javascript
(function(t,a,b,c,d)
{
   console.log(a[0]+a[1]);
   console.log(b[0]-b[1]);
   console.log(c);
   console.log(d);
   t = 123;

})(5,[1,2],[5,3],6,-5);
===>
(function (t) {
 console.log(1 + 2);
 console.log(5 - 3);
 console.log(6);
 console.log(-5);
 t = 123;
})(5);
```
插件如下：
```javascript
function isBaseLiteral(path) {
	if (path.isLiteral()) {
		return true;
	}
	if (path.isUnaryExpression({ operator: "-" }) ||
		  path.isUnaryExpression({ operator: "+" })) {
		return isBaseLiteral(path.get('argument'));
	}

	return false;
}


const resolveParams =
{
	CallExpression(path) {
		let callee = path.get('callee');
		let arguments = path.get('arguments');
		if (!callee.isFunctionExpression() || arguments.length == 0) {
			return;
		}
		let scope = callee.scope;
		let params = callee.get('params');


		for (let i in arguments) {
			let paramsPath = params[i];
			let argumentPath = arguments[i];
			const binding = scope.getBinding(paramsPath.node.name);
			if (!binding || !binding.constant) {
				continue;
			}

			let canRemoved = true;

			for (let referPath of binding.referencePaths) {
				if (argumentPath.isIdentifier() || isBaseLiteral(argumentPath)) {
					referPath.replaceWith(argumentPath.node);
				}
				else if (argumentPath.isArrayExpression()) {
					let parentPath = referPath.parentPath
					if (!parentPath.isMemberExpression()) {
						canRemoved = false;
						continue;
					}
					let { property } = parentPath.node;
					if (!types.isNumericLiteral(property)) {
						canRemoved = false;
						continue;
					}
					let index = property.value;
					if (index > argumentPath.node.elements.length) {
						canRemoved = false;
						continue;
					}
					parentPath.replaceWith(argumentPath.node.elements[index]);
				}
				else {
					canRemoved = false;
					break;
				}
			}
			if (canRemoved) {
				paramsPath.remove();
				argumentPath.remove();
			}
		}
	},
}
```
<a name="y77Lm"></a>
### 实参为字面量的eval函数还原
插件如下：
```javascript
const template = require("@babel/template");
const replaceEvalNode = {
    CallExpression: {
        exit: function (path) {
            let { callee, arguments } = path.node;
            if (arguments.length !== 1 ||
                !types.isLiteral(arguments[0])) return;
            if (types.isIdentifier(callee, { name: "eval" })) {
                const evalNode = template.statements.ast(arguments[0].value);
                path.replaceWithMultiple(evalNode);
            }
        },
    }
}
```

<a name="XBDjP"></a>
### 函数调用处替换计算值
处理FunctionDeclaration<br />思路:对于实参全部是字面量的函数调用，且运行结果唯一时，可以进行替换
```javascript
function add(a,b)
{
	return a+b;
}
s = add(1,2) + add(111,222);
===>
function add(a, b) {
  return a + b;
}
s = 3 + 333;
```
插件如下：
```javascript
function isArgsAllLiteral(argumentsNode) {

    function isBaseLiteral(node) {
        if (types.isLiteral(node)) {
            return true;
        }
        if (types.isUnaryExpression(node, { "operator": "-" }) ||
            types.isUnaryExpression(node, { "operator": "+" })) {
            return isBaseLiteral(node.argument);
        }

        if (types.isObjectExpression(node)) {
            let { properties } = node;
            if (properties.length == 0) {
                return true;
            }

            return properties.every(property => isBaseLiteral(property));

        }
        if (types.isArrayExpression(node)) {
            let { elements } = node;
            if (elements.length == 0) {
                return true;
            }
            return elements.every(element => isBaseLiteral(element));
        }

        return false;
    }

    return argumentsNode.every(argument => isBaseLiteral(argument));
}


const CalcCallExpression =
{
    FunctionDeclaration(path) {
        let { id, body } = path.node;
        const binding = path.scope.parent.getBinding(id.name);
        if (!binding || !binding.constant) return;
        if (!binding.referenced) {
            path.remove();
            return;
        }

        let sourceCode = path.toString();
        if (sourceCode.includes("try") ||
            sourceCode.includes("random") ||
            sourceCode.includes("Date")
        ) {//返回值不唯一不做处理
            return;
        }

        //直接eval，如果缺环境，让其主动报错，再补上即可。下同
        eval(sourceCode);

        let referPaths = binding.referencePaths;
        let canRemoved = true;
        for (const referPath of referPaths) {
            let callExpress = referPath.parentPath;
            if (!callExpress.isCallExpression({ callee: referPath.node })) {
                canRemoved = false;
                continue;
            }
            if (!isArgsAllLiteral(callExpress.node.arguments)) {
                canRemoved = false;
                continue;
            }
            let value = eval(callExpress.toString());
            if (typeof value == "function" || typeof value == "undefined") {
                canRemoved = false;
                continue;
            }

            console.log(callExpress.toString(), "-->", value);
            callExpress.replaceWith(types.valueToNode(value));
        }

        canRemoved && path.remove();

    },
}
```
<a name="u0OHx"></a>
### 规范循环表达式
```javascript
for (var i=0; i<10086; i++)
  console.log(6666666);
console.log(7777777);

while (true)
  console.log(8888888);

===>

for (var i = 0; i < 10086; i++) {
 console.log(6666666);
}

console.log(7777777);

while (true) {
 console.log(8888888);
}

```
插件如下：
```javascript
const standardLoop =
{
    "ForStatement|WhileStatement"({ node }) {
        if (!types.isBlockStatement(node.body)) {
            node.body = types.BlockStatement([node.body]);
        }
    },
}
```
<a name="FbE7u"></a>
### if表达式的优化: 给代码块加上{},移除DeadCode
```javascript
if (a) b;else c;
if (a) {b;}else c;
if (a) b;else {c}
if (1+1) b;else c;
if (1-1) b;else c;
if (a) {} else b;
if (a) b;else {}
===>
if (a) {
  b;
} else {
  c;
}

if (a) {
  b;
} else {
  c;
}

if (a) {
  b;
} else {
  c;
}

b;
c;

if (!a) {
  b;
}

if (a) {
  b;
}
```
插件如下：
```javascript
const SimplifyIfStatement = {
	"IfStatement"(path) {
		const consequent = path.get("consequent");
		const alternate = path.get("alternate");
		const test = path.get("test");
		const evaluateTest = test.evaluateTruthy();

		if (!consequent.isBlockStatement()) {
			consequent.replaceWith(types.BlockStatement([consequent.node]));
		}
		if (alternate.node !== null && !alternate.isBlockStatement()) {
			alternate.replaceWith(types.BlockStatement([alternate.node]));
		}

		if (consequent.node.body.length == 0) {
			if (alternate.node == null) {
				path.replaceWith(test.node);
			}
			else {
				consequent.replaceWith(alternate.node);
				alternate.remove();
				path.node.alternate = null;
				test.replaceWith(types.unaryExpression("!", test.node, true));
			}
		}

		if (alternate.isBlockStatement() && alternate.node.body.length == 0) {
			alternate.remove();
			path.node.alternate = null;
		}

		if (evaluateTest === true) {
			path.replaceWithMultiple(consequent.node.body);
		}
		else if (evaluateTest === false) {
			alternate.node === null ? path.remove() : path.replaceWithMultiple(alternate.node.body);
		}
	},
}
```
<a name="oZVAw"></a>
### LogicalExpression 转 IfStatement
```javascript
a || b;
a && b;

===>

if (a) {} else {
 b;
}

if (a) {
 b;
}
```
插件如下：
```javascript
const LogicalToIfStatement = 
{
	LogicalExpression(path)
	{
		let {node,parentPath} = path;
		if (!parentPath.isExpressionStatement())
		{
			return;
		}
		let {left,operator,right} = node;
		
		let blockNode = types.BlockStatement([]);
		let newNode = types.BlockStatement([types.ExpressionStatement(right)])
		
		let ifNode = undefined;
		
		if (operator == "||")
		{
			ifNode = types.IfStatement(left,blockNode,newNode);
		}
		else if (operator == "&&")
		{
			ifNode = types.IfStatement(left,newNode,null);
		}
		else
		{
			return;
		}
		
		parentPath.replaceWith(ifNode);
	},

}
```
<a name="JTupb"></a>
### 删除重复定义的变量
删除重复定义的变量，添加赋值语句的处理，解决5s盾的问题。 <br />`var a = 2,b = a,c = b; ===> var a = 2,c = a;`<br />插件如下：
```javascript
const deleteRepeatDefine = {
 "VariableDeclarator|FunctionDeclaration"(path)
 {
 let {node,scope,parentPath} = path;
  
 if (path.isFunctionDeclaration())
 {
  scope = parentPath.scope;
 }
 let name = node.id.name;
 const binding = scope.getBinding(name);
 if (path.isFunctionDeclaration())
 {
  if(!binding || binding.constantViolations.length > 1)
  {
  return;
  }
 }
  else
  {
   if(!binding || !binding.constant) return;
  }
   
  scope.traverse(scope.block,{
   VariableDeclarator(path)
   {
   let {node,scope} = path;
   let {id,init} = node;
   if (!types.isIdentifier(init,{name:name})) return;
    
   const binding = scope.getBinding(id.name);
    
   if (!binding || !binding.constant) return;
   
   scope.rename(id.name,name);
   path.remove();
   },
   AssignmentExpression(path)
   {
   let {node,scope} = path;
   let {left,operator,right} = node;
   if (!types.isIdentifier(right,{name:name})) return;
    
   const binding = scope.getBinding(left.name);
    
   if (!binding || binding.constantViolations.length != 1) 
   {
    return;
   }
   scope.rename(left.name,name,scope.block);
   path.remove();
   scope.crawl();
   }
  })
   
  scope.crawl();   
 },
  
}
```
<a name="vKEbp"></a>
### 删除deadCode
删除deadCode，所谓deadCode，就是程序永远都不会执行的代码<br />注意:某些情况下需要先运行resolveSequence 插件 <br />插件如下：
```javascript
const removeDeadCode = {
	"IfStatement|ConditionalExpression"(path) {
		let { consequent, alternate } = path.node;
		let testPath = path.get('test');
		const evaluateTest = testPath.evaluateTruthy();
		if (evaluateTest === true) {
			if (types.isBlockStatement(consequent)) {
				consequent = consequent.body;
			}
			path.replaceWithMultiple(consequent);
		}
		else if (evaluateTest === false) {
			if (alternate != null) {
				if (types.isBlockStatement(alternate)) {
					alternate = alternate.body;
				}
				path.replaceWithMultiple(alternate);
			}
			else {
				path.remove();
			}
		}
	},
	EmptyStatement(path) {
		path.remove();
	},
	"VariableDeclarator"(path) {
		let { node, scope, parentPath } = path;
		if(parentPath.parentPath.isProgram())
		{
			return;//全局变量不作处理
		}
		let binding = scope.getBinding(node.id.name);
		if (binding && !binding.referenced && binding.constant) {//没有被引用，也没有被改变
			path.remove();
		}
	},
	"FunctionDeclaration"(path) {
		let { node, scope, parentPath } = path;
		if(parentPath.isProgram())
		{
			return;//全局函数不作处理
		}
		let binding = parentPath.scope.getBinding(node.id.name); //可能函数定义里有同名变量或者赋值语句
		if (binding) {//没有被引用，也没有被改变
			if(!binding.referenced && binding.constant)
			{
				path.remove();
				return;
			}
			if (binding.references == 1 && binding.constantViolations.length == 1)
			{
				let {start,end} = node;
				let changePath  = binding.constantViolations[0];
				let referPath   = binding.referencePaths[0]
				if (start < changePath.node.start && changePath.node.end < end &&
				    start < referPath.node.start &&  referPath.node.end < end )
				{
					path.remove();
				}
			}
			
		}
	},	
	
	"ReturnStatement"(path) {
		let AllNextSiblings = path.getAllNextSiblings();
		for (let nextSibling of AllNextSiblings) {
			if (nextSibling.isBreakStatement() || nextSibling.isDeclaration()) {
				continue;
			}
			nextSibling.remove();
		}
	},
	"BreakStatement|ContinueStatement"(path) {
		let AllNextSiblings = path.getAllNextSiblings();
		for (let nextSibling of AllNextSiblings) {
			nextSibling.remove();
		}
	}
}
```
<a name="UhYJZ"></a>
### 变量多重赋值的还原
```javascript
var o, i, s;
o = i = s = t;

===>

var o, i, s;
s = t;
i = t;
o = t;
```
插件如下：
```javascript
const reduceAssign = 
{
	AssignmentExpression:
	{
		exit(path)
		{
			let {parentPath,node} = path;
			if (!parentPath.isAssignmentExpression({right:node,operator:"="}))
			{
				return;
			}
			
			let {left,operator,right} = node;
			if (operator != "=") return;
			
			
			let expressionPath = path.findParent(p => p.isExpressionStatement());
			if (!expressionPath) return;
			
			expressionPath.insertBefore(types.ExpressionStatement(node));
			
			path.replaceWith(right);
		}
	}
}
```
<a name="s43VT"></a>
### 合并变量声明与定义
这里的声明与定义是紧挨着
```javascript
var a,b,c;
a = 1;
b = 2;
c = 3;

===>

var a = 1,b=2,c = 3;
```
插件如下：
```javascript
const combinDefineAndNextAssgin = 
{
	VariableDeclarator(path)
	{
		let {scope,node,parentPath} = path;
		let {id,init} = node;
		if (init != null) return;
		let name = id.name;
		
		let nextSiblings = parentPath.getAllNextSiblings();
		
		for (let nextSibling of nextSiblings)
		{
			if (!nextSibling.isExpressionStatement())
			{
				break;
			}
			let expression = nextSibling.node.expression;
			if (!types.isAssignmentExpression(expression))
			{
				continue;
			}
			let {left,operator,right} = expression;
			if (!types.isIdentifier(left,{name:name}))
			{
				continue;
			}
			if (operator != "=")
			{
				break;
			}
			
			path.set("init",right);
			nextSibling.remove();
			break;
		}
		scope.crawl();
	}
}
```
<a name="LavdE"></a>
### 万能数组还原插件
插件如下：
```javascript
//这里填入 数组的声明与定义

let arrName = "XXX";   //XXX 为你要还原的数组名

const replaceArrayElements = 
{
	MemberExpression:{
		exit(path)
		{
			let {object,property} = path.node;
			if (!types.isIdentifier(object,{name:arrName}) ||
			  !types.isNumericLiteral(property))
			{
				return;
			}
			
			let value = eval(path.toString());
			path.replaceWith(types.valueToNode(value));
		}
	},
}

```
<a name="s2u4U"></a>
### 属性的访问方式还原
```javascript
var a = b["length"];

==>

var a = b.length;

```
插件如下：
```javascript
const keyToIdentifier = {
   MemberExpression:
   {
      exit({node})
      {
         const prop = node.property;
         if (node.computed && types.isStringLiteral(prop))
         {
            node.property = types.Identifier(prop.value);
            node.computed = false;
         }
    }
  },
}
```
<a name="fM1Bg"></a>
### if语句下沉插件
即if-else尾部相同的代码合并，这里默认test节点执行不影响其他代码。
```javascript
if (a)
{
	console.log(111);
	console.log(222);
	console.log(333);
	console.log(444);
	console.log(555);
	console.log(666);
	console.log(777);
	console.log(888);
	console.log(999);
}
else
{
	console.log(444);
	console.log(555);
	console.log(666);
	console.log(777);
	console.log(888);
	console.log(999);
}


===>

if (a) {
 console.log(111);
 console.log(222);
 console.log(333);
}

console.log(444);
console.log(555);
console.log(666);
console.log(777);
console.log(888);
console.log(999);
```
插件如下：
```javascript
const combinIFAndElse = 
{
	IfStatement(path)
	{
		let {test,consequent,alternate} = path.node;
		
		if (!alternate) return;
		
		let ifBody  = consequent.body;
		let elseBody = alternate.body;
		
		let codeArr = [];
		while (ifBody.length > 0 && elseBody.length > 0)
		{
			let ifCode  = generator(ifBody[ifBody.length - 1]).code;
			let elseCode = generator(elseBody[elseBody.length - 1]).code;
			if (ifCode != elseCode)
			{
				break;
			}
			codeArr.push(ifBody[ifBody.length - 1]);
			ifBody.pop();
			elseBody.pop();
		}
		
		if (codeArr.length > 0)
		{

			if (ifBody.length > 0 && elseBody.length == 0)
			{
				path.node.alternate = null;
				codeArr.forEach( node =>{path.insertAfter(node);});
			}
			else if (ifBody.length == 0 && elseBody.length > 0)
			{
				codeArr.reverse();
				codeArr.forEach( node =>{path.insertBefore(node);});
				let newNOde = types.UnaryExpression("!",test,true);
				let ifNode = types.IfStatement(newNOde,types.BlockStatement(elseBody),null);
				path.replaceWith(ifNode);
			}
			else
			{
				path.replaceWithMultiple(codeArr.reverse());
			}
		}
	},
}
```
<a name="DdBa1"></a>
### 逗号表达式存在于if的test节点或者for混淆的init节点等还原
当if语句的test节点是逻辑表达式时，并且逻辑表达式又是逗号表达式的混淆代码还原，该案例代码来自于5s盾
```javascript
function s(G, F, E, D, C, B, A) {
  if ((A = {},
  A["LaBLt"] = function(H, I) {
    return H + I;
  }
  ,
  A["veTDU"] = function(H, I) {
    return H !== I;
  }
  ,
  A["cUMCU"] = function(H, I) {
    return H(I);
  }
  ,
  A["fINkA"] = "MrNac",
  B = A,
  C = d["_cf_chl_opt"],
  h("cf_chl_prog", 'hc', 1),
  C["cRq"] && C["cRq"]["ru"]) && (D = function(H) {
    return e["getElementById"](H);
  }
  ,
  E = p(n(C["cRq"]["ru"])),
  F = B["LaBLt"](E["protocol"], '//') + E["hostname"],
  B["veTDU"](e["location"]["href"]["indexOf"](F), 0))) {
    G = B["cUMCU"](D, 'location-mismatch-warning');

    if (G) {
      G["style"]["display"] = "block";
    } else {
      if (B["fINkA"] !== "MrNac") {
        function H() {
          return null == i ? '' : '' == j ? null : k["i"](l["length"], 32768, function(I) {
            return n["charCodeAt"](I);
          });
        }
      } else {
        q("This web property is not accessible via this address.", '& 35813;& 32593;& 31449;& 36164;& 28304;& 26080;& 27861;& 36890;& 36807;& 27492;& 22320;& 22336;& 35775;& 38382;&#12290;');
      }
    }

    h("cf_chl_prog", 'hc', 'F');
    return false;
  }

  return true;
}


===》

function s(G, F, E, D, C, B, A) {
 A = {};

 A["LaBLt"] = function (H, I) {
  return H + I;
 };

 A["veTDU"] = function (H, I) {
  return H !== I;
 };

 A["cUMCU"] = function (H, I) {
  return H(I);
 };

 A["fINkA"] = "MrNac";
 B = A;
 C = d["_cf_chl_opt"];
 h("cf_chl_prog", 'hc', 1);

 if (C["cRq"] && C["cRq"]["ru"]) {
  D = function (H) {
   return e["getElementById"](H);
  };

  E = p(n(C["cRq"]["ru"]));
  F = B["LaBLt"](E["protocol"], '//') + E["hostname"];
 }

 if (C["cRq"] && C["cRq"]["ru"] && B["veTDU"](e["location"]["href"]["indexOf"](F), 0)) {
  G = B["cUMCU"](D, 'location-mismatch-warning');

  if (G) {
   G["style"]["display"] = "block";
  } else {
   if (B["fINkA"] !== "MrNac") {
    function H() {
     return null == i ? '' : '' == j ? null : k["i"](l["length"], 32768, function (I) {
      return n["charCodeAt"](I);
     });
    }
   } else {
    q("This web property is not accessible via this address.", '& 35813;& 32593;& 31449;& 36164;& 28304;& 26080;& 27861;& 36890;& 36807;& 27492;& 22320;& 22336;& 35775;& 38382;&#12290;');
   }
  }

  h("cf_chl_prog", 'hc', 'F');
  return false;
 }

 return true;
}
```
插件如下：
```javascript
const resolveSequenceForLogicalExpression = 
{
	IfStatement(path)
	{
		let {test} = path.node;
		if (!types.isLogicalExpression(test))
		{
			return;
		}
		let {left,operator,right} = test;
		if (types.isSequenceExpression(left))
		{
			let {expressions} = left;
			let lastNode = expressions.pop();
			for (let expression of expressions)
			{
				path.insertBefore(types.ExpressionStatement(expression=expression));
			}
			path.node.test.left = lastNode;
		}
		
		if (operator == "&&" && types.isSequenceExpression(right))
		{
			let {expressions} = right;
			let lastNode = expressions.pop();
			let ifBody = [];
			for (let expression of expressions)
			{
				ifBody.push(types.ExpressionStatement(expression=expression));
			}
			path.node.test.right = lastNode;
			let ifNode = types.IfStatement(path.node.test.left,types.BlockStatement(ifBody),null);
			path.insertBefore(ifNode);
		}
	}
}

```
<a name="jEBO4"></a>
### 条件表达式转if语句，支持嵌套的条件表达式，及子节点包含逗号表达式的情况
注意，如果报错，需要先运行 TransCondition 插件
```javascript
3 === this.Cn ? this.Yz = 256 : 23 === this.Cn ? this.$V ? this.Yz = 480 : this.Yz = 512 : this.$V ? this.Yz = 960 : this.Yz = 1024;

===>

if (3 === this.Cn) {
   this.Yz = 256;
  } else {
   if (23 === this.Cn) {
    if (this.$V) {
     this.Yz = 480;
    } else {
     this.Yz = 512;
    }
   } else {
    if (this.$V) {
     this.Yz = 960;
    } else {
     this.Yz = 1024;
    }
   }
  }
```
插件如下：
```javascript
const ConditionToIf = {
	ConditionalExpression: {
		exit(path){
			let {test, consequent, alternate} = path.node;
			if (types.isSequenceExpression(consequent))
			{
				let expressions = consequent.expressions;
				let retBody = [];
				for(let expression of expressions)
				{
					retBody.push(types.ExpressionStatement(expression));
				}
				consequent = types.BlockStatement(retBody);
			}
			else
			{
				consequent = types.ExpressionStatement(consequent);
				consequent = types.BlockStatement([consequent]);
			}
			if (types.isSequenceExpression(alternate))
			{
				let expressions = alternate.expressions;
				let retBody = [];
				for(let expression of expressions)
				{
					retBody.push(types.ExpressionStatement(expression));
				}
				alternate = types.BlockStatement(retBody);
			}
			else
			{
				alternate = types.ExpressionStatement(alternate);
				alternate = types.BlockStatement([alternate]);
			}
			let ifStateNode = types.IfStatement(test,consequent,alternate);
			path.replaceWithMultiple(ifStateNode);
			path.stop();
  }
 },
}
```
<a name="aeldW"></a>
### 部分常量运算可合并的进行合并
```javascript
var a = "a" + "b" + c;
var b = c + "d" + "e";
var c = "a" + "b" + c + "d" + "e";

===>

var a = "ab" + c;
var b = c + "de";
var c = "ab" + c + "de";
```
插件如下：
```javascript
const calcPartBinaryExpression =
{
    "BinaryExpression"(path) {

        let { parent, scope, parentPath, node } = path;

        let { left, operator, right } = node;

        if (types.isLiteral(left) && types.isLiteral(right)) {
            const { confident, value } = path.evaluate();
            if (!confident || value == "Infinity") return;
            path.replaceWith(types.valueToNode(value));
            return;
        }

        if (parentPath.isBinaryExpression({ left: node })) {
            if (!types.isLiteral(left) && operator == "+" &&
                types.isLiteral(right)) {
                if (parent.operator == "+" && types.isLiteral(parent.right)) {

                    path.node.right.value += parent.right.value;

                    parentPath.replaceWith(path.node);
                }
            }
        }
    },
}
```
<a name="ZWAIu"></a>
### 万能调用表达式替换计算值插件，补上函数定义，直接调用即可
主要替换类似 "motnahp"["split"]('')"reverse"["join"]('')的函数调用。<br />你还可以把环境复制到AST文件中，运行即可。

```javascript
var  a = "motnahp"["split"]('')["reverse"]()["join"]('');

===>

var a = "phantom";
```
插件如下：
```javascript
function isArgsAllLiteral(argumentsNode)
{
	
	function isBaseLiteral(node)
	{
		if (types.isLiteral(node))
		{
			return true;
		}
		if (types.isUnaryExpression(node,{"operator":"-"}) || 
		 types.isUnaryExpression(node,{"operator":"+"}))
		{
			return isBaseLiteral(node.argument);
		}
		
		if (types.isObjectExpression(node))
		{
			let {properties} = node;
			if (properties.length == 0)
			{
				return true;
			}
			
			return properties.every(property=>isBaseLiteral(property));

		}
		if (types.isArrayExpression(node))
		{
			let {elements} = node;
			if (elements.length == 0)
			{
				return true;
			}
			return elements.every(element=>isBaseLiteral(element));
		}
		
		return false;
	}
	
	return argumentsNode.every(argument=>isBaseLiteral(argument));
}


const callToStringLiteral = 
{
	CallExpression:{
		exit(path)
		{
			let {scope,node} = path;
			let {callee,arguments} = node;
			if (!isArgsAllLiteral(arguments)) return;
		 try
		 {
		 	let value = eval(path.toString());
		 	if (typeof value != "string") return;
		 	console.log(path.toString(),"-->",value);
		 	path.replaceWith(types.valueToNode(value));
		 }catch(e){}
	 }
	},
}
```
<a name="GUger"></a>
### switch语句的cases节点仅有一个元素时的还原
```javascript
function demo(cU, cV) {
 var cW = 1;

 while (cW !== 0) {
  switch (cW) {
   case 1:
    var cZ = [];
    var d0 = 0;
    var d1 = 0;

    while (d0 < cU) {
     cZ[(d0 + cV) % cU] = [];
     d0++;
    }
    cW = 0;
    break;
  }
 }
}

===>

function demo(cU, cV) {
 var cZ = [];
 var d0 = 0;
 var d1 = 0;

 while (d0 < cU) {
  cZ[(d0 + cV) % cU] = [];
  d0++;
 }
}
```
插件如下：
```javascript
const replaceSwitchNOde = 
{
	"ForStatement|WhileStatement"(path)
	{
		let {scope,node} = path;
		let body = node.body.body;
		if (body.length != 1 ||
		  !types.isSwitchStatement(body[0]))
		{
			return;
		}
		let {discriminant,cases} = body[0];
		let binding = path.scope.getBinding(discriminant.name);
		if (!binding || !binding.path || 
		  !binding.path.isVariableDeclarator()) 
		{
			return;
		}
		
		if (cases.length != 1) return;
		
		let {consequent} = cases[0];
		
		if (types.isBreakStatement(consequent[consequent.length-1]))
		{
			consequent.pop();
		}
		if (types.isExpressionStatement(consequent[consequent.length-1]) &&
		  types.isAssignmentExpression(consequent[consequent.length-1].expression))
		{

			let {left} = consequent[consequent.length-1].expression;
			if (types.isIdentifier(left,{name:discriminant.name}))
			{
				consequent.pop();
			}
		}		
		
		path.replaceWithMultiple(consequent);
		
		binding.path.remove();
	}
}
```
<a name="oKjUZ"></a>
### 判断函数调用时的实参是否都是Literal类型
由于path.isliteral() 和 types.isliteral(node) 的功能比较弱，因此，我自己写了个方法，专门来判断 当前的节点是否为字面量。代码认为 123,456[],{},[{}],都是字面量。<br />插件如下：
```javascript
function isNodeLiteral(node) {
    if(Array.isArray(node))
	{
		return node.every(ele=>isNodeLiteral(ele));
	}
    if (types.isLiteral(node)) {
        return true;
    }
    if (types.isUnaryExpression(node, {
        "operator": "-"
    }) || types.isUnaryExpression(node, {
        "operator": "+"
    })) {
        return isNodeLiteral(node.argument);
    }

    if (types.isObjectExpression(node)) {
        let {properties} = node;
        if (properties.length == 0) {
            return true;
        }

        return properties.every(property=>isNodeLiteral(property));

    }
    if (types.isArrayExpression(node)) {
        let {elements} = node;
        if (elements.length == 0) {
            return true;
        }
        return elements.every(element=>isNodeLiteral(element));
    }

    return false;
}
```
函数名	: isArgsAllLiteral<br />函数功能: 判断函数实参是否都是Literal类型<br />入口参数: argumentsNode 函数的实参，即arguments节点<br />返回值	: 实参都是Literal类型，返回true，否则返回false;<br />注意:[] 和 {} 在此函数中也看成是Literal类型
```javascript
function isArgsAllLiteral(argumentsNode)
{
	
	function isBaseLiteral(node)
	{
		if (types.isLiteral(node))
		{
			return true;
		}
		if (types.isUnaryExpression(node,{"operator":"-"}) || 
		  types.isUnaryExpression(node,{"operator":"+"}))
		{
			return isBaseLiteral(node.argument);
		}
		
		if (types.isObjectExpression(node))
		{
			let {properties} = node;
			if (properties.length == 0)
			{
				return true;
			}
			
			return properties.every(property=>isBaseLiteral(property));

		}
		if (types.isArrayExpression(node))
		{
			let {elements} = node;
			if (elements.length == 0)
			{
				return true;
			}
			return elements.every(element=>isBaseLiteral(element));
		}
		
		return false;
	}
	
	return argumentsNode.every(argument=>isBaseLiteral(argument));
}
```
注意:在使用该方法时，考虑到有嵌套的函数调用，你应该使用exit方式遍历调用表达式，实例代码如下: 
```javascript
const callToLiteral = 
{
	CallExpression:{
		exit(path)
		{
			let {scope,node} = path;
			let {callee,arguments} = node;
			if (!isArgsAllLiteral(arguments)) return;
		    ......
	 }
	},
}
```
<a name="jgo8L"></a>
### 简单函数的还原与替换，函数体只有一个return语句
```javascript
var nm = function (xH, FH) {
  return xH > FH;
 };
function mn(xH, FH) {
  return xH < FH;
 };
 var bb = nm(a,b);
 var cc = mn(a,b);


===>

 var nm = function (xH, FH) {
  return xH > FH;
 };
function mn(xH, FH) {
  return xH < FH;
 };
 var bb = a > b;
var cc = a < b;
```
插件如下：
```javascript
const reSolveFunctionExpression = 
{
   "VariableDeclarator|FunctionDeclaration"(path)
   {
      let {scope,node} = path;

      let id = node.id;

      const binding = path.scope.getBinding(id.name);

      if (!binding || !binding.constant) return;

      let params,body;

      if (path.isVariableDeclarator())
      {
         let init = node.init;
         if (!types.isFunctionExpression(init))
     {
        return;
     }
     params = init.params;
     body  = init.body;
      }

      else
      {
     params = node.params;
     body = node.body;         
      }


      let referPaths = binding.referencePaths;

      if (params.length == 1 && body.body.length == 1 && 
         types.isReturnStatement(body.body[0]) &&
         types.isUnaryExpression(body.body[0].argument))
      {
         let {operator,argument} = body.body[0].argument;
         if (!types.isIdentifier(argument,{name:params[0].name}))
         {

            return;
         }
         let canbeRemoved = true;
         for (let referPath of referPaths)
         {
            let callPath = referPath.findParent(p => p.isCallExpression());
            let {callee,arguments} = callPath.node;
            if (!types.isIdentifier(callee,{name:id.name}) || arguments.length != 1)
            {
               canbeRemoved = false;
               continue;
            }
            let UnaryNode = types.UnaryExpression(operator,arguments[0]);
            callPath.replaceWith(UnaryNode);
            callPath.scope.crawl();
         }
         canbeRemoved && path.remove();
         return;
      }
      if (params.length == 2 && body.body.length == 1 &&
         types.isReturnStatement(body.body[0]) &&
         types.isBinaryExpression(body.body[0].argument))
      {
         let {left,operator,right} = body.body[0].argument;
         if (!types.isIdentifier(left,{name:params[0].name}) || 
            !types.isIdentifier(right,{name:params[1].name}))
         {
            return;
         }
         let canbeRemoved = true;
         for (let referPath of referPaths)
         {
            let callPath = referPath.findParent(p => p.isCallExpression());
            let {callee,arguments} = callPath.node;
            if (!types.isIdentifier(callee,{name:id.name}) || arguments.length != 2)
            {
               canbeRemoved = false;
               continue;
            }
            let BinaryNode = types.BinaryExpression(operator,arguments[0],arguments[1]);
            callPath.replaceWith(BinaryNode);
            callPath.scope.crawl();
         }

         canbeRemoved && path.remove();
         return;
      }

   },
}
```
<a name="ZCjQl"></a>
### 赋值表达式的right节点常量替换
赋值表达式语句的替换，适用于<br />有binding且更改只有一次的情况
```javascript
var a;
a = 3;
b = a + 2;

===>

var a;
b = 3 + 2;
```
插件如下：
```javascript
const replaceAssignLiteral = {
  AssignmentExpression(path)
  {
     let {scope,node} = path;
     let {left,right,operator} = node;
     if (!types.isIdentifier(left) || operator != "=" ||
         !types.isLiteral(right))
     {
        return;
     }

     let binding = scope.getBinding(left.name);
     if (!binding) 
     {
        return;
     }
     let {constantViolations,referencePaths} = binding;

     if (binding.constantViolations.length == 1 &&
         path == binding.constantViolations[0])
     {
        for (let referPath of referencePaths)
        {
           referPath.replaceWith(right);
        }
        path.remove();
     }
     scope.crawl();
  },
}
```
<a name="Jz6Vb"></a>
### 多个变量定义各自分离
```javascript
var a = 123,b = 456;
let c = 789,d = 120;
===>
var a = 123;
var b = 456;
let c = 789;
let d = 120;
```
插件如下：
```javascript
const DeclaratorToDeclaration = 
{
   VariableDeclaration(path)
   {
      let {parentPath,node} = path;
   	  if (!parentPath.isBlock())
   	  {
   	 	 return;
   	  }
      let {declarations,kind} = node;
     
      if (declarations.length == 1)
      {
         return;
      }

      let newNodes = [];

      for (const varNode of declarations)
      {
         let newDeclartionNode = types.VariableDeclaration(kind,[varNode]);
         newNodes.push(newDeclartionNode);
      }

      path.replaceWithMultiple(newNodes);

   },
}
```
<a name="Cxa5a"></a>
### 变量定义为函数表达式合并为函数定义
```javascript
var a = function ()
{
  console.log(666);
}
===>
function a() {
  console.log(666);
}
```
插件如下：
```javascript
const varDeclarToFuncDeclar =
{
    VariableDeclaration(path) {
        let { parentPath, node, scope } = path;
        if (!parentPath.isBlock()) {//过滤掉部分特殊情况，例如for循环里的变量定义
            return;
        }
        let { declarations, kind } = node;
        if (declarations.length != 1) {
            return;
        }

        let { id, init } = declarations[0];
        if (!types.isFunctionExpression(init, { id: null })) {
            return;
        }

        let { params, body } = init;
        let newNode = types.FunctionDeclaration(id, params, body);
        path.replaceWith(newNode);
        scope.crawl();
    }
}
```
<a name="S0JGO"></a>
### 全局函数的计算
计算全局函数,实参需要为字面量<br />parseInt可替换为任意全局函数
```javascript
var a = parseInt("12345",16);

===>

var a = 74565;
```
插件如下：
```javascript
const evaluateGlobalFunc = 
{
	"CallExpression"(path)
	{
		if (!isElementsLiteral(path)) return;
		let {callee,arguments} = path.node;
		if (!types.isIdentifier(callee) || callee.name == "eval") return;
		let func = global[callee.name];
		if (typeof func !== "function") return;
		let args = [];
		arguments.forEach((ele,index) =>{args[index] = ele.value;});
		let value = func.apply(null,args);
		if (typeof value == "function" || typeof value == "undefined") return;
		path.replaceWith(types.valueToNode(value));
	}
}

```
<a name="mHvnH"></a>
### object对象合并，常见于ob混淆
一键解ob混淆插件更新<br />原插件名:preDecodeObject<br />先插件名:combinObjectProperty
```javascript
var N = {};
N['pjJaj'] = function(O, P) {
    return O !== P;
};
N['kchUv'] = b('0', 'kG%a');
N['pUSwg'] = b('1', '6gEI');
N['ckVCQ'] = function(Q, R) {
    return Q !== R;
};
N['AgHaJ'] = b('2', '4fPv');
N['VtmkW'] = b('3', 'N6]X');

===>
  
var N = {
  'pjJaj': function (O, P) {
    return O !== P;
  },
  'kchUv': b('0', 'kG%a'),
  'pUSwg': b('1', '6gEI'),
  'ckVCQ': function (Q, R) {
    return Q !== R;
  },
  'AgHaJ': b('2', '4fPv'),
  'VtmkW': b('3', 'N6]X')
};
```
插件如下：
```javascript
const preDecodeObject = {
   VariableDeclarator({node,parentPath,scope})
   {
      const {id,init} = node;
      if (!types.isObjectExpression(init)) return;
      let name = id.name;
      
      let properties = init.properties;
      let allNextSiblings = parentPath.getAllNextSiblings();
      for (let nextSibling of allNextSiblings)
      {
         if (!nextSibling.isExpressionStatement())  break;
         
         let expression = nextSibling.get('expression');
         if (!expression.isAssignmentExpression({operator:"="})) break;

         let {left,right} = expression.node;
         if (!types.isMemberExpression(left)) break;
         
         let {object,property} = left;
         if (!types.isIdentifier(object,{name:name}) ||
             !types.isStringLiteral(property)) 
        {
         break;
        }
        
         properties.push(types.ObjectProperty(property,right));
         nextSibling.remove();
      }  
      scope.crawl(); 
   },
}
```
<a name="h77Cj"></a>
### object对象还原，当其value字段全部是字面量的时候
当一个object里面的value全部为字面量时的还原，没有考虑单个key重新赋值的情况。<br />还原思路:<br />1.遍历 VariableDeclarator 节点或者  AssignmentExpression 节点<br />2.判断object里面的value是否全部为字面量<br />3.判断是否被重新赋值<br />4.根据scope来查找其引用的地方，替换<br />5.如果全部进行了还原，删除垃圾代码
```javascript
var obj = {"a":123,"b":456,"c":"",};
var res = obj["a"] + obj["a"] + obj["b"] + obj["c"];

===>

var res = 123 + 123 + 456 + "";
```
插件如下：
```javascript
function isBaseLiteral(node) {
    if (types.isLiteral(node)) {
        return true;
    }
    if (types.isUnaryExpression(node, {operator: "-"}) ||
        types.isUnaryExpression(node, {operator: "+"})) {
        return isBaseLiteral(node.argument);
    }

    return false;
}


const decodeObject =
    {
        VariableDeclarator(path) {
            let {node, scope} = path;
            const {id, init} = node;
            if (!types.isObjectExpression(init)) return;
            let properties = init.properties;
            if (properties.length == 0 || !properties.every(property => isBaseLiteral(property.value)))
                return;

            let binding = scope.getBinding(id.name);
            let {constant, referencePaths} = binding;
            if (!constant) return;

            let newMap = new Map();
            for (const property of properties) {
                let {key, value} = property;
                newMap.set(key.value, value);
            }

            let canBeRemoved = true;
            for (const referPath of referencePaths) {
                let {parentPath} = referPath;
                if (!parentPath.isMemberExpression()) {
                    canBeRemoved = false;
                    return;
                }
                let curKey = parentPath.node.property.value;
                if (!newMap.has(curKey))
                {
                    canBeRemoved = false;
                    break;
                }
                parentPath.replaceWith(newMap.get(curKey));
            }
            canBeRemoved && path.remove();
            newMap.clear();
        },
    }
```
<a name="CkQrs"></a>
### 处理Try...catch...语句，默认替换为block子节点里面的内容
如果逻辑错误，记得屏蔽该插件。
```javascript
const simplfiyTryStatement =
    {//半通用
        TryStatement:
            {
                exit(path) {
                    let {block, handler} = path.node;
                    let sourceCode = generator(block).code;
                    if (sourceCode.includes("window") || sourceCode.includes("document"))
                    {//胆子大一点，甚至可以直接屏蔽上面的if判断
                        path.replaceWithMultiple(block.body)
                    }
                }
            }
    }
```
<a name="Mne7a"></a>
### 给Try语句添加一个打印错误类型的语句
```javascript
try{
	a = b + c;
}catch(e){	
}

===>

try {
  a = b + c;
} catch (e) {
  console.log(e);
}
```
插件如下：
```javascript
const TempNode = template(`console.log(A);`);
const addLogToTryStatement = 
{
	CatchClause(path)
	{
		let {param,body} = path.node;
		let logNode = TempNode({"A":param,});
		body.body.unshift(logNode);
	}
}
```
