import React, { useState, useRef } from 'react';
import './LiveSourceModal.css';

const LiveSourceModal = ({ isOpen, onClose, onSave }) => {
    const [url, setUrl] = useState('');
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const allowedTypes = ['.pdf', '.html', '.htm', '.txt'];
    const allowedMimeTypes = ['application/pdf', 'text/html', 'text/plain'];

    const isFileAllowed = (f) => {
        if (!f) return false;
        const ext = '.' + f.name.split('.').pop().toLowerCase();
        return allowedTypes.includes(ext) || allowedMimeTypes.includes(f.type);
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (!isFileAllowed(selected)) {
                setErrors(prev => ({ ...prev, file: 'Only PDF, HTML, and TXT files are allowed' }));
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setFile(selected);
            setErrors(prev => ({ ...prev, file: '', url: '' }));
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped) {
            if (!isFileAllowed(dropped)) {
                setErrors(prev => ({ ...prev, file: 'Only PDF, HTML, and TXT files are allowed' }));
                return;
            }
            setFile(dropped);
            setErrors(prev => ({ ...prev, file: '', url: '' }));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSave = () => {
        const newErrors = {};
        if (!url.trim() && !file) newErrors.url = 'URL is required when no file is uploaded';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({ url: url.trim(), prompt: prompt.trim(), file: file || null });
        setUrl('');
        setPrompt('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setErrors({});
    };

    const handleClose = () => {
        setUrl('');
        setPrompt('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setErrors({});
        onClose();
    };

    return (
        <div className="live-source-modal-overlay">
            <div className="live-source-modal-container">
                <div className="live-source-modal-header">
                    <h2 className="live-source-modal-title">Live Source</h2>
                    <button className="live-source-modal-close-btn" onClick={handleClose}>&times;</button>
                </div>
                <div className="live-source-modal-body">
                    <div className="live-source-field">
                        <label className="live-source-field-label">Enter URL</label>
                        <input
                            type="text"
                            className={`live-source-field-input${errors.url ? ' input-error' : ''}`}
                            placeholder="https://example.com"
                            value={url}
                            onChange={e => { setUrl(e.target.value); if (errors.url) setErrors(prev => ({ ...prev, url: '' })); }}
                        />
                        {errors.url && <span className="live-source-error-text">{errors.url}</span>}
                    </div>
                    <div className="live-source-field">
                        <label className="live-source-field-label">Enter Prompt <span className="live-source-optional-tag">(Optional)</span></label>
                        <input
                            type="text"
                            className={`live-source-field-input${errors.prompt ? ' input-error' : ''}`}
                            placeholder="Enter your prompt..."
                            value={prompt}
                            onChange={e => { setPrompt(e.target.value); if (errors.prompt) setErrors(prev => ({ ...prev, prompt: '' })); }}
                        />
                        {errors.prompt && <span className="live-source-error-text">{errors.prompt}</span>}
                    </div>
                    <div className="live-source-field">
                        <label className="live-source-field-label">Upload File <span className="live-source-optional-tag">(Optional)</span></label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.html,.htm,.txt"
                            style={{ display: 'none' }}
                        />
                        {!file ? (
                            <div
                                className="live-source-file-dropzone"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#66758A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M17 8L12 3L7 8" stroke="#66758A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 3V15" stroke="#66758A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="live-source-dropzone-text">Click to upload or drag & drop</span>
                                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>PDF, HTML, TXT only</span>
                            </div>
                        ) : (
                            <div className="live-source-file-info">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.33333 1.33334H4C3.64638 1.33334 3.30724 1.47381 3.05719 1.72386C2.80714 1.97391 2.66667 2.31305 2.66667 2.66667V13.3333C2.66667 13.687 2.80714 14.0261 3.05719 14.2761C3.30724 14.5262 3.64638 14.6667 4 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2761C13.1929 14.0261 13.3333 13.687 13.3333 13.3333V5.33334L9.33333 1.33334Z" stroke="#930051" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9.33333 1.33334V5.33334H13.3333" stroke="#930051" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="live-source-file-name">{file.name}</span>
                                <button className="live-source-file-remove" onClick={handleRemoveFile}>&times;</button>
                            </div>
                        )}
                        {errors.file && <span className="live-source-error-text">{errors.file}</span>}
                    </div>
                </div>
                <div className="live-source-modal-footer">
                    <button className="live-source-cancel-btn" onClick={handleClose}>Cancel</button>
                    <button className="live-source-save-btn" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default LiveSourceModal;
