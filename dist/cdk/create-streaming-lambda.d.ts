import { GraphQLAPIProvider, TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { EventSourceMapping, IFunction } from 'aws-cdk-lib/aws-lambda';
import { CfnParameter, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IRole } from 'aws-cdk-lib/aws-iam';
export declare const createLambda: (stack: Stack, apiGraphql: GraphQLAPIProvider, parameterMap: Map<string, CfnParameter>, lambdaRole: IRole) => IFunction;
export declare const createLambdaRole: (context: TransformerContextProvider, stack: Construct, parameterMap: Map<string, CfnParameter>) => IRole;
export declare const createEventSourceMapping: (stack: Construct, type: string, target: IFunction, tableStreamArn: string) => EventSourceMapping;
