const { createMacro, MacroError } = require('babel-plugin-macros');
const pkgName = 'debug.macro';
const debug = require('debug')(pkgName);
const pkgDir = require('pkg-dir');
const path = require('path');
const template = require('@babel/template').default;

const debugMacro = ({ references, state, babel }) => {
  debug('Initial state:', state);

  // Utilities to help with ast construction
  const t = babel.types;
  // Complete source code if file
  const { code } = state.file;
  const refKeys = Object.keys(references);
  const invalidRefKeys = refKeys.filter(key => key !== 'default');

  if (invalidRefKeys.length > 0) {
    throw new MacroError(
      `Invalid import from ${pkgName}: ${invalidRefKeys.join(', ')}`
    );
  }

  const refs = references.default;

  // Find the fileName to use in debug invocation
  let debugScope = state.filename;
  if (debugScope) {
    const rootDir = pkgDir.sync(debugScope);
    debugScope = [
      path.basename(rootDir),
      ...path
        .relative(rootDir, debugScope)
        .split(path.sep)
        .map(p => p.split('.')[0]),
    ].join(':');
  } else {
    debugScope = 'unknown-module';
  }

  // Print well formatted errors
  const failWith = (errCode, node, message) => {
    if (node.loc) console.log(codeFrameColumns(code, node.loc, { message }));
    const error = new Error(`ERR${errCode}: ${message}`);
    error.code = `ERR${errCode}`;
    throw error;
  };

  // Inject debug import:
  const importedId = state.file.path.scope.generateUidIdentifier('debug');
  const assignedId = state.file.path.scope.generateUidIdentifier('debug');

  state.file.path.node.body.unshift(
    t.ImportDeclaration(
      [t.importNamespaceSpecifier(importedId)],
      t.stringLiteral('debug')
    ),
    template(`const %%assignedId%% = %%importedId%%(%%debugScope%%)`)({
      assignedId,
      importedId,
      debugScope: t.stringLiteral(debugScope),
    })
  );

  const stringifyArg = arg => {
    if (t.isIdentifier(arg)) return arg.name;
    else if (t.isMemberExpression(arg)) {
      if (t.isIdentifier(arg.property)) {
        return `${stringifyArg(arg.object)}.${arg.property.name}`;
      } else if (t.isStringLiteral(arg.property)) {
        return `${stringifyArg(arg.object)}[${arg.property.value}]`;
      }
    }
    failWith(
      2,
      arg,
      'Unsupported expresssion pattern, only identifiers and simple member expressions are supported'
    );
  };

  const getLineStartLiteral = node =>
    t.stringLiteral(`[L${node.loc.start.line}]`);

  const declarationVisitor = {
    VariableDeclaration(declPath) {
      const parentPath = declPath.findParent(() => true);
      const idx = parentPath.node.body.indexOf(declPath.node);
      const args = [];
      declPath.node.declarations.forEach(declarator => {
        args.push(t.stringLiteral(`${declarator.id.name} :`));
        args.push(declarator.id);
      });
      parentPath.node.body.splice(
        idx + 1,
        0,
        t.callExpression(assignedId, args)
      );
    },
    AssignmentExpression(assPath) {
      const exprPath = assPath.findParent(p => p.node.expression === assPath.node);
      const parentPath = assPath.findParent((p) => p.node.body);
      const idx = parentPath.node.body.indexOf(exprPath.node);
      parentPath.node.body.splice(
        idx + 1,
        0,
        t.callExpression(assignedId, [
          t.stringLiteral(`${assPath.node.left.name} :`),
          assPath.node.left,
        ])
      );
    },
  };

  const processReference = nodePath => {
    let parentPath = nodePath.findParent(() => true);
    if (parentPath.isCallExpression()) {
      parentPath.node.arguments.unshift(getLineStartLiteral(parentPath.node));
    } else if (
      parentPath.isMemberExpression() &&
      parentPath.node.object === nodePath.node
    ) {
      switch (parentPath.node.property.name) {
        case 'vars':
        case 'var':
          const nextParentPath = parentPath.findParent(() => true);
          if (!nextParentPath.isCallExpression()) {
            failWith(
              1,
              parentPath.node,
              `Expected ${nodePath.node.name}.${parentPath.node.property.name} to be invoked like a function`
            );
          }
          const args = nextParentPath.node.arguments;
          const newArgs = [getLineStartLiteral(nextParentPath.node)];
          for (const arg of args) {
            newArgs.push(t.stringLiteral(`${stringifyArg(arg)} :`), arg);
          }
          nextParentPath.replaceWith(t.callExpression(assignedId, newArgs));
          break;
        case 'allInScope':
          const bodyParentPath = parentPath.findParent(p => p.node.body);
          if (bodyParentPath) {
            bodyParentPath.traverse(declarationVisitor);
          }
          break;
        case 'all':
          state.file.path.traverse(declarationVisitor);
      }
    }
  };

  for (let i = 0; i < refs.length; i++) {
    const nodePath = refs[i];
    processReference(nodePath);
  }
};

module.exports = createMacro(debugMacro);
