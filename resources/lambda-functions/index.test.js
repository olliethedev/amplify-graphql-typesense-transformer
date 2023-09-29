const mockEvent = require('./mocks/event.json');

// Define mock functions
const mockRetrieve = jest.fn().mockResolvedValue([{ name: 'blog-mp6xr657pvbpjbyd4nqbvk44du-dev' }]);
const mockCreate = jest.fn();
const mockUpsert = jest.fn().mockResolvedValue({});
const mockDelete = jest.fn();
const mockSearch = jest.fn().mockResolvedValue({
    results: [{"mock": "result"}],
});

const mockTypesenseClient = {
  collections: jest.fn().mockImplementation(() => ({
    retrieve: mockRetrieve,
    create: mockCreate,
    documents: jest.fn().mockImplementation(() => ({
      upsert: mockUpsert,
      delete: mockDelete,
      search: mockSearch
    }))
  })),
  sendApiKeyAsQueryParam: jest.fn()
};

jest.mock('typesense', () => {
  return {
    Client: jest.fn().mockImplementation(() => mockTypesenseClient)
  };
});

describe('Test handler', () => {
  beforeEach((done) => {
    // Clear all mock implementations
    jest.clearAllMocks();

    process.env.TYPESENSE_HOST = 'test';
    process.env.TYPESENSE_PORT = '1234';
    process.env.TYPESENSE_PROTOCOL = 'http';
    process.env.TYPESENSE_API_KEY = 'test';
    done();
  });

  it('should handle DB event where the collection exists', async () => {
    const lambda = require("./index");

    const result = await lambda.handler(mockEvent);
  
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    // For the expectation below, ensure that the argument is the unmarshalled representation of the dynamo object.

    const expectedObject = {
        id: mockEvent.Records[0].dynamodb.NewImage.id.S,
        name: mockEvent.Records[0].dynamodb.NewImage.name.S,
        createdAt: mockEvent.Records[0].dynamodb.NewImage.createdAt.S,
        updatedAt: mockEvent.Records[0].dynamodb.NewImage.updatedAt.S,
        __typename: mockEvent.Records[0].dynamodb.NewImage.__typename.S,
        _version: Number(mockEvent.Records[0].dynamodb.NewImage._version.N),
        _lastChangedAt: Number(mockEvent.Records[0].dynamodb.NewImage._lastChangedAt.N.toString())
        
    };

    expect(mockUpsert).toHaveBeenCalledWith(expectedObject); 
    expect(mockCreate).toHaveBeenCalledTimes(0);
    expect(result).not.toBeDefined();
  });

  it('should handle DB event where the collection does not exist', async () => {

    const lambda = require("./index");

    const NEW_BLOG_TABLE_NAME = 'NewBlogTableName-mp6xr657pvbpjbyd4nqbvk44du-dev';

    const result = await lambda.handler(
        {
            "Records": [
                {
                    
                    ...mockEvent.Records[0],
                    "eventSourceARN": `arn:aws:dynamodb:us-east-1:446581856886:table/${NEW_BLOG_TABLE_NAME}/stream/2023-09-14T15:08:09.233`
                }
            ]
        }
    );
  
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: NEW_BLOG_TABLE_NAME.toLowerCase(),
        enable_nested_fields: true,
        fields: expect.arrayContaining([{"name": ".*", "type": "auto" }]),

    }));
    // Expect the upsert function to have been called once (to upsert the document)
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    const expectedObject = {
        id: mockEvent.Records[0].dynamodb.NewImage.id.S,
        name: mockEvent.Records[0].dynamodb.NewImage.name.S,
        createdAt: mockEvent.Records[0].dynamodb.NewImage.createdAt.S,
        updatedAt: mockEvent.Records[0].dynamodb.NewImage.updatedAt.S,
        __typename: mockEvent.Records[0].dynamodb.NewImage.__typename.S,
        _version: Number(mockEvent.Records[0].dynamodb.NewImage._version.N),
        _lastChangedAt: Number(mockEvent.Records[0].dynamodb.NewImage._lastChangedAt.N.toString())
    };

    // Expect the upsert function to have been called with the correct argument
    expect(mockUpsert).toHaveBeenCalledWith(expectedObject); 
    expect(result).not.toBeDefined();
  });

  it('should handle DB event where event is REMOVE', async () => {

    const lambda = require("./index");

    const DELETED_BLOG_TABLE_NAME = 'DeletedBlogTableName-mp6xr657pvbpjbyd4nqbvk44du-dev';

    const result = await lambda.handler(
        {
            "Records": [
                {
                    ...mockEvent.Records[0],
                    "eventName": "REMOVE",
                    "eventSourceARN": `arn:aws:dynamodb:us-east-1:446581856886:table/${DELETED_BLOG_TABLE_NAME}/stream/2023-09-14T15:08:09.233`
                }
            ]
        }
    );

    expect(mockDelete).toHaveBeenCalledTimes(1);

    expect(result).not.toBeDefined();
  });

  it('should handle DB event where event contains _delete', async () => {

    const lambda = require("./index");

    const result = await lambda.handler(
        {
            "Records": [
                {
                    ...mockEvent.Records[0],
                    "eventName": "MODIFY",
                    "dynamodb": {
                        ...mockEvent.Records[0].dynamodb,
                        "OldImage": {
                            ...mockEvent.Records[0].dynamodb.NewImage,
                            "_deleted": {
                                "BOOL": true
                            }
                        },
                        "NewImage": undefined
                    },
                }
            ]
        }
    );

    expect(mockDelete).toHaveBeenCalledTimes(1);

    expect(result).not.toBeDefined();
    

  });

    it('should handle AppSync query', async () => {

        const lambda = require("./index");

        const result = await lambda.handler(
            "{\"typeName\":\"Query\",\"tableName\":\"Blog-mp6xr657pvbpjbyd4nqbvk44du-dev\",\"arguments\":\"{\\\"searchParameters\\\":{\\\"q\\\":\\\"text\\\",\\\"query_by\\\":\\\"name\\\",\\\"filter_by\\\":\\\"num_comments:>100\\\",\\\"sort_by\\\":\\\"num_comments:desc\\\"}}\"}"

        );

        expect(mockSearch).toHaveBeenCalledTimes(1);

        expect(result).toBeDefined();
        expect(result).toEqual(JSON.stringify({
            results: [{"mock": "result"}],
        }));
    });


    it('should throw error for unknown event type', async () => {

        const lambda = require("./index");

        try {
            await lambda.handler(
                'unknown event type'
            );
        } catch (error) {
            expect(error.message).toEqual('Unknown event type');
        }
    }

    );
    
  
});