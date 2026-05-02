import React, { useState } from 'react';
import {
  BadgeCheck, ChevronDown, ChevronUp, CreditCard,
  Fingerprint, PencilLine, Phone, Save, ShieldAlert, X,
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
      'Department of Computing & Information Technology',
      'Department of Mechanical Engineering',
      'Department of Energy Engineering',
      'Department of Civil Engineering',
      'Department of Electrical & Electronic Engineering',
      'Department of Agricultural & Biosystems Engineering',
    ],
  },
  {
    value: 'School of Health Sciences',
    label: 'School of Health Sciences 🏥',
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

const TERMS_TEXT = `By submitting this form, you confirm that:

• Your Student ID verifies you are an enrolled Kenyatta University student. KUuza uses this to confirm eligibility to sell on the platform.

• Your National ID establishes your legal identity and ensures accountability for all transactions. This information is held securely and may be used to resolve disputes.

• Your M-Pesa phone number is used solely to process payouts from your sales directly to your mobile money wallet.

This information is kept confidential and is never shared with buyers or third parties. It is only used for seller verification, identity accountability, and payment processing within KUuza.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const selectClass = (darkMode) =>
  `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors appearance-none cursor-pointer ${
    darkMode
      ? 'border-gray-700 bg-gray-900 text-white focus:border-emerald-500'
      : 'border-stone-300 bg-white text-stone-900 focus:border-emerald-500'
  }`;

const inputClass = (darkMode, hasError) =>
  `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${
    hasError
      ? darkMode
        ? 'border-red-700 bg-gray-900 text-white focus:border-red-500'
        : 'border-red-400 bg-white text-stone-900 focus:border-red-500'
      : darkMode
      ? 'border-gray-700 bg-gray-900 text-white placeholder-gray-600 focus:border-emerald-500'
      : 'border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:border-emerald-500'
  }`;

const labelClass = (darkMode) =>
  `text-xs uppercase tracking-[0.18em] mb-1.5 block ${darkMode ? 'text-gray-500' : 'text-stone-400'}`;

// ── Sub-components ────────────────────────────────────────────────────────────

const ReadValue = ({ value, darkMode }) =>
  value ? (
    <p className={`text-base ${darkMode ? 'text-gray-200' : 'text-stone-800'}`}>{value}</p>
  ) : (
    <p className={`text-base italic ${darkMode ? 'text-gray-600' : 'text-stone-400'}`}>Not set</p>
  );

// Dropdown that reveals a text input when "Other" is chosen
const SelectWithOther = ({
  label, options, selectValue, customValue,
  onSelectChange, onCustomChange,
  editing, darkMode, placeholder, customPlaceholder, disabled = false,
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
            className={`${selectClass(darkMode)} pr-10 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
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
      </div>
    ) : (
      <ReadValue value={selectValue === '__other__' ? customValue : selectValue} darkMode={darkMode} />
    )}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

