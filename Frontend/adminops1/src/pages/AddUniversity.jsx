import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../components/Sidebar.css';
import './AddUniversity.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const AddUniversity = () => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        url: '',
    });
    const [uploadedDocs, setUploadedDocs] = useState([]);

    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setUploadedDocs([...uploadedDocs, ...files]);
    };

    const removeDoc = (index) => {
        const newDocs = [...uploadedDocs];
        newDocs.splice(index, 1);
        setUploadedDocs(newDocs);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const data = new FormData();
            data.append('name', formData.name);
            data.append('url', formData.url);

            uploadedDocs.forEach(file => {
                data.append('docs', file);
            });

            const response = await fetch(`${BACKEND_URL}/api/universities/add`, {
                method: 'POST',
                body: data,
                // Do not set Content-Type header when sending FormData, fetch sets it automatically with boundary
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save university');
            }

            // Success
            navigate('/dashboard/university-repositories');

        } catch (error) {
            console.error('Error saving university:', error);
            alert('Failed to save university: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
            <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="dashboard-main">
                    {/* Header */}
                    <div className="dashboard-header">
                        <div className="dashboard-header-left">
                            <span className="dashboard-subtitle">Manage university verifications</span>
                            <h1 className="dashboard-title">Add New University</h1>
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="add-uni-container">
                        <div className="add-uni-form">
                            {/* University Name */}
                            <div className="form-group">
                                <label>University Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter University Name"
                                />
                            </div>

                            {/* University URL */}
                            <div className="form-group">
                                <label>University URL</label>
                                <input
                                    type="text"
                                    name="url"
                                    value={formData.url}
                                    onChange={handleInputChange}
                                    placeholder="Enter University URL"
                                />
                            </div>

                            {/* University Docs */}
                            <div className="form-group docs-group">
                                <label>University Docs</label>
                                <div className="file-upload-wrapper">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        multiple
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx"
                                    />
                                    <label htmlFor="file-upload" className="file-upload-label">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 16L12 8" stroke="#930051" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M9 11L12 8L15 11" stroke="#930051" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M8 16H16" stroke="#930051" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Click to upload documents (PDF, DOC)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Uploaded Docs List */}
                            {uploadedDocs.length > 0 && (
                                <div className="uploaded-docs-list">
                                    {uploadedDocs.map((file, index) => (
                                        <div key={index} className="uploaded-doc-item">
                                            <span>{file.name}</span>
                                            <button className="remove-doc-btn" onClick={() => removeDoc(index)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="form-actions">
                            <button className="save-btn" onClick={handleSave} disabled={loading}>
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddUniversity;
