import React, { useState } from 'react';
import './LiveDataModal.css';

const LiveDataModal = ({ isOpen, onClose, lsqRow, cardId, universityId, cardToApiPath, showToast, onAfterSave, savedRowsByCard, setSavedRowsByCard }) => {
    const [savingRow, setSavingRow] = useState(null);   // index being saved
    const [savingAll, setSavingAll] = useState(false);
    const [detailRow, setDetailRow] = useState(null);   // row index for detail view

    // Get/set savedRows for the current cardId (state lives in parent)
    const savedRows = (savedRowsByCard && savedRowsByCard[cardId]) || {};
    const setSavedRows = (updater) => {
        if (!setSavedRowsByCard) return;
        setSavedRowsByCard(prev => ({
            ...prev,
            [cardId]: typeof updater === 'function' ? updater(prev[cardId] || {}) : updater,
        }));
    };

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

    // Map offering target_table to API save path
    const offeringSubApiPath = {
        program_curriculum: 'curriculum',
        program_eligibility: 'eligibility',
        fee_structure: 'fees',
        program_addon: 'addons',
        offering_faculty: 'faculty',
    };

    if (!isOpen || !lsqRow) return null;

    // Determine if this is a program-spec card (specialization extraction)
    const isProgramSpec = cardId?.startsWith('program-spec-');
    // Determine if this is an offering-all card (grouped sub-entity data)
    const isOfferingAll = cardId?.startsWith('offering-all-');

    // Detect individual offering sub-tab cards (e.g., "curriculum-{offeringId}")
    const subTabPrefixes = Object.keys(offeringSubApiPath); // target_table keys
    const subTabIdToTargetTable = {
        'curriculum': 'program_curriculum',
        'eligibility': 'program_eligibility',
        'fee-structure': 'fee_structure',
        'addon': 'program_addon',
        'offering-faculty': 'offering_faculty',
    };
    let isOfferingSub = false;
    let offeringSubTargetTable = null;
    let offeringSubId = null;
    if (cardId && !isProgramSpec && !isOfferingAll) {
        for (const prefix of Object.keys(subTabIdToTargetTable)) {
            if (cardId.startsWith(prefix + '-')) {
                const afterPrefix = cardId.slice(prefix.length + 1);
                if (afterPrefix && afterPrefix.length > 8) { // looks like a UUID
                    isOfferingSub = true;
                    offeringSubTargetTable = subTabIdToTargetTable[prefix];
                    offeringSubId = afterPrefix;
                    break;
                }
            }
        }
    }

    // For offering-all, lsqRow is an object of { targetTable: lsqRowObj }
    // We need to flatten all extracted_data from each sub-entity
    let extractedData = [];
    let groupedSections = null;

    if (isOfferingAll && typeof lsqRow === 'object' && !lsqRow.extracted_data) {
        // lsqRow is { program_curriculum: { extracted_data: [...] }, ... }
        groupedSections = {};
        let flatIndex = 0;
        Object.entries(lsqRow).forEach(([targetTable, lsqEntry]) => {
            if (lsqEntry?.extracted_data && Array.isArray(lsqEntry.extracted_data)) {
                groupedSections[targetTable] = {
                    label: formatTargetTable(targetTable),
                    startIndex: flatIndex,
                    rows: lsqEntry.extracted_data,
                    offeringId: lsqEntry.offering_id,
                };
                lsqEntry.extracted_data.forEach(row => {
                    extractedData.push({ ...row, _target_table: targetTable, _offering_id: lsqEntry.offering_id });
                    flatIndex++;
                });
            }
        });
    } else {
        extractedData = lsqRow.extracted_data || [];
    }

    if (!Array.isArray(extractedData) || extractedData.length === 0) {
        return (
            <div className="live-data-modal-overlay">
                <div className="live-data-modal-container">
                    <div className="live-data-modal-header">
                        <h2 className="live-data-modal-title">Live Data</h2>
                        <button className="live-data-modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <div className="live-data-modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
                        <p style={{ color: '#66758A', fontFamily: 'Manrope, sans-serif' }}>No extracted data available.</p>
                    </div>
                </div>
            </div>
        );
    }

    function formatTargetTable(tt) {
        const labels = {
            program_curriculum: 'Curriculum',
            program_eligibility: 'Eligibility',
            fee_structure: 'Fee Structure',
            program_addon: 'Addon',
            offering_faculty: 'Faculty',
            program_specialization: 'Specializations',
        };
        return labels[tt] || tt.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // Pick first 4 keys from first row for table columns (exclude internal keys)
    const displayRow = extractedData[0] || {};
    const allKeys = Object.keys(displayRow).filter(k => !k.startsWith('_'));
    const displayKeys = allKeys.slice(0, 4);

    const formatKey = (key) => {
        return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    const formatCellValue = (val) => {
        if (val === null || val === undefined) return '-';
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        if (typeof val === 'object') {
            if (Array.isArray(val)) return val.join(', ') || '-';
            if (val.type) return String(val.type);
            return JSON.stringify(val);
        }
        return String(val);
    };

    const saveRow = async (row, index) => {
        setSavingRow(index);
        try {
            let saveUrl;
            const cleanRow = { ...row };
            delete cleanRow._target_table;
            delete cleanRow._offering_id;

            // fee_type is stored as JSONB { type: value } — wrap string values
            if (cleanRow.fee_type !== undefined && cleanRow.fee_type !== null && typeof cleanRow.fee_type === 'string') {
                cleanRow.fee_type = { type: cleanRow.fee_type };
            }

            if (isProgramSpec) {
                // Save specialization to program's specializations endpoint
                const programId = lsqRow.program_id;
                if (!programId) {
                    showToast?.('No program ID found in LSQ entry.', 'error');
                    setSavingRow(null);
                    return;
                }
                saveUrl = `${BACKEND_URL}/api/universities/programs/${programId}/specializations`;

                const res = await fetch(saveUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanRow),
                });
                if (res.ok) {
                    const result = await res.json();
                    setSavedRows(prev => ({ ...prev, [index]: true }));
                    showToast?.('Specialization saved!', 'success');

                    // Auto-create offering for this specialization
                    const specData = result.data?.[0] || result.data;
                    if (specData?.id) {
                        try {
                            await fetch(`${BACKEND_URL}/api/universities/programs/${programId}/offerings`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ specialization_id: specData.id }),
                            });
                        } catch (offeringErr) {
                            console.error('Auto-create offering failed:', offeringErr);
                        }
                    }
                    onAfterSave?.();
                } else {
                    const err = await res.json();
                    showToast?.('Failed to save: ' + (err.error || 'Unknown error'), 'error');
                }
            } else if (isOfferingSub && offeringSubTargetTable && offeringSubId) {
                // Individual offering sub-tab card save
                const subPath = offeringSubApiPath[offeringSubTargetTable];
                if (!subPath) {
                    showToast?.('No API path for: ' + offeringSubTargetTable, 'error');
                    setSavingRow(null);
                    return;
                }
                saveUrl = `${BACKEND_URL}/api/universities/offerings/${offeringSubId}/${subPath}`;

                const res = await fetch(saveUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanRow),
                });
                if (res.ok) {
                    setSavedRows(prev => ({ ...prev, [index]: true }));
                    showToast?.('Row saved successfully!', 'success');
                    onAfterSave?.();
                } else {
                    const err = await res.json();
                    showToast?.('Failed to save: ' + (err.error || 'Unknown error'), 'error');
                }
            } else if (row._target_table && row._offering_id) {
                // Offering sub-entity save (from offering-all grouped data)
                const subPath = offeringSubApiPath[row._target_table];
                if (!subPath) {
                    showToast?.('No API path for: ' + row._target_table, 'error');
                    setSavingRow(null);
                    return;
                }
                saveUrl = `${BACKEND_URL}/api/universities/offerings/${row._offering_id}/${subPath}`;

                const res = await fetch(saveUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanRow),
                });
                if (res.ok) {
                    setSavedRows(prev => ({ ...prev, [index]: true }));
                    showToast?.('Row saved successfully!', 'success');
                    onAfterSave?.();
                } else {
                    const err = await res.json();
                    showToast?.('Failed to save: ' + (err.error || 'Unknown error'), 'error');
                }
            } else {
                // Default: university-level save
                const apiPath = cardToApiPath?.[cardId];
                if (!apiPath) {
                    showToast?.('No API path configured for this section.', 'error');
                    setSavingRow(null);
                    return;
                }
                saveUrl = `${BACKEND_URL}/api/universities/${universityId}/${apiPath}`;

                const res = await fetch(saveUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanRow),
                });
                if (res.ok) {
                    setSavedRows(prev => ({ ...prev, [index]: true }));
                    showToast?.('Row saved successfully!', 'success');
                } else {
                    const err = await res.json();
                    showToast?.('Failed to save: ' + (err.error || 'Unknown error'), 'error');
                }
            }
        } catch (err) {
            showToast?.('Failed to save: ' + err.message, 'error');
        }
        setSavingRow(null);
    };

    const handleSaveAll = async () => {
        setSavingAll(true);
        for (let i = 0; i < extractedData.length; i++) {
            if (savedRows[i]) continue;
            await saveRow(extractedData[i], i);
        }
        setSavingAll(false);
    };

    const unsavedCount = extractedData.filter((_, i) => !savedRows[i]).length;

    // Detail view
    if (detailRow !== null) {
        const row = extractedData[detailRow];
        return (
            <div className="live-data-modal-overlay">
                <div className="live-data-modal-container">
                    <div className="live-data-modal-header">
                        <div>
                            <h2 className="live-data-modal-title">Row Details</h2>
                            <p className="live-data-modal-subtitle">Row {detailRow + 1} of {extractedData.length}</p>
                        </div>
                        <button className="live-data-modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <div className="live-data-modal-body">
                        <div className="live-data-detail-header">
                            <button className="live-data-back-btn" onClick={() => setDetailRow(null)}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Back
                            </button>
                        </div>
                        <div className="live-data-detail-grid">
                            {Object.entries(row).filter(([k]) => !k.startsWith('_')).map(([key, value]) => (
                                <div className="live-data-detail-field" key={key}>
                                    <span className="live-data-detail-label">{formatKey(key)}</span>
                                    <div className="live-data-detail-value">
                                        {formatCellValue(value)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="live-data-modal-footer">
                        {savedRows[detailRow] ? (
                            <span className="live-data-saved-badge">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Saved
                            </span>
                        ) : (
                            <button className="live-data-save-btn" onClick={() => saveRow(row, detailRow)} disabled={savingRow === detailRow}>
                                {savingRow === detailRow ? 'Saving...' : 'Save Row'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Grouped table view for offering-all
    if (isOfferingAll && groupedSections) {
        return (
            <div className="live-data-modal-overlay">
                <div className="live-data-modal-container">
                    <div className="live-data-modal-header">
                        <div>
                            <h2 className="live-data-modal-title">Live Data - Offering</h2>
                            <p className="live-data-modal-subtitle">{extractedData.length} row{extractedData.length !== 1 ? 's' : ''} across {Object.keys(groupedSections).length} sections</p>
                        </div>
                        <button className="live-data-modal-close-btn" onClick={onClose}>&times;</button>
                    </div>
                    <div className="live-data-modal-body">
                        {Object.entries(groupedSections).map(([targetTable, section]) => {
                            const sectionKeys = Object.keys(section.rows[0] || {}).slice(0, 4);
                            return (
                                <div key={targetTable} style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px', borderBottom: '2px solid #930051', paddingBottom: '6px' }}>
                                        {section.label}
                                    </h3>
                                    <div className="live-data-table-wrapper">
                                        <table className="live-data-table">
                                            <thead>
                                                <tr>
                                                    <th>S.No</th>
                                                    {sectionKeys.map(key => (
                                                        <th key={key}>{formatKey(key)}</th>
                                                    ))}
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {section.rows.map((row, rowIdx) => {
                                                    const globalIdx = section.startIndex + rowIdx;
                                                    return (
                                                        <tr key={globalIdx} className={savedRows[globalIdx] ? 'saved-row' : ''}>
                                                            <td>{rowIdx + 1}</td>
                                                            {sectionKeys.map(key => (
                                                                <td key={key} title={formatCellValue(row[key])}>
                                                                    {formatCellValue(row[key])}
                                                                </td>
                                                            ))}
                                                            <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                                <button className="live-data-view-btn" onClick={() => setDetailRow(globalIdx)}>View</button>
                                                                {savedRows[globalIdx] ? (
                                                                    <span className="live-data-saved-badge">
                                                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                        Saved
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        className="live-data-save-btn"
                                                                        onClick={() => saveRow(extractedData[globalIdx], globalIdx)}
                                                                        disabled={savingRow === globalIdx}
                                                                    >
                                                                        {savingRow === globalIdx ? 'Saving...' : 'Save'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="live-data-modal-footer">
                        <button
                            className="live-data-save-all-btn"
                            onClick={handleSaveAll}
                            disabled={savingAll || unsavedCount === 0}
                        >
                            {savingAll ? 'Saving...' : unsavedCount === 0 ? 'All Saved' : `Save All (${unsavedCount})`}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Standard table view
    return (
        <div className="live-data-modal-overlay">
            <div className="live-data-modal-container">
                <div className="live-data-modal-header">
                    <div>
                        <h2 className="live-data-modal-title">Live Data</h2>
                        <p className="live-data-modal-subtitle">{extractedData.length} row{extractedData.length !== 1 ? 's' : ''} extracted</p>
                    </div>
                    <button className="live-data-modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="live-data-modal-body">
                    <div className="live-data-table-wrapper">
                        <table className="live-data-table">
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    {displayKeys.map(key => (
                                        <th key={key}>{formatKey(key)}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extractedData.map((row, index) => (
                                    <tr key={index} className={savedRows[index] ? 'saved-row' : ''}>
                                        <td>{index + 1}</td>
                                        {displayKeys.map(key => (
                                            <td key={key} title={formatCellValue(row[key])}>
                                                {formatCellValue(row[key])}
                                            </td>
                                        ))}
                                        <td style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <button className="live-data-view-btn" onClick={() => setDetailRow(index)}>View</button>
                                            {savedRows[index] ? (
                                                <span className="live-data-saved-badge">
                                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    Saved
                                                </span>
                                            ) : (
                                                <button
                                                    className="live-data-save-btn"
                                                    onClick={() => saveRow(row, index)}
                                                    disabled={savingRow === index}
                                                >
                                                    {savingRow === index ? 'Saving...' : 'Save'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="live-data-modal-footer">
                    <button
                        className="live-data-save-all-btn"
                        onClick={handleSaveAll}
                        disabled={savingAll || unsavedCount === 0}
                    >
                        {savingAll ? 'Saving...' : unsavedCount === 0 ? 'All Saved' : `Save All (${unsavedCount})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveDataModal;
