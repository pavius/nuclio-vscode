'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as nuclio from "./nuclio";
import { NuclioTreeProvider } from './extension-tree/NuclioTreeProvider';

// TODO: This is temporay - need to refactor to support both local and cloud. 
export const dashboard = new nuclio.Dashboard("http://127.0.0.1:8070");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "nuclio" is now active!');
    
    let channel = vscode.window.createOutputChannel('Nuclio output');
    let nuclioTreeProvider = new NuclioTreeProvider();
    vscode.window.registerTreeDataProvider('nuclioTreeProvider', nuclioTreeProvider);

    vscode.commands.registerCommand('nuclioTreeProvider.refresh', ()=> nuclioTreeProvider.refresh());
    vscode.commands.registerCommand('nuclioTreeProvider.invokeFunction', async (func)=> {
        try {
            let invokeResult = await dashboard.invokeFunction(func.functionConfig.metadata, {method: 'get'});
            vscode.window.showInformationMessage("Invoked function succesfully: see output channel for results" );
            channel.append(JSON.stringify(invokeResult));
        } catch (e) {
            vscode.window.showErrorMessage(e.message);
        }
    });    
}

// this method is called when your extension is deactivated
export function deactivate() {
}