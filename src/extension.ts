'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { blockToggle } from './block-toggle';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "ruby-around-the-block" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand('extension.rubyBlockToggle', () => {
    // https://code.visualstudio.com/docs/extensionAPI/vscode-api#TextEditor
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // No open text editor
    }

    // 1. get full text of current document
    const startLinePos = new vscode.Position(0, 0);
    const endLinePos = new vscode.Position(editor.document.lineCount, 0);
    const codeRange = new vscode.Range(startLinePos, endLinePos);
    const editorLines = editor.document.getText(codeRange).split(/\n/);

    // 2. get current line
    const currentLineNumber: number = editor.selection.active.line;

    // 3. call block toggle
    const replacementCode = blockToggle(editorLines, currentLineNumber);

    // 4. swap in block toggle replacement lines
    const replaceStartPos = new vscode.Position(replacementCode.startLineNum, 0);
    const replaceEndPos = new vscode.Position(replacementCode.endLineNum + 1, 0);
    const replaceRange = new vscode.Range(replaceStartPos, replaceEndPos);
    const replacementString = `${replacementCode.replacementLines.join('\n')}\n`;
    // https://code.visualstudio.com/docs/extensionAPI/vscode-api#TextEditorEdit
    editor.edit((editBuilder: vscode.TextEditorEdit) => {
      editBuilder.replace(replaceRange, replacementString);

      // 5. set current cursor position to first line of block
      if (replacementCode.replacementLines.length === 1) {
        var newPosition = new vscode.Position(replacementCode.startLineNum, 0);
        var newSelection = new vscode.Selection(newPosition, newPosition);
        editor.selection = newSelection;
      }
    });
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}