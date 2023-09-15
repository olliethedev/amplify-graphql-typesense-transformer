"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventSourceMapping = exports.createLambdaRole = exports.createLambda = void 0;
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const graphql_transformer_common_1 = require("graphql-transformer-common");
const path = require("path");
const create_cfnParameters_1 = require("./create-cfnParameters");
const createLambda = (stack, apiGraphql, parameterMap, lambdaRole) => {
    const { OpenSearchStreamingLambdaFunctionLogicalID } = graphql_transformer_common_1.ResourceConstants.RESOURCES;
    const enviroment = {
        TYPESENSE_API_KEY: parameterMap.get(create_cfnParameters_1.TYPESENSE_PARAMS.typesenseApiKey).valueAsString,
        TYPESENSE_HOST: parameterMap.get(create_cfnParameters_1.TYPESENSE_PARAMS.typesenseHost).valueAsString,
        TYPESENSE_PORT: parameterMap.get(create_cfnParameters_1.TYPESENSE_PARAMS.typesensePort).valueAsString,
        TYPESENSE_PROTOCOL: parameterMap.get(create_cfnParameters_1.TYPESENSE_PARAMS.typesenseProtocol).valueAsString,
        TYPESENSE_FIELDS_MAP: parameterMap.get(create_cfnParameters_1.TYPESENSE_PARAMS.typesenseFieldsMap).valueAsString,
    };
    return apiGraphql.host.addLambdaFunction(OpenSearchStreamingLambdaFunctionLogicalID, `functions/${OpenSearchStreamingLambdaFunctionLogicalID}.zip`, 'index.handler', path.join(__dirname, '..', 'assets', 'lambda.zip'), aws_lambda_1.Runtime.NODEJS_18_X, [
        aws_lambda_1.LayerVersion.fromLayerVersionArn(stack, 'LambdaLayerVersion', aws_cdk_lib_1.Fn.findInMap('LayerResourceMapping', aws_cdk_lib_1.Fn.ref('AWS::Region'), 'layerRegion')),
    ], lambdaRole, enviroment, undefined, stack);
};
exports.createLambda = createLambda;
const createLambdaRole = (context, stack, parameterMap) => {
    var _a, _b;
    const { OpenSearchStreamingLambdaIAMRoleLogicalID } = graphql_transformer_common_1.ResourceConstants.RESOURCES;
    const { OpenSearchStreamingIAMRoleName } = graphql_transformer_common_1.ResourceConstants.PARAMETERS;
    const role = new aws_iam_1.Role(stack, OpenSearchStreamingLambdaIAMRoleLogicalID, {
        assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com'),
        roleName: context.resourceHelper.generateIAMRoleName((_b = (_a = parameterMap.get(OpenSearchStreamingIAMRoleName)) === null || _a === void 0 ? void 0 : _a.valueAsString) !== null && _b !== void 0 ? _b : ''),
    });
    role.attachInlinePolicy(new aws_iam_1.Policy(stack, 'CloudwatchLogsAccess', {
        statements: [
            new aws_iam_1.PolicyStatement({
                actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                effect: aws_iam_1.Effect.ALLOW,
                resources: ['arn:aws:logs:*:*:*'],
            }),
        ],
    }));
    return role;
};
exports.createLambdaRole = createLambdaRole;
const createEventSourceMapping = (stack, type, target, tableStreamArn) => {
    return new aws_lambda_1.EventSourceMapping(stack, graphql_transformer_common_1.SearchableResourceIDs.SearchableEventSourceMappingID(type), {
        eventSourceArn: tableStreamArn,
        target,
        batchSize: 100,
        maxBatchingWindow: aws_cdk_lib_1.Duration.seconds(1),
        enabled: true,
        startingPosition: aws_lambda_1.StartingPosition.LATEST,
        retryAttempts: 2,
    });
};
exports.createEventSourceMapping = createEventSourceMapping;
//# sourceMappingURL=create-streaming-lambda.js.map