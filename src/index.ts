import { Plugin, Compiler } from "webpack";
import Ajv from "ajv";
import {resolveConfig as resolvePrettierConfig } from "prettier";
import { GraphQLGenDefinition } from "graphqlgen-json-schema";
import { generateCode } from "graphqlgen";
import { parseSchema, parseModels } from "graphqlgen/dist/parse";
import { validateConfig } from "graphqlgen/dist/validation"; 
import { handleGlobPattern } from "graphqlgen/dist/glob";
import * as Project from 'graphqlgen/dist/project-output'
import AjvMetaSchema from "ajv/lib/refs/json-schema-draft-06.json";
import ValidationSchema from "graphqlgen-json-schema/dist/schema.json";

function makeError(error: string): Error {
    return new Error(`Graphqlgen-Webpack-Plugin error: ${error}`)
}

function isObject(obj: unknown): obj is object {
    return (obj && typeof obj === "object");
}

function printErrors(errors: any[]): string {
    return errors
      .map(e => {
        const params = Object.keys(e.params)
          .map(key => `${key}: ${e.params[key]}`)
          .join(', ')
        return `${e.dataPath} ${e.message}. ${params}`
      })
      .join('\n')
  }

const validateFn = new Ajv().addMetaSchema(AjvMetaSchema).compile(ValidationSchema);

function validateOptions(options: unknown): GraphQLGenDefinition {
    if (!isObject(options)) {
        throw makeError("Please provide valid graphqlgen options directly to the plugin, as an object");
    }

    if (!validateFn(options)) {
        throw makeError(`Invalid options:\n${printErrors(validateFn.errors!)}`);
    }

    return options as GraphQLGenDefinition;
}

class GraphqlgenWebpackPlugin implements Plugin {
    private options: GraphQLGenDefinition;

    constructor(options: unknown) {
        this.options = validateOptions(options);
    }

    apply(compiler: Compiler) {
        compiler.hooks.beforeCompile.tapPromise("Graphqlgen-Webpack-Plugin", async () => {
            const parsedSchema = parseSchema(this.options.schema)

            // Override the options.models.files using handleGlobPattern
            const config = {
                ...this.options,
                models: {
                    ...this.options.models,
                    files: handleGlobPattern(this.options.models.files)
                }
            };

            if (!validateConfig(config, parsedSchema)) {
                return Promise.reject();
            }

            const modelMap = parseModels(
                config.models,
                parsedSchema,
                config.output,
                config.language,
            )

            const prettifyOptions = (await resolvePrettierConfig(process.cwd())) || {} // TODO: Abstract this TS specific behavior better

            const { generatedTypes, generatedResolvers } = generateCode({
                schema: parsedSchema!,
                language: config.language,
                prettify: true,
                prettifyOptions,
                config,
                modelMap,
            });

            Project.writeTypes(generatedTypes, config);

            if (config['resolver-scaffolding']) {
                Project.writeResolversScaffolding(generatedResolvers!, config);
            }
        });
    }
}

export = GraphqlgenWebpackPlugin;