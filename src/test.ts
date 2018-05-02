/*
Copyright 2017 The Nuclio Authors.

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as nuclio from './nuclio';

class Test {

    static async deployFunctionAndCleanup() {
        const dashboard = new nuclio.Dashboard('http://127.0.0.1:8070');
        
        console.log('Creating project');

        const projectConfig = new nuclio.ProjectConfig();
        projectConfig.metadata.name = 'ts-project';
        projectConfig.metadata.namespace = 'nuclio';
        projectConfig.spec.description = 'some description';
        projectConfig.spec.displayName = 'Typescript project';

        await dashboard.createProject(projectConfig);

        // get all projects
        let projects = await dashboard.getProjects({namespace: projectConfig.metadata.namespace});
        console.log('Got all projects: ' + JSON.stringify(projects));

        // get project by name
        projects = await dashboard.getProjects({
            namespace: projectConfig.metadata.namespace, 
            name: projectConfig.metadata.name
        });

        console.log('Got one project: ' + JSON.stringify(projects));
        
        console.log('Creating function');

        const functionConfig = new nuclio.FunctionConfig();
        functionConfig.metadata.name = 'ts';
        functionConfig.metadata.namespace = 'nuclio';
        functionConfig.spec.replicas = 1;
        functionConfig.spec.runtime = 'golang';
        functionConfig.spec.build.functionSourceCode = 'CnBhY2thZ2UgbWFpbgoKaW1wb3J0ICgKCSJnaXRodWIuY29tL251Y2xpby9udWNsaW8tc2RrLWdvIgopCgpmdW5jIEhhbmRsZXIoY29udGV4dCAqbnVjbGlvLkNvbnRleHQsIGV2ZW50IG51Y2xpby5FdmVudCkgKGludGVyZmFjZXt9LCBlcnJvcikgewoJY29udGV4dC5Mb2dnZXIuSW5mbygiVGhpcyBpcyBhbiB1bnN0cnVjdXJlZCAlcyIsICJsb2ciKQoKCXJldHVybiBudWNsaW8uUmVzcG9uc2V7CgkJU3RhdHVzQ29kZTogIDIwMCwKCQlDb250ZW50VHlwZTogImFwcGxpY2F0aW9uL3RleHQiLAoJCUJvZHk6ICAgICAgICBbXWJ5dGUoIkhlbGxvLCBmcm9tIG51Y2xpbyA6XSIpLAoJfSwgbmlsCn0=';
        functionConfig.spec.handler = 'main:Handler';

        // create the function. will return once the function is ready
        const createdFunction = await dashboard.createFunction(projectConfig.metadata.name, functionConfig);
        console.log('Deployed successfully @ ' + createdFunction.status.httpPort);

        // get all functions
        let functionConfigs = await dashboard.getFunctions({namespace: functionConfig.metadata.namespace});
        console.log('Got all functions:\n' + JSON.stringify(functionConfigs, null, '\t'));

        // get one function
        functionConfigs = await dashboard.getFunctions({
            namespace: functionConfig.metadata.namespace, 
            name: functionConfig.metadata.name,
        });

        console.log('Got one function:\n' + JSON.stringify(functionConfigs, null, '\t'));
        
        // get function by project
        functionConfigs = await dashboard.getFunctions({
            namespace: functionConfig.metadata.namespace, 
            projectName: projectConfig.metadata.name,
        });

        console.log('Got function by project:\n' + JSON.stringify(functionConfigs, null, '\t'));

        // wait a bit - function may be ready but k8s service might not (nuclio limitation)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // invoke the function
        try {
            let invokeResult = await dashboard.invokeFunction(functionConfig.metadata, {method: 'get'});
            console.log('Invoked function: ' + JSON.stringify(invokeResult));
        } catch (e) {
            console.log('Failed to invoke function');
        }

        // delete the function
        await dashboard.deleteFunction(createdFunction.metadata);
        console.log('Deleted function');

        // delete project
        await dashboard.deleteProject(projectConfig.metadata);
        console.log('Deleted project');

        // get all functions again
        functionConfigs = await dashboard.getFunctions({namespace: functionConfig.metadata.namespace});
        console.log('Got all functions:\n' + JSON.stringify(functionConfigs, null, '\t'));
    }

    public static main(): number {
        this.deployFunctionAndCleanup().then(() => {
            console.log('Done');
        });

        return 0;
    }
}

Test.main();
