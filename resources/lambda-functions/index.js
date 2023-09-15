const { DynamoDB } = require('aws-sdk');
const Typesense = require('typesense');

const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY;
const TYPESENSE_HOST = process.env.TYPESENSE_HOST;
const TYPESENSE_PORT = process.env.TYPESENSE_PORT;
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'http';
const TYPESENSE_FIELDS_MAP = JSON.parse(process.env.TYPESENSE_FIELDS_MAP || '{}');

if (!TYPESENSE_API_KEY || !TYPESENSE_HOST || !TYPESENSE_PORT) {
    throw new Error('You need to provide TYPESENSE_API_KEY, TYPESENSE_HOST, and TYPESENSE_PORT env variables.');
}

const typesenseClient = new Typesense.Client({
    nodes: [{
        host: TYPESENSE_HOST,
        port: TYPESENSE_PORT,
        protocol: TYPESENSE_PROTOCOL
    }],
    apiKey: TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 2
});

const ddb = new DynamoDB.DocumentClient();

const getTableNameFromArn = (arn) => arn.split(':')[5].split('/')[1];

const setIndexedFields = (typeName, allFields) => {
    if (!TYPESENSE_FIELDS_MAP[typeName]) return allFields;
    const fieldMap = TYPESENSE_FIELDS_MAP[typeName];
    if (fieldMap.include) {
        return Object.fromEntries(Object.entries(allFields).filter(([key]) => fieldMap.include.includes(key)));
    }
    if (fieldMap.exclude) {
        return Object.fromEntries(Object.entries(allFields).filter(([key]) => !fieldMap.exclude.includes(key)));
    }
    return allFields;
};

const generateObjectID = (keys) => Object.values(keys).join(':');

const handleDbEvent = (event) => {
    const operations = [];
    event.Records.forEach((record) => {
        const ddb = record.dynamodb;
        const tableName = getTableNameFromArn(record.eventSourceARN);
        const docKeys = ddb.Keys;
        const docFields = ddb.NewImage || ddb.OldImage;
        const typeName = docFields.__typename;
        const indexedFields = setIndexedFields(typeName, docFields);

        const operation = {
            action: record.eventName === 'INSERT' || record.eventName === 'MODIFY' ? 'upsert' : 'delete',
            collectionName: tableName.toLowerCase(),
            document: {
                ...indexedFields,
                id: generateObjectID(docKeys)
            }
        };
        operations.push(operation);
    });

    operations.forEach(async (op) => {
        if (op.action === 'upsert') {
            await typesenseClient.collections(op.collectionName).documents().upsert(op.document);
        } else if (op.action === 'delete') {
            await typesenseClient.collections(op.collectionName).documents(op.document.id).delete();
        }
    });
};

const handleAppSyncQuery = (event) => {
    const collection = typesenseClient.collections(event.tableName.toLowerCase());
    const query = JSON.parse(event.arguments).query;
    return collection.documents().search({
        q: query,
        query_by: 'your_search_field' // Replace with the field you want to search by
    });
};

exports.handler = async (event) => {
    try {
        if (event.Records) {
            return handleDbEvent(event);
        } else if (event.typeName) {
            return handleAppSyncQuery(event);
        } else {
            throw new Error('Unknown event type');
        }
    } catch (error) {
        console.error(error);
    }
};


