import { CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FieldList } from '../directive-args';
export declare const TYPESENSE_PARAMS: {
    typesenseApiKey: string;
    typesenseHost: string;
    typesensePort: string;
    typesenseProtocol: string;
    typesenseFieldsMap: string;
};
export declare const createParametersStack: (stack: Construct, defaultFields?: Record<string, FieldList>, defaultSettings?: Record<string, string>) => Map<string, CfnParameter>;
