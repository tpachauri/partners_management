import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UniversitySidebar from '../components/UniversitySidebar';
import UniversityActionCard from '../components/dashboard/UniversityActionCard';
import IdentityDetailsContainer from '../components/dashboard/IdentityDetailsContainer';
import UniversityInfoField from '../components/dashboard/UniversityInfoField';
import LiveSourceModal from '../components/dashboard/LiveSourceModal';
import LiveDataModal from '../components/dashboard/LiveDataModal';
import SearchBar from '../components/dashboard/SearchBar';
import '../components/Sidebar.css';
import './UniversityDetails.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const UniversityDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [university, setUniversity] = useState(location.state?.universityData || null);
    const [activeTab, setActiveTab] = useState('university-master');
    const [selectedCard, setSelectedCard] = useState(null);

    // Academics program state
    const [programs, setPrograms] = useState([]);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [programsLoading, setProgramsLoading] = useState(false);
    const [specsLoading, setSpecsLoading] = useState(false);
    const [offeringsLoading, setOfferingsLoading] = useState(false);
    const [offeringModalLoading, setOfferingModalLoading] = useState(false);
    // Search state for master tabs
    const [masterSearchQuery, setMasterSearchQuery] = useState('');

    // -- Card data state (holds editable form values per card) --
    const [cardFieldData, setCardFieldData] = useState({});
    const [saving, setSaving] = useState(false);

    // Map card IDs to their response property names from getUniversityById
    const cardToColumn = {
        profile: null,                    // flat fields on university object
        address: 'addresses',
        metadata: 'metadata',
        ranking: 'rankings',
        accredition: 'accreditations',
        highlights: 'highlights',
        gallery: 'gallery',
        faqs: 'faqs',
        'university-faculty': 'faculty',
        'student-testimonials': 'alumni',
        'hiring-partners': 'hiring_partners',
        'placement-outcome': 'placement_stats',
        'university-scholarship': 'scholarships',
    };

    // Map card IDs to API path segment for save/create
    const cardToApiPath = {
        address: 'addresses',
        metadata: 'metadata',
        ranking: 'rankings',
        accredition: 'accreditations',
        highlights: 'highlights',
        gallery: 'gallery',
        faqs: 'faqs',
        'university-faculty': 'faculty',
        'student-testimonials': 'alumni',
        'hiring-partners': 'hiring-partners',
        'placement-outcome': 'placement-stats',
        'university-scholarship': 'scholarships',
    };

    // Map card IDs to source_data keys
    const cardToSourceKey = {
        profile: 'university',
        address: 'addresses',
        metadata: 'metadata',
        ranking: 'rankings',
        accredition: 'accreditations',
        highlights: null,
        gallery: 'gallery',
        faqs: 'faqs',
        'university-faculty': 'faculty',
        'student-testimonials': 'alumni',
        'hiring-partners': 'hiring_partners',
        'placement-outcome': 'placement_stats',
        'university-scholarship': 'scholarships',
    };

    // Map field labels to JSON keys for each card
    const fieldKeyMap = {
        profile: {
            'Short Name': 'short_name',
            'Full Legal Name': 'full_legal_name',
            'Slug': 'slug',
            'Establishment Year': 'establishment_year',
            'Logo URL': 'logo_url',
            'Banner Image URL': 'banner_image_url',
            'Brochure URL': 'brochure_url',
            'Brand Primary Color': 'brand_primary_hex',
            'WES Approved (Yes/No)': 'is_wes_approved',
            'Campus Access (Yes/No)': 'has_campus_access',
            'Partner Code': 'partner_code',
            'University Main Link': 'university_main_link',
        },
        address: {
            'Campus Type': 'campus_type',
            'Address Line': 'address_line',
            'City': 'city',
            'State': 'state',
            'Pincode': 'pincode',
            'Latitude': 'latitude',
            'Longitude': 'longitude',
            'Maps Embed URL': 'maps_embed_url',
            'Nearest Transport Hub': 'nearest_transport_hub',
        },
        metadata: {
            'Meta Title': 'meta_title',
            'Meta Description': 'meta_description',
            'Canonical URL': 'canonical_url',
            'OG Image URL': 'og_image_url',
            'Schema Markup': 'schema_markup',
            'Keywords Vector': 'keywords_vector',
        },
        ranking: {
            'Ranking Agency': 'agency',
            'Ranking Year': 'ranking_year',
            'Rank Value': 'rank_value',
            'Rank Band': 'rank_band',
            'Category': 'category',
            'Rank Display Text': 'rank_display_text',
            'Verification URL': 'verification_url',
            'Primary Highlight (Yes/No)': 'is_primary_highlight',
        },
        accredition: {
            'Accreditation Body': 'accreditation_body',
            'Grade': 'grade',
            'Score': 'score',
            'Accreditation Year': 'accreditation_year',
            'Proof Document URL': 'proof_doc_url',
            'International (Yes/No)': 'is_international',
        },
        'university-scholarship': {
            'Provider Name': 'provider_name',
            'Scholarship Name': 'scholarship_name',
            'Scholarship Type': 'scholarship_type',
            'Degree Level': 'degree_level',
            'Field of Study': 'field_of_study',
            'Scholarship Value': 'scholarship_value',
            'Eligibility Criteria': 'eligibility_criteria',
        },
        highlights: {
            'Highlight Type': 'highlight_type',
            'Title': 'title',
            'Description': 'description',
            'Icon SVG Code': 'icon_svg_code',
            'Display Order': 'display_order',
            'Featured (Yes/No)': 'is_featured',
        },
        gallery: {
            'Category': 'category',
            'Media Type': 'media_type',
            'URL': 'url',
            'Thumbnail URL': 'thumbnail_url',
            'Caption': 'caption',
            'Featured (Yes/No)': 'is_featured',
            '360 Virtual Tour (Yes/No)': 'is_360_virtual_tour',
        },
        faqs: {
            'Category': 'category',
            'Question': 'question',
            'Answer': 'answer_html',
            'Display Order': 'display_order',
            'Search Vector': 'search_vector',
            'Active (Yes/No)': 'is_active',
        },
    };

    // -- Academics field ? key mapping --
    const academicsFieldKeyMap = {
        'degree-master': {
            'Program Name': 'program_name',
            'Global Degree Type': 'global_degree_type',
            'Program Level': 'program_level',
            'Mode': 'mode',
            'Total Credits': 'total_credits',
            'Duration (Months)': 'duration_months',
            'Max Duration (Months)': 'max_duration_months',
            'WES Recognized (Yes/No)': 'is_wes_recognized',
            'NEP Compliant (Yes/No)': 'is_nep_compliant',
            'Exit Pathways': 'exit_pathways_json',
            'Sample Certificate URL': 'sample_certificate_url',
            'Brochure PDF URL': 'brochure_pdf_url',
        },
        'program-offering': {
            'SKU Code': 'sku_code',
            'Industry Partner ID': 'industry_partner_id',
            'Co Brand Label': 'co_brand_label',
            'Dual Degree (Yes/No)': 'is_dual_degree',
            'Exam Center States': 'exam_center_states_json',
            'Seat Capacity': 'seat_capacity',
            'Application Deadline': 'application_deadline',
            'Active (Yes/No)': 'is_active',
        },
        'program-specialisation': {
            'Specialization Name': 'specialization_name',
            'Slug': 'slug',
            'Description': 'description_html',
            'Career Roles': 'career_roles_json',
            'Category Tag': 'category_tag',
            'Thumbnail Image URL': 'thumbnail_image_url',
            'Specialisation Brochure URL': 'specialization_brochure_url',
        },
        'fee-structure': {
            'Fee Type': 'fee_type',
            'Student Category': 'student_category',
            'Payment Plan Type': 'payment_plan_type',
            'Currency': 'currency',
            'Amount': 'amount',
            'Finance Whitelist': 'finance_whitelist_json',
            'Fee Note': 'fee_note',
            'Eligible for Loan (Yes/No)': 'is_eligible_for_loan',
        },
        'eligibility': {
            'Academic Level Required': 'academic_level_required',
            'Min Score % (General)': 'min_score_percent_gen',
            'Min Score % (Reserved)': 'min_score_percent_reserved',
            'Stream Rules': 'stream_rules_json',
            'Mandatory Subjects': 'mandatory_subjects_json',
            'Lateral Entry (Yes/No)': 'is_lateral_entry',
            'Max Backlogs Allowed': 'max_backlogs_allowed',
            'Max Education Gap Years': 'max_education_gap_years',
            'Provisional Allowed (Yes/No)': 'is_provisional_allowed',
            'Student Category': 'student_category_json',
            'Raw Criteria': 'raw_criteria',
            'Qualifying Degree': 'qualifying_degrees',
            'Documents Required': 'documents_required',
            'Target Audience': 'target_audience',
        },
        'curriculum': {
            'Term Number': 'term_number',
            'Term Label': 'term_label',
            'Subject Name': 'subject_name',
            'Subject Code': 'subject_code',
            'Credit Points': 'credit_points',
            'Elective (Yes/No)': 'is_elective',
            'Topics Covered': 'topics_covered_json',
            'Project Work (Yes/No)': 'is_project_work',
        },
        'addon': {
            'Addon Name': 'addon_name',
            'Addon Type': 'addon_type',
            'Provider Name': 'provider_name',
            'Price Amount': 'price_amount',
            'Mandatory (Yes/No)': 'is_mandatory',
            'Description': 'description_html',
            'Thumbnail URL': 'thumbnail_url',
        },
        'offering-faculty': {
            'Name': 'name',
            'Designation': 'designation',
            'Qualification': 'qualification',
            'Industry Exp (Years)': 'industry_exp_years',
            'Profile Image URL': 'profile_image_url',
            'Video Intro URL': 'video_intro_url',
            'Star Faculty (Yes/No)': 'is_star_faculty',
        },
    };

    // State for the selected program's full DB data
    const [selectedProgramData, setSelectedProgramData] = useState(null);
    // Source data for the currently-being-edited specialization/offering item
    const [editingSourceData, setEditingSourceData] = useState(null);

    // -- Entity table state (for table-first view on sub-entity cards) --
    const [cardViewMode, setCardViewMode] = useState(null);       // 'table' | 'form' | null
    const [entityTableData, setEntityTableData] = useState([]);    // rows for standalone entities
    const [editingEntityId, setEditingEntityId] = useState(null);  // row ID being edited (null = new)
    const [isLoading, setIsLoading] = useState(false);             // loading spinner

    // -- Live Source state --
    const [liveSourceModalOpen, setLiveSourceModalOpen] = useState(false);
    const [liveSourceTarget, setLiveSourceTarget] = useState(null);
    const [liveSourceLoading, setLiveSourceLoading] = useState(false);
    const [liveSourceData, setLiveSourceData] = useState({});
    const [lsqData, setLsqData] = useState({});           // { [cardId]: lsq row with extracted_data }
    const [lsqEntries, setLsqEntries] = useState([]);     // all lsq rows for LSQ tab
    const [lsqLoading, setLsqLoading] = useState(false);
    const [liveDataModalOpen, setLiveDataModalOpen] = useState(false);
    const [liveDataCardId, setLiveDataCardId] = useState(null);
    const [liveSourceContext, setLiveSourceContext] = useState(null);
    // Shape: { programId, programName, offeringId, offeringName, specId, specName }
    const [savedRowsByCard, setSavedRowsByCard] = useState(() => {
        try {
            const stored = localStorage.getItem(`livedata-saved-${id}`);
            return stored ? JSON.parse(stored) : {};
        } catch { return {}; }
    });  // { [cardId]: { rowIndex: true } } — persists across modal open/close and page refresh

    // Sync savedRowsByCard to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(`livedata-saved-${id}`, JSON.stringify(savedRowsByCard));
        } catch { /* ignore quota errors */ }
    }, [savedRowsByCard, id]);

    const EXTRACTION_API_URL = import.meta.env.VITE_EXTRACTION_API_URL || '';

    // Map card IDs to microservice target_table values (University Master only)
    const cardToTargetTable = {
        profile: 'university',
        address: 'university_address',
        metadata: 'uni_metadata',
        ranking: 'university_ranking',
        accredition: 'university_accreditation',
        highlights: 'university_highlight',
        gallery: 'university_gallery',
        faqs: 'university_faq',
        'university-faculty': 'university_faculty',
        'student-testimonials': 'alumni_success',
        'hiring-partners': 'hiring_partner',
        'placement-outcome': 'placement_stats',
        'university-scholarship': 'university_scholarship',
    };

    // Human-readable labels for target_table values (for LSQ tab)
    const targetTableLabels = {
        university: 'Profile',
        university_address: 'Address',
        uni_metadata: 'Metadata',
        university_ranking: 'Ranking',
        university_accreditation: 'Accreditation',
        university_highlight: 'Highlights',
        university_gallery: 'Gallery',
        university_faq: 'FAQs',
        university_faculty: 'Faculty',
        alumni_success: 'Student Testimonials',
        hiring_partner: 'Hiring Partners',
        placement_stats: 'Placement Outcome',
        university_scholarship: 'Scholarship',
        program_specialization: 'Specializations',
        program_curriculum: 'Curriculum',
        program_eligibility: 'Eligibility',
        fee_structure: 'Fee Structure',
        program_addon: 'Addon',
        offering_faculty: 'Offering Faculty',
    };

    // Map offering sub-tab IDs to microservice target_table values
    const offeringSubTabToTargetTable = {
        'curriculum': 'program_curriculum',
        'eligibility': 'program_eligibility',
        'fee-structure': 'fee_structure',
        'addon': 'program_addon',
        'offering-faculty': 'offering_faculty',
    };

    // Map offering target_table to API save path
    const offeringSubApiPath = {
        program_curriculum: 'curriculum',
        program_eligibility: 'eligibility',
        fee_structure: 'fees',
        program_addon: 'addons',
        offering_faculty: 'faculty',
    };

    // Table column config for all entities that display as tables
    const ENTITY_TABLE_CONFIG = {
        address: { columns: [{ h: 'CAMPUS TYPE', k: 'campus_type' }, { h: 'CITY', k: 'city' }, { h: 'STATE', k: 'state' }, { h: 'PIN CODE', k: 'pin_code' }] },
        ranking: { columns: [{ h: 'RANKING AGENCY', k: 'agency' }, { h: 'RANKING YEAR', k: 'ranking_year' }, { h: 'RANK VALUE', k: 'rank_value' }] },
        accredition: { columns: [{ h: 'ACCREDITATION BODY', k: 'accreditation_body' }, { h: 'GRADE', k: 'grade' }, { h: 'SCORE', k: 'score' }] },
        highlights: { columns: [{ h: 'HIGHLIGHT TYPE', k: 'highlight_type' }, { h: 'TITLE', k: 'title' }] },
        gallery: { columns: [{ h: 'CATEGORY', k: 'category' }, { h: 'MEDIA TYPE', k: 'media_type' }] },
        faqs: { columns: [{ h: 'DISPLAY ORDER', k: 'display_order' }, { h: 'CATEGORY', k: 'category' }, { h: 'QUESTION', k: 'question' }] },
        'university-faculty': { columns: [{ h: 'NAME', k: 'name' }, { h: 'DESIGNATION', k: 'designation' }, { h: 'QUALIFICATION', k: 'qualification' }] },
        'student-testimonials': { columns: [{ h: 'NAME', k: 'name' }, { h: 'CURRENT COMPANY', k: 'current_company' }, { h: 'DESIGNATION', k: 'designation' }] },
        'hiring-partners': { columns: [{ h: 'COMPANY NAME', k: 'company_name' }, { h: 'INDUSTRY SECTOR', k: 'industry_sector' }] },
        'placement-outcome': { columns: [{ h: 'ACADEMIC YEAR', k: 'academic_year' }, { h: 'HIGHEST PACKAGE', k: 'highest_package_lpa' }, { h: 'AVG PACKAGE', k: 'avg_package_lpa' }] },
        curriculum: { columns: [{ h: 'TERM NUMBER', k: 'term_number' }, { h: 'TERM LABEL', k: 'term_label' }, { h: 'SUBJECT NAME', k: 'subject_name' }, { h: 'SUBJECT CODE', k: 'subject_code' }] },
        eligibility: { columns: [{ h: 'ACADEMIC LEVEL', k: 'academic_level_required' }, { h: 'MIN SCORE (GEN)', k: 'min_score_percent_gen' }, { h: 'MIN SCORE (RES)', k: 'min_score_percent_reserved' }, { h: 'STUDENT CATEGORY', k: 'student_category_json' }, { h: 'RAW CRITERIA', k: 'raw_criteria' }, { h: 'DOCUMENTS REQUIRED', k: 'documents_required' }] },
        'fee-structure': { columns: [{ h: 'STUDENT CATEGORY', k: 'student_category' }, { h: 'PLAN TYPE', k: 'payment_plan_type' }, { h: 'CURRENCY', k: 'currency' }, { h: 'AMOUNT', k: 'amount' }, { h: 'FEE NOTE', k: 'fee_note' }, { h: 'LOAN ELIGIBLE', k: 'is_eligible_for_loan' }] },
        addon: { columns: [{ h: 'ADDON NAME', k: 'addon_name' }, { h: 'ADDON TYPE', k: 'addon_type' }] },
        'university-scholarship': { columns: [{ h: 'SCHOLARSHIP NAME', k: 'scholarship_name' }, { h: 'SCHOLARSHIP TYPE', k: 'scholarship_type' }, { h: 'DEGREE LEVEL', k: 'degree_level' }, { h: 'SCHOLARSHIP VALUE', k: 'scholarship_value' }] },
        'offering-faculty': { columns: [{ h: 'NAME', k: 'name' }, { h: 'DESIGNATION', k: 'designation' }, { h: 'QUALIFICATION', k: 'qualification' }] },
    };

    const valueFieldKeyMap = {
        'university-faculty': {
            'Name': 'name',
            'Designation': 'designation',
            'Qualification': 'qualification',
            'Industry Exp (Years)': 'industry_exp_years',
            'Profile Image URL': 'profile_image_url',
            'LinkedIn URL': 'linkedin_url',
            'Video Intro URL': 'video_intro_url',
            'Star Faculty (Yes/No)': 'is_star_faculty',
        },
        'student-testimonials': {
            'Name': 'name',
            'Current Company': 'current_company',
            'Designation': 'designation',
            'Hike %': 'hike_percentage',
            'Testimonial Text': 'testimonial_text',
            'Video URL': 'video_url',
            'Image URL': 'image_url',
            'LinkedIn Profile URL': 'linkedin_profile_url',
        },
        'hiring-partners': {
            'Company Name': 'company_name',
            'Logo URL': 'logo_url',
            'Industry Sector': 'industry_sector',
            'Key Recruiter (Yes/No)': 'is_key_recruiter',
            'Active Hiring (Yes/No)': 'is_active_hiring',
        },
        'placement-outcome': {
            'Academic Year': 'academic_year',
            'Highest Package (LPA)': 'highest_package_lpa',
            'Average Package (LPA)': 'avg_package_lpa',
            'Placement %': 'placement_percentage',
            'Total Recruiters': 'total_recruiters',
            'Report PDF URL': 'report_pdf_url',
        },
    };

    const incentivesFieldKeyMap = {
        'offers-master': {
            'Policy Name': 'policy_name',
            'Coupon Name': 'coupon_name',
            'Coupon Subtext': 'coupon_subtext',
            'Currency Type (INR / USD)': 'currency_type',
            'Coupon Code': 'coupon_code',
            'Auto Apply (Yes/No)': 'auto_apply',
            'Visible Tray (Yes/No)': 'visible_tray',
            'Value Config': 'value_config_json',
            'Funding Source Entity': 'funding_source_entity',
            'Commission Calc Basis': 'commission_calc_basis',
            'Stacking Group': 'stacking_group',
            'GST Inclusive (Yes/No)': 'gst_inclusive',
            'Max. Discount': 'max_discount',
            'Max. Claims Per User': 'max_claims_per_user',
            'Valid From': 'valid_from',
            'Valid To': 'valid_to',
            'Applicable Days': 'applicable_days',
            'Applicable Time Window': 'applicable_time_window',
            'Blackout Days (Yes/No)': 'blackout_days_applicable',
            'Active (Yes/No)': 'is_active',
        },
        'offer-ledger': {
            'Opportunity ID': 'opportunity_id',
            'Policy ID': 'policy_id',
            'Applied Source Type': 'applied_source_type',
            'Source Ref ID': 'source_ref_id',
            'Frozen Discount Value': 'frozen_discount_value',
            'Burn Source Entity': 'burn_source_entity',
            'Commission Impact Mode': 'commission_impact_mode',
            'Ledger Status': 'ledger_status',
            'Revocation Reason': 'revocation_reason',
            'Applied At': 'applied_at',
            'Consumed At': 'consumed_at',
        },
    };

    const legalFieldKeyMap = {
        'master-agreement': {
            'Contract Ref Code': 'contract_ref_code',
            'Status': 'contract_status',
            'Payout Model': 'payout_model',
            'Default Commission': 'default_commission_value',
            'Calculation Basis Type': 'calculation_basis_type',
            'GST Exclusive (Yes/No)': 'is_gst_exclusive',
            'Invoice Trigger Event': 'invoice_trigger_event',
            'Credit Period Days': 'credit_period_days',
            'Clawback Window Days': 'clawback_window_days',
            'Retention Bonus Clause': 'retention_bonus_clause',
            'Effective From': 'effective_from',
            'Effective To': 'effective_to',
            'Signed Document URL': 'signed_doc_url',
        },
        'addendums': {
            'Addendum Ref Code': 'addendum_ref_code',
            'Addendum Type': 'addendum_type',
            'Version Number': 'version_number',
            'Change Description': 'change_description',
            'Scope Restriction': 'scope_restriction_json',
            'Digitally Signed (Yes/No)': 'is_digitally_signed',
            'Effective From': 'effective_from',
            'Effective To': 'effective_to',
            'Status': 'status',
        },
    };

    const commercialsFieldKeyMap = {
        'payout-config': {
            'Rule Name': 'rule_name',
            'Payout Component': 'payout_component',
            'Calculation Mode': 'calculation_mode',
            'Payout Value': 'payout_value',
            'Stacking Strategy': 'stacking_strategy',
            'Slab Min Qty': 'slab_min_qty',
            'Slab Max Qty': 'slab_max_qty',
            'Retroactive (Yes/No)': 'is_retroactive',
            'Applicable Product IDs': 'applicable_product_ids',
            'Valid From': 'valid_from',
            'Valid To': 'valid_to',
            'Priority Score': 'priority_score',
        },
        'loan-partners': {
            'Finance Type': 'finance_type',
            'Provider Name': 'provider_name',
            'Interest Rate %': 'interest_rate_pct',
            'Approval TAT Hours': 'approval_tat_hours',
            'Tenure Months': 'tenure_months',
            'Min Loan Amount': 'min_loan_amount',
            'Paperless (Yes/No)': 'is_paperless',
        },
        'wallets': {
            'Currency': 'currency',
            'Accrued Balance': 'accrued_balance',
            'Withdrawable Balance': 'withdrawable_balance',
            'Held Balance': 'held_balance',
            'Total Lifetime Earnings': 'total_lifetime_earnings',
            'Total Lifetime Withdrawn': 'total_lifetime_withdrawn',
            'Wallet Version': 'wallet_version',
            'Frozen (Yes/No)': 'is_frozen',
        },
    };

    const leadsFieldKeyMap = {
        'academic-season': {
            'Season Name': 'season_name',
            'Batch Code': 'batch_code',
            'Active (Yes/No)': 'is_active',
            'Application Open Date': 'application_open_date',
            'Early Bird Deadline': 'early_bird_deadline',
            'Hard Close Deadline': 'hard_close_deadline',
            'Cycle Start Date': 'cycle_start_date',
            'Cycle End Date': 'cycle_end_date',
        },
        'lead-config': {
            'CRM Provider': 'crm_provider',
            'Lead Post URL': 'lead_post_url',
            'Auth Token': 'auth_token',
            'Webhook Secret': 'webhook_secret',
            'Success Redirect URL': 'success_redirect_url',
            'Failure Redirect URL': 'failure_redirect_url',
            'Lead Priority Score': 'lead_priority_score',
        },
    };

    // -- State for tab-specific data --
    const [allSpecializations, setAllSpecializations] = useState([]);
    const [allOfferings, setAllOfferings] = useState([]);
    const [showAddOfferingForm, setShowAddOfferingForm] = useState(false);
    const [newOfferingProgramId, setNewOfferingProgramId] = useState('');
    const [newOfferingSpecId, setNewOfferingSpecId] = useState('');
    const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }
    const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
    const [offerPolicies, setOfferPolicies] = useState({ data: [], source_data: [] });
    const [offerLedger, setOfferLedger] = useState({ data: [], source_data: [] });
    const [contracts, setContracts] = useState({ data: [], source_data: [] });
    const [addendums, setAddendums] = useState({ data: [], source_data: [] });
    const [payoutRules, setPayoutRules] = useState({ data: [], source_data: [] });
    const [partnerWallets, setPartnerWallets] = useState({ data: [], source_data: [] });
    const [leadConfig, setLeadConfig] = useState({ data: null, source_data: null });
    const [academicSeasons, setAcademicSeasons] = useState({ data: [], source_data: [] });
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    // Per-offering sub-entity data for progress bars (keyed by card id)
    const [offeringSubData, setOfferingSubData] = useState({});

    // -- Helper: Calculate progress % from DB data and field key map --
    const calculateProgress = (dbData, keyMap) => {
        if (!dbData || !keyMap) return 0;
        const source = Array.isArray(dbData) ? (dbData[0] || {}) : dbData;
        const keys = Object.values(keyMap);
        const total = keys.length;
        if (total === 0) return 0;
        const filled = keys.filter(key => {
            const val = source[key];
            if (val === null || val === undefined || val === '') return false;
            if (Array.isArray(val) && val.length === 0) return false;
            if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return false;
            return true;
        }).length;
        return Math.round((filled / total) * 100);
    };

    // -- Helper: Derive status from progress --
    const getStatus = (progress) => {
        if (progress === 0) return 'Offline';
        if (progress === 100) return 'Online';
        return 'In Progress';
    };

    // Always fetch full university data from API on mount (location.state only has partial data)
    useEffect(() => {
        if (id) {
            fetchUniversityDetails(id);
        }
    }, [id]);

    // Fetch programs and tab-specific data when university is loaded
    useEffect(() => {
        if (university?.id) {
            fetchPrograms();
            fetchLegalData();
            fetchCommercialsData();
            fetchLeadsData();
            fetchIncentiveData();
        }
    }, [university?.id]);

    // Fetch specializations and offerings when programs are loaded
    useEffect(() => {
        if (programs.length > 0) {
            fetchAllSpecializations();
            fetchAllOfferings();
            // Check LSQ status for each program's specializations
            programs.forEach(p => checkProgramLsqStatus(p.id));
        }
    }, [programs]);

    // Check offering LSQ status when offerings are loaded
    useEffect(() => {
        if (allOfferings.length > 0) {
            allOfferings.forEach(o => checkOfferingLsqStatus(o.id));
        }
    }, [allOfferings]);

    // Fetch and poll LSQ entries every 10s to keep lsqData fresh across all tabs
    useEffect(() => {
        if (!id) return;
        fetchLsqEntries();
        const interval = setInterval(fetchLsqEntries, 10000);
        return () => clearInterval(interval);
    }, [id]);

    // State for LSQ error/warning popup
    const [lsqErrorPopup, setLsqErrorPopup] = useState(null); // { errors, warnings }

    const fetchUniversityDetails = async (uniId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/universities/${uniId}`);
            if (response.ok) {
                const data = await response.json();
                setUniversity({
                    ...data,
                    name: data.full_legal_name || data.short_name || 'University',
                });
            } else {
                setUniversity({ id: uniId, name: 'Unknown University' });
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            setUniversity({ id: uniId, name: 'University' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardClick = (cardId) => {
        // Table-enabled cards ? fetch from dedicated API (which has auto-sync) and show table
        if (ENTITY_TABLE_CONFIG[cardId] && cardId !== 'curriculum') {
            setSelectedCard(cardId);
            setCardViewMode('table');
            setEditingEntityId(null);
            if (university?.id && cardToApiPath[cardId]) {
                // Fetch from dedicated endpoint to trigger auto-sync
                fetchEntityTableData(cardId, university.id);
            }
            // Check if lsq data exists for this card
            checkLsqStatus(cardId);
            return;
        }

        // University Master cards (identity + value) � data from university object
        if (cardId in cardToColumn && university) {
            if (cardId === 'profile') {
                // Profile: pre-fill from flat university fields
                const keyMap = fieldKeyMap[cardId];
                if (keyMap) {
                    const prefilled = {};
                    Object.entries(keyMap).forEach(([label, jsonKey]) => {
                        const val = university[jsonKey];
                        if (label.includes('(Yes/No)')) {
                            prefilled[label] = val === true ? 'Yes' : val === false ? 'No' : '';
                        } else {
                            prefilled[label] = val !== undefined && val !== null ? String(val) : '';
                        }
                    });
                    setCardFieldData(prefilled);
                }
            } else {
                const column = cardToColumn[cardId];
                const dbData = column ? university[column] : null;
                const keyMapObj = fieldKeyMap[cardId] ? fieldKeyMap : valueFieldKeyMap;
                prefillFromData(cardId, dbData, keyMapObj);
                // For singleton sub-entity cards (e.g. metadata), set editingEntityId if row exists
                if (dbData) {
                    const existing = Array.isArray(dbData) ? dbData[0] : dbData;
                    if (existing?.id) setEditingEntityId(existing.id);
                }
            }
        }
        // Academics cards � prefill from program data if available
        else if (academicsFieldKeyMap[cardId]) {
            if (cardId === 'degree-master' && selectedProgramData?.data) {
                const keyMap = academicsFieldKeyMap[cardId];
                const prefilled = {};
                Object.entries(keyMap).forEach(([label, jsonKey]) => {
                    const val = selectedProgramData.data[jsonKey];
                    if (label.includes('(Yes/No)')) {
                        prefilled[label] = val === true ? 'Yes' : val === false ? 'No' : '';
                    } else if (jsonKey.endsWith('_json')) {
                        prefilled[label] = Array.isArray(val) ? val.join(', ') : (val ? String(val) : '');
                    } else {
                        prefilled[label] = val !== undefined && val !== null ? String(val) : '';
                    }
                });
                setCardFieldData(prefilled);
            } else {
                setCardFieldData({});
            }
        }
        // Incentives cards � data from offerPolicies/offerLedger
        else if (incentivesFieldKeyMap[cardId]) {
            const dataSource = cardId === 'offers-master' ? offerPolicies : offerLedger;
            prefillFromData(cardId, dataSource?.data, incentivesFieldKeyMap);
        }
        // Legal cards
        else if (legalFieldKeyMap[cardId]) {
            const dataSource = cardId === 'master-agreement' ? contracts : addendums;
            prefillFromData(cardId, dataSource?.data, legalFieldKeyMap);
        }
        // Commercials cards
        else if (commercialsFieldKeyMap[cardId]) {
            let dataSource;
            if (cardId === 'payout-config') dataSource = payoutRules;
            else if (cardId === 'loan-partners') dataSource = university ? { data: university.financing_options } : null;
            else if (cardId === 'wallets') dataSource = partnerWallets;
            else dataSource = null;
            prefillFromData(cardId, dataSource?.data, commercialsFieldKeyMap);
        }
        // Leads cards
        else if (leadsFieldKeyMap[cardId]) {
            const dataSource = cardId === 'lead-config' ? leadConfig : academicSeasons;
            prefillFromData(cardId, dataSource?.data, leadsFieldKeyMap);
        }
        else {
            setCardFieldData({});
        }
        setSelectedCard(cardId);
    };

    // Helper to pre-fill card fields from DB data
    const prefillFromData = (cardId, dbData, keyMapObj) => {
        if (dbData) {
            const sourceData = Array.isArray(dbData) ? (dbData[0] || {}) : dbData;
            const keyMap = keyMapObj[cardId];
            if (keyMap) {
                const prefilled = {};
                Object.entries(keyMap).forEach(([label, jsonKey]) => {
                    const val = sourceData[jsonKey];
                    if (label.includes('(Yes/No)')) {
                        prefilled[label] = val === true ? 'Yes' : val === false ? 'No' : '';
                    } else {
                        prefilled[label] = Array.isArray(val) ? val.join(', ') : (val !== undefined && val !== null ? String(val) : '');
                    }
                });
                setCardFieldData(prefilled);
            } else {
                setCardFieldData({});
            }
        } else {
            setCardFieldData({});
        }
    };

    const handleBackToGrid = () => {
        // If in form mode for a table-enabled card, go back to table first
        if (ENTITY_TABLE_CONFIG[selectedCard] && cardViewMode === 'form') {
            setCardViewMode('table');
            setEditingEntityId(null);
            setCardFieldData({});
            return;
        }
        // Clear ephemeral live source data for singleton cards (profile/metadata)
        if (['profile', 'metadata'].includes(selectedCard)) {
            setLiveSourceData(prev => {
                const next = { ...prev };
                delete next[selectedCard];
                return next;
            });
        }
        setSelectedCard(null);
        setCardViewMode(null);
        setEntityTableData([]);
        setEditingEntityId(null);
    };

    // -- Entity table helpers --
    const fetchEntityTableData = async (cardId, universityId) => {
        setIsLoading(true);
        try {
            const apiPath = cardToApiPath[cardId];
            if (!apiPath) { setIsLoading(false); return; }
            const res = await fetch(`${BACKEND_URL}/api/universities/${universityId}/${apiPath}`);
            if (res.ok) {
                const result = await res.json();
                setEntityTableData(result.data || []);
                // Also refresh the university object so source_data stays current
                fetchUniversityDetails(universityId);
            }
        } catch (err) { console.error(`Error fetching ${cardId} data:`, err); } finally { setIsLoading(false); }
    };

    const fetchCurriculumForOffering = async (offeringId) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offeringId}/curriculum`);
            if (res.ok) {
                const result = await res.json();
                // Attach sc_ source data to each curriculum row
                const scMap = {};
                (result.source_data || []).forEach(sc => { scMap[sc.id] = sc; });
                const enriched = (result.data || []).map(row => ({
                    ...row,
                    _source_data: scMap[row.id] || null,
                })).sort((a, b) => (Number(a.term_number) || 0) - (Number(b.term_number) || 0));
                setEntityTableData(enriched);
            }
        } catch (err) { console.error('Error fetching curriculum:', err); } finally { setIsLoading(false); }
    };

    const fetchEligibilityForOffering = async (offeringId) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offeringId}/eligibility`);
            if (res.ok) {
                const result = await res.json();
                const scMap = {};
                (result.source_data || []).forEach(sc => { scMap[sc.id] = sc; });
                const enriched = (result.data || []).map(row => ({
                    ...row,
                    _source_data: scMap[row.id] || null,
                }));
                setEntityTableData(enriched);
            }
        } catch (err) { console.error('Error fetching eligibility:', err); } finally { setIsLoading(false); }
    };

    const fetchFeesForOffering = async (offeringId) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offeringId}/fees`);
            if (res.ok) {
                const result = await res.json();
                // Flatten fee_type JSONB {type:'x'} ? 'x' for display
                const flattenFeeType = (obj) => {
                    if (obj && typeof obj.fee_type === 'object' && obj.fee_type !== null) {
                        return { ...obj, fee_type: obj.fee_type.type || JSON.stringify(obj.fee_type) };
                    }
                    return obj;
                };
                const scMap = {};
                (result.source_data || []).forEach(sc => { scMap[sc.id] = flattenFeeType(sc); });
                const enriched = (result.data || []).map(row => ({
                    ...flattenFeeType(row),
                    _source_data: scMap[row.id] || null,
                }));
                setEntityTableData(enriched);
            }
        } catch (err) { console.error('Error fetching fees:', err); } finally { setIsLoading(false); }
    };

    const fetchAddonsForOffering = async (offeringId) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offeringId}/addons`);
            if (res.ok) {
                const result = await res.json();
                const scMap = {};
                (result.source_data || []).forEach(sc => { scMap[sc.id] = sc; });
                const enriched = (result.data || []).map(row => ({
                    ...row,
                    _source_data: scMap[row.id] || null,
                }));
                setEntityTableData(enriched);
            }
        } catch (err) { console.error('Error fetching addons:', err); } finally { setIsLoading(false); }
    };

    const fetchFacultyForOffering = async (offeringId) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offeringId}/faculty`);
            if (res.ok) {
                const result = await res.json();
                const scMap = {};
                (result.source_data || []).forEach(sc => { scMap[sc.id] = sc; });
                const enriched = (result.data || []).map(row => ({
                    ...row,
                    _source_data: scMap[row.id] || null,
                }));
                setEntityTableData(enriched);
            }
        } catch (err) { console.error('Error fetching offering faculty:', err); } finally { setIsLoading(false); }
    };

    const handleEditEntity = (cardId, row) => {
        setEditingEntityId(row.id);
        setCardViewMode('form');

        // Pre-fill form fields from the row data
        const keyMapObj = fieldKeyMap[cardId] || valueFieldKeyMap[cardId] || academicsFieldKeyMap[cardId];
        const keyMap = keyMapObj;
        if (keyMap) {
            const prefilled = {};
            Object.entries(keyMap).forEach(([label, jsonKey]) => {
                const val = row[jsonKey];
                if (label.includes('(Yes/No)')) {
                    prefilled[label] = val === true ? 'Yes' : val === false ? 'No' : '';
                } else if (jsonKey.endsWith('_json')) {
                    prefilled[label] = Array.isArray(val) ? val.join(', ') : (val ? String(val) : '');
                } else {
                    prefilled[label] = Array.isArray(val) ? val.join(', ') : (val !== undefined && val !== null ? String(val) : '');
                }
            });
            setCardFieldData(prefilled);
        }

        // Set source data for sc_ values display
        if (row._source_data) {
            // Academics rows (curriculum, specialization, offering) have _source_data attached
            setEditingSourceData(row._source_data);
        } else {
            const sourceKey = cardToSourceKey[cardId];
            if (sourceKey && university?.source_data?.[sourceKey]) {
                const scArr = university.source_data[sourceKey];
                const matchingSc = Array.isArray(scArr) ? scArr.find(sc => sc.id === row.id) : scArr;
                setEditingSourceData(matchingSc || null);
            } else {
                setEditingSourceData(null);
            }
        }
    };

    const handleAddNewEntity = (cardId) => {
        setEditingEntityId(null);
        setCardViewMode('form');
        setCardFieldData({});
        setEditingSourceData(null);
        setSelectedCard(cardId);
    };

    const renderEntityTable = (cardId, tableData) => {
        const config = ENTITY_TABLE_CONFIG[cardId];
        if (!config) return null;

        const colWidth = Math.floor(85 / config.columns.length) + '%';
        const entityLabels = {
            ranking: 'Ranking', accredition: 'Accreditation', highlights: 'Highlight',
            gallery: 'Gallery Item', faqs: 'FAQ', 'university-faculty': 'Faculty Member',
            'student-testimonials': 'Testimonial', 'hiring-partners': 'Hiring Partner',
            'placement-outcome': 'Placement Stat',
            curriculum: 'Curriculum Entry',
        };
        const label = entityLabels[cardId] || cardId;

        return (
            <div className="details-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#4A5666' }}>{label}s</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {lsqData[cardId] ? (
                            <button className="action-btn live-data-btn" onClick={() => openLiveDataModal(cardId)}>Live Data</button>
                        ) : (
                            <button className="action-btn" onClick={() => openLiveSourceModal(cardId)}>Live Source</button>
                        )}
                        <button className="add-university-btn" onClick={() => handleAddNewEntity(cardId)}>+ Add {label}</button>
                    </div>
                </div>
                {tableData && tableData.length > 0 ? (
                    <div className="table-wrapper master-table" style={{ overflowX: 'auto' }}>
                        <div className="table-header" style={{ minWidth: '600px' }}>
                            <div className="table-col" style={{ width: '6%', minWidth: '45px' }}>SR NO</div>
                            {config.columns.map(col => (
                                <div className="table-col" key={col.k} style={{ width: colWidth, minWidth: '80px' }}>{col.h}</div>
                            ))}
                            <div className="table-col" style={{ width: '15%', minWidth: '80px' }}>ACTIONS</div>
                        </div>
                        {tableData.map((row, index) => (
                            <div className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`} key={row.id || index} style={{ minWidth: '600px' }}>
                                <div className="table-col" style={{ width: '6%', minWidth: '45px' }}>{index + 1}</div>
                                {config.columns.map(col => (
                                    <div className="table-col" key={col.k} style={{ width: colWidth, minWidth: '80px' }}>
                                        <span className="uni-name">{row[col.k] ?? '-'}</span>
                                    </div>
                                ))}
                                <div className="table-col action-col" style={{ width: '15%', minWidth: '80px' }}>
                                    <button className="action-btn" onClick={() => handleEditEntity(cardId, row)}>Edit</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: '#66758A', textAlign: 'center', padding: '40px 0', fontFamily: 'Manrope, sans-serif', fontSize: '14px' }}>
                        No {label.toLowerCase()}s yet. Click <strong>+ Add {label}</strong> to create one.
                    </div>
                )}
            </div>
        );
    };

    const handleAddProgram = async (name) => {
        if (!university?.id) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/universities/${university.id}/programs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programName: name }),
            });
            if (response.ok) {
                const result = await response.json();
                const newProg = result.data[0];
                setPrograms(prev => [...prev, { id: newProg.id, name: name, program_id: newProg.program_id }]);
                setSelectedProgram(newProg.id);
                setSelectedProgramData(newProg);
                setSelectedCard(null);
            } else {
                const err = await response.json();
                showToast('Failed to create program: ' + (err.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error creating program:', error);
            showToast('Failed to create program: ' + error.message, 'error');
        }
    };

    // -- Live Source handlers --
    const openLiveSourceModal = (targetSection, context = null) => {
        setLiveSourceTarget(targetSection);
        setLiveSourceContext(context);
        setLiveSourceModalOpen(true);
    };

    // Helper: fire a single extraction request (fire-and-forget)
    const fireExtractionRequest = (targetTable, url, prompt, file, extractionContext) => {
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('target_table', targetTable);
            formData.append('context', JSON.stringify(extractionContext));
            formData.append('geolocation', JSON.stringify({ country: 'IN' }));
            formData.append('forceRefresh', 'false');
            if (prompt && prompt.trim()) formData.append('custom_prompt', prompt.trim());

            fetch(`${EXTRACTION_API_URL}/api/extract/structured`, {
                method: 'POST',
                body: formData,
            }).catch(err => console.error('Extraction request failed:', err));
        } else {
            const body = {
                url: url.trim(),
                target_table: targetTable,
                context: extractionContext,
                geolocation: { country: 'IN' },
                forceRefresh: false,
            };
            if (prompt && prompt.trim()) body.custom_prompt = prompt.trim();

            fetch(`${EXTRACTION_API_URL}/api/extract/structured`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }).catch(err => console.error('Extraction request failed:', err));
        }
    };

    const handleLiveSourceSave = ({ url, prompt, file }) => {
        const target = liveSourceTarget;
        const ctx = liveSourceContext;
        setLiveSourceModalOpen(false);
        setLiveSourceContext(null);

        const baseContext = { university_id: id, university_name: university?.name || '' };

        // Profile & Metadata: send to extraction API like other cards
        if (target === 'profile' || target === 'metadata') {
            const targetTable = cardToTargetTable[target];
            if (targetTable) {
                fireExtractionRequest(targetTable, url, prompt, file, baseContext);
                showToast('Extraction queued. Check Live Source Queue.', 'success');
            }
            return;
        }

        // Program Master → specialization extraction
        if (target === 'specialization') {
            const extractionCtx = {
                ...baseContext,
                program_id: ctx?.programId,
                program_name: ctx?.programName,
            };
            fireExtractionRequest('program_specialization', url, prompt, file, extractionCtx);
            showToast('Specialization extraction queued. Check Live Source Queue.', 'success');
            return;
        }

        // Offering → all sub-entities in a single request
        if (target === 'offering-all-sub-entities') {
            const extractionCtx = {
                ...baseContext,
                program_id: ctx?.programId,
                program_name: ctx?.programName,
                offering_id: ctx?.offeringId,
                offering_name: ctx?.offeringName,
            };
            const subTables = ['program_curriculum', 'program_eligibility', 'fee_structure', 'program_addon', 'offering_faculty'];
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('target_tables', JSON.stringify(subTables));
                formData.append('context', JSON.stringify(extractionCtx));
                formData.append('geolocation', JSON.stringify({ country: 'IN' }));
                formData.append('forceRefresh', 'false');
                if (prompt && prompt.trim()) formData.append('custom_prompt', prompt.trim());
                fetch(`${EXTRACTION_API_URL}/api/extract/structured`, {
                    method: 'POST',
                    body: formData,
                }).catch(err => console.error('Extraction request failed:', err));
            } else {
                const body = {
                    url: url.trim(),
                    target_tables: subTables,
                    context: extractionCtx,
                    geolocation: { country: 'IN' },
                    forceRefresh: false,
                };
                if (prompt && prompt.trim()) body.custom_prompt = prompt.trim();
                fetch(`${EXTRACTION_API_URL}/api/extract/structured`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }).catch(err => console.error('Extraction request failed:', err));
            }
            showToast('Offering extraction queued. Check Live Source Queue.', 'success');
            return;
        }

        // Individual offering sub-tab
        if (offeringSubTabToTargetTable[target]) {
            const extractionCtx = {
                ...baseContext,
                program_id: ctx?.programId,
                program_name: ctx?.programName || '',
                offering_id: ctx?.offeringId,
                offering_name: ctx?.offeringName || '',
            };
            fireExtractionRequest(offeringSubTabToTargetTable[target], url, prompt, file, extractionCtx);
            showToast('Extraction queued. Check Live Source Queue.', 'success');
            return;
        }

        // University Master table-based sections
        const targetTable = cardToTargetTable[target];
        if (!targetTable) return;

        fireExtractionRequest(targetTable, url, prompt, file, baseContext);
        showToast('Your request has been queued. Check the Live Source Queue to track status.', 'success');
    };

    // Check if a successful lsq entry exists for a card (called when card opens)
    const checkLsqStatus = async (cardId) => {
        const targetTable = cardToTargetTable[cardId];
        if (!targetTable) return;

        try {
            const params = new URLSearchParams({ university_id: id, target_table: targetTable });
            const res = await fetch(`${BACKEND_URL}/api/universities/lsq/latest?${params}`);
            const result = await res.json();
            if (result.data?.status === 'success' || result.data?.status === 'partial') {
                setLsqData(prev => ({ ...prev, [cardId]: result.data }));
            }
        } catch (err) {
            console.error('checkLsqStatus error:', err);
        }
    };

    // Check if a successful lsq entry exists for a program's specializations
    const checkProgramLsqStatus = async (programId) => {
        try {
            const params = new URLSearchParams({ university_id: id, target_table: 'program_specialization', program_id: programId });
            const res = await fetch(`${BACKEND_URL}/api/universities/lsq/latest?${params}`);
            const result = await res.json();
            if (result.data?.status === 'success' || result.data?.status === 'partial') {
                setLsqData(prev => ({ ...prev, [`program-spec-${programId}`]: result.data }));
            }
        } catch (err) {
            console.error('checkProgramLsqStatus error:', err);
        }
    };

    // Check LSQ status for all 5 offering sub-entity tables
    const checkOfferingLsqStatus = async (offeringId) => {
        try {
            const params = new URLSearchParams({ university_id: id, offering_id: offeringId });
            const res = await fetch(`${BACKEND_URL}/api/universities/lsq/offering-latest?${params}`);
            const result = await res.json();
            const data = result.data || {};
            // Store each sub-entity's LSQ data
            Object.entries(data).forEach(([targetTable, lsqRow]) => {
                // Find the sub-tab ID from the targetTable
                const subTabId = Object.entries(offeringSubTabToTargetTable).find(([, tt]) => tt === targetTable)?.[0];
                if (subTabId && (lsqRow.status === 'success' || lsqRow.status === 'partial')) {
                    setLsqData(prev => ({ ...prev, [`${subTabId}-${offeringId}`]: lsqRow }));
                }
            });
            // Also check if offering has any successful LSQ data (for top-level button)
            const hasAny = Object.values(data).some(r => r.status === 'success' || r.status === 'partial');
            if (hasAny) {
                setLsqData(prev => ({ ...prev, [`offering-all-${offeringId}`]: data }));
            }
        } catch (err) {
            console.error('checkOfferingLsqStatus error:', err);
        }
    };

    // Build reverse lookup: target_table → cardId
    const targetTableToCard = Object.fromEntries(
        Object.entries(cardToTargetTable).filter(([, v]) => v).map(([k, v]) => [v, k])
    );
    const targetTableToSubTab = Object.fromEntries(
        Object.entries(offeringSubTabToTargetTable).map(([k, v]) => [v, k])
    );

    // Fetch all LSQ entries for the Live Source Queue tab + refresh lsqData
    const fetchLsqEntries = async () => {
        setLsqLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/lsq/all?university_id=${id}`);
            const result = await res.json();
            const entries = result.data || [];
            setLsqEntries(entries);

            // Rebuild lsqData from the latest successful/partial entries
            const freshLsqData = {};
            // Track latest per key (entries are already sorted by created_at DESC)
            const seen = new Set();

            for (const entry of entries) {
                if (entry.status !== 'success' && entry.status !== 'partial') continue;

                // University master cards
                const cardId = targetTableToCard[entry.target_table];
                if (cardId && !entry.program_id && !entry.offering_id) {
                    if (!seen.has(cardId)) {
                        seen.add(cardId);
                        freshLsqData[cardId] = entry;
                    }
                    continue;
                }

                // Program specializations
                if (entry.target_table === 'program_specialization' && entry.program_id) {
                    const key = `program-spec-${entry.program_id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        freshLsqData[key] = entry;
                    }
                    continue;
                }

                // Offering sub-entities
                const subTabId = targetTableToSubTab[entry.target_table];
                if (subTabId && entry.offering_id) {
                    const key = `${subTabId}-${entry.offering_id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        freshLsqData[key] = entry;
                    }
                    // Also build the offering-all aggregate
                    const allKey = `offering-all-${entry.offering_id}`;
                    if (!freshLsqData[allKey]) freshLsqData[allKey] = {};
                    if (!freshLsqData[allKey][entry.target_table]) {
                        freshLsqData[allKey][entry.target_table] = entry;
                    }
                }
            }

            setLsqData(freshLsqData);
        } catch (err) {
            console.error('fetchLsqEntries error:', err);
        }
        setLsqLoading(false);
    };

    // Open the Live Data modal for a card
    const openLiveDataModal = (cardId) => {
        setLiveDataCardId(cardId);
        setLiveDataModalOpen(true);
    };

    // For singleton cards (profile/metadata), populate liveSourceData inline instead of opening modal
    const showLiveDataInline = (cardId) => {
        const lsqEntry = lsqData[cardId];
        if (!lsqEntry || !lsqEntry.extracted_data) return;
        const extractedRows = Array.isArray(lsqEntry.extracted_data) ? lsqEntry.extracted_data : [lsqEntry.extracted_data];
        const extracted = extractedRows[0] || {};
        const keyMap = fieldKeyMap[cardId];
        if (!keyMap) return;
        // Reverse map: db column key -> field label, then build { label: value }
        const reverseMap = {};
        for (const [label, dbKey] of Object.entries(keyMap)) {
            reverseMap[dbKey] = label;
        }
        const mappedData = {};
        for (const [dbKey, value] of Object.entries(extracted)) {
            const label = reverseMap[dbKey];
            if (label && value !== null && value !== undefined && value !== '') {
                mappedData[label] = Array.isArray(value) ? value.join(', ') : String(value);
            }
        }
        setLiveSourceData(prev => ({ ...prev, [cardId]: { data: mappedData } }));
    };

    const getLiveSourceValue = (sectionId, fieldLabel) => {
        const section = liveSourceData[sectionId];
        if (!section) return null;
        return section.data?.[fieldLabel] || null;
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddOffering = async () => {
        if (!newOfferingProgramId) { showToast('Please select a program.', 'error'); return; }
        try {
            const response = await fetch(`${BACKEND_URL}/api/universities/programs/${newOfferingProgramId}/offerings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ specialization_id: newOfferingSpecId || null }),
            });
            if (response.ok) {
                await fetchAllOfferings();
                setShowAddOfferingForm(false);
                setNewOfferingProgramId('');
                setNewOfferingSpecId('');
                showToast('Offering created successfully!', 'success');
            } else {
                const err = await response.json();
                showToast('Failed to create offering: ' + (err.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error creating offering:', error);
            showToast('Failed to create offering: ' + error.message, 'error');
        }
    };

    const handleProgramSelect = async (programId) => {
        setSelectedProgram(programId);
        setSelectedCard(null);
        await fetchProgramData(programId);
    };

    const fetchPrograms = async () => {
        setProgramsLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/universities/${university.id}/programs`);
            if (response.ok) {
                const result = await response.json();
                const programList = result.data || result;
                const mapped = programList.map(p => ({
                    id: p.id,
                    name: p.program_name || 'Unnamed',
                    program_level: p.program_level,
                    duration_months: p.duration_months,
                    total_credits: p.total_credits,
                    ...p,
                }));
                setPrograms(mapped);
            }
        } catch (error) {
            console.error('Error fetching programs:', error);
        } finally {
            setProgramsLoading(false);
        }
    };

    const fetchProgramData = async (programId) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/universities/${university.id}/programs/${programId}`);
            if (response.ok) {
                const result = await response.json();
                // Store full response so source_data is accessible for getSourceValue
                setSelectedProgramData(result);
            }
        } catch (error) {
            console.error('Error fetching program data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // -- Incentives fetch (standalone) --
    const fetchIncentiveData = async () => {
        try {
            const [policies, ledger] = await Promise.all([
                fetch(`${BACKEND_URL}/api/universities/offer-policies`).then(r => r.json()),
                fetch(`${BACKEND_URL}/api/universities/offer-ledger`).then(r => r.json()),
            ]);
            setOfferPolicies(policies);
            setOfferLedger(ledger);
        } catch (error) {
            console.error('Error fetching incentives:', error);
        }
    };

    // -- Legal fetch (university-scoped) --
    const fetchLegalData = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/${university.id}/contracts`);
            const data = await res.json();
            setContracts(data);
            if (data.data?.[0]) {
                const addRes = await fetch(`${BACKEND_URL}/api/universities/contracts/${data.data[0].id}/addendums`);
                setAddendums(await addRes.json());
            }
        } catch (error) {
            console.error('Error fetching legal data:', error);
        }
    };

    // -- Commercials fetch (standalone) --
    const fetchCommercialsData = async () => {
        try {
            const [rules, wallets] = await Promise.all([
                fetch(`${BACKEND_URL}/api/universities/payout-rules`).then(r => r.json()),
                fetch(`${BACKEND_URL}/api/universities/partner-wallets`).then(r => r.json()),
            ]);
            setPayoutRules(rules);
            setPartnerWallets(wallets);
        } catch (error) {
            console.error('Error fetching commercials:', error);
        }
    };

    // -- Leads fetch (university-scoped) --
    const fetchLeadsData = async () => {
        try {
            const [config, seasons] = await Promise.all([
                fetch(`${BACKEND_URL}/api/universities/${university.id}/lead-config`).then(r => r.json()),
                fetch(`${BACKEND_URL}/api/universities/${university.id}/academic-seasons`).then(r => r.json()),
            ]);
            setLeadConfig(config);
            setAcademicSeasons(seasons);
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    // -- Specializations fetch (all programs) --
    const fetchAllSpecializations = async () => {
        setSpecsLoading(true);
        try {
            const allSpecs = [];
            for (const prog of programs) {
                const res = await fetch(`${BACKEND_URL}/api/universities/programs/${prog.id}/specializations`);
                if (res.ok) {
                    const result = await res.json();
                    // Build sc_ lookup by ID for source data
                    const scMap = {};
                    (result.source_data || []).forEach(sc => { scMap[sc.id] = sc; });
                    const specs = (result.data || []).map(s => ({
                        ...s,
                        program_name: prog.name,
                        program_level: prog.program_level,
                        program_id: prog.id,
                        _source_data: scMap[s.id] || null,
                    }));
                    allSpecs.push(...specs);
                }
            }
            setAllSpecializations(allSpecs);
        } catch (error) {
            console.error('Error fetching specializations:', error);
        } finally {
            setSpecsLoading(false);
        }
    };

    // -- Offerings fetch (all programs) --
    const fetchAllOfferings = async () => {
        setOfferingsLoading(true);
        try {
            const allOffs = [];
            for (const prog of programs) {
                const res = await fetch(`${BACKEND_URL}/api/universities/programs/${prog.id}/offerings`);
                if (res.ok) {
                    const result = await res.json();
                    // Build sc_ lookup by ID for source data
                    const scMap = {};
                    (result.source_data || []).forEach(sc => { scMap[sc.id] = sc; });
                    const offs = (result.data || []).map(o => ({
                        ...o,
                        program_name: prog.name,
                        program_level: prog.program_level,
                        program_id: prog.id,
                        mode: prog.mode || o.mode,
                        total_credits: prog.total_credits || o.total_credits,
                        duration_months: prog.duration_months || o.duration_months,
                        max_duration_months: prog.max_duration_months || o.max_duration_months,
                        _source_data: scMap[o.id] || null,
                    }));
                    allOffs.push(...offs);
                }
            }
            setAllOfferings(allOffs);
        } catch (error) {
            console.error('Error fetching offerings:', error);
        } finally {
            setOfferingsLoading(false);
        }
    };

    // -- Save handler � per-entity CRUD endpoints --
    const confirmSaveCard = () => {
        setConfirmDialog({
            message: 'Do you want to save the changes?',
            variant: 'save',
            confirmLabel: 'Save',
            onConfirm: handleSaveCard,
        });
    };

    const handleSaveCard = async () => {
        if (!selectedCard || !university?.id) {
            console.log('Save clicked (no card selected or no university)');
            return;
        }

        // Resolve the correct keyMap for the selected card
        const resolveKeyMap = () => {
            if (fieldKeyMap[selectedCard]) return fieldKeyMap[selectedCard];
            if (valueFieldKeyMap[selectedCard]) return valueFieldKeyMap[selectedCard];
            if (academicsFieldKeyMap[selectedCard]) return academicsFieldKeyMap[selectedCard];
            if (incentivesFieldKeyMap[selectedCard]) return incentivesFieldKeyMap[selectedCard];
            if (legalFieldKeyMap[selectedCard]) return legalFieldKeyMap[selectedCard];
            if (commercialsFieldKeyMap[selectedCard]) return commercialsFieldKeyMap[selectedCard];
            if (leadsFieldKeyMap[selectedCard]) return leadsFieldKeyMap[selectedCard];
            return null;
        };

        const keyMap = resolveKeyMap();
        if (!keyMap) return;

        // Build jsonData from form fields
        const jsonData = {};
        Object.entries(keyMap).forEach(([label, jsonKey]) => {
            const rawValue = cardFieldData[label] || '';
            if (jsonKey.endsWith('_json')) {
                if (!rawValue) { jsonData[jsonKey] = null; }
                else { try { jsonData[jsonKey] = JSON.parse(rawValue); } catch { jsonData[jsonKey] = rawValue.includes(',') ? rawValue.split(',').map(s => s.trim()).filter(Boolean) : rawValue; } }
            } else if (label.includes('(Yes/No)')) {
                // Boolean fields: convert Yes/No to true/false
                if (rawValue === 'Yes') jsonData[jsonKey] = true;
                else if (rawValue === 'No') jsonData[jsonKey] = false;
                else jsonData[jsonKey] = null;
            } else {
                jsonData[jsonKey] = rawValue;
            }
        });

        // fee_type is stored as JSONB {"type": value} � wrap string back
        if (selectedCard === 'fee-structure' && jsonData.fee_type !== undefined && jsonData.fee_type !== null && jsonData.fee_type !== '') {
            jsonData.fee_type = { type: jsonData.fee_type };
        }

        let url = '';
        let method = 'POST';
        let onSuccess = null;

        // -- University Master: Profile --
        if (selectedCard === 'profile') {
            url = `${BACKEND_URL}/api/universities/${university.id}`;
            method = 'PUT';
            onSuccess = () => fetchUniversityDetails(university.id);
        }
        // -- University Master: Sub-entity cards --
        else if (cardToApiPath[selectedCard]) {
            const apiPath = cardToApiPath[selectedCard];
            if (editingEntityId) {
                url = `${BACKEND_URL}/api/universities/${apiPath}/${editingEntityId}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/${university.id}/${apiPath}`;
                method = 'POST';
            }
            onSuccess = async () => {
                await fetchUniversityDetails(university.id);
                if (ENTITY_TABLE_CONFIG[selectedCard]) {
                    await fetchEntityTableData(selectedCard, university.id);
                    setCardViewMode('table');
                    setEditingEntityId(null);
                }
            };
        }
        // -- Academics: degree-master --
        else if (selectedCard === 'degree-master') {
            if (!selectedProgram) { showToast('Please select a program first.', 'error'); return; }
            url = `${BACKEND_URL}/api/universities/${university.id}/programs/${selectedProgram}`;
            method = 'PUT';
            onSuccess = () => fetchProgramData(selectedProgram);
        }
        // -- Academics: program-specialisation --
        else if (selectedCard === 'program-specialisation') {
            if (!selectedProgram) { showToast('Please select a program first.', 'error'); return; }
            if (editingEntityId) {
                url = `${BACKEND_URL}/api/universities/specializations/${editingEntityId}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/programs/${selectedProgram}/specializations`;
                method = 'POST';
            }
            onSuccess = async () => {
                await fetchProgramData(selectedProgram);
                await fetchAllSpecializations();
            };
        }
        // -- Academics: program-offering --
        else if (selectedCard === 'program-offering') {
            if (!selectedProgram) { showToast('Please select a program first.', 'error'); return; }
            if (editingEntityId) {
                url = `${BACKEND_URL}/api/universities/offerings/${editingEntityId}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/programs/${selectedProgram}/offerings`;
                method = 'POST';
            }
            onSuccess = async () => {
                await fetchProgramData(selectedProgram);
                await fetchAllOfferings();
            };
        }
        // -- Academics: offering-scoped (fee, eligibility, curriculum, addon, offering-faculty) --
        else if (['fee-structure', 'eligibility', 'curriculum', 'addon', 'offering-faculty'].includes(selectedCard)) {
            if (!selectedProgram) { showToast('Please select a program first.', 'error'); return; }
            const subPathMap = { 'fee-structure': 'fees', 'eligibility': 'eligibility', 'curriculum': 'curriculum', 'addon': 'addons', 'offering-faculty': 'offering-faculty' };
            const subPath = subPathMap[selectedCard];
            const offeringId = modalContent?.offering?.id || selectedProgramData?.data?.offerings?.[0]?.id;
            if (!offeringId) { showToast('No offering found. Please create a program offering first.', 'error'); return; }
            if (editingEntityId) {
                // Determine PUT URL. Note: offering-faculty uses /offering-faculty/:id to avoid conflict with university faculty
                if (selectedCard === 'offering-faculty') {
                    url = `${BACKEND_URL}/api/universities/offering-faculty/${editingEntityId}`;
                } else {
                    url = `${BACKEND_URL}/api/universities/${subPath}/${editingEntityId}`;
                }
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/offerings/${offeringId}/${subPath}`;
                method = 'POST';
            }
            onSuccess = async () => {
                await fetchProgramData(selectedProgram);
                if (selectedCard === 'curriculum') {
                    await fetchCurriculumForOffering(offeringId);
                    setCardViewMode('table');
                    setEditingEntityId(null);
                } else if (selectedCard === 'eligibility') {
                    await fetchEligibilityForOffering(offeringId);
                    setCardViewMode('table');
                    setEditingEntityId(null);
                } else if (selectedCard === 'fee-structure') {
                    await fetchFeesForOffering(offeringId);
                    setCardViewMode('table');
                    setEditingEntityId(null);
                } else if (selectedCard === 'addon') {
                    await fetchAddonsForOffering(offeringId);
                    setCardViewMode('table');
                    setEditingEntityId(null);
                } else if (selectedCard === 'offering-faculty') {
                    await fetchFacultyForOffering(offeringId);
                    setCardViewMode('table');
                    setEditingEntityId(null);
                }
            };
        }
        // -- Incentives: offers-master --
        else if (selectedCard === 'offers-master') {
            const existing = offerPolicies?.data?.[0];
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/offer-policies/${existing.id}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/offer-policies`;
                method = 'POST';
            }
            onSuccess = () => fetchIncentiveData();
        }
        // -- Incentives: offer-ledger --
        else if (selectedCard === 'offer-ledger') {
            const existing = offerLedger?.data?.[0];
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/offer-ledger/${existing.id}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/offer-ledger`;
                method = 'POST';
            }
            onSuccess = () => fetchIncentiveData();
        }
        // -- Legal: master-agreement --
        else if (selectedCard === 'master-agreement') {
            const existing = contracts?.data?.[0];
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/contracts/${existing.id}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/${university.id}/contracts`;
                method = 'POST';
            }
            onSuccess = () => fetchLegalData();
        }
        // -- Legal: addendums --
        else if (selectedCard === 'addendums') {
            const existing = addendums?.data?.[0];
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/addendums/${existing.id}`;
                method = 'PUT';
            } else {
                const contractId = contracts?.data?.[0]?.id;
                if (!contractId) { showToast('No contract found. Please create a contract first.', 'error'); return; }
                url = `${BACKEND_URL}/api/universities/contracts/${contractId}/addendums`;
                method = 'POST';
            }
            onSuccess = () => fetchLegalData();
        }
        // -- Commercials: payout-config --
        else if (selectedCard === 'payout-config') {
            const existing = payoutRules?.data?.[0];
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/payout-rules/${existing.id}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/payout-rules`;
                method = 'POST';
            }
            onSuccess = () => fetchCommercialsData();
        }
        // -- Commercials: loan-partners (financing-options) --
        else if (selectedCard === 'loan-partners') {
            const existingData = university?.financing_options;
            const existing = Array.isArray(existingData) ? existingData[0] : null;
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/financing-options/${existing.id}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/${university.id}/financing-options`;
                method = 'POST';
            }
            onSuccess = async () => { await fetchUniversityDetails(university.id); await fetchCommercialsData(); };
        }
        // -- Commercials: wallets --
        else if (selectedCard === 'wallets') {
            const existing = partnerWallets?.data?.[0];
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/partner-wallets/${existing.id}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/partner-wallets`;
                method = 'POST';
            }
            onSuccess = () => fetchCommercialsData();
        }
        // -- Leads: lead-config --
        else if (selectedCard === 'lead-config') {
            const existing = leadConfig?.data;
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/lead-config/${existing.id}`;
                method = 'PUT';
            } else {
                showToast('No lead config found.', 'error');
                return;
            }
            onSuccess = () => fetchLeadsData();
        }
        // -- Leads: academic-season --
        else if (selectedCard === 'academic-season') {
            const existing = academicSeasons?.data?.[0];
            if (existing?.id) {
                url = `${BACKEND_URL}/api/universities/academic-seasons/${existing.id}`;
                method = 'PUT';
            } else {
                url = `${BACKEND_URL}/api/universities/${university.id}/academic-seasons`;
                method = 'POST';
            }
            onSuccess = () => fetchLeadsData();
        }
        else {
            console.log('No save handler for card:', selectedCard);
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData),
            });

            if (response.ok) {
                if (onSuccess) await onSuccess();
                showToast('Saved successfully!');
            } else {
                const err = await response.json();
                showToast('Failed to save: ' + (err.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error saving:', error);
            showToast('Failed to save: ' + error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (label, value) => {
        setCardFieldData(prev => ({ ...prev, [label]: value }));
    };

    // -- Identity field configs --
    const renderCardFields = (cardId) => {
        const fieldConfigs = {
            profile: [
                { label: 'Short Name', placeholder: 'Enter short name...' },
                { label: 'Full Legal Name', placeholder: 'Enter full legal name...' },
                { label: 'Slug', placeholder: 'Enter slug...' },
                { label: 'Establishment Year', placeholder: 'Enter year...' },
                { label: 'Logo URL', placeholder: 'Enter logo URL...' },
                { label: 'Banner Image URL', placeholder: 'Enter banner image URL...' },
                { label: 'Brochure URL', placeholder: 'Enter brochure URL...' },
                { label: 'Brand Primary Color', placeholder: 'Enter hex color...' },
                { label: 'WES Approved (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Campus Access (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Partner Code', placeholder: 'Enter partner code...' },
                { label: 'University Main Link', placeholder: 'Enter URL...' },
            ],
            address: [
                { label: 'Campus Type', placeholder: 'Enter campus type...' },
                { label: 'Address Line', placeholder: 'Enter address...' },
                { label: 'City', placeholder: 'Enter city...' },
                { label: 'State', placeholder: 'Enter state...' },
                { label: 'Pincode', placeholder: 'Enter pincode...' },
                { label: 'Latitude', placeholder: 'Enter latitude...' },
                { label: 'Longitude', placeholder: 'Enter longitude...' },
                { label: 'Maps Embed URL', placeholder: 'Enter map URL...' },
                { label: 'Nearest Transport Hub', placeholder: 'Enter transport hub...' },
            ],
            metadata: [
                { label: 'Meta Title', placeholder: 'Enter meta title...' },
                { label: 'Meta Description', placeholder: 'Enter meta description...' },
                { label: 'Canonical URL', placeholder: 'Enter URL...' },
                { label: 'OG Image URL', placeholder: 'Enter OG image URL...' },
                { label: 'Schema Markup', placeholder: 'Enter schema markup...' },
                { label: 'Keywords Vector', placeholder: 'Enter keywords...' },
            ],
            ranking: [
                { label: 'Ranking Agency', placeholder: 'Enter agency...' },
                { label: 'Ranking Year', placeholder: 'Enter year...' },
                { label: 'Rank Value', placeholder: 'Enter value...' },
                { label: 'Rank Band', placeholder: 'Enter band...' },
                { label: 'Category', placeholder: 'Enter category...' },
                { label: 'Rank Display Text', placeholder: 'Enter display text...' },
                { label: 'Verification URL', placeholder: 'Enter URL...' },
                { label: 'Primary Highlight (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            accredition: [
                { label: 'Accreditation Body', placeholder: 'Enter body...' },
                { label: 'Grade', placeholder: 'Enter grade...' },
                { label: 'Score', placeholder: 'Enter score...' },
                { label: 'Valid Until', placeholder: 'Enter date...' },
                { label: 'Proof Document URL', placeholder: 'Enter URL...' },
                { label: 'International (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            highlights: [
                { label: 'Highlight Type', placeholder: 'Enter type...' },
                { label: 'Title', placeholder: 'Enter title...' },
                { label: 'Description', placeholder: 'Enter description...' },
                { label: 'Icon SVG Code', placeholder: 'Enter SVG code...' },
                { label: 'Display Order', placeholder: 'Enter order...' },
                { label: 'Featured (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            gallery: [
                { label: 'Category', placeholder: 'Enter category...' },
                { label: 'Media Type', placeholder: 'Enter type...' },
                { label: 'URL', placeholder: 'Enter media URL...' },
                { label: 'Thumbnail URL', placeholder: 'Enter thumbnail URL...' },
                { label: 'Caption', placeholder: 'Enter caption...' },
                { label: 'Featured (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: '360 Virtual Tour (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            faqs: [
                { label: 'Category', placeholder: 'Enter category...' },
                { label: 'Question', placeholder: 'Enter question...' },
                { label: 'Answer', placeholder: 'Enter answer...' },
                { label: 'Display Order', placeholder: 'Enter order...' },
                { label: 'Search Vector', placeholder: 'Enter search vector...' },
                { label: 'Active (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            // -- Academics field configs --
            'degree-master': [
                { label: 'Program Name', placeholder: 'Enter program name...' },
                { label: 'Global Degree Type', placeholder: 'Enter degree type...' },
                { label: 'Program Level', placeholder: 'Enter level...' },
                { label: 'Mode', placeholder: 'Enter mode...' },
                { label: 'Total Credits', placeholder: 'Enter total credits...' },
                { label: 'Duration (Months)', placeholder: 'Enter duration...' },
                { label: 'Max Duration (Months)', placeholder: 'Enter max duration...' },
                { label: 'WES Recognized (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'NEP Compliant (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Exit Pathways', placeholder: 'Enter exit pathways JSON...' },
                { label: 'Sample Certificate URL', placeholder: 'Enter URL...' },
                { label: 'Brochure PDF URL', placeholder: 'Enter URL...' },
            ],
            'program-offering': [
                { label: 'SKU Code', placeholder: 'Enter SKU code...' },
                { label: 'Industry Partner ID', placeholder: 'Enter partner ID...' },
                { label: 'Co Brand Label', placeholder: 'Enter label...' },
                { label: 'Dual Degree (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Exam Center States', placeholder: 'Enter states JSON...' },
                { label: 'Seat Capacity', placeholder: 'Enter capacity...' },
                { label: 'Application Deadline', placeholder: 'Enter deadline date...' },
                { label: 'Active (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            'program-specialisation': [
                { label: 'Specialization Name', placeholder: 'Enter specialization...' },
                { label: 'Slug', placeholder: 'Enter slug...' },
                { label: 'Description', placeholder: 'Enter description...' },
                { label: 'Career Roles', placeholder: 'Enter career roles JSON...' },
                { label: 'Category Tag', placeholder: 'Enter category...' },
                { label: 'Thumbnail Image URL', placeholder: 'Enter URL...' },
                { label: 'Specialisation Brochure URL', placeholder: 'Enter brochure URL...' },
            ],
            'fee-structure': [
                { label: 'Fee Type', placeholder: 'Enter fee type...' },
                { label: 'Student Category', placeholder: 'Enter category...' },
                { label: 'Payment Plan Type', placeholder: 'Enter plan type...' },
                { label: 'Currency', placeholder: 'Enter currency...' },
                { label: 'Amount', placeholder: 'Enter amount...' },
                { label: 'Finance Whitelist', placeholder: 'Enter finance whitelist JSON...' },
                { label: 'Fee Note', placeholder: 'Enter fee note...' },
                { label: 'Eligible for Loan (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            'eligibility': [
                { label: 'Academic Level Required', placeholder: 'Enter level...' },
                { label: 'Min Score % (General)', placeholder: 'Enter score...' },
                { label: 'Min Score % (Reserved)', placeholder: 'Enter score...' },
                { label: 'Stream Rules', placeholder: 'Enter stream rules JSON...' },
                { label: 'Mandatory Subjects', placeholder: 'Enter mandatory subjects JSON...' },
                { label: 'Lateral Entry (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Max Backlogs Allowed', placeholder: 'Enter max backlogs...' },
                { label: 'Max Education Gap Years', placeholder: 'Enter max gap years...' },
                { label: 'Provisional Allowed (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Student Category', placeholder: 'Enter student category...' },
                { label: 'Raw Criteria', placeholder: 'Enter raw criteria...' },
                { label: 'Qualifying Degree', placeholder: 'Enter qualifying degrees JSON...' },
                { label: 'Documents Required', placeholder: 'Enter documents required JSON...' },
                { label: 'Target Audience', placeholder: 'Enter target audience JSON...' },
            ],
            'curriculum': [
                { label: 'Term Number', placeholder: 'Enter term number...' },
                { label: 'Term Label', placeholder: 'Enter term label...' },
                { label: 'Subject Name', placeholder: 'Enter subject name...' },
                { label: 'Subject Code', placeholder: 'Enter subject code...' },
                { label: 'Credit Points', placeholder: 'Enter credit points...' },
                { label: 'Elective (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Topics Covered', placeholder: 'Enter topics JSON...' },
                { label: 'Project Work (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            'addon': [
                { label: 'Addon Name', placeholder: 'Enter addon name...' },
                { label: 'Addon Type', placeholder: 'Enter type...' },
                { label: 'Provider Name', placeholder: 'Enter provider...' },
                { label: 'Price Amount', placeholder: 'Enter price...' },
                { label: 'Mandatory (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Description', placeholder: 'Enter description...' },
                { label: 'Thumbnail URL', placeholder: 'Enter URL...' },
            ],
            'offering-faculty': [
                { label: 'Name', placeholder: 'Enter name...' },
                { label: 'Designation', placeholder: 'Enter designation...' },
                { label: 'Qualification', placeholder: 'Enter qualification...' },
                { label: 'Industry Exp (Years)', placeholder: 'Enter years...' },
                { label: 'Profile Image URL', placeholder: 'Enter URL...' },
                { label: 'Video Intro URL', placeholder: 'Enter URL...' },
                { label: 'Star Faculty (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            // -- Value & Outcomes field configs --
            'university-faculty': [
                { label: 'Name', placeholder: 'Enter name...' },
                { label: 'Designation', placeholder: 'Enter designation...' },
                { label: 'Qualification', placeholder: 'Enter qualification...' },
                { label: 'Industry Exp (Years)', placeholder: 'Enter years...' },
                { label: 'Profile Image URL', placeholder: 'Enter image URL...' },
                { label: 'LinkedIn URL', placeholder: 'Enter LinkedIn URL...' },
                { label: 'Video Intro URL', placeholder: 'Enter video URL...' },
                { label: 'Star Faculty (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            'student-testimonials': [
                { label: 'Name', placeholder: 'Enter name...' },
                { label: 'Current Company', placeholder: 'Enter company...' },
                { label: 'Designation', placeholder: 'Enter designation...' },
                { label: 'Hike %', placeholder: 'Enter hike percentage...' },
                { label: 'Testimonial Text', placeholder: 'Enter testimonial...' },
                { label: 'Video URL', placeholder: 'Enter video URL...' },
                { label: 'Image URL', placeholder: 'Enter image URL...' },
                { label: 'LinkedIn Profile URL', placeholder: 'Enter LinkedIn URL...' },
            ],
            'hiring-partners': [
                { label: 'Company Name', placeholder: 'Enter company name...' },
                { label: 'Logo URL', placeholder: 'Enter logo URL...' },
                { label: 'Industry Sector', placeholder: 'Enter industry...' },
                { label: 'Key Recruiter (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Active Hiring (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            'placement-outcome': [
                { label: 'Academic Year', placeholder: 'Enter year...' },
                { label: 'Highest Package (LPA)', placeholder: 'Enter highest package...' },
                { label: 'Average Package (LPA)', placeholder: 'Enter average package...' },
                { label: 'Placement %', placeholder: 'Enter placement percentage...' },
                { label: 'Total Recruiters', placeholder: 'Enter total recruiters...' },
                { label: 'Report PDF URL', placeholder: 'Enter report URL...' },
            ],
            'university-scholarship': [
                { label: 'Provider Name', placeholder: 'Enter provider name...' },
                { label: 'Scholarship Name', placeholder: 'Enter scholarship name...' },
                { label: 'Scholarship Type', placeholder: 'Enter type...' },
                { label: 'Degree Level', placeholder: 'Enter degree level...' },
                { label: 'Field of Study', placeholder: 'Enter field of study...' },
                { label: 'Scholarship Value', placeholder: 'Enter scholarship value...' },
                { label: 'Eligibility Criteria', placeholder: 'Enter eligibility criteria...' },
            ],
            // -- Incentives field configs --
            'offers-master': [
                { label: 'Policy Name', placeholder: 'Enter policy name...' },
                { label: 'Coupon Name', placeholder: 'Enter coupon name...' },
                { label: 'Coupon Subtext', placeholder: 'Enter subtext...' },
                { label: 'Currency Type (INR / USD)', placeholder: 'Enter currency...' },
                { label: 'Coupon Code', placeholder: 'Enter coupon code...' },
                { label: 'Auto Apply (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Visible Tray (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Value Config', placeholder: 'Enter value config JSON...' },
                { label: 'Funding Source Entity', placeholder: 'Enter entity...' },
                { label: 'Commission Calc Basis', placeholder: 'Enter basis...' },
                { label: 'Stacking Group', placeholder: 'Enter stacking group...' },
                { label: 'GST Inclusive (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Max. Discount', placeholder: 'Enter max discount...' },
                { label: 'Max. Claims Per User', placeholder: 'Enter max claims...' },
                { label: 'Valid From', placeholder: 'Enter date...' },
                { label: 'Valid To', placeholder: 'Enter date...' },
                { label: 'Applicable Days', placeholder: 'Enter days...' },
                { label: 'Applicable Time Window', placeholder: 'Enter time window...' },
                { label: 'Blackout Days (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Active (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            'offer-ledger': [
                { label: 'Opportunity ID', placeholder: 'Enter opportunity ID...' },
                { label: 'Policy ID', placeholder: 'Enter policy ID...' },
                { label: 'Applied Source Type', placeholder: 'Enter source type...' },
                { label: 'Source Ref ID', placeholder: 'Enter ref ID...' },
                { label: 'Frozen Discount Value', placeholder: 'Enter discount value...' },
                { label: 'Burn Source Entity', placeholder: 'Enter entity...' },
                { label: 'Commission Impact Mode', placeholder: 'Enter mode...' },
                { label: 'Ledger Status', placeholder: 'Enter status...' },
                { label: 'Revocation Reason', placeholder: 'Enter reason...' },
                { label: 'Applied At', placeholder: 'Enter date...' },
                { label: 'Consumed At', placeholder: 'Enter date...' },
            ],
            // -- Legal/Admin field configs --
            'master-agreement': [
                { label: 'Contract Ref Code', placeholder: 'Enter ref code...' },
                { label: 'Status', placeholder: 'Enter status...' },
                { label: 'Payout Model', placeholder: 'Enter payout model...' },
                { label: 'Default Commission', placeholder: 'Enter commission value...' },
                { label: 'Calculation Basis Type', placeholder: 'Enter basis type...' },
                { label: 'GST Exclusive (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Invoice Trigger Event', placeholder: 'Enter event...' },
                { label: 'Credit Period Days', placeholder: 'Enter days...' },
                { label: 'Clawback Window Days', placeholder: 'Enter days...' },
                { label: 'Retention Bonus Clause', placeholder: 'Enter clause...' },
                { label: 'Effective From', placeholder: 'Enter date...' },
                { label: 'Effective To', placeholder: 'Enter date...' },
                { label: 'Signed Document URL', placeholder: 'Enter URL...' },
            ],
            'addendums': [
                { label: 'Addendum Ref Code', placeholder: 'Enter ref code...' },
                { label: 'Addendum Type', placeholder: 'Enter type...' },
                { label: 'Version Number', placeholder: 'Enter version...' },
                { label: 'Change Description', placeholder: 'Enter description...' },
                { label: 'Scope Restriction', placeholder: 'Enter scope JSON...' },
                { label: 'Digitally Signed (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Effective From', placeholder: 'Enter date...' },
                { label: 'Effective To', placeholder: 'Enter date...' },
                { label: 'Status', placeholder: 'Enter status...' },
            ],
            // -- Commercials field configs --
            'payout-config': [
                { label: 'Rule Name', placeholder: 'Enter rule name...' },
                { label: 'Payout Component', placeholder: 'Enter component...' },
                { label: 'Calculation Mode', placeholder: 'Enter mode...' },
                { label: 'Payout Value', placeholder: 'Enter value...' },
                { label: 'Stacking Strategy', placeholder: 'Enter strategy...' },
                { label: 'Slab Min Qty', placeholder: 'Enter min qty...' },
                { label: 'Slab Max Qty', placeholder: 'Enter max qty...' },
                { label: 'Retroactive (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Applicable Product IDs', placeholder: 'Enter product IDs...' },
                { label: 'Valid From', placeholder: 'Enter date...' },
                { label: 'Valid To', placeholder: 'Enter date...' },
                { label: 'Priority Score', placeholder: 'Enter score...' },
            ],
            'loan-partners': [
                { label: 'Finance Type', placeholder: 'Enter type...' },
                { label: 'Provider Name', placeholder: 'Enter provider name...' },
                { label: 'Interest Rate %', placeholder: 'Enter rate...' },
                { label: 'Approval TAT Hours', placeholder: 'Enter hours...' },
                { label: 'Tenure Months', placeholder: 'Enter months...' },
                { label: 'Min Loan Amount', placeholder: 'Enter amount...' },
                { label: 'Paperless (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            'wallets': [
                { label: 'Currency', placeholder: 'Enter currency...' },
                { label: 'Accrued Balance', placeholder: 'Enter balance...' },
                { label: 'Withdrawable Balance', placeholder: 'Enter balance...' },
                { label: 'Held Balance', placeholder: 'Enter balance...' },
                { label: 'Total Lifetime Earnings', placeholder: 'Enter amount...' },
                { label: 'Total Lifetime Withdrawn', placeholder: 'Enter amount...' },
                { label: 'Wallet Version', placeholder: 'Enter version...' },
                { label: 'Frozen (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
            ],
            // -- Lead field configs --
            'academic-season': [
                { label: 'Season Name', placeholder: 'Enter season name...' },
                { label: 'Batch Code', placeholder: 'Enter batch code...' },
                { label: 'Active (Yes/No)', placeholder: 'Select...', type: 'dropdown', options: ['Yes', 'No'] },
                { label: 'Application Open Date', placeholder: 'Enter date...' },
                { label: 'Early Bird Deadline', placeholder: 'Enter date...' },
                { label: 'Hard Close Deadline', placeholder: 'Enter date...' },
                { label: 'Cycle Start Date', placeholder: 'Enter date...' },
                { label: 'Cycle End Date', placeholder: 'Enter date...' },
            ],
            'lead-config': [
                { label: 'CRM Provider', placeholder: 'Enter provider...' },
                { label: 'Lead Post URL', placeholder: 'Enter URL...' },
                { label: 'Auth Token', placeholder: 'Enter token...' },
                { label: 'Webhook Secret', placeholder: 'Enter secret...' },
                { label: 'Success Redirect URL', placeholder: 'Enter URL...' },
                { label: 'Failure Redirect URL', placeholder: 'Enter URL...' },
                { label: 'Lead Priority Score', placeholder: 'Enter score...' },
            ],
        };

        const fields = fieldConfigs[cardId];
        if (!fields) return <div style={{ padding: '20px 0', color: '#66758A' }}>No fields configured.</div>;

        // -- Resolve source value for a given field from sc_ data --
        const getSourceValue = (fieldLabel) => {
            let sourceObj = null;
            let sourceKey = null;
            let keyMap = null;

            // University Master cards (identity + value)
            if (cardToSourceKey[cardId] !== undefined) {
                if (editingEntityId && editingSourceData) {
                    // Editing a specific entity table row — use matched source data
                    sourceObj = editingSourceData;
                    sourceKey = null;
                } else {
                    sourceObj = university?.source_data;
                    sourceKey = cardToSourceKey[cardId];
                }
                keyMap = fieldKeyMap[cardId] || valueFieldKeyMap[cardId];
            }
            // Academics cards
            else if (academicsFieldKeyMap[cardId]) {
                if (cardId === 'degree-master') {
                    // source_data is a flat sc_program_master object
                    sourceObj = selectedProgramData?.source_data;
                    sourceKey = null;
                } else {
                    // specialization/offering: use per-item source data
                    sourceObj = editingSourceData;
                    sourceKey = null;
                }
                keyMap = academicsFieldKeyMap[cardId];
            }
            // Incentives cards
            else if (incentivesFieldKeyMap[cardId]) {
                const dataSource = cardId === 'offers-master' ? offerPolicies : offerLedger;
                sourceObj = dataSource?.source_data;
                sourceKey = null; // source_data is array directly
                keyMap = incentivesFieldKeyMap[cardId];
            }
            // Legal cards
            else if (legalFieldKeyMap[cardId]) {
                const dataSource = cardId === 'master-agreement' ? contracts : addendums;
                sourceObj = dataSource?.source_data;
                sourceKey = null;
                keyMap = legalFieldKeyMap[cardId];
            }
            // Commercials cards
            else if (commercialsFieldKeyMap[cardId]) {
                if (cardId === 'payout-config') sourceObj = payoutRules?.source_data;
                else if (cardId === 'wallets') sourceObj = partnerWallets?.source_data;
                else if (cardId === 'loan-partners') sourceObj = university?.source_data?.financing_options;
                sourceKey = null;
                keyMap = commercialsFieldKeyMap[cardId];
            }
            // Leads cards
            else if (leadsFieldKeyMap[cardId]) {
                const dataSource = cardId === 'lead-config' ? leadConfig : academicSeasons;
                sourceObj = dataSource?.source_data;
                sourceKey = null;
                keyMap = leadsFieldKeyMap[cardId];
            }

            if (!keyMap) return null;

            const jsonKey = keyMap[fieldLabel];
            if (!jsonKey) return null;

            // Resolve the source data to look up
            let srcData = sourceObj;
            if (sourceKey && sourceObj) {
                srcData = sourceObj[sourceKey];
            }
            if (!srcData) return null;

            const src = Array.isArray(srcData) ? (srcData[0] || {}) : srcData;
            const val = src[jsonKey];
            if (val === undefined || val === null || val === '') return null;
            return Array.isArray(val) ? val.join(', ') : String(val);
        };

        return (
            <>
                {['profile', 'metadata'].includes(cardId) && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
                        {lsqData[cardId] ? (
                            <button className="action-btn live-data-btn" onClick={() => showLiveDataInline(cardId)}>Live Data</button>
                        ) : null}
                        <button className="action-btn" onClick={() => openLiveSourceModal(cardId)}>Live Source</button>
                    </div>
                )}
                <div className="fields-grid-2-col">
                    {fields.map((field, idx) => {
                        const srcVal = getSourceValue(field.label);
                        const liveSrcVal = getLiveSourceValue(cardId, field.label);
                        const hasLiveSource = !!liveSourceData[cardId];
                        return (
                            <UniversityInfoField
                                key={idx}
                                label={field.label}
                                placeholder={field.placeholder}
                                value={cardFieldData[field.label] || ''}
                                onChange={(e) => handleFieldChange(field.label, e.target.value)}
                                sourceText={srcVal || 'NOT FOUND'}
                                onUseSource={srcVal ? () => handleFieldChange(field.label, srcVal) : () => { }}
                                liveSourceText={hasLiveSource ? (liveSrcVal || 'NOT FOUND') : null}
                                onUseLiveSource={hasLiveSource ? (liveSrcVal ? () => handleFieldChange(field.label, liveSrcVal) : () => { }) : undefined}
                                type={field.type}
                                options={field.options}
                            />
                        );
                    })}
                </div>
                {['offers-master', 'offer-ledger'].includes(cardId) && (
                    <label className="same-for-all-checkbox">
                        <input type="checkbox" />
                        <span>This Information is same for all the programs</span>
                    </label>
                )}
            </>
        );
    };

    // -- Academics section cards (dynamic progress) --
    const academicsCards = [
        { id: 'degree-master', title: 'Degree Master', fieldCount: 15 },
        { id: 'program-offering', title: 'Program Offering', fieldCount: 12 },
        { id: 'program-specialisation', title: 'Program Specialisation', fieldCount: 7 },
        { id: 'fee-structure', title: 'Program Offering Fee Structure', fieldCount: 6 },
        { id: 'eligibility', title: 'Program Offering Eligibility', fieldCount: 11 },
        { id: 'curriculum', title: 'Program Offering Curriculum', fieldCount: 8 },
        { id: 'addon', title: 'Program Offering Addon', fieldCount: 7 },
    ].map(card => {
        let dbData = null;
        if (card.id === 'degree-master') {
            dbData = selectedProgramData?.data;
        } else if (card.id === 'program-offering') {
            // Use first offering for the selected program
            const progOfferings = allOfferings.filter(o => o.program_id === selectedProgram);
            dbData = progOfferings.length > 0 ? progOfferings : null;
        } else if (card.id === 'program-specialisation') {
            const progSpecs = allSpecializations.filter(s => s.program_id === selectedProgram);
            dbData = progSpecs.length > 0 ? progSpecs : null;
        } else if (offeringSubData[card.id]) {
            dbData = offeringSubData[card.id];
        }
        const progress = calculateProgress(dbData, academicsFieldKeyMap[card.id]);
        return { ...card, progress, status: getStatus(progress) };
    });

    // -- Value & Outcomes section cards (dynamic progress from university object) --
    const valueCards = [
        { id: 'university-faculty', title: 'University Faculty', fieldCount: 8 },
        { id: 'student-testimonials', title: 'Student Testimonials', fieldCount: 9 },
        { id: 'hiring-partners', title: 'Hiring Partners', fieldCount: 5 },
        { id: 'placement-outcome', title: 'Placement Outcome Metric', fieldCount: 6 },
    ].map(card => {
        const column = cardToColumn[card.id];
        const progress = calculateProgress(column ? university?.[column] : null, valueFieldKeyMap[card.id]);
        return { ...card, progress, status: getStatus(progress) };
    });

    // -- Incentives / Scholarships section cards (dynamic progress) --
    const incentivesCards = [
        { id: 'offers-master', title: 'University Offers Master', fieldCount: 29 },
        { id: 'offer-ledger', title: 'Opportunity Offer Ledger', fieldCount: 7 },
    ].map(card => {
        const dataSource = card.id === 'offers-master' ? offerPolicies : offerLedger;
        const progress = calculateProgress(dataSource?.data, incentivesFieldKeyMap[card.id]);
        return { ...card, progress, status: getStatus(progress) };
    });

    // -- Legal/Admin section cards (dynamic progress) --
    const legalCards = [
        { id: 'master-agreement', title: 'Master Agreement', fieldCount: 18 },
        { id: 'addendums', title: 'Addendums', fieldCount: 12 },
    ].map(card => {
        const dataSource = card.id === 'master-agreement' ? contracts : addendums;
        const progress = calculateProgress(dataSource?.data, legalFieldKeyMap[card.id]);
        return { ...card, progress, status: getStatus(progress) };
    });

    // -- Commercials section cards (dynamic progress) --
    const commercialsCards = [
        { id: 'payout-config', title: 'Payout Configuration', fieldCount: 13 },
        { id: 'loan-partners', title: 'Financing Options', fieldCount: 9 },
        { id: 'wallets', title: 'Partner Wallet', fieldCount: 10 },
    ].map(card => {
        let dataSource;
        if (card.id === 'payout-config') dataSource = payoutRules?.data;
        else if (card.id === 'loan-partners') dataSource = university?.financing_options;
        else if (card.id === 'wallets') dataSource = partnerWallets?.data;
        const progress = calculateProgress(dataSource, commercialsFieldKeyMap[card.id]);
        return { ...card, progress, status: getStatus(progress) };
    });

    // -- Lead section cards (dynamic progress) --
    const leadCards = [
        { id: 'academic-season', title: 'Academic Season', fieldCount: 8 },
        { id: 'lead-config', title: 'University Lead Config', fieldCount: 7 },
    ].map(card => {
        const dataSource = card.id === 'lead-config' ? leadConfig?.data : academicSeasons?.data;
        const progress = calculateProgress(dataSource, leadsFieldKeyMap[card.id]);
        return { ...card, progress, status: getStatus(progress) };
    });

    // -- Modal helper --
    const openModal = (title, content) => {
        setModalContent({ title, ...content });
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
        setModalContent(null);
        // Reset all card/form state so background returns to the grid (e.g. offering master)
        // Clear ephemeral live source data for singleton cards
        if (['profile', 'metadata'].includes(selectedCard)) {
            setLiveSourceData(prev => {
                const next = { ...prev };
                delete next[selectedCard];
                return next;
            });
        }
        setSelectedCard(null);
        setCardViewMode(null);
        setEntityTableData([]);
        setEditingEntityId(null);
        setCardFieldData({});
        setEditingSourceData(null);
    };

    // -- Modal: Edit program specializations table --
    const openSpecializationModal = async (program) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/universities/programs/${program.id}/specializations`);
            const result = await res.json();
            const specs = result.data || [];
            openModal(`Specializations � ${program.name}`, { type: 'specialization-table', specs, program });
        } catch (error) {
            console.error('Error fetching specializations:', error);
        }
    };

    // -- Modal: Edit offering sub-cards --
    const openOfferingModal = async (offering) => {
        setOfferingModalLoading(true);
        try {
            const specName = offering.specialization_id
                ? (allSpecializations.find(s => s.id === offering.specialization_id)?.specialization_name || offering.sku_code || 'Offering')
                : (offering.sku_code || 'Offering');
            setCardFieldData({});
            setEditingSourceData(offering._source_data || offering);

            // Pre-fetch all sub-entity data for progress bars
            const subData = { 'program-offering': [offering] };
            if (offering.id) {
                const subPaths = [
                    { cardId: 'fee-structure', path: 'fees' },
                    { cardId: 'eligibility', path: 'eligibility' },
                    { cardId: 'curriculum', path: 'curriculum' },
                    { cardId: 'addon', path: 'addons' },
                    { cardId: 'offering-faculty', path: 'faculty' },
                ];
                await Promise.all(subPaths.map(async ({ cardId, path }) => {
                    try {
                        const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offering.id}/${path}`);
                        if (res.ok) {
                            const result = await res.json();
                            subData[cardId] = result.data || [];
                        }
                    } catch (err) {
                        console.error(`Error pre-fetching ${cardId}:`, err);
                    }
                }));

                // Also check offering LSQ status
                checkOfferingLsqStatus(offering.id);
            }
            setOfferingSubData(subData);

            // Find program name for context
            const programName = programs.find(p => p.id === offering.program_id)?.name || '';

            openModal(`Edit Offering — ${specName}`, { type: 'offering-tabs', offering, activeSubTab: null, programName, specName });
        } finally {
            setOfferingModalLoading(false);
        }
    };

    // -- Rendering helpers for modal content --
    const renderModalBody = () => {
        if (!modalContent) return null;
        const { type } = modalContent;

        if (type === 'specialization-table') {
            const { specs, program } = modalContent;
            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
                        {lsqData[`program-spec-${program.id}`] ? (
                            <button className="action-btn live-data-btn" onClick={() => openLiveDataModal(`program-spec-${program.id}`)}>Live Data</button>
                        ) : (
                            <button className="action-btn" onClick={() => openLiveSourceModal('specialization', { programId: program.id, programName: program.name })}>Live Source</button>
                        )}
                    </div>
                    {specs.length > 0 ? (
                        <div className="table-wrapper">
                            <div className="table-header">
                                <div className="table-col" style={{ width: '10%', minWidth: '50px' }}>SR NO</div>
                                <div className="table-col" style={{ flex: '1 1 50%' }}>SPECIALIZATION NAME</div>
                                <div className="table-col" style={{ flex: '1 1 30%' }}>ACTIONS</div>
                            </div>
                            {specs.map((spec, index) => (
                                <div className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`} key={spec.id}>
                                    <div className="table-col" style={{ width: '10%', minWidth: '50px' }}>{index + 1}</div>
                                    <div className="table-col" style={{ flex: '1 1 50%' }}>
                                        <span className="uni-name">{spec.specialization_name || 'Unnamed'}</span>
                                    </div>
                                    <div className="table-col" style={{ flex: '1 1 30%' }}>
                                        <button className="action-btn" onClick={() => {
                                            closeModal();
                                            setSelectedCard('program-specialisation');
                                            setSelectedProgram(program.id);
                                            setEditingEntityId(spec.id);
                                            setEditingSourceData(spec._source_data || spec);
                                            const keyMap = academicsFieldKeyMap['program-specialisation'];
                                            if (keyMap) {
                                                const prefilled = {};
                                                Object.entries(keyMap).forEach(([label, jsonKey]) => {
                                                    const val = spec[jsonKey];
                                                    if (jsonKey.endsWith('_json')) {
                                                        prefilled[label] = Array.isArray(val) ? val.join(', ') : (val ? String(val) : '');
                                                    } else {
                                                        prefilled[label] = val !== undefined && val !== null ? String(val) : '';
                                                    }
                                                });
                                                setCardFieldData(prefilled);
                                            }
                                        }}>Edit</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#66758A', textAlign: 'center', padding: '24px 0' }}>No specializations yet.</p>
                    )}
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="add-university-btn" onClick={() => { closeModal(); setSelectedCard('program-specialisation'); setCardFieldData({}); setSelectedProgram(program.id); }}>+ Add Specialization</button>
                    </div>
                </div>
            );
        }

        if (type === 'offering-tabs') {
            const { offering, activeSubTab } = modalContent;
            const subCards = [
                { id: 'program-offering', title: 'Program Offering', icon: <path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
                { id: 'curriculum', title: 'Program Offering Curriculum', icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5V4.5A2.5 2.5 0 016.5 2H20V22H6.5A2.5 2.5 0 014 19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
                { id: 'eligibility', title: 'Program Offering Eligibility', icon: <path d="M9 11L12 14L22 4M21 12V19A2 2 0 0119 21H5A2 2 0 013 19V5A2 2 0 015 3H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
                { id: 'addon', title: 'Program Offering Addon', icon: <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
                { id: 'fee-structure', title: 'Program Offering Fee Structure', icon: <path d="M12 1V23M17 5H9.5A3.5 3.5 0 009.5 12H14.5A3.5 3.5 0 0114.5 19H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
                { id: 'offering-faculty', title: 'Program Offering Faculty', icon: <path d="M20 21V19A4 4 0 0016 15H8A4 4 0 004 19V21M12 11A4 4 0 100 3 4 4 0 000 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
            ];

            // If no sub-card selected yet, show the 5 clickable cards
            if (!activeSubTab) {
                const hasOfferingLsq = !!lsqData[`offering-all-${offering.id}`];
                // Only show top-level Live Source for offerings created from Live Source
                // (i.e., there's a successful program_specialization LSQ entry for this program AND the offering has a specialization_id)
                const isFromLiveSource = !!offering.specialization_id && !!lsqData[`program-spec-${offering.program_id}`];
                return (
                    <div>
                        {/* Top-level Live Source / Live Data — only for offerings from Live Source */}
                        {isFromLiveSource && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px' }}>
                                {hasOfferingLsq ? (
                                    <button className="action-btn live-data-btn" onClick={() => openLiveDataModal(`offering-all-${offering.id}`)}>Live Data</button>
                                ) : (
                                    <button className="action-btn" onClick={() => openLiveSourceModal('offering-all-sub-entities', {
                                        offeringId: offering.id,
                                        offeringName: modalContent.specName || '',
                                        programId: offering.program_id,
                                        programName: modalContent.programName || '',
                                    })}>Live Source</button>
                                )}
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                            {subCards.map(card => {
                                const subCardData = offeringSubData[card.id] || null;
                                const subCardProgress = calculateProgress(subCardData, academicsFieldKeyMap[card.id]);
                                const hasLiveData = !!lsqData[`${card.id}-${offering.id}`];
                                return (
                                    <div
                                        key={card.id}
                                        onClick={async () => {
                                            setSelectedCard(card.id);
                                            setEditingEntityId(null);
                                            const keyMap = academicsFieldKeyMap[card.id];

                                            if (card.id === 'program-offering' && offering && keyMap) {
                                                // Prefill from the offering object directly
                                                setEditingEntityId(offering.id);
                                                setEditingSourceData(offering._source_data || null);
                                                const prefilled = {};
                                                Object.entries(keyMap).forEach(([label, jsonKey]) => {
                                                    const val = offering[jsonKey];
                                                    if (label.includes('(Yes/No)')) {
                                                        prefilled[label] = val === true ? 'Yes' : val === false ? 'No' : '';
                                                    } else if (jsonKey.endsWith('_json')) {
                                                        prefilled[label] = Array.isArray(val) ? val.join(', ') : (val ? String(val) : '');
                                                    } else {
                                                        prefilled[label] = val !== undefined && val !== null ? String(val) : '';
                                                    }
                                                });
                                                setCardFieldData(prefilled);
                                            } else if (['fee-structure', 'eligibility', 'addon', 'offering-faculty'].includes(card.id) && offering?.id) {
                                                // Fetch existing data for offering-scoped sub-entities
                                                const subPathMap = { 'fee-structure': 'fees', 'eligibility': 'eligibility', 'addon': 'addons', 'offering-faculty': 'faculty' };
                                                try {
                                                    const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offering.id}/${subPathMap[card.id]}`);
                                                    if (res.ok) {
                                                        const result = await res.json();
                                                        // Set source data from sc_ table response
                                                        const scArr = result.source_data || [];
                                                        const scItem = Array.isArray(scArr) ? scArr[0] : scArr;
                                                        setEditingSourceData(scItem || null);

                                                        const existing = Array.isArray(result.data) ? result.data[0] : result.data;
                                                        if (existing && keyMap) {
                                                            setEditingEntityId(existing.id);
                                                            const prefilled = {};
                                                            Object.entries(keyMap).forEach(([label, jsonKey]) => {
                                                                let val = existing[jsonKey];
                                                                // Flatten JSONB objects like fee_type: {type:'x'} ? 'x'
                                                                if (val && typeof val === 'object' && !Array.isArray(val) && val.type !== undefined) {
                                                                    val = val.type;
                                                                }
                                                                if (label.includes('(Yes/No)')) {
                                                                    prefilled[label] = val === true ? 'Yes' : val === false ? 'No' : '';
                                                                } else if (jsonKey.endsWith('_json')) {
                                                                    prefilled[label] = Array.isArray(val) ? val.join(', ') : (val ? String(val) : '');
                                                                } else {
                                                                    prefilled[label] = val !== undefined && val !== null ? String(val) : '';
                                                                }
                                                            });
                                                            setCardFieldData(prefilled);
                                                        } else {
                                                            setCardFieldData({});
                                                        }
                                                    } else {
                                                        setEditingSourceData(null);
                                                        setCardFieldData({});
                                                    }
                                                } catch (err) {
                                                    console.error(`Error fetching ${card.id}:`, err);
                                                    setEditingSourceData(null);
                                                    setCardFieldData({});
                                                }
                                            } else {
                                                setCardFieldData({});
                                            }

                                            if (card.id === 'curriculum' && offering?.id) {
                                                fetchCurriculumForOffering(offering.id);
                                                setCardViewMode('table');
                                            } else if (card.id === 'eligibility' && offering?.id) {
                                                fetchEligibilityForOffering(offering.id);
                                                setCardViewMode('table');
                                            } else if (card.id === 'fee-structure' && offering?.id) {
                                                fetchFeesForOffering(offering.id);
                                                setCardViewMode('table');
                                            } else if (card.id === 'addon' && offering?.id) {
                                                fetchAddonsForOffering(offering.id);
                                                setCardViewMode('table');
                                            } else if (card.id === 'offering-faculty' && offering?.id) {
                                                fetchFacultyForOffering(offering.id);
                                                setCardViewMode('table');
                                            } else {
                                                setCardViewMode(null);
                                            }
                                            setModalContent(prev => ({ ...prev, activeSubTab: card.id }));
                                        }}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            gap: '10px', padding: '20px 12px',
                                            border: hasLiveData ? '1.5px solid #059669' : '1.5px solid #E6E6E6',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            background: hasLiveData ? '#F0FDF9' : '#FBFBFB',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = hasLiveData ? '#047857' : '#930051'; e.currentTarget.style.boxShadow = hasLiveData ? '0 2px 8px rgba(5,150,105,0.15)' : '0 2px 8px rgba(147,0,81,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = hasLiveData ? '#059669' : '#E6E6E6'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: '#930051' }}>{card.icon}</svg>
                                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, color: '#333', textAlign: 'center' }}>{card.title}</span>
                                        {/* Progress bar */}
                                        <div style={{ width: '100%', marginTop: '4px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '10px', color: '#66758A' }}>Progress</span>
                                                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '10px', fontWeight: 600, color: subCardProgress > 0 ? '#930051' : '#66758A' }}>{subCardProgress}%</span>
                                            </div>
                                            <div style={{ width: '100%', height: '4px', background: '#E8E8E8', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${subCardProgress}%`, height: '100%', background: 'linear-gradient(90deg, #930051, #D4006A)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // Sub-card selected — show table for curriculum, form for others
            const activeCard = subCards.find(c => c.id === activeSubTab);

            // Table view for curriculum, eligibility, fee-structure, addon
            if (['curriculum', 'eligibility', 'fee-structure', 'addon', 'offering-faculty'].includes(activeSubTab) && cardViewMode === 'table') {
                const config = ENTITY_TABLE_CONFIG[activeSubTab];
                const colWidth = Math.max(10, Math.floor(68 / config.columns.length)) + '%';
                const tableMinWidth = 60 + (config.columns.length * 140) + 120; // SR NO + cols + actions
                const titleMap = { curriculum: 'Program Offering Curriculum', eligibility: 'Program Offering Eligibility', 'fee-structure': 'Program Offering Fee Structure', addon: 'Program Offering Addon', 'offering-faculty': 'Program Offering Faculty' };
                const entityLabel = { curriculum: 'Curriculum Entry', eligibility: 'Eligibility Entry', 'fee-structure': 'Fee Entry', addon: 'Addon Entry', 'offering-faculty': 'Faculty Entry' };
                const fetchFn = { curriculum: fetchCurriculumForOffering, eligibility: fetchEligibilityForOffering, 'fee-structure': fetchFeesForOffering, addon: fetchAddonsForOffering, 'offering-faculty': fetchFacultyForOffering };
                return (
                    <div>
                        <button
                            onClick={() => { setCardViewMode(null); setModalContent(prev => ({ ...prev, activeSubTab: null })); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', marginBottom: '12px',
                                border: 'none', background: 'transparent', cursor: 'pointer',
                                fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, color: '#930051',
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Back to cards
                        </button>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#333', margin: 0 }}>{titleMap[activeSubTab]}</h4>
                            {lsqData[`${activeSubTab}-${offering.id}`] ? (
                                <button className="action-btn live-data-btn" onClick={() => openLiveDataModal(`${activeSubTab}-${offering.id}`)}>Live Data</button>
                            ) : (
                                <button className="action-btn" onClick={() => openLiveSourceModal(activeSubTab, {
                                    offeringId: offering.id,
                                    offeringName: modalContent.specName || '',
                                    programId: offering.program_id,
                                    programName: modalContent.programName || '',
                                })}>Live Source</button>
                            )}
                        </div>
                        {entityTableData.length > 0 ? (
                            <div className="table-wrapper master-table" style={{ overflowX: 'auto' }}>
                                <div style={{ minWidth: tableMinWidth + 'px' }}>
                                    <div className="table-header">
                                        <div className="table-col" style={{ width: '60px', minWidth: '60px', flexShrink: 0 }}>SR NO</div>
                                        {config.columns.map(col => (
                                            <div className="table-col" key={col.k} style={{ flex: '1 1 140px', minWidth: '120px' }}>{col.h}</div>
                                        ))}
                                        <div className="table-col" style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>ACTIONS</div>
                                    </div>
                                    {entityTableData.map((row, index) => (
                                        <div className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`} key={row.id || index}>
                                            <div className="table-col" style={{ width: '60px', minWidth: '60px', flexShrink: 0 }}>{index + 1}</div>
                                            {config.columns.map(col => (
                                                <div className="table-col" key={col.k} style={{ flex: '1 1 140px', minWidth: '120px' }}>
                                                    <span className="uni-name">{(() => {
                                                        const val = row[col.k];
                                                        if (val === null || val === undefined) return '-';
                                                        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                                                        if (typeof val === 'object') {
                                                            if (Array.isArray(val)) return val.join(', ') || '-';
                                                            if (val.type) return val.type;
                                                            return JSON.stringify(val);
                                                        }
                                                        return String(val);
                                                    })()}</span>
                                                </div>
                                            ))}
                                            <div className="table-col action-col" style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>
                                                <button className="action-btn" onClick={() => {
                                                    handleEditEntity(activeSubTab, row);
                                                }}>Edit</button>
                                                {activeSubTab === 'curriculum' && (
                                                    <button className="action-btn" style={{ color: '#D32F2F', borderColor: '#D32F2F' }} onClick={() => {
                                                        setConfirmDialog({
                                                            message: 'Are you sure you want to delete this curriculum entry?',
                                                            onConfirm: async () => {
                                                                try {
                                                                    const res = await fetch(`${BACKEND_URL}/api/universities/curriculum/${row.id}`, { method: 'DELETE' });
                                                                    if (res.ok) {
                                                                        showToast('Deleted successfully!');
                                                                        if (offering?.id) fetchCurriculumForOffering(offering.id);
                                                                    } else {
                                                                        showToast('Failed to delete', 'error');
                                                                    }
                                                                } catch (err) { console.error('Delete error:', err); showToast('Error deleting entry', 'error'); }
                                                            },
                                                        });
                                                    }}>Delete</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#66758A', textAlign: 'center', padding: '40px 0', fontFamily: 'Manrope, sans-serif', fontSize: '14px' }}>
                                No {entityLabel[activeSubTab].toLowerCase()}s yet.
                            </div>
                        )}
                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="add-university-btn" onClick={() => { setEditingEntityId(null); setCardViewMode('form'); setCardFieldData({}); }}>+ Add {entityLabel[activeSubTab]}</button>
                        </div>
                    </div>
                );
            }

            // Form view (for all sub-cards, including curriculum/eligibility/fee when in form mode)
            return (
                <div>
                    <button
                        onClick={() => {
                            const tableSubTabs = ['curriculum', 'eligibility', 'fee-structure', 'addon', 'offering-faculty'];
                            if (tableSubTabs.includes(activeSubTab) && cardViewMode === 'form') {
                                // Back to table
                                setCardViewMode('table');
                                setEditingEntityId(null);
                                setCardFieldData({});
                                if (offering?.id) {
                                    if (activeSubTab === 'curriculum') fetchCurriculumForOffering(offering.id);
                                    else if (activeSubTab === 'eligibility') fetchEligibilityForOffering(offering.id);
                                    else if (activeSubTab === 'fee-structure') fetchFeesForOffering(offering.id);
                                    else if (activeSubTab === 'addon') fetchAddonsForOffering(offering.id);
                                    else if (activeSubTab === 'offering-faculty') fetchFacultyForOffering(offering.id);
                                }
                            } else {
                                setModalContent(prev => ({ ...prev, activeSubTab: null }));
                            }
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', marginBottom: '12px',
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, color: '#930051',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {['curriculum', 'eligibility', 'fee-structure', 'addon', 'offering-faculty'].includes(activeSubTab) && cardViewMode === 'form' ? 'Back to table' : 'Back to cards'}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: '#333', margin: 0 }}>{activeCard?.title}</h4>
                        {activeSubTab === 'addon' && (
                            <button className="action-btn" onClick={() => openLiveSourceModal('addon')}>Live Source</button>
                        )}
                    </div>
                    {renderCardFields(activeSubTab)}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button className="add-university-btn" onClick={confirmSaveCard}>Save</button>
                    </div>
                </div>
            );
        }

        return null;
    };

    const renderContent = () => {
        // University Master cards (identity + value combined)
        const universityMasterCards = [
            { id: 'profile', title: 'Profile', fieldCount: 12 },
            { id: 'address', title: 'Address', fieldCount: 9 },
            { id: 'metadata', title: 'Metadata', fieldCount: 6 },
            { id: 'ranking', title: 'Ranking', fieldCount: 8 },
            { id: 'accredition', title: 'Accredition', fieldCount: 6 },
            { id: 'highlights', title: 'Highlights', fieldCount: 6 },
            { id: 'gallery', title: 'Gallery', fieldCount: 7 },
            { id: 'faqs', title: "FAQ's", fieldCount: 6 },
            { id: 'university-faculty', title: 'University Faculty', fieldCount: 8 },
            { id: 'student-testimonials', title: 'Student Testimonials', fieldCount: 8 },
            { id: 'hiring-partners', title: 'Hiring Partners', fieldCount: 5 },
            { id: 'placement-outcome', title: 'Placement Outcome', fieldCount: 6 },
            { id: 'university-scholarship', title: 'University Scholarship', fieldCount: 7 },
        ].map(card => {
            const column = cardToColumn[card.id];
            const keyMapObj = fieldKeyMap[card.id] || valueFieldKeyMap[card.id];
            const progress = calculateProgress(column ? university?.[column] : (card.id === 'profile' ? university : null), keyMapObj);
            return { ...card, progress, status: getStatus(progress) };
        });

        // -- Table view for entity cards (skip if modal is open to avoid background forms) --
        if (selectedCard && !modalOpen && ENTITY_TABLE_CONFIG[selectedCard] && cardViewMode === 'table') {
            const tableData = entityTableData;

            const entityLabels = {
                ranking: 'Rankings', accredition: 'Accreditations', highlights: 'Highlights',
                gallery: 'Gallery', faqs: "FAQ's", 'university-faculty': 'University Faculty',
                'student-testimonials': 'Student Testimonials', 'hiring-partners': 'Hiring Partners',
                'placement-outcome': 'Placement Outcomes',
            };

            return (
                <div className="details-section">
                    <div className="details-page-header">
                        <button onClick={handleBackToGrid} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#930051', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', padding: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Back to cards
                        </button>
                    </div>
                    <div className="details-page-header" style={{ marginTop: '8px' }}>
                        <span>{entityLabels[selectedCard] || selectedCard}</span>
                    </div>
                    {renderEntityTable(selectedCard, tableData)}
                </div>
            );
        }

        // -- Detail form view when a card is selected (skip if modal is open to avoid background forms) --
        if (selectedCard && !modalOpen) {
            const cardLists = {
                'university-master': universityMasterCards,
                'program-master': academicsCards,
                'specialization-master': academicsCards,
                'offering-master': academicsCards,
                incentives: incentivesCards,
                legal: legalCards,
                commercials: commercialsCards,
                lead: leadCards,
            };
            const allCards = cardLists[activeTab] || universityMasterCards;
            const cardData = allCards.find(c => c.id === selectedCard) || { title: selectedCard, progress: 0 };

            const sectionNameMap = {
                'university-master': 'University Master',
                'program-master': 'Program Master',
                'specialization-master': 'Specialization Master',
                'offering-master': 'Offering Master',
                incentives: 'Incentives / Scholarships',
                legal: 'Legal/Admin',
                commercials: 'Commercials',
                lead: 'Lead',
            };
            const sectionName = sectionNameMap[activeTab] || 'University Master';

            return (
                <div className="details-section">
                    <IdentityDetailsContainer
                        title={cardData.title}
                        sectionName={sectionName}
                        progress={cardData.progress}
                        onBack={handleBackToGrid}
                        onSave={confirmSaveCard}
                    >
                        {renderCardFields(selectedCard)}
                    </IdentityDetailsContainer>
                </div>
            );
        }

        switch (activeTab) {
            case 'university-master':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <span>University Master</span>
                        </div>
                        <div className="uni-cards-grid">
                            {universityMasterCards.map((card) => (
                                <UniversityActionCard
                                    key={card.id}
                                    title={card.title}
                                    subtitle={`Contains ${card.fieldCount} verification fields.`}
                                    status={card.status}
                                    progress={card.progress}
                                    icon={
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="#930051" strokeWidth="1.5" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="#930051" strokeWidth="1.5" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" stroke="#930051" strokeWidth="1.5" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="#930051" strokeWidth="1.5" />
                                        </svg>
                                    }
                                    onClick={() => handleCardClick(card.id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'program-master':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22 10L12 5L2 10L12 15L22 10ZM6 12V17C6 17.55 8.69 18 12 18C15.31 18 18 17.55 18 17M12 15V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Program Master</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#4A5666' }}>Programs</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <SearchBar value={masterSearchQuery} onChange={(val) => setMasterSearchQuery(val)} placeholder="Search programs..." />
                                <button className="add-university-btn" onClick={() => { const name = prompt('Enter program name:'); if (name && name.trim()) handleAddProgram(name.trim()); }}>+ Add New Program</button>
                            </div>
                        </div>
                        {programsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                                <div style={{ width: '44px', height: '44px', border: '4px solid #E6E6E6', borderTopColor: '#930051', borderRadius: '50%', animation: 'dtSpinner 0.8s linear infinite' }} />
                                <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, color: '#930051' }}>Loading programs...</span>
                            </div>
                        ) : programs.length > 0 ? (
                            <div className="table-wrapper master-table" style={{ overflowX: 'auto' }}>
                                <div className="table-header" style={{ minWidth: '1000px' }}>
                                    <div className="table-col" style={{ width: '5%', minWidth: '45px' }}>SR NO</div>
                                    <div className="table-col" style={{ width: '20%', minWidth: '160px' }}>PROGRAM NAME</div>
                                    <div className="table-col" style={{ width: '12%', minWidth: '110px' }}>PROGRAM LEVEL</div>
                                    <div className="table-col" style={{ width: '12%', minWidth: '110px' }}>GLOBAL DEGREE</div>
                                    <div className="table-col" style={{ width: '9%', minWidth: '80px' }}>DURATION</div>
                                    <div className="table-col" style={{ width: '10%', minWidth: '95px' }}>TOTAL CREDITS</div>
                                    <div className="table-col" style={{ width: '23%', minWidth: '250px' }}>ACTIONS</div>
                                </div>
                                {(() => {
                                    const q = masterSearchQuery.toLowerCase();
                                    const filtered = q ? programs.filter(p =>
                                        (p.name || '').toLowerCase().includes(q) ||
                                        (p.program_level || '').toLowerCase().includes(q) ||
                                        (p.global_degree_type || '').toLowerCase().includes(q)
                                    ) : programs;
                                    return filtered.map((program, index) => (
                                        <div className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`} key={program.id} style={{ minWidth: '1000px' }}>
                                            <div className="table-col" style={{ width: '5%', minWidth: '45px' }}>{index + 1}</div>
                                            <div className="table-col" style={{ width: '20%', minWidth: '160px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="uni-avatar" style={{ flexShrink: 0 }}><span>{(program.name || 'P').charAt(0)}</span></div>
                                                <span className="uni-name" style={{ flex: '1 1 0', minWidth: 0 }}>{program.name || 'Unnamed'}</span>
                                            </div>
                                            <div className="table-col" style={{ width: '12%', minWidth: '110px' }}>{program.program_level || '-'}</div>
                                            <div className="table-col" style={{ width: '12%', minWidth: '110px' }}>{program.global_degree_type || '-'}</div>
                                            <div className="table-col" style={{ width: '9%', minWidth: '80px' }}>{program.duration_months ? `${program.duration_months}m` : '-'}</div>
                                            <div className="table-col" style={{ width: '10%', minWidth: '95px' }}>{program.total_credits || '-'}</div>
                                            <div className="table-col action-col" style={{ width: '32%', minWidth: '250px' }}>
                                                <button className="action-btn" onClick={async () => {
                                                    setSelectedProgram(program.id);
                                                    await handleProgramSelect(program.id);
                                                    // Fetch fresh data to avoid stale state
                                                    try {
                                                        const res = await fetch(`${BACKEND_URL}/api/universities/${university.id}/programs/${program.id}`);
                                                        if (res.ok) {
                                                            const result = await res.json();
                                                            setSelectedProgramData(result);
                                                            // Prefill form from fresh data
                                                            const keyMap = academicsFieldKeyMap['degree-master'];
                                                            if (keyMap && result.data) {
                                                                const prefilled = {};
                                                                Object.entries(keyMap).forEach(([label, jsonKey]) => {
                                                                    const val = result.data[jsonKey];
                                                                    if (label.includes('(Yes/No)')) {
                                                                        prefilled[label] = val === true ? 'Yes' : val === false ? 'No' : '';
                                                                    } else if (jsonKey.endsWith('_json')) {
                                                                        prefilled[label] = Array.isArray(val) ? val.join(', ') : (val ? String(val) : '');
                                                                    } else {
                                                                        prefilled[label] = val !== undefined && val !== null ? String(val) : '';
                                                                    }
                                                                });
                                                                setCardFieldData(prefilled);
                                                            }
                                                            setEditingSourceData(result.source_data || null);
                                                        }
                                                    } catch (err) { console.error('Error fetching program:', err); }
                                                    setSelectedCard('degree-master');
                                                }}>Edit</button>
                                                <button className="action-btn" onClick={() => openSpecializationModal(program)}>Specializations</button>
                                                {lsqData[`program-spec-${program.id}`] && (
                                                    <button className="action-btn live-data-btn" onClick={() => openLiveDataModal(`program-spec-${program.id}`)}>Live Data</button>
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <div className="academics-empty-state">
                                <div className="academics-empty-icon">
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                        <path d="M44 20L24 10L4 20L24 30L44 20Z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 24V34C12 34 16 38 24 38C32 38 36 34 36 34V24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3>No Programs Yet</h3>
                                <p>Click <strong>+ Add New Program</strong> to create your first program.</p>
                            </div>
                        )}
                    </div>
                );

            case 'specialization-master':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Specialization Master</span>
                        </div>
                        <SearchBar value={masterSearchQuery} onChange={(val) => setMasterSearchQuery(val)} placeholder="Search specializations..." />
                        {specsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                                <div style={{ width: '44px', height: '44px', border: '4px solid #E6E6E6', borderTopColor: '#930051', borderRadius: '50%', animation: 'dtSpinner 0.8s linear infinite' }} />
                                <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, color: '#930051' }}>Loading specializations...</span>
                            </div>
                        ) : allSpecializations.length > 0 ? (
                            <div className="table-wrapper master-table" style={{ overflowX: 'auto' }}>
                                <div className="table-header" style={{ minWidth: '1050px' }}>
                                    <div className="table-col" style={{ width: '5%', minWidth: '45px' }}>SR NO</div>
                                    <div className="table-col" style={{ width: '17%', minWidth: '150px' }}>SPECIALIZATION NAME</div>
                                    <div className="table-col" style={{ width: '15%', minWidth: '130px' }}>PROGRAM NAME</div>
                                    <div className="table-col" style={{ width: '10%', minWidth: '110px' }}>PROGRAM LEVEL</div>
                                    <div className="table-col" style={{ width: '7%', minWidth: '60px' }}>MODE</div>
                                    <div className="table-col" style={{ width: '7%', minWidth: '65px' }}>CREDITS</div>
                                    <div className="table-col" style={{ width: '9%', minWidth: '75px' }}>DURATION</div>
                                    <div className="table-col" style={{ width: '30%', minWidth: '250px' }}>ACTIONS</div>
                                </div>
                                {(() => {
                                    const q = masterSearchQuery.toLowerCase();
                                    const filtered = q ? allSpecializations.filter(s =>
                                        (s.specialization_name || '').toLowerCase().includes(q) ||
                                        (s.program_name || '').toLowerCase().includes(q) ||
                                        (s.program_level || '').toLowerCase().includes(q)
                                    ) : allSpecializations;
                                    return filtered.map((spec, index) => (
                                        <div className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`} key={spec.id} style={{ minWidth: '1050px' }}>
                                            <div className="table-col" style={{ width: '5%', minWidth: '45px' }}>{index + 1}</div>
                                            <div className="table-col" style={{ width: '17%', minWidth: '150px' }}><span className="uni-name">{spec.specialization_name || '-'}</span></div>
                                            <div className="table-col" style={{ width: '15%', minWidth: '130px' }}>{spec.program_name || '-'}</div>
                                            <div className="table-col" style={{ width: '10%', minWidth: '110px' }}>{spec.program_level || '-'}</div>
                                            <div className="table-col" style={{ width: '7%', minWidth: '60px' }}>{spec.mode || '-'}</div>
                                            <div className="table-col" style={{ width: '7%', minWidth: '65px' }}>{spec.total_credits || '-'}</div>
                                            <div className="table-col" style={{ width: '9%', minWidth: '75px' }}>{spec.duration_months ? `${spec.duration_months}m` : '-'}</div>
                                            <div className="table-col action-col" style={{ width: '30%', minWidth: '250px' }}>
                                                <button className="action-btn" onClick={() => {
                                                    setSelectedCard('program-specialisation');
                                                    setSelectedProgram(spec.program_id);
                                                    setEditingEntityId(spec.id);
                                                    setEditingSourceData(spec._source_data || spec);
                                                    // Prefill form from specialization data
                                                    const keyMap = academicsFieldKeyMap['program-specialisation'];
                                                    if (keyMap) {
                                                        const prefilled = {};
                                                        Object.entries(keyMap).forEach(([label, jsonKey]) => {
                                                            const val = spec[jsonKey];
                                                            if (jsonKey.endsWith('_json')) {
                                                                prefilled[label] = Array.isArray(val) ? val.join(', ') : (val ? String(val) : '');
                                                            } else {
                                                                prefilled[label] = val !== undefined && val !== null ? String(val) : '';
                                                            }
                                                        });
                                                        setCardFieldData(prefilled);
                                                    }
                                                }}>Edit</button>
                                                <button className="action-btn" onClick={() => { setSelectedCard('program-offering'); setCardFieldData({}); setSelectedProgram(spec.program_id); }}>Offering</button>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <div className="academics-empty-state">
                                <div className="academics-empty-icon">
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                        <path d="M24 4L4 14L24 24L44 14L24 4Z" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4 34L24 44L44 34" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4 24L24 34L44 24" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3>No Specializations Yet</h3>
                                <p>Create specializations from the <strong>Program Master</strong> tab.</p>
                            </div>
                        )}
                    </div>
                );

            case 'offering-master':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Offering Master</span>
                            <button
                                onClick={() => setShowAddOfferingForm(!showAddOfferingForm)}
                                style={{
                                    marginLeft: 'auto',
                                    backgroundColor: '#930051',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    fontFamily: 'Manrope, sans-serif',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7a0043'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#930051'}
                            >
                                <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                                    <path
                                        d="M7 3V11M3 7H11"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                    />

                                </svg>
                                Add New Offering
                            </button>
                        </div>

                        {/* Search bar */}
                        <SearchBar value={masterSearchQuery} onChange={(val) => setMasterSearchQuery(val)} placeholder="Search offerings..." />

                        {/* Add Offering Inline Form */}
                        {showAddOfferingForm && (
                            <div style={{
                                backgroundColor: '#F8F4F6',
                                borderRadius: '10px',
                                padding: '20px',
                                marginBottom: '16px',
                                border: '1px solid #E8D5DF',
                            }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, color: '#4A5666', marginBottom: '6px' }}>
                                            Program *
                                        </label>
                                        <select
                                            value={newOfferingProgramId}
                                            onChange={(e) => { setNewOfferingProgramId(e.target.value); setNewOfferingSpecId(''); }}
                                            style={{
                                                width: '100%',
                                                padding: '9px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #CBD5E1',
                                                fontFamily: 'Manrope, sans-serif',
                                                fontSize: '13px',
                                                color: '#333',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                            }}
                                        >
                                            <option value="">Select a program...</option>
                                            {programs.map(p => (
                                                <option key={p.id} value={p.id}>{p.name || p.program_name || p.id}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '12px', fontWeight: 600, color: '#4A5666', marginBottom: '6px' }}>
                                            Specialization (optional)
                                        </label>
                                        <select
                                            value={newOfferingSpecId}
                                            onChange={(e) => setNewOfferingSpecId(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '9px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #CBD5E1',
                                                fontFamily: 'Manrope, sans-serif',
                                                fontSize: '13px',
                                                color: '#333',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                            }}
                                            disabled={!newOfferingProgramId}
                                        >
                                            <option value="">Select a specialization...</option>
                                            {allSpecializations
                                                .filter(s => s.program_id === newOfferingProgramId)
                                                .map(s => (
                                                    <option key={s.id} value={s.id}>{s.specialization_name || s.id}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={handleAddOffering}
                                            style={{
                                                backgroundColor: '#930051',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '9px 20px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                fontFamily: 'Manrope, sans-serif',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s ease'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7a0043'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#930051'}
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => { setShowAddOfferingForm(false); setNewOfferingProgramId(''); setNewOfferingSpecId(''); }}
                                            style={{
                                                backgroundColor: '#F1F5F9',
                                                color: '#4A5666',
                                                border: '1px solid #CBD5E1',
                                                borderRadius: '8px',
                                                padding: '9px 20px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                fontFamily: 'Manrope, sans-serif',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {offeringsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                                <div style={{ width: '44px', height: '44px', border: '4px solid #E6E6E6', borderTopColor: '#930051', borderRadius: '50%', animation: 'dtSpinner 0.8s linear infinite' }} />
                                <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, color: '#930051' }}>Loading offerings...</span>
                            </div>
                        ) : allOfferings.length > 0 ? (
                            <div className="table-wrapper master-table" style={{ overflowX: 'auto' }}>
                                <div className="table-header" style={{ minWidth: '1100px' }}>
                                    <div className="table-col" style={{ width: '4%', minWidth: '45px' }}>SR NO</div>
                                    <div className="table-col" style={{ width: '14%', minWidth: '140px' }}>SPECIALIZATION NAME</div>
                                    <div className="table-col" style={{ width: '13%', minWidth: '130px' }}>PROGRAM NAME</div>
                                    <div className="table-col" style={{ width: '9%', minWidth: '110px' }}>PROGRAM LEVEL</div>
                                    <div className="table-col" style={{ width: '6%', minWidth: '55px' }}>MODE</div>
                                    <div className="table-col" style={{ width: '7%', minWidth: '65px' }}>CREDITS</div>
                                    <div className="table-col" style={{ width: '8%', minWidth: '75px' }}>DURATION</div>
                                    <div className="table-col" style={{ width: '10%', minWidth: '100px' }}>MAX DURATION</div>
                                    <div className="table-col" style={{ width: '29%', minWidth: '250px' }}>ACTIONS</div>
                                </div>
                                {(() => {
                                    const q = masterSearchQuery.toLowerCase();
                                    const filtered = q ? allOfferings.filter(o =>
                                        (o.program_name || '').toLowerCase().includes(q) ||
                                        (o.program_level || '').toLowerCase().includes(q) ||
                                        (o.sku_code || '').toLowerCase().includes(q) ||
                                        (() => {
                                            const specMatch = allSpecializations.find(s => s.id === o.specialization_id);
                                            return specMatch ? (specMatch.specialization_name || '').toLowerCase().includes(q) : false;
                                        })()
                                    ) : allOfferings;
                                    return filtered.map((offering, index) => {
                                        let specName = '-';
                                        if (offering.specialization_id) {
                                            const found = allSpecializations.find(s => s.id === offering.specialization_id);
                                            specName = found?.specialization_name || offering.sku_code || '-';
                                        } else if (offering._source_data?.specialization_id) {
                                            const found = allSpecializations.find(s => s.id === offering._source_data.specialization_id);
                                            specName = found?.specialization_name || offering.sku_code || '-';
                                        }
                                        return (
                                            <div className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`} key={offering.id} style={{ minWidth: '1100px' }}>
                                                <div className="table-col" style={{ width: '4%', minWidth: '45px' }}>{index + 1}</div>
                                                <div className="table-col" style={{ width: '14%', minWidth: '140px' }}><span className="uni-name">{specName}</span></div>
                                                <div className="table-col" style={{ width: '13%', minWidth: '130px' }}>{offering.program_name || '-'}</div>
                                                <div className="table-col" style={{ width: '9%', minWidth: '110px' }}>{offering.program_level || '-'}</div>
                                                <div className="table-col" style={{ width: '6%', minWidth: '55px' }}>{offering.mode || '-'}</div>
                                                <div className="table-col" style={{ width: '7%', minWidth: '65px' }}>{offering.total_credits || '-'}</div>
                                                <div className="table-col" style={{ width: '8%', minWidth: '75px' }}>{offering.duration_months ? `${offering.duration_months}m` : '-'}</div>
                                                <div className="table-col" style={{ width: '10%', minWidth: '100px' }}>{offering.max_duration_months ? `${offering.max_duration_months}m` : '-'}</div>
                                                <div className="table-col action-col" style={{ width: '29%', minWidth: '250px' }}>
                                                    <button className="action-btn" style={{ position: 'relative' }} onClick={async () => { setSelectedProgram(offering.program_id); await openOfferingModal(offering); }}>
                                                        Edit
                                                    </button>
                                                    <button className="action-btn" style={{ color: '#D32F2F', borderColor: '#D32F2F' }} onClick={() => {
                                                        setConfirmDialog({
                                                            message: 'Are you sure you want to delete this offering? All related curriculum, eligibility, fees, and addons will also be removed.',
                                                            onConfirm: async () => {
                                                                try {
                                                                    const res = await fetch(`${BACKEND_URL}/api/universities/offerings/${offering.id}`, { method: 'DELETE' });
                                                                    if (res.ok) {
                                                                        showToast('Offering deleted successfully!');
                                                                        await fetchAllOfferings();
                                                                    } else {
                                                                        showToast('Failed to delete offering', 'error');
                                                                    }
                                                                } catch (err) { console.error('Delete error:', err); showToast('Error deleting offering', 'error'); }
                                                            },
                                                        });
                                                    }}>Delete</button>
                                                    {lsqData[`offering-all-${offering.id}`] && (
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                            background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px',
                                                            padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                                                            color: '#059669', fontFamily: 'Manrope, sans-serif',
                                                        }}>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                                                            Live Data
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        ) : (
                            <div className="academics-empty-state">
                                <div className="academics-empty-icon">
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                        <path d="M8 14H40M8 24H40M8 34H28" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <h3>No Offerings Yet</h3>
                                <p>Click <strong>+ Add New Offering</strong> above to create your first offering.</p>
                            </div>
                        )}
                    </div>
                );

            case 'incentives':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Incentives / Scholarships</span>
                        </div>
                        <div className="uni-cards-grid">
                            {incentivesCards.map((card) => (
                                <UniversityActionCard
                                    key={card.id}
                                    title={card.title}
                                    subtitle={`Contains ${card.fieldCount} verification fields.`}
                                    status={card.status}
                                    progress={card.progress}
                                    icon={
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="#930051" strokeWidth="1.5" />
                                            <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="#930051" strokeWidth="1.5" />
                                        </svg>
                                    }
                                    onClick={() => handleCardClick(card.id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'legal':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6H21M7 6V19M17 6V19M8 11H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Legal/Admin</span>
                        </div>
                        <div className="uni-cards-grid">
                            {legalCards.map((card) => (
                                <UniversityActionCard
                                    key={card.id}
                                    title={card.title}
                                    subtitle={`Contains ${card.fieldCount} verification fields.`}
                                    status={card.status}
                                    progress={card.progress}
                                    icon={
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 6H21M7 6V19M17 6V19M8 11H16" stroke="#930051" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    }
                                    onClick={() => handleCardClick(card.id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'commercials':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z M1 10H23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Commercials</span>
                        </div>
                        <div className="uni-cards-grid">
                            {commercialsCards.map((card) => (
                                <UniversityActionCard
                                    key={card.id}
                                    title={card.title}
                                    subtitle={`Contains ${card.fieldCount} verification fields.`}
                                    status={card.status}
                                    progress={card.progress}
                                    icon={
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z" stroke="#930051" strokeWidth="1.5" />
                                            <path d="M1 10H23" stroke="#930051" strokeWidth="1.5" />
                                        </svg>
                                    }
                                    onClick={() => handleCardClick(card.id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'lead':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Lead</span>
                        </div>
                        <div className="uni-cards-grid">
                            {leadCards.map((card) => (
                                <UniversityActionCard
                                    key={card.id}
                                    title={card.title}
                                    subtitle={`Contains ${card.fieldCount} verification fields.`}
                                    status={card.status}
                                    progress={card.progress}
                                    icon={
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#930051" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    }
                                    onClick={() => handleCardClick(card.id)}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'live-source-queue':
                return (
                    <div className="details-section">
                        <div className="details-page-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M4 6H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M4 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M4 18H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="19" cy="15" r="4" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M19 13V15L20 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Live Source Queue</span>
                        </div>
                        {lsqLoading && lsqEntries.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                                <div style={{ width: '44px', height: '44px', border: '4px solid #E6E6E6', borderTopColor: '#930051', borderRadius: '50%', animation: 'dtSpinner 0.8s linear infinite' }} />
                                <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, color: '#930051' }}>Loading queue...</span>
                            </div>
                        ) : lsqEntries.length > 0 ? (
                            <div className="table-wrapper master-table" style={{ overflowX: 'auto' }}>
                                <div className="table-header" style={{ minWidth: '900px' }}>
                                    <div className="table-col" style={{ width: '5%', minWidth: '45px' }}>S.NO</div>
                                    <div className="table-col" style={{ width: '20%', minWidth: '160px' }}>CONTEXT</div>
                                    <div className="table-col" style={{ width: '20%', minWidth: '160px' }}>SOURCE URL</div>
                                    <div className="table-col" style={{ width: '12%', minWidth: '90px' }}>STATUS</div>
                                    <div className="table-col" style={{ width: '8%', minWidth: '60px' }}>ROWS</div>
                                    <div className="table-col" style={{ width: '10%', minWidth: '80px' }}>TIME</div>
                                    <div className="table-col" style={{ width: '15%', minWidth: '130px' }}>CREATED</div>
                                </div>
                                {lsqEntries.map((entry, index) => {
                                    const createdMs = entry.created_at ? (entry.created_at < 1e12 ? entry.created_at * 1000 : entry.created_at) : 0;
                                    const isStale = entry.status === 'pending' && createdMs &&
                                        (Date.now() - createdMs) > 5 * 60 * 1000;
                                    return (
                                        <div className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`} key={entry.id || index} style={{ minWidth: '900px' }}>
                                            <div className="table-col" style={{ width: '5%', minWidth: '45px' }}>{index + 1}</div>
                                            <div className="table-col" style={{ width: '20%', minWidth: '160px' }}>{(() => {
                                                const label = targetTableLabels[entry.target_table] || entry.target_table;
                                                const parts = [];
                                                if (entry.program_name) parts.push(entry.program_name);
                                                if (entry.offering_name) parts.push(entry.offering_name);
                                                parts.push(label);
                                                return parts.length > 1 ? parts.join(' > ') : label;
                                            })()}</div>
                                            <div className="table-col" style={{ width: '20%', minWidth: '160px' }}>
                                                {entry.source_url ? (
                                                    <a href={entry.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#930051', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        {entry.source_url.length > 50 ? entry.source_url.substring(0, 50) + '...' : entry.source_url}
                                                    </a>
                                                ) : '-'}
                                            </div>
                                            <div className="table-col" style={{ width: '12%', minWidth: '90px' }}>
                                                <span
                                                    className={`lsq-status-badge lsq-status-${isStale ? 'stale' : entry.status}`}
                                                    style={entry.status === 'failed' ? { cursor: 'pointer' } : {}}
                                                    onClick={() => {
                                                        if (entry.status === 'failed') {
                                                            setLsqErrorPopup({
                                                                errors: entry.errors || null,
                                                                warnings: entry.warnings || null,
                                                                context: (() => {
                                                                    const label = targetTableLabels[entry.target_table] || entry.target_table;
                                                                    const parts = [];
                                                                    if (entry.program_name) parts.push(entry.program_name);
                                                                    if (entry.offering_name) parts.push(entry.offering_name);
                                                                    parts.push(label);
                                                                    return parts.join(' > ');
                                                                })(),
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {isStale ? 'Stale' : entry.status}
                                                </span>
                                            </div>
                                            <div className="table-col" style={{ width: '8%', minWidth: '60px' }}>{entry.row_count ?? '-'}</div>
                                            <div className="table-col" style={{ width: '10%', minWidth: '80px' }}>{entry.elapsed_ms ? `${(entry.elapsed_ms / 1000).toFixed(1)}s` : '-'}</div>
                                            <div className="table-col" style={{ width: '15%', minWidth: '130px' }}>{createdMs ? new Date(createdMs).toLocaleString() : '-'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                    <path d="M8 12H40" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M8 24H28" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M8 36H18" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                                    <circle cx="36" cy="30" r="8" stroke="#CBD5E1" strokeWidth="2" />
                                    <path d="M36 26V30L38 32" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p style={{ marginTop: '16px', fontFamily: 'Manrope, sans-serif', fontSize: '14px', color: '#94A3B8', fontWeight: 500 }}>No extraction requests yet</p>
                                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: '#CBD5E1' }}>Use "Live Source" on any card to start extracting data</p>
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="details-placeholder">
                        <h2>Select a sub-group to view details</h2>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />

            <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''} university-details-container`}>
                <div className="secondary-sidebar-wrapper">
                    <UniversitySidebar
                        university={university}
                        activeTab={activeTab}
                        onTabChange={(tab) => { setActiveTab(tab); setSelectedCard(null); setMasterSearchQuery(''); setLiveSourceData({}); }}
                        programs={programs}
                        selectedProgram={selectedProgram}
                        onProgramSelect={handleProgramSelect}
                        onAddProgram={handleAddProgram}
                    />
                </div>

                {/* Loading overlay for offering modal */}
                {offeringModalLoading && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 9999,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{ width: '44px', height: '44px', border: '4px solid #E6E6E6', borderTopColor: '#930051', borderRadius: '50%', animation: 'dtSpinner 0.8s linear infinite' }} />
                        <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, color: '#930051' }}>Loading offering details...</span>
                    </div>
                )}

                {/* Toast Notification */}
                {toast && (
                    <div style={{
                        position: 'fixed',
                        bottom: '32px',
                        right: '32px',
                        backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444',
                        color: '#fff',
                        padding: '14px 24px',
                        borderRadius: '10px',
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '14px',
                        fontWeight: 600,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        animation: 'fadeInUp 0.3s ease',
                    }}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            {toast.type === 'success'
                                ? <path d="M15 4.5L6.75 12.75L3 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                : <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            }
                        </svg>
                        {toast.message}
                    </div>
                )}

                <div className="details-content-area" style={{ position: 'relative' }}>
                    {isLoading && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.75)', zIndex: 100,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '12px', backdropFilter: 'blur(2px)',
                        }}>
                            <div style={{
                                width: '44px', height: '44px', border: '4px solid #E6E6E6',
                                borderTopColor: '#930051', borderRadius: '50%',
                                animation: 'dtSpinner 0.8s linear infinite',
                            }} />
                            <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, color: '#930051' }}>Loading...</span>
                        </div>
                    )}
                    {renderContent()}
                </div>
                <style>{`@keyframes dtSpinner { to { transform: rotate(360deg); } }`}</style>
            </div>

            {/* Modal overlay */}
            {modalOpen && modalContent && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">{modalContent.title}</h3>
                            <button className="modal-close-btn" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-body" style={{ position: 'relative', minHeight: '200px' }}>
                            {isLoading && (
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 200,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '12px', backdropFilter: 'blur(2px)',
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', border: '4px solid #E6E6E6',
                                        borderTopColor: '#930051', borderRadius: '50%',
                                        animation: 'dtSpinner 0.8s linear infinite',
                                    }} />
                                    <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600, color: '#930051' }}>Loading...</span>
                                </div>
                            )}
                            {renderModalBody()}
                        </div>
                    </div>
                </div>
            )}

            {/* LSQ Error/Warning Popup */}
            {lsqErrorPopup && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeInUp 0.2s ease',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '16px', padding: '28px 32px',
                        maxWidth: '520px', width: '90%', textAlign: 'left',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)', maxHeight: '70vh', display: 'flex', flexDirection: 'column',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'rgba(211,47,47,0.1)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>Extraction Failed</h4>
                                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '11px', color: '#66758A', margin: '2px 0 0' }}>{lsqErrorPopup.context}</p>
                                </div>
                            </div>
                            <button onClick={() => setLsqErrorPopup(null)} style={{
                                background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#999', lineHeight: 1,
                            }}>&times;</button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {lsqErrorPopup.errors && (
                                <div style={{ marginBottom: '16px' }}>
                                    <span style={{
                                        display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                                        background: '#FEE2E2', color: '#991B1B', fontFamily: 'Manrope, sans-serif',
                                        fontSize: '11px', fontWeight: 700, marginBottom: '8px',
                                    }}>Errors</span>
                                    <pre style={{
                                        background: '#FEF2F2', borderRadius: '8px', padding: '12px 14px',
                                        fontFamily: 'monospace', fontSize: '12px', color: '#991B1B',
                                        whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                                        border: '1px solid #FECACA', lineHeight: 1.5,
                                    }}>{typeof lsqErrorPopup.errors === 'string' ? lsqErrorPopup.errors : JSON.stringify(lsqErrorPopup.errors, null, 2)}</pre>
                                </div>
                            )}
                            {lsqErrorPopup.warnings && (
                                <div style={{ marginBottom: '16px' }}>
                                    <span style={{
                                        display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
                                        background: '#FEF3C7', color: '#92400E', fontFamily: 'Manrope, sans-serif',
                                        fontSize: '11px', fontWeight: 700, marginBottom: '8px',
                                    }}>Warnings</span>
                                    <pre style={{
                                        background: '#FFFBEB', borderRadius: '8px', padding: '12px 14px',
                                        fontFamily: 'monospace', fontSize: '12px', color: '#92400E',
                                        whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                                        border: '1px solid #FDE68A', lineHeight: 1.5,
                                    }}>{typeof lsqErrorPopup.warnings === 'string' ? lsqErrorPopup.warnings : JSON.stringify(lsqErrorPopup.warnings, null, 2)}</pre>
                                </div>
                            )}
                            {!lsqErrorPopup.errors && !lsqErrorPopup.warnings && (
                                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: '#66758A', textAlign: 'center', padding: '20px 0' }}>
                                    No error or warning details available for this entry.
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button
                                onClick={() => setLsqErrorPopup(null)}
                                style={{
                                    padding: '8px 24px', borderRadius: '8px', border: 'none',
                                    background: '#930051', fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                                    fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#7a0043'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#930051'; }}
                            >Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Dialog */}
            {confirmDialog && (() => {
                const isSave = confirmDialog.variant === 'save';
                const accentColor = isSave ? '#930051' : '#D32F2F';
                const accentHover = isSave ? '#7a0043' : '#B71C1C';
                const accentBg = isSave ? 'rgba(147,0,81,0.1)' : 'rgba(211,47,47,0.1)';
                const confirmLabel = confirmDialog.confirmLabel || 'OK';
                const title = isSave ? 'Save Changes' : 'Confirm Action';
                return (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeInUp 0.2s ease',
                    }}>
                        <div style={{
                            background: '#fff', borderRadius: '16px', padding: '28px 32px',
                            maxWidth: '380px', width: '90%', textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: accentBg, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                            }}>
                                {isSave ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M17 21v-8H7v8M7 3v5h8" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <h4 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>{title}</h4>
                            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', color: '#66758A', marginBottom: '24px', lineHeight: '1.5' }}>{confirmDialog.message}</p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setConfirmDialog(null)}
                                    style={{
                                        padding: '10px 28px', borderRadius: '8px', border: '1.5px solid #E0E0E0',
                                        background: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                                        fontWeight: 600, color: '#666', cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#999'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
                                >Cancel</button>
                                <button
                                    onClick={async () => {
                                        if (confirmDialog.onConfirm) await confirmDialog.onConfirm();
                                        setConfirmDialog(null);
                                    }}
                                    style={{
                                        padding: '10px 28px', borderRadius: '8px', border: 'none',
                                        background: accentColor, fontFamily: 'Manrope, sans-serif', fontSize: '13px',
                                        fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = accentHover; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = accentColor; }}
                                >{confirmLabel}</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Live Source Modal */}
            <LiveSourceModal
                isOpen={liveSourceModalOpen}
                onClose={() => setLiveSourceModalOpen(false)}
                onSave={handleLiveSourceSave}
            />

            {/* Live Data Modal */}
            <LiveDataModal
                isOpen={liveDataModalOpen}
                onClose={() => { setLiveDataModalOpen(false); setLiveDataCardId(null); }}
                lsqRow={liveDataCardId ? lsqData[liveDataCardId] : null}
                cardId={liveDataCardId}
                universityId={id}
                cardToApiPath={cardToApiPath}
                showToast={showToast}
                savedRowsByCard={savedRowsByCard}
                setSavedRowsByCard={setSavedRowsByCard}
                onAfterSave={() => {
                    // Refresh relevant data after saving from Live Data modal
                    fetchAllSpecializations();
                    fetchAllOfferings();
                    if (programs.length > 0) programs.forEach(p => checkProgramLsqStatus(p.id));
                }}
            />

            {/* Live Source Loading Overlay */}
            {liveSourceLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.7)', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 999,
                }}>
                    <div style={{
                        width: '44px', height: '44px', border: '4px solid #E6E6E6',
                        borderTopColor: '#930051', borderRadius: '50%',
                        animation: 'dtSpinner 0.8s linear infinite',
                    }} />
                    <span style={{ marginTop: '14px', fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 600, color: '#930051' }}>
                        Fetching live source data...
                    </span>
                </div>
            )}
        </div>
    );
};

export default UniversityDetails;
