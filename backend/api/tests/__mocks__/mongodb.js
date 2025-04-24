// Mock MongoDB client and functionality
export const MongoClient = {
  connect: jest.fn().mockResolvedValue({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        insertMany: jest.fn().mockResolvedValue({ insertedCount: 1 }),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
      })
    })
  })
};
