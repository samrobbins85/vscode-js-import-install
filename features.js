const vscode = require("vscode");
const editor = vscode.window.activeTextEditor;

function installPackages() {
  const text = editor.document.getText(editor.selection);
  console.log("Installing");
  vscode.window.showInformationMessage(text);
}

module.exports = installPackages;
