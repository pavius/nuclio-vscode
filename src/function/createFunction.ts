'use strict';

import * as nuclio from '../nuclio';
import { writeFormattedJson } from '../utils';
import * as path from 'path';
import * as vscode from 'vscode';
import { selectFolder, NuclioQuickPickItem } from '../folderSelector';
import { ProjectFile } from '../config/projectFile';

const fse = require('fs-extra');

export async function CreateFunction(projectConfig: nuclio.LocalProject) {
    const functionPath = await selectFolder('Select the folder for the function');
    const functionYamlPath = path.join(functionPath, 'function.yaml');

    let functionName: string;
    let functionNamespace: string;

    // check if function contains yaml
    if (!await fse.pathExists(functionYamlPath)) {
        // Otherwise- create it.
        functionName = await vscode.window.showInputBox({ prompt: 'Enter the new function name' });
        functionNamespace = await vscode.window.showInputBox({ prompt: 'Enter the new function namespace' });

        const picks: NuclioQuickPickItem<FunctionRuntime | string>[] = Object.keys(FunctionRuntime)
            .map((t: string) => { return { data: FunctionRuntime[t], label: t, description: '' }; });
        const options: vscode.QuickPickOptions = { placeHolder: 'Select the runtime' };
        const runtime = await vscode.window.showQuickPick(picks, options);

        let handler: string;
        let handlerCode: string;
        let fileExtension: string;

        // TODO: fill all the missing values
        switch (runtime.data) {
            case FunctionRuntime.Go:
                handlerCode = goHandlerCode;
                fileExtension = '.go';
                handler = 'main:Handler';
                break;
            case FunctionRuntime.NetCore:
                fileExtension = '.cs';
                break;
            case FunctionRuntime.NodeJs:
                handlerCode = nodejsHandlerCode;
                fileExtension = '.js';
                break;
            case FunctionRuntime.Python27:
            case FunctionRuntime.Python36:
                handlerCode = pythonHandlerCode;
                fileExtension = '.py';
                break;
            case FunctionRuntime.Shell:
                fileExtension = '.sh';
                handlerCode = '';
                break;
            case FunctionRuntime.Java:
                handlerCode = '';
                fileExtension = '.java';
                break;
        }

        // Create .yaml file
        const yamlPath: string = path.join(functionPath, 'function.yaml');
        let data = {
            metadata: {
                name: functionName,
                namespace: functionNamespace,
            },
            spec: {
                runtime: runtime.data,
                handler: handler,
                replicas: 1,
                build: {}
            }
        };

        await writeFormattedJson(yamlPath, data);

        // Create empty handler file
        let handlerFilePath = path.join(functionPath, 'handler' + fileExtension);
        await fse.writeFile(handlerFilePath, handlerCode);
    } else {
        let functionYaml = await fse.readJson(functionYamlPath);
        functionName = functionYaml['metadata']['name'];
        functionNamespace = functionYaml['metadata']['namespace'];
    }

    // Update project config with function details
    let projectFileConfig = new ProjectFile(projectConfig.path);
    let projectData = await projectFileConfig.readFromFile();
    projectData.functions.push(new nuclio.LocalFunction(functionName, functionNamespace, functionPath));
    projectFileConfig.writeToProjectConfig(projectData);
}

export enum FunctionRuntime {
    Go = 'golang',
    Python27 = 'python:2.7',
    Python36 = 'python:3.6',
    NetCore = 'dotnetcore',
    Java = 'java',
    NodeJs = 'nodejs',
    Shell = 'shell',
}

const goHandlerCode: string = `package main

import (
    "github.com/nuclio/nuclio-sdk-go"
)

func Handler(context *nuclio.Context, event nuclio.Event) (interface{}, error) {
    return nil, nil
}`;

const pythonHandlerCode: string = `def handler(context, event):
pass`;

const nodejsHandlerCode: string = `exports.handler = function (context, event) {
};`;