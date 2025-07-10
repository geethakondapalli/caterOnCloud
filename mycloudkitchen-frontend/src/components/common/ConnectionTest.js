import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

const ConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [message, setMessage] = useState('');

    useEffect(() => {
        testConnection();
    }, []);

    const testConnection = async () => {
        try {
        setStatus('testing');
        setMessage('Connecting to backend...');
        
        const response = await authService.testConnection();
        setStatus('success');
        setMessage(`✅ Connected! Server status: ${response.status}`);
        } catch (error) {
        setStatus('error');
        setMessage(`❌ Connection failed: ${error.message}`);
        }
    };

     if (status === 'success') return null; // Hide when connected

    return (
        <div className="connection-test">
            {status === 'testing' && (
                <div className="status testing">
                    <Loader className="icon" />
                    <span>{message}</span>
                </div>
            )}
            {status === 'success' && (
                <div className="status success">
                    <CheckCircle className="icon" />
                    <span>{message}</span>
                </div>
            )}
            {status === 'error' && (
                <div className="status error">
                    <AlertCircle className="icon" />
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
};

export default ConnectionTest;