const SellerVerificationSection = ({ user, darkMode, onVerified }) => {
  const isVerified = user?.is_verified_seller;

  // Parse email to derive expected admission number + year for cross-validation
  const emailLocal = user?.email?.split('@')[0] || '';
  const [emailAdmNumber, emailYear] = emailLocal.includes('.') ? emailLocal.split('.') : ['', ''];

  // ── Form state ──
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [studentIdError, setStudentIdError] = useState('');

  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [nationalId, setNationalId] = useState(user?.national_id || '');
  const [mpesaPhone, setMpesaPhone] = useState(user?.mpesa_phone || '');
  const [termsAccepted, setTermsAccepted] = useState(user?.seller_terms_accepted || false);
  const [course, setCourse] = useState(user?.course || '');
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study || '');

  // School — detect if stored value is a known school or custom
  const knownSchool = KU_SCHOOLS.find((s) => s.value === user?.school);
  const [schoolSelect, setSchoolSelect] = useState(
    knownSchool ? user.school : user?.school ? '__other__' : ''
  );
  const [schoolCustom, setSchoolCustom] = useState(
    !knownSchool && user?.school ? user.school : ''
  );

  // Department — detect if stored value belongs to stored school
  const knownDeptList = knownSchool?.departments || [];
  const [departmentSelect, setDepartmentSelect] = useState(
    knownDeptList.includes(user?.department)
      ? user.department
      : user?.department
      ? '__other__'
      : ''
  );
  const [departmentCustom, setDepartmentCustom] = useState(
    !knownDeptList.includes(user?.department) && user?.department ? user.department : ''
  );

  // ── Derived ──
  const selectedSchool = KU_SCHOOLS.find((s) => s.value === schoolSelect);
  const availableDepts = selectedSchool?.departments || [];
  const finalSchool = schoolSelect === '__other__' ? schoolCustom : schoolSelect;
  const finalDept = departmentSelect === '__other__' ? departmentCustom : departmentSelect;
  const isEditable = isVerified ? editing : true;

  // ── Student ID cross-validation ──
  const validateStudentId = (id) => {
    if (!id || !emailAdmNumber || !emailYear) {
      setStudentIdError('');
      return;
    }
    const parts = id.trim().split('/');
    if (parts.length < 3) {
      setStudentIdError(`Expected format: XX/${emailAdmNumber}/${emailYear}`);
      return;
    }
    if (parts[1] !== emailAdmNumber) {
      setStudentIdError(`Admission number "${parts[1]}" doesn't match your email (${emailAdmNumber})`);
      return;
    }
    if (parts[2] !== emailYear) {
      setStudentIdError(`Year "${parts[2]}" doesn't match your email (${emailYear})`);
      return;
    }
    setStudentIdError('');
  };

  // ── Reset ──
  const resetFields = () => {
    setStudentId(user?.student_id || '');
    setNationalId(user?.national_id || '');
    setMpesaPhone(user?.mpesa_phone || '');
    setTermsAccepted(user?.seller_terms_accepted || false);
    setCourse(user?.course || '');
    setYearOfStudy(user?.year_of_study || '');
    const ks = KU_SCHOOLS.find((s) => s.value === user?.school);
    setSchoolSelect(ks ? user.school : user?.school ? '__other__' : '');
    setSchoolCustom(!ks && user?.school ? user.school : '');
    const kdl = ks?.departments || [];
    setDepartmentSelect(kdl.includes(user?.department) ? user.department : user?.department ? '__other__' : '');
    setDepartmentCustom(!kdl.includes(user?.department) && user?.department ? user.department : '');
    setStudentIdError('');
  };

  const handleCancel = () => {
    resetFields();
    setEditing(false);
  };

  const handleSchoolChange = (val) => {
    setSchoolSelect(val);
    setSchoolCustom('');
    setDepartmentSelect('');
    setDepartmentCustom('');
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!studentId.trim() || !nationalId.trim() || !mpesaPhone.trim() ||
        !course.trim() || !finalSchool || !finalDept || !yearOfStudy) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    if (studentIdError) {
      showToast(studentIdError, 'error');
      return;
    }
    if (!isVerified && !termsAccepted) {
      showToast('You must accept the seller terms to continue.', 'error');
      return;
    }

    const payload = {
      student_id: studentId.trim(),
      national_id: nationalId.trim(),
      mpesa_phone: mpesaPhone.trim(),
      course: course.trim(),
      school: finalSchool.trim(),
      department: finalDept.trim(),
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
      showToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──
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
          {isVerified ? (
            <BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" />
          ) : (
            <ShieldAlert className={`h-5 w-5 shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
          )}
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              Seller verification
            </p>
            <p className={`mt-0.5 text-xs ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
              {isVerified
                ? 'Your seller account is active. These details are private and never shown to buyers.'
                : 'Complete this once to start selling. These details are private and never shown to buyers.'}
            </p>
          </div>
        </div>

        {isVerified && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <PencilLine className="h-3.5 w-3.5" />
            Edit
          </button>
        )}

        {editing && (
          <button
            type="button"
            onClick={handleCancel}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
      </div>

      {/* ── First-time info card ── */}
      {!isVerified && (
        <div className={`mt-5 rounded-2xl border p-4 ${
          darkMode ? 'border-amber-900/40 bg-amber-950/20' : 'border-amber-200 bg-amber-50'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] mb-3 ${
            darkMode ? 'text-amber-400' : 'text-amber-700'
          }`}>
            What you'll need
          </p>
          <ul className="space-y-3">
            {[
              { icon: CreditCard, label: 'Student ID number', detail: 'Your KU reg number — ties to your enrollment' },
              { icon: Fingerprint, label: 'National ID number', detail: 'Establishes legal identity and accountability' },
              { icon: Phone, label: 'M-Pesa phone number', detail: 'Used to send you payouts from your sales' },
            ].map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                  darkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-600'
                }`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-stone-800'}`}>{label}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>{detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className={`mt-4 text-xs ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
            This is a one-time step. Once verified, you can edit these details here anytime.
          </p>
        </div>
      )}

      {/* ── Fields ── */}
      <div className="mt-5 space-y-5">

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
                }}
                placeholder={`e.g. J17/${emailAdmNumber || '1234'}/${emailYear || '2022'}`}
                className={inputClass(darkMode, !!studentIdError)}
              />
              {studentIdError && (
                <p className="mt-1.5 text-xs text-red-500">{studentIdError}</p>
              )}
              {!studentIdError && studentId && (
                <p className={`mt-1.5 text-xs ${darkMode ? 'text-gray-600' : 'text-stone-400'}`}>
                  Format: letters+numbers / {emailAdmNumber || 'admission no.'} / {emailYear || 'year'} — first section length may vary
                </p>
              )}
            </>
          ) : (
            <ReadValue value={studentId} darkMode={darkMode} />
          )}
        </div>

        {/* National ID */}
        <div>
          <label className={labelClass(darkMode)}>National ID number</label>
          {isEditable ? (
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="e.g. 38291047"
              className={inputClass(darkMode, false)}
            />
          ) : (
            <ReadValue value={nationalId} darkMode={darkMode} />
          )}
        </div>

        {/* M-Pesa */}
        <div>
          <label className={labelClass(darkMode)}>M-Pesa phone number</label>
          {isEditable ? (
            <input
              type="tel"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="e.g. 0712 345 678"
              className={inputClass(darkMode, false)}
            />
          ) : (
            <ReadValue value={mpesaPhone} darkMode={darkMode} />
          )}
        </div>

        {/* Course */}
        <div>
          <label className={labelClass(darkMode)}>Course of study</label>
          {isEditable ? (
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. BSc Computer Science"
              className={inputClass(darkMode, false)}
            />
          ) : (
            <ReadValue value={course} darkMode={darkMode} />
          )}
        </div>

        {/* School */}
        <SelectWithOther
          label="School"
          options={KU_SCHOOLS.map((s) => ({ value: s.value, label: s.label }))}
          selectValue={schoolSelect}
          customValue={schoolCustom}
          onSelectChange={handleSchoolChange}
          onCustomChange={setSchoolCustom}
          editing={isEditable}
          darkMode={darkMode}
          placeholder="Select your school…"
          customPlaceholder="Type your school name…"
        />

        {/* Department */}
        <SelectWithOther
          label="Department"
          options={availableDepts.map((d) => ({ value: d, label: d }))}
          selectValue={departmentSelect}
          customValue={departmentCustom}
          onSelectChange={setDepartmentSelect}
          onCustomChange={setDepartmentCustom}
          editing={isEditable}
          darkMode={darkMode}
          placeholder={schoolSelect && schoolSelect !== '__other__' ? 'Select your department…' : 'Select a school first…'}
          customPlaceholder="Type your department name…"
          disabled={!schoolSelect || schoolSelect === '__other__' ? false : availableDepts.length === 0}
        />

        {/* Year of study */}
        <div>
          <label className={labelClass(darkMode)}>Current year of study</label>
          {isEditable ? (
            <div className="relative">
              <select
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                className={`${selectClass(darkMode)} pr-10`}
              >
                <option value="">Select year…</option>
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
          ) : (
            <ReadValue
              value={yearOfStudy && yearOfStudy !== 'Postgraduate' ? `Year ${yearOfStudy}` : yearOfStudy}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>

      {/* ── Terms (first-time or editing) ── */}
      {(!isVerified || editing) && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setTermsOpen((v) => !v)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-xs transition-colors ${
              darkMode
                ? 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            <span className="font-medium">Why we collect this data — Seller Terms</span>
            {termsOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
          </button>

          {termsOpen && (
            <div className={`mt-2 rounded-2xl px-4 py-4 text-xs leading-relaxed whitespace-pre-line ${
              darkMode ? 'bg-gray-900 text-gray-400' : 'bg-stone-100 text-stone-500'
            }`}>
              {TERMS_TEXT}
            </div>
          )}

          {!isVerified && (
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-600 cursor-pointer"
              />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-stone-700'}`}>
                I understand why this data is collected and agree to KUuza's seller terms and conditions.
              </span>
            </label>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {submitting
              ? isVerified ? 'Saving…' : 'Verifying…'
              : isVerified ? 'Save changes' : 'Complete verification'}
          </button>
        </div>
      )}

      {/* ── Save button (edit mode only, already verified) ── */}
      {isVerified && editing && (
        <div className="mt-6">
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
