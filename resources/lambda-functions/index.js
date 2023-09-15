const { DynamoDB } = require('aws-sdk');
const Typesense = require('typesense');

const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY;
const TYPESENSE_HOST = process.env.TYPESENSE_HOST;
const TYPESENSE_PORT = process.env.TYPESENSE_PORT;
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'http';

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
    connectionTimeoutSeconds: 5
});

/* DB event example
{
    "Records": [
        {
            "eventID": "75c6d0774736d13b7ecd133f35da0a22",
            "eventName": "INSERT",
            "eventVersion": "1.1",
            "eventSource": "aws:dynamodb",
            "awsRegion": "us-east-1",
            "dynamodb": {
                "ApproximateCreationDateTime": 1694805859,
                "Keys": {
                    "id": {
                        "S": "e5855fc0-0ad5-4de3-8f2b-2a28168a352a"
                    }
                },
                "NewImage": {
                    "createdAt": {
                        "S": "2023-09-15T19:24:19.368Z"
                    },
                    "_lastChangedAt": {
                        "N": "1694805859393"
                    },
                    "__typename": {
                        "S": "Blog"
                    },
                    "name": {
                        "S": "lets go1"
                    },
                    "id": {
                        "S": "e5855fc0-0ad5-4de3-8f2b-2a28168a352a"
                    },
                    "_version": {
                        "N": "1"
                    },
                    "updatedAt": {
                        "S": "2023-09-15T19:24:19.368Z"
                    }
                },
                "SequenceNumber": "4841800000000015978594257",
                "SizeBytes": 200,
                "StreamViewType": "NEW_AND_OLD_IMAGES"
            },
            "eventSourceARN": "arn:aws:dynamodb:us-east-1:446581856886:table/Blog-mp6xr657pvbpjbyd4nqbvk44du-dev/stream/2023-09-14T15:08:09.233"
        }
    ]
}
*/

/* AppSync query example
"{\"typeName\":\"Query\",\"tableName\":\"Blog-mp6xr657pvbpjbyd4nqbvk44du-dev\",\"arguments\":\"{\\\"query\\\":\\\"hello!\\\",\\\"field\\\":\\\"name\\\"}\"}"

*/

exports.handler = async (event) => {
    console.log("env: ", process.env);
    console.info(JSON.stringify(event, null, 4));
      try {
          if (event.Records) {
              return handleDbEvent(event);
          } else if (typeof event === 'string' && event.includes('typeName')) {
              return handleAppSyncQuery(JSON.parse(event)).then(result => JSON.stringify(result));
          } else {
              throw new Error('Unknown event type');
          }
      } catch (error) {
          console.error(error);
      }
  };

  const handleDbEvent = async (event) => {
    const operations = [];
    event.Records.forEach((record) => {
        const ddb = record.dynamodb;
        const tableName = record.eventSourceARN.split(':')[5].split('/')[1];
        const rawDoc = ddb.NewImage || ddb.OldImage;
        const docFields = DynamoDB.Converter.unmarshall(rawDoc);

        const operation = {
            action: record.eventName === 'INSERT' || record.eventName === 'MODIFY' ? 'upsert' : 'delete',
            collectionName: tableName.toLowerCase(),
            document: {
                ...docFields
            },
            rawDoc
        };
        console.log({operation});
        operations.push(operation);
    });

    await Promise.all(operations.map(async (op) => {
        if (op.action === 'upsert') {
            const collectionExists = await typesenseClient.collections().retrieve().then(collections => collections.some(collection => collection.name === op.collectionName));
            if (!collectionExists) {
                const schema = {
                    name: op.collectionName,
                    fields: Object.keys(op.document).map(key => ({
                        name: key,
                        type: getTypesenseFieldType(Object.keys(op.rawDoc[key])[0])
                    }))
                };
                await typesenseClient.collections().create(schema);
            }
            await typesenseClient.collections(op.collectionName).documents().upsert(op.document);
        } else if (op.action === 'delete') {
            await typesenseClient.collections(op.collectionName).documents(op.document.id).delete();
        }
    }));
};

const handleAppSyncQuery = (event) => {
    const collection = typesenseClient.collections(event.tableName.toLowerCase());
    const parsedEvent = JSON.parse(event.arguments);
    const { query, field, filter, sort } = parsedEvent;
    return collection.documents().search({
        q: query,
        query_by: field,
        filter_by: filter,
        sort_by: sort
    });
};

const getTypesenseFieldType = (dynamoType) => {
    switch (dynamoType) {
        case 'S':
        case 'SS':
            return 'string';
        case 'N':
            return 'float';
        case 'NS':
            return 'float[]';
        case 'BOOL':
            return 'bool';
        case 'M':
            return 'object';
        case 'L':
            return 'object[]';
        default:
            return 'string';
    }
};



