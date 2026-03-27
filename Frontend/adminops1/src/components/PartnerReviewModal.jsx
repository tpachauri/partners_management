import React, { useState, useEffect, useRef } from 'react';
import './PartnerReviewModal.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const STEP_COLORS = ['#3B82F6', '#8B5CF6', '#059669', '#F59E0B'];
const STEP_BG    = ['#EFF6FF', '#F5F3FF', '#ECFDF5', '#FFFBEB'];

function VerifiedDot({ verified }) {
    if (verified) return <span className="prv-verified-dot" title="Verified" />;
    return <span className="prv-pending-label">Pending</span>;
}

// ── helpers ──────────────────────────────────────────────────────────────
function fmtArr(arr) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
    return arr.join(' · ');
}

function capitalize(s) {
    if (!s) return null;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── entity-type detector ─────────────────────────────────────────────────
function entityKind(d) {
    const cat = (d.user_category || '').toLowerCase();
    if (cat.includes('individual') || cat.includes('proprietor')) return 'personal';
    if (cat.includes('partnership') || cat.includes('llp'))       return 'partnership';
    return 'company'; // pvt ltd, ltd, etc.
}

// ── main step builder ────────────────────────────────────────────────────
function buildSteps(d) {
    const up   = d.userProfile || {};
    const kind = entityKind(d);

    /* ── Step-2 fields are entity-type specific ── */
    const ef = []; // entity fields accumulator

    // Always: Entity Type
    ef.push({ key: 's2_type', label: 'Entity Type', value: d.user_category, verified: !!d.entity_completed });

    // ── GST (all three types) ────────────────────────────────────────────
    ef.push({
        key: 's2_gst_sel', label: 'GSTIN (Selected)',
        value: d.selected_gst,
        verified: d.gst_verified === true,
        optional: true,
    });
    const allGsts = fmtArr(d.gst_numbers);
    if (allGsts && (d.gst_numbers?.length ?? 0) > 1) {
        ef.push({
            key: 's2_gst_all', label: `All GSTINs (${d.gst_numbers.length} found)`,
            value: allGsts,
            verified: false,
            optional: true,
        });
    }

    // ── Udyam (all three types) ──────────────────────────────────────────
    ef.push({
        key: 's2_msme_sel', label: 'Udyam URN (Selected)',
        value: d.selected_msme,
        verified: d.udyam_verified === true,
        optional: true,
    });
    const allMsme = fmtArr(d.msme_numbers);
    if (allMsme && (d.msme_numbers?.length ?? 0) > 1) {
        ef.push({
            key: 's2_msme_all', label: `All Udyam URNs (${d.msme_numbers.length} found)`,
            value: allMsme,
            verified: false,
            optional: true,
        });
    }

    // ── CIN / LLPIN (company + partnership) ─────────────────────────────
    if (kind === 'company' || kind === 'partnership') {
        const cinLabel  = kind === 'partnership' ? 'LLPIN / CIN (Selected)' : 'CIN (Selected)';
        const cinAllLbl = kind === 'partnership' ? 'All LLPINs / CINs' : `All CINs (${d.cin_numbers?.length ?? 0} found)`;
        ef.push({
            key: 's2_cin_sel', label: cinLabel,
            value: d.selected_cin || d.llpin,
            verified: !!d.selected_cin || !!d.llpin,
            optional: true,
        });
        const allCins = fmtArr(d.cin_numbers);
        if (allCins && (d.cin_numbers?.length ?? 0) > 1) {
            ef.push({
                key: 's2_cin_all', label: cinAllLbl,
                value: allCins,
                verified: false,
                optional: true,
            });
        }
    }

    // ── Selected Director (company only) ─────────────────────────────────
    if (kind === 'company') {
        ef.push({
            key: 's2_dir', label: 'Selected Director',
            value: d.selected_director,
            verified: false,
            optional: true,
        });
    }

    // ── Aadhaar-PAN Name Match (all types, if available) ─────────────────
    if (d.aadhar_name) {
        ef.push({
            key: 's2_aadhar_match', label: 'Aadhaar-PAN Name Match',
            value: 'Matched',
            verified: true,
            optional: true,
        });
    }

    // ── Aadhaar Verification Status (all types) ──────────────────────────
    ef.push({
        key: 's2_aadhar_status', label: 'Aadhaar Status',
        value: capitalize(d.aadhar_status) || 'Pending',
        verified: d.aadhar_status === 'verified',
        badge: d.aadhar_status || 'pending',
        optional: false, // always show
    });

    return [
        {
            label: 'STEP 1\nBASIC INFO',
            idx: 0,
            fields: [
                { key: 's1_name',  label: 'Full Name',  value: up.full_name || d.entity_name || d.aadhar_name, verified: !!d.aadhar_name || !!d.pan_completed },
                { key: 's1_email', label: 'Email',      value: up.email,     verified: !!up.email },
                { key: 's1_phone', label: 'Phone',      value: up.phone,     verified: !!up.phone },
                { key: 's1_pan',   label: 'PAN Number', value: d.pan_number, verified: !!d.pan_completed },
            ],
        },
        {
            label: 'STEP 2\nENTITY DETAILS',
            idx: 1,
            fields: ef.filter(f => !f.optional || !!f.value),
        },
        {
            label: 'STEP 3\nBANK ACCOUNT',
            idx: 2,
            fields: [
                { key: 's3_acc',  label: 'Account Number', value: d.bank_account_no, verified: d.bank_verify_status === 'verified' },
                { key: 's3_ifsc', label: 'IFSC Code',      value: d.ifsc_code,       verified: d.bank_verify_status === 'verified' },
            ],
        },
        {
            label: 'STEP 4\nAGREEMENT',
            idx: 3,
            fields: [
                { key: 's4_match', label: 'Bank-PAN Name Match', value: d.bank_verify_status === 'verified' ? 'Matched' : 'Pending',    verified: d.bank_verify_status === 'verified' },
                { key: 's4_agr',   label: 'Agreement Status',    value: d.agreement_completed ? 'Auto-populated Fields OK' : 'Pending', verified: !!d.agreement_completed },
                { key: 's4_esign', label: 'eSign Status',        value: d.signed_agreement_url ? 'Completed' : 'Pending',               verified: !!d.signed_agreement_url },
            ],
        },
    ];
}

function getStatus(d) {
    if (!d) return { label: '…', cls: '' };
    if (d.onboarding_flag === 1)                                        return { label: 'Completed',       cls: 'prv-s-completed' };
    if (d.aadhar_status === 'blocked' || d.bank_verify_status === 'blocked') return { label: 'Blocked',    cls: 'prv-s-blocked' };
    if (d.agreement_completed)                                          return { label: 'Agreement Done',  cls: 'prv-s-agreement' };
    if (d.bank_completed)                                               return { label: 'Bank Verified',   cls: 'prv-s-bank' };
    if (d.entity_completed)                                             return { label: 'Entity Verified', cls: 'prv-s-entity' };
    if (d.pan_completed)                                                return { label: 'PAN Verified',    cls: 'prv-s-pan' };
    return { label: 'Pending for Review', cls: 'prv-s-pending' };
}

export default function PartnerReviewModal({ partner, onClose, onActionComplete }) {
    const [detail, setDetail]               = useState(null);
    const [loading, setLoading]             = useState(true);
    const [actions, setActions]             = useState({});
    const [finalComment, setFinalComment]   = useState('');
    const [uploads, setUploads]             = useState({});
    const [reviewSaving, setReviewSaving]   = useState(false);
    const [reviewSaved,  setReviewSaved]    = useState(false);
    const [confirmAction, setConfirmAction]     = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading]     = useState(false);
    const [actionDone, setActionDone]           = useState(null);
    const [actionError, setActionError]         = useState('');
    // ── Verification states (GST / Udyam — company & partnership only) ──
    const [gstVerified,   setGstVerified]   = useState(false);
    const [udyamVerified, setUdyamVerified] = useState(false);
    const [verifying,     setVerifying]     = useState({ gst: false, udyam: false });
    const [verifyError,   setVerifyError]   = useState('');
    const fileRefs = useRef({});

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`${BACKEND_URL}/api/partners/${partner.id}`).then(r => r.ok ? r.json() : null),
            fetch(`${BACKEND_URL}/api/partners/${partner.id}/review`).then(r => r.ok ? r.json() : null),
        ])
            .then(([detailJson, reviewJson]) => {
                if (detailJson?.data) {
                    setDetail(detailJson.data);
                    setGstVerified(!!detailJson.data.gst_available);
                    setUdyamVerified(!!detailJson.data.udyam_verified);
                }
                if (reviewJson?.data) {
                    const { field_notes = [], final_comment = '' } = reviewJson.data;
                    // Restore actions state from saved field_notes
                    const restored = {};
                    field_notes.forEach(n => {
                        restored[n.field_key] = {
                            val: n.admin_value || '',
                            cmt: n.admin_comment || '',
                            upload_url: n.admin_upload_url || '',
                        };
                    });
                    setActions(restored);
                    setFinalComment(final_comment || '');
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [partner.id]);

    const saveReview = async () => {
        setReviewSaving(true);
        setReviewSaved(false);
        try {
            const field_notes = Object.entries(actions).map(([field_key, v]) => ({
                field_key,
                admin_value:      v.val        || '',
                admin_comment:    v.cmt        || '',
                admin_upload_url: v.upload_url || '',
            })).filter(n => n.admin_value || n.admin_comment || n.admin_upload_url);

            await fetch(`${BACKEND_URL}/api/partners/${partner.id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field_notes, final_comment: finalComment }),
            });
            setReviewSaved(true);
            setTimeout(() => setReviewSaved(false), 2500);
        } catch (err) {
            console.error('Failed to save review:', err);
        } finally {
            setReviewSaving(false);
        }
    };

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const setAction = (key, field, val) => {
        setActions(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
        if (field === 'act') {
            if (key === 's2_gst_sel')       handleVerify('gst',    val === 'approve');
            if (key === 's2_msme_sel')      handleVerify('udyam',  val === 'approve');
            if (key === 's2_aadhar_status') handleVerify('aadhar', val === 'approve');
        }
    };
    const getAction = (key, field) => actions[key]?.[field] ?? '';

    const handleAction = async (type) => {
        if (type === 'reject' && !rejectionReason.trim()) {
            setActionError('Please enter a rejection reason before confirming.');
            return;
        }
        setActionLoading(true);
        setActionError('');
        try {
            const body = type === 'reject' ? { reason: rejectionReason.trim() } : {};
            const res = await fetch(`${BACKEND_URL}/api/partners/${partner.id}/${type}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Action failed.');
            setActionDone({ type });
            setConfirmAction(null);
            // Refresh parent list after a short delay so the success screen is visible
            setTimeout(() => {
                onActionComplete?.();
                onClose();
            }, 2200);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * Update gst_verified / udyam_verified / aadhar_status for this partner.
     * type: 'gst' | 'udyam' | 'aadhar'
     */
    const handleVerify = async (type, newVal) => {
        const endpointMap = { gst: 'verify-gst', udyam: 'verify-udyam', aadhar: 'verify-aadhar' };
        const endpoint = endpointMap[type];
        if (!endpoint) return;

        setVerifying(p => ({ ...p, [type]: true }));
        setVerifyError('');
        try {
            const res = await fetch(`${BACKEND_URL}/api/partners/${partner.id}/${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: newVal }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Verification update failed.');
            // Update local state so UI reflects the change immediately
            if (type === 'gst')   { setGstVerified(newVal);   setDetail(p => ({ ...p, gst_verified: newVal })); }
            if (type === 'udyam') { setUdyamVerified(newVal); setDetail(p => ({ ...p, udyam_verified: newVal })); }
            if (type === 'aadhar') setDetail(p => ({ ...p, aadhar_status: newVal ? 'verified' : 'blocked' }));
        } catch (err) {
            setVerifyError(err.message);
        } finally {
            setVerifying(p => ({ ...p, [type]: false }));
        }
    };

    const status = getStatus(detail);

    return (
        <div className="prv-overlay" onClick={onClose}>
            <div className="prv-modal" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="prv-header">
                    <div className="prv-header-left">
                        <button className="prv-back-btn" onClick={onClose}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Back
                        </button>
                        <div>
                            <div className="prv-title-row">
                                <h2 className="prv-title">Onboarding Review</h2>
                                {detail && (
                                    <span className={`prv-status-badge ${status.cls}`}>
                                        <span className="prv-status-dot" />
                                        {status.label}
                                    </span>
                                )}
                            </div>
                            <p className="prv-subtitle">
                                #{partner.auth_user_id?.slice(0, 8)}…
                                {partner.partner_name && ` · ${partner.partner_name}`}
                                {detail?.user_category && ` · (${detail.user_category})`}
                            </p>
                        </div>
                    </div>
                    <div className="prv-header-right">
                        {!detail?.signed_agreement_url && (
                            <button className="prv-hdr-btn prv-hdr-approve" onClick={() => setConfirmAction('approve')}>✓ Approve For Agreement</button>
                        )}
                        <button className="prv-hdr-btn prv-hdr-reject"  onClick={() => setConfirmAction('reject')}>✕ Reject</button>
                        <div className="prv-legend">
                            <span className="prv-legend-dot" /> Verified &nbsp;·&nbsp; <span className="prv-pending-label">Pending</span> Not Verified
                        </div>
                    </div>
                </div>

                {/* Eligibility pill — shown inline for non-personal entities, hidden once eSigned */}
                {detail && entityKind(detail) !== 'personal' && !detail.signed_agreement_url && (
                    <div style={{ padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`prv-eligibility-pill ${gstVerified && udyamVerified ? 'prv-pill-eligible' : 'prv-pill-blocked'}`}>
                            {gstVerified && udyamVerified ? '✓ Eligible to Sign' : '⏳ Blocked from Signing'}
                        </span>
                        {verifyError && <span style={{ fontSize: 12, color: '#DC2626' }}>{verifyError}</span>}
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>Approve GST &amp; Udyam rows below to unblock</span>
                    </div>
                )}

                {/* ── Body ── */}
                {loading ? (
                    <div className="prv-loading">
                        <div className="prv-spinner" />
                        Loading partner data…
                    </div>
                ) : !detail ? (
                    <div className="prv-loading prv-error-txt">Failed to load partner data.</div>
                ) : (
                    <div className="prv-content">
                        {/* Sticky column headers */}
                        <div className="prv-grid prv-table-head">
                            <div className="prv-th">Stage</div>
                            <div className="prv-th">Field Name</div>
                            <div className="prv-th">Field Value (User Input)</div>
                            <div className="prv-th">Admin Action</div>
                            <div className="prv-th">Admin Value</div>
                            <div className="prv-th">Admin Comment</div>
                            <div className="prv-th">Admin Upload</div>
                        </div>

                        {/* Step groups */}
                        {buildSteps(detail).map((step) => (
                            <div
                                key={step.idx}
                                className="prv-step-group"
                                style={{ '--sc': STEP_COLORS[step.idx], '--sb': STEP_BG[step.idx] }}
                            >
                                {step.fields.map((f, fi) => (
                                    <div className="prv-grid prv-row" key={f.key}>
                                        {/* Stage */}
                                        <div className="prv-cell prv-cell-stage">
                                            {fi === 0 && (
                                                <span className="prv-stage-lbl" style={{ color: STEP_COLORS[step.idx] }}>
                                                    {step.label}
                                                </span>
                                            )}
                                        </div>
                                        {/* Field Name */}
                                        <div className="prv-cell prv-cell-field">
                                            <span>{f.label}</span>
                                            <VerifiedDot verified={f.verified} />
                                        </div>
                                        {/* Value */}
                                        <div className="prv-cell prv-cell-value">
                                            {f.badge
                                                ? <span className={`prv-svb prv-svb-${f.badge}`}>{f.value}</span>
                                                : f.value
                                                    ? <span className="prv-val">{f.value}</span>
                                                    : <span className="prv-val-empty">—</span>
                                            }
                                        </div>
                                        {/* Admin Action — only for GST, Udyam, Aadhaar */}
                                        <div className="prv-cell prv-cell-action">
                                            {(f.key === 's2_gst_sel' || f.key === 's2_msme_sel' || f.key === 's2_aadhar_status') && (
                                                <>
                                                    <label className={`prv-radio ${getAction(f.key, 'act') === 'approve' ? 'prv-radio-yes' : ''}`}>
                                                        <input type="radio" name={`act-${f.key}`} onChange={() => setAction(f.key, 'act', 'approve')} />
                                                        Approve
                                                    </label>
                                                    <label className={`prv-radio ${getAction(f.key, 'act') === 'reject' ? 'prv-radio-no' : ''}`}>
                                                        <input type="radio" name={`act-${f.key}`} onChange={() => setAction(f.key, 'act', 'reject')} />
                                                        Reject
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                        {/* Admin Value */}
                                        <div className="prv-cell">
                                            <input
                                                className="prv-input"
                                                placeholder="Admin value…"
                                                value={getAction(f.key, 'val')}
                                                onChange={e => setAction(f.key, 'val', e.target.value)}
                                            />
                                        </div>
                                        {/* Comment */}
                                        <div className="prv-cell">
                                            <input
                                                className="prv-input"
                                                placeholder="Comment…"
                                                value={getAction(f.key, 'cmt')}
                                                onChange={e => setAction(f.key, 'cmt', e.target.value)}
                                            />
                                        </div>
                                        {/* Upload */}
                                        <div className="prv-cell prv-cell-upload">
                                            <input
                                                type="file"
                                                style={{ display: 'none' }}
                                                ref={el => { fileRefs.current[f.key] = el; }}
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setUploads(p => ({ ...p, [f.key]: file.name }));
                                                }}
                                            />
                                            <button className="prv-upload-btn" onClick={() => fileRefs.current[f.key]?.click()}>
                                                ↑ Upload
                                            </button>
                                            {uploads[f.key] && (
                                                <span className="prv-upload-name" title={uploads[f.key]}>
                                                    {uploads[f.key].length > 14 ? uploads[f.key].slice(0, 12) + '…' : uploads[f.key]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Final comment row */}
                        <div className="prv-grid prv-row prv-final-row">
                            <div className="prv-cell prv-cell-stage prv-cell-final-stage">
                                <span className="prv-stage-lbl" style={{ color: '#374151' }}>ADMIN<br />FINAL<br />COMMENT</span>
                            </div>
                            <div className="prv-cell prv-cell-final-span">
                                <input
                                    className="prv-input"
                                    style={{ fontSize: '13px' }}
                                    placeholder="Enter final admin comment…"
                                    value={finalComment}
                                    onChange={e => setFinalComment(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="prv-footer">
                    <div className="prv-doc-links">
                        {detail?.signed_agreement_url && (
                            <a href={detail.signed_agreement_url} target="_blank" rel="noopener noreferrer" className="prv-doc-link">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                    <path d="M2 11h10M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Signed Agreement
                            </a>
                        )}
                        {detail?.audit_trail_url && (
                            <a href={detail.audit_trail_url} target="_blank" rel="noopener noreferrer" className="prv-doc-link">
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                    <path d="M2 11h10M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Audit Trail
                            </a>
                        )}
                        {!detail?.signed_agreement_url && !detail?.audit_trail_url && (
                            <span className="prv-no-docs">No documents yet</span>
                        )}
                    </div>
                    <button
                        className={`prv-save-btn ${reviewSaved ? 'prv-save-btn-done' : ''}`}
                        onClick={saveReview}
                        disabled={reviewSaving}
                    >
                        {reviewSaving
                            ? <><span className="prv-confirm-spinner" /> Saving…</>
                            : reviewSaved
                                ? '✓ Saved'
                                : 'Save Review Notes'
                        }
                    </button>
                </div>

            </div>

                {/* ── Confirmation Dialog ── */}
                {confirmAction && !actionDone && (
                    <div className="prv-confirm-overlay" onClick={() => !actionLoading && setConfirmAction(null)}>
                        <div className="prv-confirm-box" onClick={e => e.stopPropagation()}>
                            <div className={`prv-confirm-icon ${confirmAction === 'approve' ? 'prv-ci-approve' : 'prv-ci-reject'}`}>
                                {confirmAction === 'approve'
                                    ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    : <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                }
                            </div>
                            <h3 className="prv-confirm-title">
                                {confirmAction === 'approve' ? 'Approve Application?' : 'Reject Application?'}
                            </h3>
                            <p className="prv-confirm-desc">
                                {confirmAction === 'approve'
                                    ? 'This will mark all onboarding steps as complete and allow the partner to proceed to the Agreement step.'
                                    : 'The partner\'s data will be archived and they will start onboarding fresh from the beginning.'
                                }
                            </p>
                            <p className="prv-confirm-partner">
                                {partner.partner_name || partner.auth_user_id?.slice(0, 16) + '…'}
                            </p>
                            {confirmAction === 'reject' && (
                                <div className="prv-reject-reason-wrap">
                                    <label className="prv-reject-reason-label">Rejection Reason <span style={{ color: '#DC2626' }}>*</span></label>
                                    <textarea
                                        className="prv-reject-reason-input"
                                        placeholder="Enter reason for rejection…"
                                        value={rejectionReason}
                                        onChange={e => { setRejectionReason(e.target.value); setActionError(''); }}
                                        rows={3}
                                    />
                                </div>
                            )}
                            {actionError && (
                                <p className="prv-confirm-error">{actionError}</p>
                            )}
                            <div className="prv-confirm-actions">
                                <button
                                    className="prv-confirm-cancel"
                                    onClick={() => { setConfirmAction(null); setActionError(''); setRejectionReason(''); }}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={`prv-confirm-proceed ${confirmAction === 'approve' ? 'prv-cp-approve' : 'prv-cp-reject'}`}
                                    onClick={() => handleAction(confirmAction)}
                                    disabled={actionLoading}
                                >
                                    {actionLoading
                                        ? <><span className="prv-confirm-spinner" /> Processing…</>
                                        : confirmAction === 'approve' ? '✓ Confirm Approve' : '✕ Confirm Reject'
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Success Screen ── */}
                {actionDone && (
                    <div className="prv-confirm-overlay">
                        <div className="prv-confirm-box prv-done-box">
                            <div className={`prv-confirm-icon ${actionDone.type === 'approve' ? 'prv-ci-approve' : 'prv-ci-reject'}`}>
                                {actionDone.type === 'approve'
                                    ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    : <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                                }
                            </div>
                            <h3 className="prv-confirm-title">
                                {actionDone.type === 'approve' ? 'Application Approved!' : 'Application Rejected!'}
                            </h3>
                            <p className="prv-confirm-desc">
                                {actionDone.type === 'approve'
                                    ? 'Partner can now proceed to sign the agreement.'
                                    : 'Partner will need to restart the onboarding process.'
                                }
                            </p>
                            <div className="prv-done-closing">Closing…</div>
                        </div>
                    </div>
                )}

        </div>
    );
}
