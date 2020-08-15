import { createMacro, MacroError } from 'babel-plugin-macros';
import * as t from '@babel/types';
import _debug from 'debug';
import pkgDir from 'pkg-dir';
import path from 'path';
import template from '@babel/template';
import { codeFrameColumns } from '@babel/code-frame';
import { NodePath } from '@babel/core';

const pkgName = 'debug.macro';
const debug = _debug(pkgName);

export default createMacro(function debugMacro({ references, state }) {
  debug('Initial state:', state);

  // Complete source code of file
  const { code } = state.file;
  const refKeys = Object.keys(references);

  validateImport();

  // All the references where the default imoprt is getting used
  const refs = references.default;
  const debugScope = deriveDebugScope();

  const { assignedId } = injectDebugImports();

  // Process references
  for (let i = 0; i < refs.length; i++) {
    const nodePath = refs[i];
    processReference(nodePath);
  }

  // Functions:

  // Enforce usage through default import
  function validateImport() {
    const invalidRefKeys = refKeys.filter(key => key !== 'default');
    if (invalidRefKeys.length > 0) {
      throw new MacroError(
        `Invalid import from ${pkgName}: ${invalidRefKeys.join(', ')}`
      );
    }
  }

  // Find the fileName to use in debug invocation
  function deriveDebugScope() {
    let debugScope = state.filename;
    if (debugScope) {
      const rootDir = pkgDir.sync(debugScope);
      if (rootDir) {
        debugScope = [
          path.basename(rootDir),
          ...path
            .relative(rootDir, debugScope)
            .split(path.sep)
            .map(p => p.split('.')[0]),
        ].join(':');
      }
    } else {
      debugScope = 'unknown-module';
    }
    return debugScope;
  }

  function injectDebugImports() {
    const importedId = state.file.path.scope.generateUidIdentifier('debug');
    const assignedId = state.file.path.scope.generateUidIdentifier('debug');

    (state.file.path.node as t.Program).body.unshift(
      t.importDeclaration(
        [t.importNamespaceSpecifier(importedId)],
        t.stringLiteral('debug')
      ),
      (template(`const %%assignedId%% = %%importedId%%(%%debugScope%%)`)({
        assignedId,
        importedId,
        debugScope: t.stringLiteral(debugScope),
      }) as t.Statement)
    );

    return {
      importedId,
      assignedId
    }
  }

  // Print well formatted errors
  function failWith(node: t.Node, message: string) {
    if (node.loc) console.log(codeFrameColumns(code, node.loc, { message }));
    return new Error(message);
  };

  function getLogPrefix(node: t.Node) {
    return [
      getDateLiteral(node),
      getLineStartLiteral(node)
    ];
  }

  function getLineStartLiteral(node: t.Node) {
    return t.stringLiteral(`[L:${node.loc?.start.line ?? '?'}]`);
  }

  function getDateLiteral(node: t.Node) {
    return t.templateLiteral([
      t.templateElement({ raw: '[@:', cooked: '[@:' }),
      t.templateElement({ raw: ']', cooked: ']' }, true)
    ], [
      t.callExpression(
        t.memberExpression(t.identifier('Date'), t.identifier('now')),
        []
      )
    ]);
  }

  function processReference(nodePath: NodePath<t.Node>) {
    let parentPath = nodePath.findParent(() => true);
    if (parentPath.isCallExpression()) {
      parentPath.node.arguments.unshift(...getLogPrefix(parentPath.node));
    } else if (
      parentPath.isMemberExpression() &&
      parentPath.node.object === nodePath.node
    ) {
      const parentNode = parentPath.node as t.MemberExpression;
      switch (parentNode.property.name) {
        case 'vars':
        case 'var':
          const nextParentPath = parentPath.findParent(() => true);
          if (!nextParentPath.isCallExpression()) {
            throw failWith(
              parentNode,
              `Expected ${(parentNode.object as t.Identifier).name}.${parentNode.property.name} to be invoked like a function`
            );
          }
          const nextParentNode = nextParentPath.node as t.CallExpression;
          const args = nextParentNode.arguments;
          const newArgs: Array<t.Expression | t.SpreadElement | t.JSXNamespacedName | t.ArgumentPlaceholder> = getLogPrefix(nextParentNode);
          for (const arg of args) {
            newArgs.push(t.stringLiteral(`${stringifyArg(arg)} :`), arg);
          }
          nextParentPath.replaceWith(t.callExpression(assignedId, newArgs));
          break;
        case 'allInScope':
          const bodyParentPath = findBodyParent(parentPath)
          if (bodyParentPath) {
            bodyParentPath.traverse(getDeclarationVisitor());
          }
          break;
        case 'all':
          state.file.path.traverse(getDeclarationVisitor());
      }
    }
  }

  function stringifyArg(arg: Arg): string {
    if (t.isIdentifier(arg)) return arg.name;
    else if (t.isMemberExpression(arg)) {
      if (t.isIdentifier(arg.property)) {
        return `${stringifyArg(arg.object)}.${arg.property.name}`;
      } else if (t.isStringLiteral(arg.property)) {
        return `${stringifyArg(arg.object)}[${arg.property.value}]`;
      }
    }
    throw failWith(
      arg,
      'Unsupported expresssion pattern, only identifiers and simple member expressions are supported'
    );
  };

  function getDeclarationVisitor() {
    return {
      VariableDeclaration(declPath: NodePath<t.VariableDeclaration>) {
        const parentPath = declPath.findParent(() => true);
        const parentNode = parentPath.node as (t.Program | t.BlockStatement)
        const idx = parentNode.body.indexOf(declPath.node);
        const args: Arg[] = getLogPrefix(parentNode);
        let couldProcess = true;
        declPath.node.declarations.forEach(declarator => {
          const { id } = declarator;
          if (t.isIdentifier(id)) {
            args.push(t.stringLiteral(`${id.name} :`));
            args.push(id);
          } else {
            couldProcess = false;
          }
        });
        if (couldProcess) {
          parentNode.body.splice(
            idx + 1,
            0,
            t.expressionStatement(t.callExpression(assignedId, args))
          );
        }
      },
      AssignmentExpression(assPath: NodePath<t.AssignmentExpression>) {
        const exprPath = assPath.findParent(p => (p.node as any).expression === assPath.node);
        const parentPath = findBodyParent(assPath)!;
        const idx = parentPath.node.body.indexOf(exprPath.node);
        const assignee = assPath.node.left;
        if (t.isIdentifier(assignee)) {
          parentPath.node.body.splice(
            idx + 1,
            0,
            t.callExpression(assignedId, [
              ...getLogPrefix(parentPath.node),
              t.stringLiteral(`${assignee.name} :`),
              assignee
            ])
          );
        }
      },
    };
  }

});

type Arg = t.Expression | t.SpreadElement | t.JSXNamespacedName | t.ArgumentPlaceholder;

// Fix to handle cases when body is a statement and not a block statement
function findBodyParent(nodePath: NodePath<any>) {
  return nodePath.findParent(p => (p.node as any).body) as NodePath<t.Node & { body: t.Statement[] }> | null;
}
