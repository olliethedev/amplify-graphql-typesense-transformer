import { ResourceConstants } from 'graphql-transformer-common';
import { CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FieldList } from '../directive-args';

export const TYPESENSE_PARAMS = {
  typesenseApiKey:'TypesenseApiKey',
  typesenseHost: 'TypesenseHost',
  typesensePort: 'TypesensePort',
  typesenseProtocol: 'TypesenseProtocol',
  typesenseFieldsMap: 'TypesenseFieldsMap'
  
}

export const createParametersStack = (stack: Construct, defaultFields?: Record<string, FieldList>, defaultSettings?: Record<string, string>): Map<string, CfnParameter> => {
  const {
    OpenSearchAccessIAMRoleName,
    OpenSearchStreamingFunctionName,
    OpenSearchStreamingIAMRoleName,
  } = ResourceConstants.PARAMETERS;

  console.log({stack})

  return new Map<string, CfnParameter>([
    [
      TYPESENSE_PARAMS.typesenseApiKey,
      new CfnParameter(stack, TYPESENSE_PARAMS.typesenseApiKey, {
        description: 'Algolia App ID.',
        default: "",
      }),
    ],
    
    [
      TYPESENSE_PARAMS.typesenseHost,
      new CfnParameter(stack, TYPESENSE_PARAMS.typesenseHost, {
        description: 'Typesense Host.',
        default: "",
      }),
    ],

    [
      TYPESENSE_PARAMS.typesensePort,
      new CfnParameter(stack, TYPESENSE_PARAMS.typesensePort, {
        description: 'Typesense Port.',
        default: "",
      }),
    ],

    [
      TYPESENSE_PARAMS.typesenseProtocol,
      new CfnParameter(stack, TYPESENSE_PARAMS.typesenseProtocol, {
        description: 'Typesense Protocol.',
        default: "http",
      }),
    ],

    [
      TYPESENSE_PARAMS.typesenseFieldsMap,
      new CfnParameter(stack, TYPESENSE_PARAMS.typesenseFieldsMap, {
        description: 'Typesense Fields Map.',
        default: "{}",
      }),
    ],
    
    [
      OpenSearchAccessIAMRoleName,
      new CfnParameter(stack, OpenSearchAccessIAMRoleName, {
        description: 'The name of the IAM role assumed by AppSync for OpenSearch.',
        default: 'AppSyncOpenSearchRole',
      }),
    ],

    [
      OpenSearchStreamingFunctionName,
      new CfnParameter(stack, OpenSearchStreamingFunctionName, {
        description: 'The name of the streaming lambda function.',
        default: 'DdbToEsFn',
      }),
    ],

    [
      OpenSearchStreamingIAMRoleName,
      new CfnParameter(stack, OpenSearchStreamingIAMRoleName, {
        description: 'The name of the streaming lambda function IAM role.',
        default: 'SearchLambdaIAMRole',
      }),
    ],
  ]);
};