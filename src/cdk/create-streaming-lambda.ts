import { GraphQLAPIProvider, TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import {
  EventSourceMapping, IFunction, LayerVersion, Runtime, StartingPosition,
} from 'aws-cdk-lib/aws-lambda';

import { CfnParameter, Fn, Stack, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Effect, IRole, Policy, PolicyStatement, Role, ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { ResourceConstants, SearchableResourceIDs } from 'graphql-transformer-common';
import * as path from 'path';

import { TYPESENSE_PARAMS } from './create-cfnParameters';

export const createLambda = (
  stack: Stack,
  apiGraphql: GraphQLAPIProvider,
  parameterMap: Map<string, CfnParameter>,
  lambdaRole: IRole,
): IFunction => {
  const { OpenSearchStreamingLambdaFunctionLogicalID } = ResourceConstants.RESOURCES;

  const enviroment: { [key: string]: string } = {
    TYPESENSE_API_KEY: parameterMap.get(TYPESENSE_PARAMS.typesenseApiKey)!.valueAsString,
    TYPESENSE_HOST: parameterMap.get(TYPESENSE_PARAMS.typesenseHost)!.valueAsString,
    TYPESENSE_PORT: parameterMap.get(TYPESENSE_PARAMS.typesensePort)!.valueAsString,
    TYPESENSE_PROTOCOL: parameterMap.get(TYPESENSE_PARAMS.typesenseProtocol)!.valueAsString,
    TYPESENSE_FIELDS_MAP: parameterMap.get(TYPESENSE_PARAMS.typesenseFieldsMap)!.valueAsString,
  };

  return apiGraphql.host.addLambdaFunction(
    OpenSearchStreamingLambdaFunctionLogicalID,
    `functions/${OpenSearchStreamingLambdaFunctionLogicalID}.zip`,
    'index.handler', 
    path.join(__dirname,'..', 'assets', 'lambda.zip'),
    Runtime.NODEJS_18_X,
    [
      LayerVersion.fromLayerVersionArn(
        stack,
        'LambdaLayerVersion',
        Fn.findInMap('LayerResourceMapping', Fn.ref('AWS::Region'), 'layerRegion'),
      ),
    ],
    lambdaRole,
    enviroment,
    undefined,
    stack,
  );
};

export const createLambdaRole = (context: TransformerContextProvider, stack: Construct, parameterMap: Map<string, CfnParameter>): IRole => {
  const { OpenSearchStreamingLambdaIAMRoleLogicalID } = ResourceConstants.RESOURCES;
  const { OpenSearchStreamingIAMRoleName } = ResourceConstants.PARAMETERS;
  const role = new Role(stack, OpenSearchStreamingLambdaIAMRoleLogicalID, {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    roleName: context.resourceHelper.generateIAMRoleName(parameterMap.get(OpenSearchStreamingIAMRoleName)?.valueAsString ?? ''),
  });
  role.attachInlinePolicy(
    new Policy(stack, 'CloudwatchLogsAccess', {
      statements: [
        new PolicyStatement({
          actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          effect: Effect.ALLOW,
          resources: ['arn:aws:logs:*:*:*'],
        }),
      ],
    }),
  );

  return role;
};

export const createEventSourceMapping = (
  stack: Construct,
  type: string,
  target: IFunction,
  tableStreamArn: string,
): EventSourceMapping => {
  return new EventSourceMapping(stack, SearchableResourceIDs.SearchableEventSourceMappingID(type), {
    eventSourceArn: tableStreamArn,
    target,
    batchSize: 100,
    maxBatchingWindow: Duration.seconds(1),
    enabled: true,
    startingPosition: StartingPosition.LATEST,
    retryAttempts: 2,
  });
};