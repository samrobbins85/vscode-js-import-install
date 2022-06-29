// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const editor = vscode.window.activeTextEditor;
const acorn = require("acorn");
const walk = require("acorn-walk");
const builtinModules = require("builtin-modules");
const { rollup } = require("rollup");
const virtual = require("@rollup/plugin-virtual");

async function getPackageManager() {
  let packageManager = "npm";
  const dir = await vscode.workspace.fs.readDirectory(
    vscode.workspace.workspaceFolders[0].uri
  );
  const entries = dir.map((item) => item[0]);
  if (entries.includes("yarn.lock")) {
    packageManager = "yarn";
  }
  return packageManager;
}
// Uses rollup to generate consistent importing to make it simpler to parse
async function roll(text) {
  const out = await rollup({
    input: "entry",
    plugins: [virtual({ entry: text })],
  });
  const gen = await out.generate({ format: "cjs" });
  return gen.output[0].code;
}

async function getCurrentDependencies() {
  const doc = await vscode.workspace.openTextDocument(
    vscode.workspace.workspaceFolders[0].uri.path + "/package.json"
  );
  const json = JSON.parse(doc.getText());
  return [
    ...Object.keys(json.dependencies),
    ...Object.keys(json.devDependencies),
  ];
}

async function getInstall() {
  const text = editor.document.getText(editor.selection);
  const deps = [];
  try {
    const result = await roll(text);
    // Use acorn to find all requires and find what they're requiring
    walk.simple(acorn.parse(result, { ecmaVersion: 2020 }), {
      CallExpression(node) {
        if (node.callee.name === "require") {
          deps.push(node.arguments[0].value);
        }
      },
    });
    const currentDependencies = await getCurrentDependencies();
    const toInstall = deps.filter(
      (item) =>
        !currentDependencies.includes(item) && !builtinModules.includes(item)
    );
    const packageManager = await getPackageManager();
    const terminal = vscode.window.createTerminal("Package Installer");
    terminal.sendText(`${packageManager} install ${toInstall.join(" ")}`);
    vscode.window.showInformationMessage(`Installing ${toInstall.join(" ,")}`);
  } catch (error) {
    console.log("ERROR");
    console.error(error);
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function activate(context) {
  let importInstall = vscode.commands.registerCommand(
    "vscode-js-import-install.install",
    async function () {
      getInstall();
    }
  );
  context.subscriptions.push(importInstall);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
