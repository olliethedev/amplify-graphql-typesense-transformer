"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParametersStack = exports.TYPESENSE_PARAMS = void 0;
const graphql_transformer_common_1 = require("graphql-transformer-common");
const aws_cdk_lib_1 = require("aws-cdk-lib");
exports.TYPESENSE_PARAMS = {
    typesenseApiKey: 'TypesenseApiKey',
    typesenseHost: 'TypesenseHost',
    typesensePort: 'TypesensePort',
    typesenseProtocol: 'TypesenseProtocol',
    typesenseFieldsMap: 'TypesenseFieldsMap'
};
const createParametersStack = (stack, defaultFields, defaultSettings) => {
    const { OpenSearchAccessIAMRoleName, OpenSearchStreamingFunctionName, OpenSearchStreamingIAMRoleName, } = graphql_transformer_common_1.ResourceConstants.PARAMETERS;
    console.log({ stack });
    return new Map([
        [
            exports.TYPESENSE_PARAMS.typesenseApiKey,
            new aws_cdk_lib_1.CfnParameter(stack, exports.TYPESENSE_PARAMS.typesenseApiKey, {
                description: 'Algolia App ID.',
                default: "",
            }),
        ],
        [
            exports.TYPESENSE_PARAMS.typesenseHost,
            new aws_cdk_lib_1.CfnParameter(stack, exports.TYPESENSE_PARAMS.typesenseHost, {
                description: 'Typesense Host.',
                default: "",
            }),
        ],
        [
            exports.TYPESENSE_PARAMS.typesensePort,
            new aws_cdk_lib_1.CfnParameter(stack, exports.TYPESENSE_PARAMS.typesensePort, {
                description: 'Typesense Port.',
                default: "",
            }),
        ],
        [
            exports.TYPESENSE_PARAMS.typesenseProtocol,
            new aws_cdk_lib_1.CfnParameter(stack, exports.TYPESENSE_PARAMS.typesenseProtocol, {
                description: 'Typesense Protocol.',
                default: "http",
            }),
        ],
        [
            exports.TYPESENSE_PARAMS.typesenseFieldsMap,
            new aws_cdk_lib_1.CfnParameter(stack, exports.TYPESENSE_PARAMS.typesenseFieldsMap, {
                description: 'Typesense Fields Map.',
                default: "{}",
            }),
        ],
        [
            OpenSearchAccessIAMRoleName,
            new aws_cdk_lib_1.CfnParameter(stack, OpenSearchAccessIAMRoleName, {
                description: 'The name of the IAM role assumed by AppSync for OpenSearch.',
                default: 'AppSyncOpenSearchRole',
            }),
        ],
        [
            OpenSearchStreamingFunctionName,
            new aws_cdk_lib_1.CfnParameter(stack, OpenSearchStreamingFunctionName, {
                description: 'The name of the streaming lambda function.',
                default: 'DdbToEsFn',
            }),
        ],
        [
            OpenSearchStreamingIAMRoleName,
            new aws_cdk_lib_1.CfnParameter(stack, OpenSearchStreamingIAMRoleName, {
                description: 'The name of the streaming lambda function IAM role.',
                default: 'SearchLambdaIAMRole',
            }),
        ],
    ]);
};
exports.createParametersStack = createParametersStack;
//# sourceMappingURL=create-cfnParameters.js.map