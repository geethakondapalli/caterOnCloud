import React, { useState } from 'react';
import { authService } from '../../services/auth';
import { menuService } from '../../services/menu';

const IntegrationTest = () => {
  const [results, setResults] = useState({});

  const tests = [
    {
      name: 'Backend Health Check',
      test: () => authService.testConnection()
    },
    {
      name: 'Load Menus',
      test: () => menuService.getMenuItems({ limit: 5 })
    },
    {
      name: 'User Registration',
      test: () => authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'customer'
      })
    }
  ];

  const runTest = async (testName, testFn) => {
    try {
      setResults(prev => ({ ...prev, [testName]: 'running' }));
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: 'success' }));
      console.log(`${testName} success:`, result);
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: 'error' }));
      console.error(`${testName} error:`, error);
    }
  };

 /*    const runAllTests = async () => {
        for (const { name, test } of tests) {
        await runTest(name, test);
        }
    }; */
};

export default IntegrationTest;