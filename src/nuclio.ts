/*
Copyright 2017 The Nuclio Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import axios from 'axios';

export interface IPlatform {

    // create a single  function given a configuration
    createProject(projectConfig: ProjectConfig);

    // get a set of projects matching a filter
    getProjects(filter: IProjectFilter): Promise<ProjectConfig[]>;

    // delete a project
    deleteProject(projectID: IResourceIdentifier);

    // create a single  function given a configuration
    createFunction(projectName: string, functionConfig: FunctionConfig): Promise<FunctionConfig>;

    // invoke a function
    invokeFunction(id: IResourceIdentifier, options: IInvokeOptions): Promise<InvokeResult>;

    // get a set of functions matching a filter
    getFunctions(filter: IFunctionFilter): Promise<FunctionConfig[]>;

    // delete a function
    deleteFunction(id: IResourceIdentifier);
}

export class ResourceMeta {
    name: string
    namespace: string
    labels: {[key: string]: string}
    annotations: {[key: string]: string}
}

export class ProjectSpec {
    displayName: string;
    description: string;
}

export class ProjectConfig {
    metadata: ResourceMeta;
    spec: ProjectSpec;

    constructor() {
        this.metadata = new ResourceMeta();
        this.spec = new ProjectSpec();
    }
}

export interface IInvokeOptions {
    method: string;
    logLevel?: string;
    path?: string;
    headers?: {[key: string]:any};
    body?: any;
    via?: string;
}

export class InvokeResult {
    statusCode: number;
    headers: {[key: string]:any};
    body: any;
}

export interface IResourceIdentifier {
    namespace: string
    name?: string
}

export interface IProjectFilter extends IResourceIdentifier {}

export interface IFunctionFilter extends IResourceIdentifier {
    projectName?: string;
}

export class Env {
    name: string;
    value: string;
}

export class DataBinding {
    name: string;
    class: string;
    kind: string;
    url: string;
    path: string;
    query: string;
    secret: string;
    attributes: any;
}

export class Trigger {
    class: string;
    kind: string;
    disabled: boolean;
    maxWorkers: number;
    url: string;
    paths: string[];
    numPartitions: number;
    user: string;
    secret: string;
    attributes: any;
}

export class Build {
    path: string;
    functionSourceCode: string;
    functionConfigPath: string;
    tempDir: string;
    registry: string;
    image: string;
    noBaseImagePull: boolean;
    noCache: boolean;
    noCleanup: boolean;
    baseImage: string;
    commands: string[];
    scriptPaths: string[];
    addedObjectPaths: {[localPath: string]: string};
}

export class FunctionSpec {
    description: string;
    disabled: boolean;
    handler: string;
    runtime; string;
    env: Env[];
    image: string;
    imageHash: string;
    replicas: number;
    minReplicas: number;
    maxReplicas: number;
    dataBindings: {[name: string]: DataBinding};
    triggers: {[name: string]: Trigger};
    build: Build;
    runRegistry: string;
    runtimeAttributes: any;

    constructor() {
        this.build = new Build();
    }
}

export class FunctionStatus {
    state: string;
    message: string;
    httpPort: number;
}

export class FunctionConfig {
    metadata: ResourceMeta;
    spec: FunctionSpec;
    status: FunctionStatus;

    constructor() {
        this.metadata = new ResourceMeta();
        this.spec = new FunctionSpec();
        this.status = new FunctionStatus();
    }
}

export class Dashboard implements IPlatform{
    public url: string;
    
    constructor(url: string) {
        this.url = url;
    }

    // create a single  function given a configuration
    async createProject(projectConfig: ProjectConfig) {
        const body = JSON.stringify(projectConfig);

        // create function by posting function config
        await axios.post(this.url + "/projects", body)
    }

    // get a set of projects matching a filter
    async getProjects(filter: IProjectFilter): Promise<ProjectConfig[]> {
        return await this.getResources(filter, "project", ProjectConfig)
    }

    // delete a project
    async deleteProject(id: IResourceIdentifier) {
        return this.deleteResource(id, "project", ProjectConfig)
    }
    
    async createFunction(projectName: string, functionConfig: FunctionConfig): Promise<FunctionConfig> {
        const body = JSON.stringify(functionConfig);

        // create labels if not created
        functionConfig.metadata.labels = functionConfig.metadata.labels ? functionConfig.metadata.labels : {};
        functionConfig.metadata.labels["nuclio.io/project-name"] = projectName;
        
        // create function by posting function config
        const response = await axios.post(this.url + "/functions", body)

        const retryIntervalMs = 1000;
        const maxRetries = 60;

        // poll for retryIntervalMs * maxRetries
        for (let retryIdx = 0; retryIdx < maxRetries; retryIdx++) {
            let createdFunctionConfig: FunctionConfig[];

            try {

                // try to get functions. this can fail in the local platform, as it may return 404 at this point
                createdFunctionConfig = await this.getFunctions({
                    name: functionConfig.metadata.name, 
                    namespace: functionConfig.metadata.namespace
                });
            } catch (e) {
                createdFunctionConfig = [];
            }

            // if we got a function
            if (createdFunctionConfig.length) {
                
                // if the function is ready, we're done
                if (createdFunctionConfig[0].status.state == "ready") {
                    return createdFunctionConfig[0];
                }

                // if the function is in error state, explode
                if (createdFunctionConfig[0].status.state == "error") {
                    throw new Error("Creation failed: " + createdFunctionConfig[0].status.message);
                }
            }

            // wait a bit
            await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        }
    }

    async invokeFunction(id: IResourceIdentifier, options: IInvokeOptions): Promise<InvokeResult> {
        
        // name must be passed
        if (id.name === undefined) {
            throw new Error("Function name must be specified in invoke");
        }
        
        // get headers from options or create a new object
        const headers = options.headers ? options.headers : {};
        headers["x-nuclio-function-name"] = id.name;
        headers["x-nuclio-function-namespace"] = id.namespace;
        headers["x-nuclio-invoke-via"] = options.via ? options.via : "external-ip";
        
        if (options.path !== undefined) {
            headers["x-nuclio-path"] = options.path;
        }

        let response: any;
        const url = this.url + "/function_invocations"
        const axiosMethod = axios[options.method]

        // invoke the function by calling the appropraite method on function_invocations
        if (['post', 'put', 'path'].indexOf(options.method) > -1) {
            response = await axiosMethod(url, options.body, {headers: headers})
        } else {
            response = await axiosMethod(url, {headers: headers})
        }
        
        const invokeResult = new InvokeResult();
        invokeResult.statusCode = response.status;
        invokeResult.headers = response.headers;
        invokeResult.body = response.data;

        return invokeResult;
    }

    // get a set of functions matching a filter
    async getFunctions(filter: IFunctionFilter): Promise<FunctionConfig[]> {
        let headers = {}
        
        // set project name filter
        if (filter.projectName !== undefined) {
            headers["x-nuclio-project-name"] = filter.projectName;
        }
        
        return await this.getResources(filter, "function", FunctionConfig, headers)
    }

    // delete functions
    async deleteFunction(id: IFunctionFilter) {
        return this.deleteResource(id, "function", FunctionConfig)
    }

    // get resources
    async getResources(filter: IResourceIdentifier, resourceName: string, resourceClass: any, headers?: any): Promise<any> {

        // headers will filter namespace
        headers = headers ? headers : {}
        headers["x-nuclio-" + resourceName + "-namespace"] = filter.namespace;

        // url is resource name (plural)
        let path = "/" + resourceName + "s"

        if (filter.name !== undefined) {
            path += "/" + filter.name
        }
        
        const resources = [];
        let responseResources = {};

        // get functions, filtered by the filter
        let response = await axios.get(this.url + path, {headers: headers})

        // if name was passed, we get a single entity. wrap it in an array to normalize it
        if (filter.name !== undefined) {
            responseResources["single"] = response.data
        } else {
            responseResources = response.data
        }

        // iterate over response which is {resourceName: resourceConfig} and create the appropriate object
        for (const resourceName in responseResources) {
            let resource = new resourceClass();

            // assign the object
            Object.assign(resource, responseResources[resourceName]);

            resources.push(resource);
        }

        return resources;
    }

    // delete functions
    async deleteResource(id: IResourceIdentifier, resourceName: string, resourceClass: any) {
        
        // name must be passed
        if (id.name === undefined) {
            throw new Error("Resource name must be specified in delete");
        }
        
        let resource = new resourceClass();
        resource.metadata.name = id.name;
        resource.metadata.namespace = id.namespace;
        
        // delete the function
        await axios.delete(this.url + "/" + resourceName + "s", {data: JSON.stringify(resource)});
    }
}
