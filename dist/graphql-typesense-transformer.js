"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypesenseTransformer = void 0;
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const aws_appsync_1 = require("aws-cdk-lib/aws-appsync");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const graphql_transformer_common_1 = require("graphql-transformer-common");
const create_cfnParameters_1 = require("./cdk/create-cfnParameters");
const create_layer_cfnMapping_1 = require("./cdk/create-layer-cfnMapping");
const create_streaming_lambda_1 = require("./cdk/create-streaming-lambda");
const STACK_NAME = 'TypesenseStack';
const directiveName = "typesense";
const RESPONSE_MAPPING_TEMPLATE = `
#if( $ctx.error )
  $util.error($ctx.error.message, $ctx.error.type)
#else
  $ctx.result
#end
`;
class TypesenseTransformer extends graphql_transformer_core_1.TransformerPluginBase {
    constructor() {
        super('amplify-graphql-typesense-transformer', 
        /* GraphQL */ `
        directive @${directiveName}(fields: FieldList, settings: AWSJSON) on OBJECT
        input FieldList {
          include: [String]
          exclude: [String]
        }
      `);
        this.generateResolvers = (context) => {
            const { Env } = graphql_transformer_common_1.ResourceConstants.PARAMETERS;
            const { HasEnvironmentParameter } = graphql_transformer_common_1.ResourceConstants.CONDITIONS;
            console.log({ STACK_NAME });
            const stack = context.stackManager.createStack(STACK_NAME);
            console.log(stack);
            (0, create_layer_cfnMapping_1.setMappings)(stack);
            createCondition(stack, context, Env, HasEnvironmentParameter);
            stack.templateOptions.description = 'An auto-generated nested stack for typesense.';
            stack.templateOptions.templateFormatVersion = '2010-09-09';
            const { defaultFieldParams, defaultSettingsParams } = createParametersMap(this.searchableObjectTypeDefinitions);
            console.log({ searchableObjectTypeDefinitions: this.searchableObjectTypeDefinitions, defaultFieldParams, defaultSettingsParams });
            console.log("before createParametersInStack");
            const parameterMap = (0, create_cfnParameters_1.createParametersStack)(stack.node.scope, defaultFieldParams, defaultSettingsParams);
            console.log("after createParametersInStack");
            const lambdaRole = (0, create_streaming_lambda_1.createLambdaRole)(context, stack, parameterMap);
            const lambda = (0, create_streaming_lambda_1.createLambda)(stack, context.api, parameterMap, lambdaRole);
            const dataSource = context.api.host.addLambdaDataSource(`searchResolverDataSource`, lambda, {}, stack);
            createSourceMappings(this.searchableObjectTypeDefinitions, context, lambda, dataSource);
        };
        this.object = (definition, directive, ctx) => {
            validateModelDirective(definition);
            const directiveArguments = getDirectiveArguments(directive);
            const fieldName = (0, graphql_transformer_common_1.graphqlName)(`search${(0, graphql_transformer_common_1.plurality)((0, graphql_transformer_common_1.toUpper)(definition.name.value), true)}`);
            this.searchableObjectTypeDefinitions.push({
                node: definition,
                fieldName,
                fieldNameRaw: definition.name.value,
                directiveArguments,
            });
        };
        this.transformSchema = (ctx) => {
            const fields = [];
            for (const model of this.searchableObjectTypeDefinitions) {
                fields.push((0, graphql_transformer_common_1.makeField)(model.fieldName, [(0, graphql_transformer_common_1.makeInputValueDefinition)("query", (0, graphql_transformer_common_1.makeNonNullType)((0, graphql_transformer_common_1.makeNamedType)("String"))),
                    (0, graphql_transformer_common_1.makeInputValueDefinition)("field", (0, graphql_transformer_common_1.makeNonNullType)((0, graphql_transformer_common_1.makeNamedType)("String"))),
                    (0, graphql_transformer_common_1.makeInputValueDefinition)("filter", (0, graphql_transformer_common_1.makeNamedType)("String")),
                    (0, graphql_transformer_common_1.makeInputValueDefinition)("sort", (0, graphql_transformer_common_1.makeNamedType)("String")),], (0, graphql_transformer_common_1.makeNamedType)("AWSJSON")));
            }
            ctx.output.addQueryFields(fields);
        };
        this.searchableObjectTypeDefinitions = [];
    }
}
exports.TypesenseTransformer = TypesenseTransformer;
const createCondition = (stack, context, Env, HasEnvironmentParameter) => {
    const envParam = context.stackManager.getParameter(Env);
    new aws_cdk_lib_1.CfnCondition(stack, HasEnvironmentParameter, {
        expression: aws_cdk_lib_1.Fn.conditionNot(aws_cdk_lib_1.Fn.conditionEquals(envParam, graphql_transformer_common_1.ResourceConstants.NONE)),
    });
};
const createParametersMap = (searchableObjectTypeDefinitions) => {
    const defaultFieldParams = searchableObjectTypeDefinitions.reduce((acc, { fieldNameRaw, directiveArguments }) => {
        return { [fieldNameRaw]: directiveArguments.fields, ...acc };
    }, {});
    const defaultSettingsParams = searchableObjectTypeDefinitions.reduce((acc, { fieldNameRaw, directiveArguments }) => {
        return { [fieldNameRaw]: directiveArguments.settings, ...acc };
    }, {});
    return { defaultFieldParams, defaultSettingsParams };
};
const validateModelDirective = (object) => {
    const modelDirective = object.directives.find((dir) => dir.name.value === "model");
    if (!modelDirective) {
        throw new graphql_transformer_core_1.InvalidDirectiveError(`Types annotated with @${directiveName} must also be annotated with @model.`);
    }
};
const getTable = (context, definition) => {
    const ddbDataSource = context.dataSources.get(definition);
    const tableName = graphql_transformer_common_1.ModelResourceIDs.ModelTableResourceID(definition.name.value);
    const table = ddbDataSource.ds.stack.node.findChild(tableName);
    return { table, tableConfig: ddbDataSource.ds.dynamoDbConfig };
};
const getDirectiveArguments = (directive) => {
    const directiveWrapped = new graphql_transformer_core_1.DirectiveWrapper(directive);
    return directiveWrapped.getArguments({
        fields: undefined,
        settings: undefined,
    });
};
const createSourceMappings = (searchableObjectTypeDefinitions, context, lambda, lambdaDataSource) => {
    const stack = context.stackManager.getStack(STACK_NAME);
    for (const def of searchableObjectTypeDefinitions) {
        const type = def.node.name.value;
        const openSearchIndexName = context.resourceHelper.getModelNameMapping(type);
        const tableData = getTable(context, def.node);
        const ddbTable = tableData.table;
        if (!ddbTable) {
            throw new Error('Failed to find ddb table for searchable');
        }
        ddbTable.grantStreamRead(lambda.role);
        if (!ddbTable.tableStreamArn) {
            throw new Error('tableStreamArn is required on ddb table ot create event source mappings');
        }
        (0, create_streaming_lambda_1.createEventSourceMapping)(stack, openSearchIndexName, lambda, ddbTable.tableStreamArn);
        const resolver = new aws_appsync_1.CfnResolver(stack, `${def.fieldNameRaw}SearchResolver`, {
            apiId: context.api.apiId,
            fieldName: def.fieldName,
            typeName: "Query",
            kind: "UNIT",
            dataSourceName: lambdaDataSource === null || lambdaDataSource === void 0 ? void 0 : lambdaDataSource.ds.attrName,
            requestMappingTemplate: getRequestMappingTemplate(tableData.tableConfig.tableName),
            responseMappingTemplate: RESPONSE_MAPPING_TEMPLATE,
        });
        context.api.addSchemaDependency(resolver);
    }
};
const getRequestMappingTemplate = (tableName) => `
$util.toJson({ "version": "2018-05-29", "operation": "Invoke", "payload": $util.toJson({ "typeName": "Query", "tableName": "${tableName}", "arguments": $util.toJson($ctx.args) }) })
`;
//# sourceMappingURL=graphql-typesense-transformer.js.map