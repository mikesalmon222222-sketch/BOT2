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
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    mockBids.push({
      id: 'septa_test_1',
      title: 'Bus Maintenance Services Contract',
      description: 'Comprehensive maintenance services for SEPTA bus fleet including routine inspections, repairs, and emergency maintenance.',
      postedDate: today.toISOString(),
      dueDate: nextWeek.toISOString(),
      portal: 'SEPTA',
      bidLink: 'https://epsadmin.septa.org/vendor/requisitions/view/12345',
      quantity: '1 annual contract',
      documents: [],
      _id: 'mock_bid_1',
      createdAt: today,
      updatedAt: today
    });
    
    mockBids.push({
      id: 'septa_test_2', 
      title: 'Track Signal Equipment Upgrade',
      description: 'Upgrade and modernization of track signal equipment along the Broad Street Line.',
      postedDate: today.toISOString(),
      dueDate: tomorrow.toISOString(),
      portal: 'SEPTA',
      bidLink: 'https://epsadmin.septa.org/vendor/requisitions/view/12346',
      quantity: '15 signal units',
      documents: [],
      _id: 'mock_bid_2',
      createdAt: today,
      updatedAt: today
    });
  }
};

module.exports = mockDatabase;