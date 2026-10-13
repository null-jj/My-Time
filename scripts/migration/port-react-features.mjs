import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

const inputRoot = process.argv[2];
if (!inputRoot)
  throw new Error("Pass the path to an unmodified source checkout.");
const featureDirs = ["dashboard", "dtr", "admin", "invite", "tracker"];
const targets = featureDirs.flatMap((dir) =>
  fs
    .readdirSync(path.join(inputRoot, "components", dir))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => `components/${dir}/${file}`),
);
const pages = ["calendar", "tokens", "welcome", "themes"];
const files = [...targets, ...pages.map((page) => `app/${page}/page.tsx`)];
const program = ts.createProgram(
  files.map((file) => path.join(inputRoot, file)),
  {
    jsx: ts.JsxEmit.Preserve,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
  },
);
const checker = program.getTypeChecker();
const f = ts.factory;
const call = (name) =>
  f.createCallExpression(f.createIdentifier(name), undefined, []);
const arrow = (expression) =>
  f.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    expression,
  );
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

for (const relative of files) {
  const source = program.getSourceFile(path.join(inputRoot, relative));
  const reactive = new Map();
  const props = new Map();
  const sym = (node) => checker.getSymbolAtLocation(node);
  function scan(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const name = node.initializer.expression.getText(source);
      if (ts.isArrayBindingPattern(node.name) && name === "useState") {
        reactive.set(
          sym(node.name.elements[0].name),
          node.name.elements[0].name.text,
        );
      }
      if (
        ts.isObjectBindingPattern(node.name) &&
        /^use(OrganizationContext|TimeTrackingContext|Theme|User)$/.test(name)
      ) {
        for (const binding of node.name.elements)
          reactive.set(sym(binding.name), binding.name.text);
      }
    }
    if (
      (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) &&
      node.parameters
    ) {
      for (const param of node.parameters) {
        if (ts.isObjectBindingPattern(param.name)) {
          for (const binding of param.name.elements) {
            if (ts.isIdentifier(binding.name))
              props.set(
                sym(binding.name),
                binding.propertyName?.getText(source) || binding.name.text,
              );
          }
        }
      }
    }
    ts.forEachChild(node, scan);
  }
  scan(source);
  const result = ts.transform(source, [
    (context) => {
      function visit(node) {
        if (ts.isImportDeclaration(node)) {
          const name = node.moduleSpecifier.text;
          if (name === "react") return undefined;
          const replacement =
            name === "lucide-react"
              ? "@/components/icons"
              : name === "sonner"
                ? "@/components/ui/sonner"
                : name === "@clerk/nextjs"
                  ? "@/lib/auth-client"
                  : name === "next/navigation"
                    ? "@/lib/navigation"
                    : name;
          return f.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            f.createStringLiteral(replacement),
            node.attributes,
          );
        }
        if (
          ts.isExpressionStatement(node) &&
          ts.isStringLiteral(node.expression) &&
          node.expression.text === "use client"
        )
          return undefined;
        if (ts.isJsxAttribute(node)) {
          if (["key", "suppressHydrationWarning"].includes(node.name.text))
            return undefined;
          if (node.name.text === "className")
            return f.updateJsxAttribute(
              node,
              f.createIdentifier("class"),
              ts.visitNode(node.initializer, visit),
            );
          if (node.name.text === "onChange")
            return f.updateJsxAttribute(
              node,
              f.createIdentifier("onInput"),
              ts.visitNode(node.initializer, visit),
            );
        }
        if (
          ts.isTypeReferenceNode(node) &&
          node.typeName.getText(source) === "React.FormEvent"
        ) {
          return f.createTypeReferenceNode("SubmitEvent", undefined);
        }
        if (ts.isParameter(node) && ts.isObjectBindingPattern(node.name)) {
          return f.updateParameterDeclaration(
            node,
            node.modifiers,
            node.dotDotDotToken,
            f.createIdentifier("props"),
            node.questionToken,
            node.type,
            node.initializer,
          );
        }
        if (ts.isVariableStatement(node)) {
          const declarations = [];
          for (const declaration of node.declarationList.declarations) {
            const init = declaration.initializer;
            if (
              init &&
              ts.isCallExpression(init) &&
              ts.isObjectBindingPattern(declaration.name) &&
              /^use(OrganizationContext|TimeTrackingContext|Theme|User)$/.test(
                init.expression.getText(source),
              )
            ) {
              const contextName = `context${declaration.pos}`.replace("-", "_");
              declarations.push(
                f.createVariableDeclaration(
                  contextName,
                  undefined,
                  undefined,
                  ts.visitNode(init, visit),
                ),
              );
              for (const binding of declaration.name.elements) {
                declarations.push(
                  f.createVariableDeclaration(
                    binding.name.text,
                    undefined,
                    undefined,
                    arrow(
                      f.createPropertyAccessExpression(
                        f.createIdentifier(contextName),
                        binding.propertyName?.getText(source) ||
                          binding.name.text,
                      ),
                    ),
                  ),
                );
              }
            } else declarations.push(ts.visitNode(declaration, visit));
          }
          return f.updateVariableStatement(
            node,
            node.modifiers,
            f.updateVariableDeclarationList(node.declarationList, declarations),
          );
        }
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
          const name = node.expression.text;
          if (name === "useState")
            return f.updateCallExpression(
              node,
              f.createIdentifier("createSignal"),
              node.typeArguments,
              node.arguments.map((arg) => ts.visitNode(arg, visit)),
            );
          if (name === "useCallback")
            return ts.visitNode(node.arguments[0], visit);
          if (name === "useEffect") {
            const compute = arrow(
              ts.visitNode(
                node.arguments[1] || f.createArrayLiteralExpression(),
                visit,
              ),
            );
            const effect = ts.visitNode(node.arguments[0], visit);
            return f.createCallExpression(
              f.createIdentifier("createEffect"),
              undefined,
              [compute, effect],
            );
          }
        }
        if (ts.isShorthandPropertyAssignment(node)) {
          const symbol = checker.getShorthandAssignmentValueSymbol(node);
          if (reactive.has(symbol))
            return f.createPropertyAssignment(
              node.name,
              call(reactive.get(symbol)),
            );
          if (props.has(symbol))
            return f.createPropertyAssignment(
              node.name,
              f.createPropertyAccessExpression(
                f.createIdentifier("props"),
                props.get(symbol),
              ),
            );
        }
        if (ts.isIdentifier(node)) {
          const parent = node.parent;
          const isName =
            (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
            (ts.isPropertyAssignment(parent) && parent.name === node) ||
            ts.isBindingElement(parent) ||
            ts.isJsxAttribute(parent) ||
            (ts.isVariableDeclaration(parent) && parent.name === node) ||
            ts.isParameter(parent) ||
            ts.isImportSpecifier(parent);
          if (!isName) {
            if (reactive.has(sym(node))) return call(reactive.get(sym(node)));
            if (props.has(sym(node)))
              return f.createPropertyAccessExpression(
                f.createIdentifier("props"),
                props.get(sym(node)),
              );
          }
        }
        return ts.visitEachChild(node, visit, context);
      }
      return (node) => ts.visitNode(node, visit);
    },
  ]);
  let code = printer.printFile(result.transformed[0]);
  code = `import { createSignal, createEffect, createMemo } from 'solid-js';\n${code}`;
  const output = relative.startsWith("app/")
    ? `src/pages/${relative.split("/")[1]}.tsx`
    : relative;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, code);
  result.dispose();
}
console.log(
  `Ported ${files.length} feature modules; inspect derived values and early render branches before verification.`,
);
