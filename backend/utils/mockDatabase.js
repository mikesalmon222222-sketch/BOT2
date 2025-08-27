// Mock database for testing when MongoDB is not available
let mockCredentials = [];
let mockBids = [];
let nextId = 1;

const mockDatabase = {
  // Mock credential operations
  credentials: {
    find: (query = {}) => {
      if (query.portalName) {
        return mockCredentials.filter(c => c.portalName === query.portalName);
      }
      return mockCredentials;
    },
    
    findOne: (query) => {
      if (query.portalName) {
        return mockCredentials.find(c => c.portalName === query.portalName);
      }
      if (query._id) {
        return mockCredentials.find(c => c._id === query._id);
      }
      return null;
    },
    
    create: (data) => {
      const credential = {
        ...data,
        _id: `mock_${nextId++}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockCredentials.push(credential);
      return credential;
    },
    
    findByIdAndUpdate: (id, updates) => {
      const index = mockCredentials.findIndex(c => c._id === id);
      if (index !== -1) {
        mockCredentials[index] = { ...mockCredentials[index], ...updates, updatedAt: new Date() };
        return mockCredentials[index];
      }
      return null;
    },
    
    findByIdAndDelete: (id) => {
      const index = mockCredentials.findIndex(c => c._id === id);
      if (index !== -1) {
        return mockCredentials.splice(index, 1)[0];
      }
      return null;
    }
  },
  
  // Mock bid operations
  bids: {
    find: (query = {}) => {
      let result = [...mockBids];
      
      if (query.portal) {
        result = result.filter(b => b.portal === query.portal);
      }
      
      if (query.postedDate && query.postedDate.$gte) {
        const dateThreshold = new Date(query.postedDate.$gte);
        result = result.filter(b => new Date(b.postedDate) >= dateThreshold);
      }
      
      return result;
    },
    
    findOne: (query) => {
      if (query.id) {
        return mockBids.find(b => b.id === query.id);
      }
      return null;
    },
    
    create: (data) => {
      const bid = {
        ...data,
        _id: `mock_bid_${nextId++}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockBids.push(bid);
      return bid;
    },
    
    countDocuments: (query = {}) => {
      return mockBids.filter(bid => {
        if (query.postedDate && query.postedDate.$gte) {
          const dateThreshold = new Date(query.postedDate.$gte);
          return new Date(bid.postedDate) >= dateThreshold;
        }
        return true;
      }).length;
    }
  },
  
  // Testing utilities
  _reset: () => {
    mockCredentials = [];
    mockBids = [];
    nextId = 1;
  },
  
  _addTestData: () => {
    // Add some test bids for demonstration
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    mockBids.push({
      id: 'test_septa_1',
      title: 'Transportation Services Contract',
      description: 'Test bid for transportation services',
      postedDate: today.toISOString(),
      dueDate: tomorrow.toISOString(),
      portal: 'SEPTA',
      bidLink: 'https://epsadmin.septa.org/vendor/requisitions/view/123',
      quantity: '1 contract',
      _id: 'mock_bid_1',
      createdAt: today,
      updatedAt: today
    });
  }
};

module.exports = mockDatabase;