import React from 'react';
import './UniversityInfoField.css';

const UniversityInfoField = ({
    label,
    value,
    onChange,
    placeholder = 'Enter value...',
    sourceText,
    onUseSource,
    liveSourceText,
    onUseLiveSource,
    type = 'text',
    options = []
}) => {
    return (
        <div className="uni-info-field-container">
            {/* Header */}
            <div className="uni-field-header">
                <span className="uni-field-label">{label}</span>
                <div className="uni-field-header-actions">
                    {onUseSource && (
                        <button className="uni-field-use-source" onClick={onUseSource}>
                            <span>Use Source</span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="#930051" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                    {onUseLiveSource && (
                        <button className="uni-field-use-live-source" onClick={onUseLiveSource}>
                            <span>Use Live Source</span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.25 10.5L8.75 7L5.25 3.5" stroke="#930051" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Input or Dropdown */}
            <div className="uni-field-input-wrapper">
                {type === 'dropdown' ? (
                    <select
                        className="uni-field-input"
                        value={value}
                        onChange={onChange}
                    >
                        <option value="">Select...</option>
                        {(options || []).map((opt, idx) => (
                            <option key={idx} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        className="uni-field-input"
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                    />
                )}
            </div>

            {/* Source Display */}
            {sourceText && (
                <div className="uni-field-source-box">
                    <span className="source-label">SOURCE:</span>
                    <span className="source-text">{sourceText}</span>
                </div>
            )}

            {/* Live Source Display */}
            {liveSourceText && (
                <div className="uni-field-live-source-box">
                    <span className="source-label">LIVE SOURCE:</span>
                    <span className="source-text">{liveSourceText}</span>
                </div>
            )}
        </div>
    );
};

export default UniversityInfoField;
