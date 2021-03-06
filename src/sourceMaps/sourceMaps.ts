/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import {SourceMap, MappedPosition, ISourcePathDetails} from './sourceMap';
import {getMapForGeneratedPath} from './sourceMapFactory';
import {ISourceMapPathOverrides} from '../debugAdapterInterfaces';

export class SourceMaps {
    // Maps absolute paths to generated/authored source files to their corresponding SourceMap object
    private _generatedPathToSourceMap = new Map<string, SourceMap>();
    private _authoredPathToSourceMap = new Map<string, SourceMap>();

    // Path to resolve / paths against
    private _webRoot: string;

    private _sourceMapPathOverrides: ISourceMapPathOverrides;

    public constructor(webRoot?: string, sourceMapPathOverrides?: ISourceMapPathOverrides) {
        this._webRoot = webRoot;
        this._sourceMapPathOverrides = sourceMapPathOverrides;
    }

    /**
     * Returns the generated script path for an authored source path
     * @param pathToSource - The absolute path to the authored file
     */
    public getGeneratedPathFromAuthoredPath(authoredPath: string): string {
        authoredPath = authoredPath.toLowerCase();
        return this._authoredPathToSourceMap.has(authoredPath) ?
            this._authoredPathToSourceMap.get(authoredPath).generatedPath() :
            null;
    }

    public mapToGenerated(authoredPath: string, line: number, column: number): MappedPosition {
        authoredPath = authoredPath.toLowerCase();
        return this._authoredPathToSourceMap.has(authoredPath) ?
            this._authoredPathToSourceMap.get(authoredPath)
                .generatedPositionFor(authoredPath, line, column) :
            null;
    }

    public mapToAuthored(pathToGenerated: string, line: number, column: number): MappedPosition {
        pathToGenerated = pathToGenerated.toLowerCase();
        return this._generatedPathToSourceMap.has(pathToGenerated) ?
            this._generatedPathToSourceMap.get(pathToGenerated)
                .authoredPositionFor(line, column) :
            null;
    }

    public allMappedSources(pathToGenerated: string): string[] {
        pathToGenerated = pathToGenerated.toLowerCase();
        return this._generatedPathToSourceMap.has(pathToGenerated) ?
            this._generatedPathToSourceMap.get(pathToGenerated).authoredSources :
            null;
    }

    public allSourcePathDetails(pathToGenerated: string): ISourcePathDetails[] {
        pathToGenerated = pathToGenerated.toLowerCase();
        return this._generatedPathToSourceMap.has(pathToGenerated) ?
            this._generatedPathToSourceMap.get(pathToGenerated).allSourcePathDetails :
            null;
    }

    public sourceContentFor(authoredPath: string): string {
        authoredPath = authoredPath.toLowerCase();
        return this._authoredPathToSourceMap.has(authoredPath) ?
            this._authoredPathToSourceMap.get(authoredPath)
                .sourceContentFor(authoredPath) :
            null;
    }

    /**
     * Given a new path to a new script file, finds and loads the sourcemap for that file
     */
    public processNewSourceMap(pathToGenerated: string, sourceMapURL: string): Promise<void> {
        return this._generatedPathToSourceMap.has(pathToGenerated.toLowerCase()) ?
            Promise.resolve() :
            getMapForGeneratedPath(pathToGenerated, sourceMapURL, this._webRoot, this._sourceMapPathOverrides).then(sourceMap => {
                if (sourceMap) {
                    this._generatedPathToSourceMap.set(pathToGenerated.toLowerCase(), sourceMap);
                    sourceMap.authoredSources.forEach(authoredSource => this._authoredPathToSourceMap.set(authoredSource.toLowerCase(), sourceMap));
                }
            });
    }
}
