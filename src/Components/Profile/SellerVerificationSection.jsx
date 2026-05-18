import React, { useState } from 'react';
import {
  BadgeCheck, BookOpen, ChevronDown, ChevronUp, CreditCard,
  Fingerprint, PencilLine, Phone, Save, ShieldAlert, X, AlertCircle,
} from 'lucide-react';
import { submitSellerVerification, updateCurrentUser } from '../../api/authapi';
import { showToast } from '../../Services/toastService';

// ── Data ─────────────────────────────────────────────────────────────────────

const KU_SCHOOLS = [
  {
    value: 'School of Agriculture & Environmental Sciences',
    label: 'School of Agriculture & Environmental Sciences ',
    departments: [
      'Department of Agricultural Economics',
      'Department of Animal Science',
      'Department of Agricultural Sciences & Technology',
      'Department of Environmental Planning & Management',
      'Department of Environmental Science & Education',
      'Department of Environmental Studies & Community Development',
    ],
  },
  {
    value: 'School of Business, Economics & Tourism',
    label: 'School of Business, Economics & Tourism ',
    departments: [
      'Department of Business Administration',
      'Department of Management Science',
      'Department of Accounting & Finance',
      'Department of Applied Economics',
      'Department of Econometrics & Statistics',
      'Department of Economic Theory',
      'Department of Hospitality & Tourism Management',
      'Department of Recreation & Sports Management',
    ],
  },
  {
    value: 'School of Education',
    label: 'School of Education ',
    departments: [
      'Department of Educational Psychology',
      'Department of Educational Management, Policy & Curriculum Studies',
      'Department of Educational Communication & Technology',
      'Department of Educational Foundations',
      'Department of Library & Information Science',
      'Department of Early Childhood & Special Needs Education',
    ],
  },
  {
    value: 'School of Engineering & Architecture',
    label: 'School of Engineering & Architecture ',
    departments: [
      'Department of Architecture & Interior Design',
      'Department of Spatial & Environmental Planning',
      'Department of Construction & Real Estate Management',
      'Department of Mechanical Engineering',
      'Department of Energy Engineering',
      'Department of Civil Engineering',
      'Department of Electrical & Electronic Engineering',
      'Department of Agricultural & Biosystems Engineering',
    ],
  },
  {
    value: 'School of Health Sciences',
    label: 'School of Health Sciences',
    departments: [
      'Department of Human Anatomy',
      'Department of Pathology',
      'Department of Medical Microbiology & Parasitology',
      'Department of Psychiatry & Mental Health',
      'Department of Medical Physiology',
      'Department of Medical Laboratory Sciences',
      'Department of Paediatrics & Child Health',
      'Department of Obstetrics & Gynaecology',
      'Department of Medicine, Therapeutics, Dermatology & Psychiatry',
      'Department of General Surgery',
      'Department of Special Surgery',
      'Department of Medical Surgical Nursing & Pre-clinical Services',
      'Department of Community & Reproductive Health Nursing',
      'Department of Pharmacognosy, Pharmaceutical Chemistry & Pharmaceutics',
      'Department of Pharmacology & Clinical Pharmacy',
      'Department of Community Health & Epidemiology',
      'Department of Environmental & Occupational Health',
      'Department of Health Management & Informatics',
      'Department of Population, Reproductive Health & Community Resource Management',
      'Department of Food, Nutrition & Dietetics',
      'Department of Physical Education, Exercise & Sports Science',
    ],
  },
  {
    value: 'School of Pure & Applied Sciences',
    label: 'School of Pure & Applied Sciences ',
    departments: [
      'Department of Biochemistry, Microbiology & Biotechnology',
      'Department of Chemistry',
      'Department of Computing & Information Science',
      'Department of Mathematics & Actuarial Science',
      'Department of Plant Sciences',
      'Department of Physics',
      'Department of Zoological Sciences',
    ],
  },
  {
    value: 'School of Law, Arts & Social Sciences',
    label: 'School of Law, Arts & Social Sciences',
    departments: [
      'Department of Literature, Linguistics & Foreign Languages',
      'Department of Geography',
      'Department of Sociology, Gender & Development Studies',
      'Department of History, Archaeology & Political Studies',
      'Department of Kiswahili & African Languages',
      'Department of Philosophy & Religious Studies',
      'Department of Psychology',
      'Department of Public Policy & Administration',
      'Department of Public Law',
      'Department of Private Law',
      'Department of Security, Diplomacy & Peace Studies',
      'Department of Communication, Media, Film & Theatre Studies',
      'Department of Fine Art & Design',
      'Department of Music & Dance',
      'Department of Fashion Design & Marketing',
    ],
  },
];

