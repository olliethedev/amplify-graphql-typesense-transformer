import { TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import { TransformerContextProvider, TransformerSchemaVisitStepContextProvider, TransformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, ObjectTypeDefinitionNode } from 'graphql';
import { TypesenseDirectiveArgs } from './directive-args';
interface SearchableObjectTypeDefinition {
    node: ObjectTypeDefinitionNode;
    fieldName: string;
    fieldNameRaw: string;
    directiveArguments: TypesenseDirectiveArgs;
}
export declare class TypesenseTransformer extends TransformerPluginBase {
    searchableObjectTypeDefinitions: SearchableObjectTypeDefinition[];
    constructor();
    generateResolvers: (context: TransformerContextProvider) => void;
    object: (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider) => void;
    transformSchema: (ctx: TransformerTransformSchemaStepContextProvider) => void;
}
export {};
