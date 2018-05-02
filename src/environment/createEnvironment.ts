'use strict';

import * as vscode from 'vscode';
import { LocalEnvironment } from '../nuclio';
import { SettingsFile } from '../config/settingsFile';

export async function createEnvironment(): Promise<void> {

    let settingsFile = new SettingsFile();

    // Create .nuclio-vscode on the user's home if not exist
    settingsFile.createSettingsFolder();

    // Get environment details
    let name = await vscode.window.showInputBox({ prompt: 'Enter the new environment name' });
    let namespace = await vscode.window.showInputBox({ prompt: 'Enter the new environment namespace' });

    let address = await vscode.window.showInputBox({ prompt: 'Enter the new environment address' });
    if (!address.startsWith('http')) {
        address = 'http://' + address;
    }

    const newEnv = new LocalEnvironment(name, namespace, address, []);

    settingsFile.addNewEnvironment(newEnv);
}