const YEARS_OF_STUDY = ['1', '2', '3', '4', '5', '6', 'Postgraduate'];

const TERMS_SECTIONS = [
  {
    heading: 'Your data & why we collect it',
    items: [
      'Your Student ID verifies you are an enrolled Kenyatta University student. KUuza uses this to confirm eligibility to sell on the platform.',
      'Your National ID establishes your legal identity and ensures accountability for all transactions. It is held securely and may be used to resolve disputes.',
      'Your M-Pesa number is used solely to send payouts from your sales to your mobile wallet.',
      'This information is never shared with buyers or third parties. It is only used for verification, identity accountability, and payment processing within KUuza.',
    ],
  },
  {
    heading: 'Listings & products',
    items: [
      'Only sell items you personally own or have made.',
      'Descriptions must be accurate — no misleading photos or details.',
      'No counterfeit, pirated, or illegally obtained goods.',
      'Food and beverages are permitted. By listing food items you confirm you comply with all KU campus rules and Kenyan food safety regulations. KUuza is not liable for any health issues arising from food sold on the platform.',
      'No prescription medications, alcohol, or tobacco products.',
      'No weapons, hazardous materials, or any restricted items.',
    ],
  },
  {
    heading: 'Transactions & conduct',
    items: [
      'Honor every confirmed transaction — no ghosting buyers after acceptance.',
      'Agreed prices cannot be changed after a transaction is accepted.',
      'Communicate respectfully with buyers at all times.',
      'Disputes must be raised within 48 hours of the scheduled delivery.',
    ],
  },
  {
    heading: 'Eligibility & accountability',
    items: [
      'Sellers must be enrolled Kenyatta University students or staff.',
      'You are personally responsible for all items you list.',
      'Providing false verification information results in immediate suspension.',
      'KUuza reserves the right to remove any listing or suspend any account.',
    ],
  },
  {
    heading: 'Campus & legal',
    items: [
      'Comply with all KU campus rules and Kenyan law.',
      'Do not use the platform for pyramid schemes, fundraising, or solicitation.',
      'Listings must not violate university intellectual property or copyright policies.',
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const selectClass = (darkMode, hasError = false) =>
  `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors appearance-none cursor-pointer ${
    hasError
      ? darkMode
        ? 'border-red-700 bg-gray-900 text-white focus:border-red-500'
        : 'border-red-400 bg-white text-stone-900 focus:border-red-500'
      : darkMode
      ? 'border-gray-700 bg-gray-900 text-white focus:border-emerald-500'
      : 'border-stone-200 bg-white text-stone-900 focus:border-emerald-500'
  }`;

const inputClass = (darkMode, hasError) =>
  `w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors ${
    hasError
      ? darkMode
        ? 'border-red-700 bg-gray-900 text-white focus:border-red-500'
        : 'border-red-400 bg-white text-stone-900 focus:border-red-500'
      : darkMode
      ? 'border-gray-700 bg-gray-900 text-white placeholder-gray-600 focus:border-emerald-500'
      : 'border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:border-emerald-500'
  }`;

const labelClass = (darkMode) =>
  `text-xs font-medium mb-1.5 block ${darkMode ? 'text-gray-400' : 'text-stone-500'}`;

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1.5 text-xs text-red-500">{msg}</p> : null;

// ── Sub-components ────────────────────────────────────────────────────────────

const ReadValue = ({ value, darkMode }) =>
  value ? (
    <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-stone-800'}`}>{value}</p>
  ) : (
    <p className={`text-sm italic ${darkMode ? 'text-gray-600' : 'text-stone-400'}`}>Not set</p>
  );

const SelectWithOther = ({
  label, options, selectValue, customValue,
  onSelectChange, onCustomChange,
  editing, darkMode, placeholder, customPlaceholder, disabled = false,
  error,
}) => (
  <div>
    <label className={labelClass(darkMode)}>{label}</label>
    {editing ? (
      <div className="space-y-2">
        <div className="relative">
          <select
            value={selectValue}
            onChange={(e) => onSelectChange(e.target.value)}
            disabled={disabled}
            className={`${selectClass(darkMode, !!error)} pr-10 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <option value="">{placeholder || 'Select…'}</option>
            {options.map((opt) => (
              <option key={opt.value ?? opt} value={opt.value ?? opt}>
                {opt.label ?? opt}
              </option>
            ))}
            <option value="__other__">Other (type below)</option>
          </select>
          <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
            darkMode ? 'text-gray-500' : 'text-stone-400'
          }`} />
        </div>
        {selectValue === '__other__' && (
          <input
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={customPlaceholder || 'Type here…'}
            className={inputClass(darkMode, false)}
          />
        )}
        <FieldError msg={error} />
      </div>
    ) : (
      <ReadValue value={selectValue === '__other__' ? customValue : selectValue} darkMode={darkMode} />
    )}
  </div>
);

// Grouped field card
const FieldCard = ({ darkMode, children }) => (
  <div className={`rounded-2xl border p-4 space-y-4 ${
    darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-stone-100 bg-white'
  }`}>
    {children}
  </div>
);

const SectionLabel = ({ icon: Icon, label, darkMode }) => (
  <div className={`flex items-center gap-2 mb-1 ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
    <Icon className="h-3.5 w-3.5" />
    <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const SellerVerificationSection = ({ user, darkMode, onVerified }) => {
  const isVerified = user?.is_verified_seller;

  const emailLocal = user?.email?.split('@')[0] || '';
  const [emailAdmNumber, emailYear] = emailLocal.includes('.') ? emailLocal.split('.') : ['', ''];

  const [editing,          setEditing]          = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [termsOpen,        setTermsOpen]        = useState(!isVerified);
  const [termsRead,        setTermsRead]        = useState(!isVerified);
  const [fieldErrors,      setFieldErrors]      = useState({});
  const [apiError,         setApiError]         = useState('');
  const [studentIdError,   setStudentIdError]   = useState('');
  const [studentId,     setStudentId]     = useState(user?.student_id || '');
  const [nationalId,    setNationalId]    = useState(user?.national_id || '');
  const [mpesaPhone,    setMpesaPhone]    = useState(user?.mpesa_phone || '');
  const [termsAccepted, setTermsAccepted] = useState(user?.seller_terms_accepted || false);
  const [course,        setCourse]        = useState(user?.course || '');
  const [yearOfStudy,   setYearOfStudy]   = useState(user?.year_of_study || '');

  const knownSchool = KU_SCHOOLS.find((s) => s.value === user?.school);
  const [schoolSelect, setSchoolSelect] = useState(
    knownSchool ? user.school : user?.school ? '__other__' : ''
  );
  const [schoolCustom, setSchoolCustom] = useState(
    !knownSchool && user?.school ? user.school : ''
  );

  const knownDeptList = knownSchool?.departments || [];
  const [departmentSelect, setDepartmentSelect] = useState(
    knownDeptList.includes(user?.department)
      ? user.department
      : user?.department ? '__other__' : ''
  );
  const [departmentCustom, setDepartmentCustom] = useState(
    !knownDeptList.includes(user?.department) && user?.department ? user.department : ''
  );

  const selectedSchool    = KU_SCHOOLS.find((s) => s.value === schoolSelect);
  const availableDepts    = selectedSchool?.departments || [];
  const finalSchool       = schoolSelect === '__other__' ? schoolCustom : schoolSelect;
  const finalDept         = departmentSelect === '__other__' ? departmentCustom : departmentSelect;
  const isEditable        = isVerified ? editing : true;

  const validateStudentId = (id) => {
    if (!id) { setStudentIdError(''); return; }
    const parts = id.trim().split('/');
    if (parts.length < 3) {
      setStudentIdError('Expected format: XX/AdmissionNo/Year (e.g. J17/12345/2022)'); return;
    }
    const admNoIsNumeric = /^\d+$/.test(emailAdmNumber);
    if (admNoIsNumeric && emailAdmNumber && parts[1] !== emailAdmNumber) {
      setStudentIdError(`Admission number "${parts[1]}" doesn't match your email (${emailAdmNumber})`); return;
    }
    if (admNoIsNumeric && emailYear && parts[2] !== emailYear) {
      setStudentIdError(`Year "${parts[2]}" doesn't match your email (${emailYear})`); return;
    }
    setStudentIdError('');
  };

  const resetFields = () => {
    setStudentId(user?.student_id || '');
    setNationalId(user?.national_id || '');
    setMpesaPhone(user?.mpesa_phone || '');
    setTermsAccepted(user?.seller_terms_accepted || false);
    setCourse(user?.course || '');
    setYearOfStudy(user?.year_of_study || '');
    const ks  = KU_SCHOOLS.find((s) => s.value === user?.school);
    const kdl = ks?.departments || [];
    setSchoolSelect(ks ? user.school : user?.school ? '__other__' : '');
    setSchoolCustom(!ks && user?.school ? user.school : '');
    setDepartmentSelect(kdl.includes(user?.department) ? user.department : user?.department ? '__other__' : '');
    setDepartmentCustom(!kdl.includes(user?.department) && user?.department ? user.department : '');
    setStudentIdError('');
    setFieldErrors({});
    setApiError('');
  };

  const handleCancel = () => { resetFields(); setEditing(false); };

  const handleSchoolChange = (val) => {
    setSchoolSelect(val);
    setSchoolCustom('');
    setDepartmentSelect('');
    setDepartmentCustom('');
  };

  const clearFieldError = (key) => {
    if (fieldErrors[key]) setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const handleSubmit = async () => {
    // Client-side field validation — collect all errors at once
    const errors = {};
    if (!studentId.trim())  errors.studentId   = 'Student ID is required';
    else if (studentIdError) errors.studentId  = studentIdError;
    if (!nationalId.trim()) errors.nationalId  = 'National ID is required';
    else if (!/^\d{8}$/.test(nationalId.trim())) errors.nationalId = 'National ID must be exactly 8 digits';
    if (!mpesaPhone.trim()) errors.mpesaPhone  = 'M-Pesa number is required';
    if (!course.trim())     errors.course      = 'Course of study is required';
    if (!yearOfStudy)       errors.yearOfStudy = 'Year of study is required';
    if (!finalSchool)       errors.school      = 'School is required';
    if (!finalDept)         errors.department  = 'Department is required';
    if (!isVerified && !termsAccepted) errors.terms = 'You must accept the seller terms to continue';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setApiError('');

    const payload = {
      student_id:  studentId.trim(),
      national_id: nationalId.trim(),
      mpesa_phone: mpesaPhone.trim(),
      course:      course.trim(),
      school:      finalSchool.trim(),
      department:  finalDept.trim(),
      year_of_study: yearOfStudy,
      ...(!isVerified && { seller_terms_accepted: termsAccepted }),
    };

    setSubmitting(true);
    try {
      if (isVerified) {
        await updateCurrentUser(payload);
        showToast('Seller details updated.', 'success');
      } else {
        await submitSellerVerification(payload);
        showToast('Seller account verified!', 'success');
      }
      setEditing(false);
      if (onVerified) onVerified();
    } catch (err) {
      // Map backend field errors back to inline highlights
      if (err.fieldErrors) {
        const be = {};
        if (err.fieldErrors.student_id) be.studentId  = err.fieldErrors.student_id;
        if (err.fieldErrors.national_id) be.nationalId = err.fieldErrors.national_id;
        if (err.fieldErrors.mpesa_phone) be.mpesaPhone = err.fieldErrors.mpesa_phone;
        if (Object.keys(be).length > 0) setFieldErrors(be);
      }
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="seller-verify"
      className={`rounded-3xl border p-5 ${
        darkMode ? 'border-gray-800 bg-gray-950' : 'border-stone-200 bg-stone-50'
      }`}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          {isVerified
            ? <BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            : <ShieldAlert className={`h-5 w-5 shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />}
          <div>
            <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              Seller verification
            </p>
            <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
              {isVerified
                ? 'Your seller account is active. These details are private.'
                : 'Complete this once to start selling. All details are private.'}
            </p>
          </div>
        </div>

        {isVerified && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <PencilLine className="h-3.5 w-3.5" /> Edit
          </button>
        )}
        {editing && (
          <button
            type="button"
            onClick={handleCancel}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>

      {/* ── First-time info strip ── */}
      {!isVerified && (
        <div className={`mt-4 grid grid-cols-3 gap-2`}>
          {[
            { icon: CreditCard, label: 'Student ID',    detail: 'Confirms KU enrollment' },
            { icon: Fingerprint, label: 'National ID',  detail: 'Legal identity & accountability' },
            { icon: Phone,       label: 'M-Pesa number', detail: 'Receives your sales payouts' },
          ].map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              className={`rounded-2xl p-3 flex flex-col gap-1.5 ${
                darkMode ? 'bg-amber-950/20 border border-amber-900/30' : 'bg-amber-50 border border-amber-100'
              }`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-600'
              }`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className={`text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-stone-800'}`}>{label}</p>
              <p className={`text-xs leading-snug ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>{detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── API error banner ── */}
      {apiError && (
        <div className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
          darkMode ? 'border-red-800 bg-red-950/40 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm">{apiError}</p>
        </div>
      )}

      {/* ── Fields ── */}
      <div className="mt-4 space-y-3">

        {/* Identity & Payment */}
        <FieldCard darkMode={darkMode}>
          <SectionLabel icon={Fingerprint} label="Identity & Payment" darkMode={darkMode} />

          {/* Student ID */}
          <div>
            <label className={labelClass(darkMode)}>Student ID number</label>
            {isEditable ? (
              <>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    validateStudentId(e.target.value);
                    clearFieldError('studentId');
                  }}
                  placeholder={`e.g. J17/${emailAdmNumber || '1234'}/${emailYear || '2022'}`}
                  className={inputClass(darkMode, !!(fieldErrors.studentId || studentIdError))}
                />
                <FieldError msg={fieldErrors.studentId || studentIdError} />
                {!(fieldErrors.studentId || studentIdError) && studentId && (
                  <p className={`mt-1.5 text-xs ${darkMode ? 'text-gray-600' : 'text-stone-400'}`}>
                    Format: letters+numbers / {emailAdmNumber || 'admission no.'} / {emailYear || 'year'}
                  </p>
                )}
              </>
            ) : (
              <ReadValue value={studentId} darkMode={darkMode} />
            )}
          </div>

          {/* National ID + M-Pesa side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass(darkMode)}>National ID</label>
              {isEditable ? (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={nationalId}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setNationalId(digits);
                      clearFieldError('nationalId');
                    }}
                    placeholder="8-digit ID e.g. 38291047"
                    className={inputClass(darkMode, !!fieldErrors.nationalId)}
                  />
                  <FieldError msg={fieldErrors.nationalId} />
                </>
              ) : (
                <ReadValue value={nationalId} darkMode={darkMode} />
              )}
            </div>

            <div>
              <label className={labelClass(darkMode)}>M-Pesa number</label>
              {isEditable ? (
                <>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => { setMpesaPhone(e.target.value); clearFieldError('mpesaPhone'); }}
                    placeholder="e.g. 0712 345 678"
                    className={inputClass(darkMode, !!fieldErrors.mpesaPhone)}
                  />
                  <FieldError msg={fieldErrors.mpesaPhone} />
                </>
              ) : (
                <ReadValue value={mpesaPhone} darkMode={darkMode} />
              )}
            </div>
          </div>
        </FieldCard>

        {/* Academic Info */}
        <FieldCard darkMode={darkMode}>
          <SectionLabel icon={BookOpen} label="Academic Info" darkMode={darkMode} />

          {/* Course + Year side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass(darkMode)}>Course of study</label>
              {isEditable ? (
                <>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => { setCourse(e.target.value); clearFieldError('course'); }}
                    placeholder="e.g. BSc Computer Science"
                    className={inputClass(darkMode, !!fieldErrors.course)}
                  />
                  <FieldError msg={fieldErrors.course} />
                </>
              ) : (
                <ReadValue value={course} darkMode={darkMode} />
              )}
            </div>

            <div>
              <label className={labelClass(darkMode)}>Year of study</label>
              {isEditable ? (
                <>
                  <div className="relative">
                    <select
                      value={yearOfStudy}
                      onChange={(e) => { setYearOfStudy(e.target.value); clearFieldError('yearOfStudy'); }}
                      className={`${selectClass(darkMode, !!fieldErrors.yearOfStudy)} pr-10`}
                    >
                      <option value="">Select…</option>
                      {YEARS_OF_STUDY.map((y) => (
                        <option key={y} value={y}>
                          {y === 'Postgraduate' ? 'Postgraduate' : `Year ${y}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                      darkMode ? 'text-gray-500' : 'text-stone-400'
                    }`} />
                  </div>
                  <FieldError msg={fieldErrors.yearOfStudy} />
                </>
              ) : (
                <ReadValue
                  value={yearOfStudy && yearOfStudy !== 'Postgraduate' ? `Year ${yearOfStudy}` : yearOfStudy}
                  darkMode={darkMode}
                />
              )}
            </div>
          </div>

          <SelectWithOther
            label="School"
            options={KU_SCHOOLS.map((s) => ({ value: s.value, label: s.label }))}
            selectValue={schoolSelect}
            customValue={schoolCustom}
            onSelectChange={(val) => { handleSchoolChange(val); clearFieldError('school'); }}
            onCustomChange={setSchoolCustom}
            editing={isEditable}
            darkMode={darkMode}
            placeholder="Select your school…"
            customPlaceholder="Type your school name…"
            error={fieldErrors.school}
          />

          <SelectWithOther
            label="Department"
            options={availableDepts.map((d) => ({ value: d, label: d }))}
            selectValue={departmentSelect}
            customValue={departmentCustom}
            onSelectChange={(val) => { setDepartmentSelect(val); clearFieldError('department'); }}
            onCustomChange={setDepartmentCustom}
            editing={isEditable}
            darkMode={darkMode}
            placeholder={schoolSelect && schoolSelect !== '__other__' ? 'Select your department…' : 'Select a school first…'}
            customPlaceholder="Type your department name…"
            disabled={!schoolSelect || schoolSelect === '__other__' ? false : availableDepts.length === 0}
            error={fieldErrors.department}
          />
        </FieldCard>
      </div>

      {/* ── Terms ── */}
      {(!isVerified || editing) && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => { setTermsOpen((v) => !v); setTermsRead(true); }}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs transition-colors ${
              darkMode
                ? 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            <span className="font-medium">
              Seller Terms &amp; Platform Rules
              {!termsRead && (
                <span className="ml-2 text-amber-500 font-semibold">— read before agreeing</span>
              )}
            </span>
            {termsOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          </button>

          {termsOpen && (
            <div className={`mt-2 rounded-xl px-4 py-4 text-xs leading-relaxed space-y-4 ${
              darkMode ? 'bg-gray-900 text-gray-400' : 'bg-stone-100 text-stone-500'
            }`}>
              {TERMS_SECTIONS.map((section) => (
                <div key={section.heading}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-stone-600'
                  }`}>
                    {section.heading}
                  </p>
                  <ul className="space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {!isVerified && (
            <>
              <label className={`mt-3 flex items-start gap-3 ${termsRead ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  disabled={!termsRead}
                  onChange={(e) => { setTermsAccepted(e.target.checked); clearFieldError('terms'); }}
                  className="mt-0.5 h-4 w-4 accent-emerald-600 cursor-pointer"
                />
                <span className={`text-sm ${fieldErrors.terms ? 'text-red-500' : darkMode ? 'text-gray-300' : 'text-stone-700'}`}>
                  I have read and agree to KUuza's seller terms and platform rules.
                </span>
              </label>
              <FieldError msg={fieldErrors.terms} />
            </>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {submitting
              ? isVerified ? 'Saving…' : 'Verifying…'
              : isVerified ? 'Save changes' : 'Complete verification'}
          </button>
        </div>
      )}

      {/* ── Save (edit mode, already verified) ── */}
      {isVerified && editing && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

    </section>
  );
};

export default SellerVerificationSection;
