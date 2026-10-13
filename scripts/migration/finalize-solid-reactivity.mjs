import ts from "typescript";
import fs from "node:fs";
const dirs = [
  "components/dashboard",
  "components/dtr",
  "components/admin",
  "components/invite",
  "components/tracker",
  "src/pages",
];
const files = dirs.flatMap((dir) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => `${dir}/${file}`),
);
const program = ts.createProgram(files, {
  jsx: ts.JsxEmit.Preserve,
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
});
const checker = program.getTypeChecker();
const f = ts.factory;
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

for (const file of files) {
  const source = program.getSourceFile(file);
  const accessors = new Set();
  const derived = new Set();
  const sym = (node) => checker.getSymbolAtLocation(node);
  function walk(node, fn) {
    fn(node);
    ts.forEachChild(node, (child) => walk(child, fn));
  }
  walk(source, (node) => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      if (
        ts.isArrayBindingPattern(node.name) &&
        ts.isCallExpression(node.initializer) &&
        node.initializer.expression.getText(source) === "createSignal"
      )
        accessors.add(sym(node.name.elements[0].name));
      if (
        ts.isIdentifier(node.name) &&
        ts.isArrowFunction(node.initializer) &&
        !node.initializer.parameters.length &&
        !ts.isBlock(node.initializer.body) &&
        node.initializer.body.getText(source).startsWith("context")
      )
        accessors.add(sym(node.name));
    }
  });
  for (let pass = 0; pass < 10; pass++)
    walk(source, (node) => {
      if (
        !ts.isVariableDeclaration(node) ||
        !ts.isIdentifier(node.name) ||
        !node.initializer ||
        derived.has(sym(node.name))
      )
        return;
      let owner = node.parent;
      while (owner && !ts.isFunctionLike(owner)) owner = owner.parent;
      if (
        !owner ||
        !ts.isFunctionDeclaration(owner) ||
        !owner.name ||
        !/^[A-Z]/.test(owner.name.text)
      )
        return;
      if (
        ts.isArrowFunction(node.initializer) ||
        ts.isFunctionExpression(node.initializer)
      )
        return;
      if (
        ts.isCallExpression(node.initializer) &&
        /^(use|createSignal|createEffect|createMemo)/.test(
          node.initializer.expression.getText(source),
        )
      )
        return;
      let depends = false;
      walk(node.initializer, (child) => {
        if (ts.isIdentifier(child) && derived.has(sym(child))) depends = true;
        if (ts.isCallExpression(child) && accessors.has(sym(child.expression)))
          depends = true;
        if (
          ts.isPropertyAccessExpression(child) &&
          child.expression.getText(source) === "props"
        )
          depends = true;
      });
      if (depends) derived.add(sym(node.name));
    });
  const result = ts.transform(source, [
    (context) => {
      function visit(node) {
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          derived.has(sym(node.name))
        ) {
          return f.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            undefined,
            f.createCallExpression(
              f.createIdentifier("createMemo"),
              undefined,
              [
                f.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  ts.visitNode(node.initializer, visit),
                ),
              ],
            ),
          );
        }
        if (ts.isShorthandPropertyAssignment(node)) {
          const symbol = checker.getShorthandAssignmentValueSymbol(node);
          if (derived.has(symbol))
            return f.createPropertyAssignment(
              node.name,
              f.createCallExpression(node.name, undefined, []),
            );
        }
        if (ts.isIdentifier(node) && derived.has(sym(node))) {
          const p = node.parent;
          if (
            !(ts.isVariableDeclaration(p) && p.name === node) &&
            !(ts.isPropertyAccessExpression(p) && p.name === node) &&
            !(ts.isPropertyAssignment(p) && p.name === node)
          )
            return f.createCallExpression(node, undefined, []);
        }
        if (
          ts.isFunctionDeclaration(node) &&
          node.name &&
          /^[A-Z]/.test(node.name.text) &&
          node.body
        ) {
          const statements = node.body.statements;
          const split = statements.findIndex(
            (statement) =>
              ts.isIfStatement(statement) || ts.isReturnStatement(statement),
          );
          if (split >= 0) {
            const render = f.createCallExpression(
              f.createIdentifier("createMemo"),
              undefined,
              [
                f.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                  f.createBlock(
                    statements
                      .slice(split)
                      .map((statement) => ts.visitNode(statement, visit)),
                    true,
                  ),
                ),
              ],
            );
            return f.updateFunctionDeclaration(
              node,
              node.modifiers,
              node.asteriskToken,
              node.name,
              node.typeParameters,
              node.parameters,
              node.type,
              f.createBlock(
                [
                  ...statements
                    .slice(0, split)
                    .map((statement) => ts.visitNode(statement, visit)),
                  f.createVariableStatement(
                    undefined,
                    f.createVariableDeclarationList(
                      [
                        f.createVariableDeclaration(
                          "view",
                          undefined,
                          undefined,
                          render,
                        ),
                      ],
                      ts.NodeFlags.Const,
                    ),
                  ),
                  f.createReturnStatement(
                    f.createJsxFragment(
                      f.createJsxOpeningFragment(),
                      [
                        f.createJsxExpression(
                          undefined,
                          f.createCallExpression(
                            f.createIdentifier("view"),
                            undefined,
                            [],
                          ),
                        ),
                      ],
                      f.createJsxJsxClosingFragment(),
                    ),
                  ),
                ],
                true,
              ),
            );
          }
        }
        return ts.visitEachChild(node, visit, context);
      }
      return (node) => ts.visitNode(node, visit);
    },
  ]);
  fs.writeFileSync(file, printer.printFile(result.transformed[0]));
  result.dispose();
}
console.log(
  "Converted derived snapshots and conditional component returns to Solid memos.",
);
