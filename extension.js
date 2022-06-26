// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
var babel = require("@babel/core");
const editor = vscode.window.activeTextEditor;
const commonjs = require("@babel/plugin-transform-modules-commonjs");
// const typescript = require("@babel/plugin-transform-typescript");
const acorn = require("acorn");
const walk = require("acorn-walk");
import { rollup } from "rollup";
import virtual from "@rollup/plugin-virtual";
async function getInstall() {
  const text = editor.document.getText(editor.selection);
  const deps = [];
  try {
    const out = await rollup({
      input: "entry",
      plugins: [virtual({ entry: text })],
    });
    const gen = await out.generate({ format: "cjs" });
    const result = gen.output[0].code;
    console.log(acorn.parse(result));
    walk.simple(acorn.parse(result), {
      CallExpression(node) {
        if (node.callee.name === "require") {
          deps.push(node.arguments[0].value);
        }
      },
    });
    console.log(result.code);
  } catch (error) {
    console.log("ERROR");
    console.error(error);
  }
  vscode.window.showInformationMessage(deps.toString());
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-js-import-install" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "vscode-js-import-install.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from vscode-js-import-install!"
      );
      try {
        const terminal = vscode.window.createTerminal("Created Terminal");
        terminal.sendText("touch leavemehere.txt");
      } catch (error) {
        console.log(error);
      }
    }
  );

  let importInstall = vscode.commands.registerCommand(
    "vscode-js-import-install.install",
    function () {
      getInstall();
    }
  );
  context.subscriptions.push(importInstall);
  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
